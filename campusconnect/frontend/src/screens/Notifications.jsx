import { Icon } from "../lib/icons.jsx";
import { BackBar, Empty, Avatar } from "../components/kit.jsx";
import { actions, useStore } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { timeAgo } from "../lib/format.js";

export default function Notifications() {
  const nav = useNav();
  const items = useStore((s) => s.notifications);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="screen">
      <BackBar title="Notifications" sub={unread ? `${unread} unread` : "You're all caught up"} right={unread > 0 && <button className="btn sm ghost" onClick={actions.markAllRead}>Mark all read</button>} />
      <div className="scroll pb-safe">
        {items.length === 0 && <Empty icon="bell" title="No notifications yet" />}
        <div className="col pad">
          {items.map((n) => (
            <button key={n.id} className="list-row" style={{ opacity: n.read ? 0.7 : 1 }} onClick={() => (actions.readNotification(n.id), nav.route(n.action))}>
              <span className={`icon-tile ${n.kind === "trust" ? "green" : n.kind === "credit" ? "amber" : ""}`}><Icon name={n.icon} /></span>
              <div className="grow" style={{ textAlign: "left" }}>
                <div className="bold small">{n.title}</div>
                <div className="tiny muted">{n.body}</div>
              </div>
              <div className="col" style={{ alignItems: "flex-end", gap: 6 }}>
                <span className="tiny muted">{timeAgo(n.at)}</span>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--primary)" }} />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
