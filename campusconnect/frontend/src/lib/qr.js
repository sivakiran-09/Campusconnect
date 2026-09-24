// Minimal QR Code encoder: byte mode, error-correction level M, versions 1-6 (up to 106 bytes).
// Zero dependencies so the handover screen works offline. Verified against OpenCV's decoder.

const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16]; // level M
const NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4]; // level M
const MAX_VERSION = 6;

const rawModules = (v) => {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const n = Math.floor(v / 7) + 2;
    r -= (25 * n - 10) * n - 55;
  }
  return r;
};

const alignPositions = (v) => {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2;
  const size = v * 4 + 17;
  const step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
  const res = [6];
  for (let pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
  return res;
};

// Reed-Solomon over GF(256) with polynomial 0x11D
const gfMul = (x, y) => {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
};

const rsDivisor = (deg) => {
  const res = new Array(deg).fill(0);
  res[deg - 1] = 1;
  let root = 1;
  for (let i = 0; i < deg; i++) {
    for (let j = 0; j < deg; j++) {
      res[j] = gfMul(res[j], root);
      if (j + 1 < deg) res[j] ^= res[j + 1];
    }
    root = gfMul(root, 2);
  }
  return res;
};

const rsRemainder = (data, div) => {
  const res = div.map(() => 0);
  for (const b of data) {
    const f = b ^ res.shift();
    res.push(0);
    div.forEach((c, i) => (res[i] ^= gfMul(c, f)));
  }
  return res;
};

const interleave = (data, v) => {
  const nb = NUM_BLOCKS[v];
  const eccLen = ECC_PER_BLOCK[v];
  const raw = Math.floor(rawModules(v) / 8);
  const shortCount = nb - (raw % nb);
  const shortLen = Math.floor(raw / nb);
  const div = rsDivisor(eccLen);
  const blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < shortCount ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < shortCount) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const out = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((b, j) => {
      if (i !== shortLen - eccLen || j >= shortCount) out.push(b[i]);
    });
  }
  return out;
};

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0,
];

const penalty = (m) => {
  const n = m.length;
  let score = 0;
  const line = (get) => {
    for (let a = 0; a < n; a++) {
      let run = 1;
      for (let b = 1; b < n; b++) {
        if (get(a, b) === get(a, b - 1)) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
      // finder-like 1:1:3:1:1 pattern with 4 light modules on either side
      const s = Array.from({ length: n }, (_, b) => (get(a, b) ? 1 : 0)).join("");
      for (const p of ["000010111010", "010111010000"]) {
        let i = -1;
        while ((i = s.indexOf(p, i + 1)) !== -1) score += 40;
      }
      // patterns touching the border count as light beyond the edge
      if (s.startsWith("10111010000")) score += 40;
      if (s.endsWith("00001011101")) score += 40;
    }
  };
  line((a, b) => m[a][b]);
  line((a, b) => m[b][a]);
  for (let y = 0; y < n - 1; y++)
    for (let x = 0; x < n - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) score += 3;
  const dark = m.flat().filter(Boolean).length;
  const k = Math.ceil(Math.abs(dark * 20 - n * n * 10) / (n * n)) - 1;
  return score + Math.max(0, k) * 10;
};

/** Returns a boolean[][] matrix (true = dark) for the given text. */
export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= MAX_VERSION; ver++) {
    const cap = Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];
    if (12 + bytes.length * 8 <= cap * 8) break;
  }
  if (ver > MAX_VERSION) throw new Error("QR payload too long");
  const dataCap = Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];

  const bits = [];
  const push = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(4, 4);
  push(bytes.length, 8);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, dataCap * 8 - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < dataCap * 8; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }
  const codewords = interleave(data, ver);

  const size = ver * 4 + 17;
  const mod = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (x, y, dark) => {
    mod[y][x] = dark;
    fn[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
      }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  const ap = alignPositions(ver);
  ap.forEach((cy, i) =>
    ap.forEach((cx, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    })
  );

  const drawFormat = (mask) => {
    const d = (0 << 3) | mask; // ECC level M = 0b00
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bitsF = ((d << 10) | rem) ^ 0x5412;
    const bit = (i) => ((bitsF >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(i));
    setFn(8, 7, bit(6));
    setFn(8, 8, bit(7));
    setFn(7, 8, bit(8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i));
    setFn(8, size - 8, true);
  };
  drawFormat(0); // reserve function modules before placing data

  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && i < codewords.length * 8) {
          mod[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
  }

  let best = null;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const trial = mod.map((row) => row.slice());
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) trial[y][x] = !trial[y][x];
    const saved = mod;
    // draw format bits for this mask onto the trial grid
    const d = m;
    let rem = d;
    for (let k = 0; k < 10; k++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const fb = ((d << 10) | rem) ^ 0x5412;
    const bit = (k) => ((fb >>> k) & 1) !== 0;
    for (let k = 0; k <= 5; k++) trial[k][8] = bit(k);
    trial[7][8] = bit(6);
    trial[8][8] = bit(7);
    trial[8][7] = bit(8);
    for (let k = 9; k < 15; k++) trial[8][14 - k] = bit(k);
    for (let k = 0; k < 8; k++) trial[8][size - 1 - k] = bit(k);
    for (let k = 8; k < 15; k++) trial[size - 15 + k][8] = bit(k);
    trial[size - 8][8] = true;
    void saved;
    const p = penalty(trial);
    if (p < bestScore) {
      bestScore = p;
      best = trial;
    }
  }
  return best;
}
