import { useMemo, useState } from "react";
import "../styles/messages.css";
import { Icon } from "../lib/icons.jsx";
import { Avatar, Empty } from "../components/kit.jsx";
import { actions, useStore, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { timeAgo } from "../lib/format.js";

const preview = (m) => {
  if (!m) return "Say hello 👋";
  if (m.deleted) return "This message was deleted";
  if (m.type === "voice") return "🎤 Voice message";
  if (m.type === "image") return "📷 Photo";
  if (m.type === "listing") return m.text || "Sent a listing";
  if (m.type === "system") return m.text;
  return m.text;
};

export default function Messages() {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const chats = useStore((s) => s.chats);
  const users = useStore((s) => s.users);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const withMeta = chats.map((c) => {
      const last = c.messages[c.messages.length - 1];
      const title = c.type === "ai" ? "Campus AI" : c.type === "group" ? c.title : users[c.peer]?.name;
      return { c, last, title, at: last?.at || 0 };
    });
    const filtered = q.trim() ? withMeta.filter((r) => r.title?.toLowerCase().includes(q.toLowerCase()) || preview(r.last).toLowerCase().includes(q.toLowerCase())) : withMeta;
    return filtered.sort((a, b) => (b.c.pinned ? 1 : 0) - (a.c.pinned ? 1 : 0) || b.at - a.at);
  }, [chats, users, q]);

  const openChat = (c) => nav.push("chat", { id: c.id });
  const newMsg = () =>
    ui.openSheet({
      title: "New message",
      render: (close) => (
        <div className="col">
          {Object.values(users).filter((u) => u.id !== me.id).map((u) => (
            <button key={u.id} className="list-row" onClick={() => (close(), openChat({ id: actions.openChat(u.id) }))}>
              <Avatar u={u} online={u.online} />
              <div className="grow" style={{ textAlign: "left" }}><div className="bold">{u.name}</div><div className="tiny muted">{u.batch}</div></div>
            </button>
          ))}
        </div>
      ),
    });

  return (
    <>
      <header className="appbar">
        <h1>Messages</h1>
        <span className="spacer" />
        <button className="icon-btn filled" onClick={newMsg} aria-label="New message"><Icon name="edit" /></button>
      </header>
      <div className="pad">
        <label className="search" style={{ boxShadow: "none" }}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" />
        </label>
      </div>
      <div className="scroll pb-tab">
        {!rows.length && <Empty icon="comment" title="No conversations" />}
        <div className="chatlist">
          {rows.map(({ c, last, title }) => {
            const isAi = c.type === "ai";
            const isGroup = c.type === "group";
            const u = !isAi && !isGroup ? users[c.peer] : null;
            const mine = last?.from === me.id;
            return (
              <button key={c.id} className="chatrow" onClick={() => openChat(c)}>
                {isAi ? (
                  <span className="ai-avatar"><Icon name="sparkles" /></span>
                ) : isGroup ? (
                  <span className="group-avatar"><Icon name="users" /></span>
                ) : (
                  <Avatar u={u} online={u?.online} />
                )}
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between">
                    <span className="row gap-4 truncate"><b className="truncate">{title}</b>{c.pinned && <Icon name="pinned" size={13} className="muted" />}{c.muted && <Icon name="bellOff" size={13} className="muted" />}</span>
                    <span className="tiny muted" style={{ flex: "none" }}>{last ? timeAgo(last.at) : ""}</span>
                  </div>
                  <div className="row between mt-4">
                    <span className={`small truncate ${c.unread ? "bold" : "muted"}`}>{mine && <Icon name="checks" size={14} style={{ verticalAlign: "-2px", color: last?.status === "read" ? "var(--primary-text)" : "var(--ink-3)" }} />} {isGroup && last && !mine ? `${users[last.from]?.name.split(" ")[0]}: ` : ""}{preview(last)}</span>
                    {c.unread > 0 && !c.muted && <span className="unread-dot num">{c.unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
