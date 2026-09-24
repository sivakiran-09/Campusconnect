import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { bus } from "./store.jsx";

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);
let tid = 0;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [sheets, setSheets] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 260);
  }, []);
  const toast = useCallback(
    (t) => {
      const id = ++tid;
      setToasts((list) => [...list.slice(-2), { id, ...t }]);
      setTimeout(() => dismiss(id), t.action ? 6500 : 3200);
    },
    [dismiss]
  );
  useEffect(() => {
    bus.toast = toast;
  }, [toast]);

  const closeSheet = useCallback((id) => {
    setSheets((s) => s.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setSheets((s) => s.filter((x) => x.id !== id)), 230);
  }, []);
  /** openSheet({ title, render: (close) => node, dialog }) */
  const openSheet = useCallback((cfg) => {
    const id = ++tid;
    setSheets((s) => [...s, { id, ...cfg }]);
    return id;
  }, []);
  const confirm = useCallback(
    ({ title, body, ok = "Confirm", danger, cancel = "Cancel" }) =>
      new Promise((res) => {
        const id = openSheet({
          dialog: true,
          render: (close) => (
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h3>
              {body && <p className="soft-text mt-8">{body}</p>}
              <div className="row mt-16" style={{ justifyContent: "flex-end" }}>
                <button className="btn ghost" onClick={() => (close(), res(false))}>{cancel}</button>
                <button className={`btn ${danger ? "danger" : ""}`} onClick={() => (close(), res(true))}>{ok}</button>
              </div>
            </div>
          ),
        });
        void id;
      }),
    [openSheet]
  );

  useEffect(() => {
    const k = (e) => e.key === "Escape" && sheets.length && closeSheet(sheets[sheets.length - 1].id);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sheets, closeSheet]);

  const value = useMemo(() => ({ toast, openSheet, closeSheet, confirm }), [toast, openSheet, closeSheet, confirm]);
  return (
    <UICtx.Provider value={value}>
      {children}
      {sheets.map((s) => (
        <SheetView key={s.id} s={s} close={() => closeSheet(s.id)} />
      ))}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone || ""} ${t.leaving ? "leaving" : ""}`} onClick={() => dismiss(t.id)}>
            <span className="t-ic"><Icon name={t.icon || (t.tone === "success" ? "check" : t.tone === "alert" ? "bell" : "info")} /></span>
            <div className="t-body">
              <b>{t.title}</b>
              {t.body}
            </div>
            {t.action && (
              <button className="t-act" onClick={(e) => (e.stopPropagation(), dismiss(t.id), t.action.run())}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </UICtx.Provider>
  );
}

function SheetView({ s, close }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current?.querySelector("[autofocus], input, textarea");
    if (el && !s.noFocus) setTimeout(() => el.focus({ preventScroll: true }), 320);
  }, [s.noFocus]);
  if (s.dialog)
    return (
      <div className={`overlay center ${s.leaving ? "leaving" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <div className="dialog" role="dialog" aria-modal="true" ref={ref}>{s.render(close)}</div>
      </div>
    );
  return (
    <div className={`overlay ${s.leaving ? "leaving" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={`sheet ${s.leaving ? "leaving" : ""}`} role="dialog" aria-modal="true" aria-label={s.title} ref={ref} style={s.tall ? { height: "92%" } : undefined}>
        <div className="grab" />
        {s.title && (
          <div className="sheet-h">
            <h3>{s.title}</h3>
            <button className="icon-btn" onClick={close} aria-label="Close"><Icon name="x" /></button>
          </div>
        )}
        <div className="sheet-body">{s.render(close)}</div>
      </div>
    </div>
  );
}
