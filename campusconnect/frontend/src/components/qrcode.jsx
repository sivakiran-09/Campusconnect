import { useMemo } from "react";
import { qrMatrix } from "../lib/qr.js";
import { Icon } from "../lib/icons.jsx";

/** Real, scannable QR (encoded locally). The centre badge covers only ~3% of modules, well inside error-correction. */
export function QRCode({ value, size = 220, badge = true }) {
  const m = useMemo(() => qrMatrix(value), [value]);
  const n = m.length;
  const q = 2;
  const cells = [];
  m.forEach((row, y) => row.forEach((d, x) => d && cells.push(`M${x + q} ${y + q}h1v1h-1z`)));
  const b = Math.max(3, Math.round(n * 0.16));
  const lo = Math.floor((n - b) / 2) + q;
  return (
    <div className="qr" style={{ width: size, height: size }} role="img" aria-label="Handover QR code">
      <svg viewBox={`0 0 ${n + q * 2} ${n + q * 2}`} shapeRendering="crispEdges" width="100%" height="100%">
        <rect width={n + q * 2} height={n + q * 2} fill="#fff" />
        <path d={cells.join("")} fill="#16143a" />
        {badge && <rect x={lo} y={lo} width={b} height={b} rx={0.9} fill="#3a2fd1" stroke="#fff" strokeWidth=".5" />}
      </svg>
      {badge && (
        <span className="qr-badge" style={{ width: `${(b / (n + q * 2)) * 100}%`, height: `${(b / (n + q * 2)) * 100}%`, left: `${(lo / (n + q * 2)) * 100}%`, top: `${(lo / (n + q * 2)) * 100}%` }}>
          <Icon name="lock" />
        </span>
      )}
    </div>
  );
}
