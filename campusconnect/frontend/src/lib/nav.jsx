import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bus } from "./store.jsx";

const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);
let seq = 0;

/** Tabs keep their own scroll; pushed screens stack on top with a slide animation, like a native app. */
export function NavProvider({ children }) {
  const [tab, setTab] = useState("hub");
  const [stack, setStack] = useState([]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const push = useCallback((name, props = {}) => {
    setStack((s) => [...s, { key: ++seq, name, props }]);
    try {
      history.pushState({ cc: true }, "");
    } catch {
      /* sandboxed iframe */
    }
  }, []);

  const popInternal = useCallback(() => {
    const top = stackRef.current[stackRef.current.length - 1];
    if (!top) return false;
    setStack((s) => s.map((x) => (x.key === top.key ? { ...x, leaving: true } : x)));
    setTimeout(() => setStack((s) => s.filter((x) => x.key !== top.key)), 230);
    return true;
  }, []);

  const pop = useCallback(() => {
    if (popInternal()) {
      try {
        history.back();
      } catch {
        /* ignore */
      }
    }
  }, [popInternal]);

  useEffect(() => {
    const h = () => popInternal();
    window.addEventListener("popstate", h);
    return () => window.removeEventListener("popstate", h);
  }, [popInternal]);

  const go = useCallback((t) => {
    setStack([]);
    setTab(t);
  }, []);
  const replace = useCallback((name, props = {}) => setStack((s) => [...s.slice(0, -1), { key: ++seq, name, props }]), []);

  /** Resolve a notification/story action into a navigation. */
  const route = useCallback(
    (a) => {
      if (!a) return;
      switch (a.type) {
        case "item": return push("item", { id: a.id });
        case "tx": return push("handoff", { id: a.id });
        case "post": return push("post", { id: a.id });
        case "impact": return push("impact");
        case "trust": return push("trust");
        case "wallet": return push("wallet");
        case "ai": return push("chat", { id: "ai", ask: a.q });
        case "chat": return push("chat", { id: a.id });
        case "tab": return go(a.tab);
        default:
      }
    },
    [push, go]
  );
  useEffect(() => {
    bus.route = route;
  }, [route]);

  const value = useMemo(() => ({ tab, stack, push, pop, go, replace, route }), [tab, stack, push, pop, go, replace, route]);
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}
