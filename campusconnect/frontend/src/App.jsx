import { useEffect } from "react";
import { Icon } from "./lib/icons.jsx";
import { useStore, actions, startRealtime } from "./lib/store.jsx";
import { NavProvider, useNav } from "./lib/nav.jsx";
import { UIProvider } from "./lib/ui.jsx";
import { API_ON } from "./lib/api.js";
import Onboarding from "./screens/Onboarding.jsx";
import Hub from "./screens/Hub.jsx";
import Resources from "./screens/Resources.jsx";
import Skills from "./screens/Skills.jsx";
import Messages from "./screens/Messages.jsx";
import Profile from "./screens/Profile.jsx";
import ItemDetail from "./screens/ItemDetail.jsx";
import CreateListing from "./screens/CreateListing.jsx";
import Handoff from "./screens/Handoff.jsx";
import Scanner from "./screens/Scanner.jsx";
import Chat from "./screens/Chat.jsx";
import PostDetail from "./screens/PostDetail.jsx";
import Impact from "./screens/Impact.jsx";
import Notifications from "./screens/Notifications.jsx";
import Search from "./screens/Search.jsx";
import { Settings, TrustDetail, Wallet } from "./screens/Misc.jsx";

const SCREENS = { item: ItemDetail, create: CreateListing, handoff: Handoff, scanner: Scanner, chat: Chat, post: PostDetail, impact: Impact, notifications: Notifications, search: Search, settings: Settings, trust: TrustDetail, wallet: Wallet, user: Profile };
const TABS = [
  { id: "hub", label: "Hub", icon: "grad", C: Hub },
  { id: "resources", label: "Resources", icon: "swap", C: Resources },
  { id: "skills", label: "Skills", icon: "bulb", C: Skills },
  { id: "messages", label: "Messages", icon: "comment", C: Messages },
  { id: "me", label: "Profile", icon: "user", C: Profile },
];

export default function App() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [theme]);

  return (
    <div className="stage">
      <aside className="promo">
        <div className="brandrow"><Icon name="shield" size={28} />CampusConnect</div>
        <h1>Don't buy what your campus already has.</h1>
        <p>Don't lose what your seniors already know. A verified, circular campus for sharing resources, skills and experience.</p>
        <ul>
          <li><Icon name="shield" />Verified college identity</li>
          <li><Icon name="qr" />QR handovers with condition checks</li>
          <li><Icon name="sparkles" />Campus AI grounded in senior knowledge</li>
        </ul>
        <div className="demo-note">{API_ON ? "Connected to your CampusConnect backend." : "Demo mode: all data is local. Sign in with the demo campus to explore every screen."}</div>
      </aside>
      <div className="device">
        <UIProvider>
          <NavProvider>
            <Root />
          </NavProvider>
        </UIProvider>
      </div>
    </div>
  );
}

function Root() {
  const authed = useStore((s) => s.auth.status === "in");
  useEffect(() => {
    if (authed) startRealtime();
  }, [authed]);
  return authed ? <Main /> : <Onboarding />;
}

function Main() {
  const nav = useNav();
  const unreadChats = useStore((s) => s.chats.reduce((a, c) => a + (c.unread && !c.muted ? 1 : 0), 0));
  const showTabbar = nav.stack.length === 0;

  return (
    <>
      <div className="tabs-layer">
        {TABS.map(({ id, C }) => (
          <section key={id} className="tab-pane" hidden={nav.tab !== id} aria-hidden={nav.tab !== id}>
            <C active={nav.tab === id} />
          </section>
        ))}
      </div>
      {showTabbar && (
        <nav className="tabbar" aria-label="Main">
          {TABS.map((t) => (
            <button key={t.id} className="tab" aria-current={nav.tab === t.id ? "page" : undefined} onClick={() => (nav.tab === t.id ? document.querySelector(`.tab-pane:not([hidden]) .scroll`)?.scrollTo({ top: 0, behavior: "smooth" }) : nav.go(t.id))}>
              <span className="pill"><Icon name={t.icon} /></span>
              {t.label}
              {t.id === "messages" && unreadChats > 0 && <span className="badge-dot">{unreadChats}</span>}
            </button>
          ))}
        </nav>
      )}
      {nav.stack.map((s, idx) => {
        const C = SCREENS[s.name];
        return (
          <div key={s.key} className={`screen pushed ${s.leaving ? "leaving" : ""}`} style={{ zIndex: 20 + idx }}>
            <C {...s.props} active />
          </div>
        );
      })}
    </>
  );
}
