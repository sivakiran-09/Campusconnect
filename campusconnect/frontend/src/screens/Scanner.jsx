import { useState } from "react";
import "../styles/handoff.css";
import { Icon } from "../lib/icons.jsx";
import { actions, useStore } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";

export default function Scanner({ id }) {
  const nav = useNav();
  const ui = useUI();
  const tx = useStore((s) => s.transactions.find((t) => t.id === id));
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState(false);

  const confirm = (val) => {
    try {
      actions.confirmHandover(id, val);
      ui.toast({ title: "Handover confirmed", tone: "success", icon: "check" });
      nav.pop();
    } catch (e) {
      setErr(e.message);
      setScanning(false);
    }
  };

  const simulateScan = () => {
    if (!tx?.handover) return setErr("No active QR for this exchange yet.");
    setErr("");
    setScanning(true);
    setTimeout(() => confirm(tx.handover.token), 1100);
  };

  return (
    <div className="screen scanner-screen">
      <header className="scan-head">
        <button className="icon-btn white" onClick={nav.pop} aria-label="Close scanner"><Icon name="x" /></button>
        <b>Scan handover QR</b>
        <button className="icon-btn white" aria-label="Switch camera"><Icon name="flip" /></button>
      </header>
      <div className="scan-view">
        <div className={`scan-frame ${scanning ? "found" : ""}`}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          {!scanning && <div className="scan-line" />}
          {scanning && <Icon name="check" size={48} className="scan-check" />}
        </div>
        <p className="scan-hint">{scanning ? "Handover confirmed!" : "Point your camera at the owner's QR code"}</p>
      </div>
      <div className="scan-sheet">
        <button className="btn lg block" onClick={simulateScan} disabled={scanning}><Icon name="scan" />{scanning ? "Confirming…" : "Simulate scan (demo)"}</button>
        <div className="divider-or mt-16"><span>or enter the 6-digit PIN</span></div>
        <div className="row gap-8 mt-12">
          <input className={`input grow ${err ? "err" : ""}`} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" aria-label="Backup PIN" />
          <button className="btn" disabled={pin.length < 6} onClick={() => confirm(pin)}>Confirm</button>
        </div>
        {err && <div className="help err mt-8">{err}</div>}
      </div>
    </div>
  );
}
