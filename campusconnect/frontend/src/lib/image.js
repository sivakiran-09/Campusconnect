// Client-side half of the smart image pipeline:
//   validate -> compress (Canvas, strips EXIF) -> preview -> crop -> progress upload
// The server repeats validation and re-compresses with sharp/Pillow (backend/src/services/image.js).
export const IMAGE_RULES = { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 12 * 1024 * 1024, minSide: 200, maxSide: 1600, quality: 0.82 };

export const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

export function validateImage(file) {
  if (!file) return { ok: false, reason: "No file selected" };
  if (!IMAGE_RULES.types.includes(file.type)) return { ok: false, reason: "Use a JPG, PNG or WebP photo" };
  if (file.size > IMAGE_RULES.maxBytes) return { ok: false, reason: `Photo is ${kb(file.size)}. Max is ${kb(IMAGE_RULES.maxBytes)}` };
  return { ok: true };
}

const loadImage = (src) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read this image"));
    img.src = src;
  });

const toBlob = (canvas, type = "image/jpeg", q = IMAGE_RULES.quality) => new Promise((res) => canvas.toBlob(res, type, q));
const toDataUrl = (blob) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(blob);
  });

/** Downscale + re-encode as JPEG. Re-encoding through canvas drops all EXIF/GPS metadata. */
export async function compressImage(file, { maxSide = IMAGE_RULES.maxSide, quality = IMAGE_RULES.quality } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (Math.min(img.naturalWidth, img.naturalHeight) < IMAGE_RULES.minSide) throw new Error(`Photo is too small (min ${IMAGE_RULES.minSide}px)`);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await toBlob(c, "image/jpeg", quality);
    return { blob, dataUrl: await toDataUrl(blob), width: w, height: h, originalSize: file.size, size: blob.size, name: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Crop a data URL to an aspect ratio with zoom + pan (ox/oy in -1..1). */
export async function cropImage(dataUrl, { aspect = 4 / 3, zoom = 1, ox = 0, oy = 0, out = 1200 }) {
  const img = await loadImage(dataUrl);
  let cw = img.naturalWidth;
  let ch = cw / aspect;
  if (ch > img.naturalHeight) {
    ch = img.naturalHeight;
    cw = ch * aspect;
  }
  cw /= zoom;
  ch /= zoom;
  const maxX = img.naturalWidth - cw;
  const maxY = img.naturalHeight - ch;
  const sx = (maxX / 2) * (1 + ox);
  const sy = (maxY / 2) * (1 + oy);
  const c = document.createElement("canvas");
  c.width = out;
  c.height = Math.round(out / aspect);
  c.getContext("2d").drawImage(img, sx, sy, cw, ch, 0, 0, c.width, c.height);
  const blob = await toBlob(c, "image/jpeg", 0.8);
  return { blob, dataUrl: await toDataUrl(blob), width: c.width, height: c.height, size: blob.size };
}

/** Upload with real progress when an API is configured; simulated (but paced) in demo mode. */
export function uploadWithProgress(blob, { url, token, onProgress }) {
  return new Promise((resolve, reject) => {
    if (!url) {
      let p = 0;
      const t = setInterval(() => {
        p = Math.min(100, p + 8 + Math.random() * 18);
        onProgress?.(Math.round(p));
        if (p >= 100) {
          clearInterval(t);
          resolve({ url: null, stripped: true, stored: "demo" });
        }
      }, 90);
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/uploads/image`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.responseText || "Upload failed")));
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    const fd = new FormData();
    fd.append("image", blob, "photo.jpg");
    xhr.send(fd);
  });
}

/** Deterministic pseudo "AI" condition comparison used in Demo Mode. The FastAPI service does the real one. */
export async function compareCondition(beforeUrl, afterUrl) {
  try {
    const [a, b] = await Promise.all([loadImage(beforeUrl), loadImage(afterUrl)]);
    const sig = (img) => {
      const c = document.createElement("canvas");
      c.width = c.height = 16;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0, 16, 16);
      return x.getImageData(0, 0, 16, 16).data;
    };
    const A = sig(a);
    const B = sig(b);
    let d = 0;
    for (let i = 0; i < A.length; i += 4) d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
    const sim = 1 - d / (256 * 3 * 255);
    return Math.max(62, Math.min(99, Math.round(60 + sim * 39)));
  } catch {
    return 94;
  }
}
