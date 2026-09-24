import { useEffect, useRef, useState } from "react";
import "../styles/chat.css";
import { Icon } from "../lib/icons.jsx";
import { Avatar, BackBar } from "../components/kit.jsx";
import { CoverArt } from "../components/cover.jsx";
import { statusOf } from "../components/cards.jsx";
import { actions, useStore, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { clock, dayLabel, priceLabel } from "../lib/format.js";
import { QUICK_REPLIES } from "../lib/seed.js";
import { SUGGESTIONS } from "../lib/campusAi.js";
import { compressImage, validateImage } from "../lib/image.js";

export default function Chat({ id, ask }) {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const chat = useStore((s) => s.chats.find((c) => c.id === id));
  const users = useStore((s) => s.users);
  const resources = useStore((s) => s.resources);
  const txs = useStore((s) => s.transactions);
  const typingId = useStore((s) => s.typing[id]);
  const aiTyping = useStore((s) => s.aiTyping);
  const [text, setText] = useState("");
  const scroller = useRef();
  const fileRef = useRef();
  const askedRef = useRef(false);

  useEffect(() => {
    actions.viewChat(id);
    actions.markRead(id);
    return () => actions.viewChat(null);
  }, [id]);
  useEffect(() => {
    if (ask && !askedRef.current) {
      askedRef.current = true;
      actions.askAi(ask);
    }
  }, [ask]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [chat?.messages.length, typingId, aiTyping]);

  if (!chat) return null;
  const isAi = chat.type === "ai";
  const isGroup = chat.type === "group";
  const peer = !isAi && !isGroup ? users[chat.peer] : null;
  const title = isAi ? "Campus AI" : isGroup ? chat.title : peer?.name;
  const sub = isAi ? "Grounded in campus knowledge" : isGroup ? `${chat.memberCount} members` : peer?.online ? "Online" : "Offline";
  const ctxRes = chat.context?.resourceId ? resources.find((r) => r.id === chat.context.resourceId) : null;
  const ctxTx = chat.context?.txId ? txs.find((t) => t.id === chat.context.txId) : null;

  const send = (t) => {
    const val = (t ?? text).trim();
    if (!val) return;
    if (isAi) actions.askAi(val);
    else actions.sendMessage(id, { text: val });
    setText("");
  };
  const sendVoice = () => actions.sendMessage(id, { type: "voice", secs: 4 + Math.floor(Math.random() * 20) });
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const v = validateImage(file);
    if (!v.ok) return ui.toast({ title: "Can't send this photo", body: v.reason, tone: "alert" });
    try {
      const c = await compressImage(file, { maxSide: 900 });
      actions.sendMessage(id, { type: "image", src: c.dataUrl });
    } catch (err) {
      ui.toast({ title: "Couldn't process photo", body: err.message, tone: "alert" });
    }
  };
  const openMenu = () =>
    ui.openSheet({
      render: (close) => (
        <div className="col">
          {!isAi && !isGroup && <button className="list-row" onClick={() => (close(), nav.push("user", { id: peer.id }))}><Icon name="user" /><span>View profile</span></button>}
          {!isAi && <button className="list-row" onClick={() => (actions.chatFlag(id, { muted: !chat.muted }), close())}><Icon name={chat.muted ? "bell" : "bellOff"} /><span>{chat.muted ? "Unmute" : "Mute"} notifications</span></button>}
          {!isAi && (
            <button
              className="list-row red-text"
              onClick={async () => {
                const okc = await ui.confirm({ title: "Delete conversation?", danger: true, ok: "Delete" });
                if (okc) (actions.deleteChat(id), close(), nav.pop());
              }}
            >
              <Icon name="trash" />
              <span>Delete conversation</span>
            </button>
          )}
        </div>
      ),
    });

  let lastDay = null;

  return (
    <div className="screen chat-screen">
      <BackBar
        title={title}
        sub={sub}
        onBack={nav.pop}
        right={
          <>
            {!isAi && !isGroup && (
              <button className="icon-btn" aria-label="Call">
                <Icon name="phone" />
              </button>
            )}
            <button className="icon-btn" onClick={openMenu} aria-label="More options">
              <Icon name="more" />
            </button>
          </>
        }
      />
      {ctxRes && (
        <button className="ctx-strip" onClick={() => nav.push("item", { id: ctxRes.id })}>
          <span className="ctx-thumb">
            <CoverArt r={ctxRes} />
          </span>
          <div className="grow" style={{ textAlign: "left" }}>
            <b className="small truncate">{ctxRes.title}</b>
            <span className="tiny muted">
              {priceLabel(ctxRes)}
              {ctxTx ? ` · ${statusOf(ctxTx.status).label}` : ""}
            </span>
          </div>
          {ctxTx && (
            <button className="btn sm soft" onClick={(e) => (e.stopPropagation(), nav.push("handoff", { id: ctxTx.id }))}>
              Open
            </button>
          )}
        </button>
      )}
      <div className="scroll chat-scroll" ref={scroller}>
        <div className="pad col">
          {isAi && chat.messages.length === 0 && <AiIntro onPick={send} />}
          {chat.messages.map((m) => {
            const showDay = dayLabel(m.at) !== lastDay;
            lastDay = dayLabel(m.at);
            const mine = m.from === me.id;
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="day-chip">
                    <span>{dayLabel(m.at)}</span>
                  </div>
                )}
                {m.type === "system" ? (
                  <div className="sys-msg" onClick={() => m.txId && nav.push("handoff", { id: m.txId })}>
                    <Icon name="ok" />
                    {m.text}
                  </div>
                ) : m.from === "ai" ? (
                  <AiBubble m={m} nav={nav} onPick={send} />
                ) : (
                  <Bubble
                    m={m}
                    mine={mine}
                    isGroup={isGroup}
                    user={users[m.from]}
                    onReact={(e) => actions.react(id, m.id, e)}
                    onDelete={mine ? () => actions.deleteMessage(id, m.id) : null}
                    resource={m.type === "listing" ? resources.find((r) => r.id === m.resourceId) : null}
                    onOpenListing={() => nav.push("item", { id: m.resourceId })}
                  />
                )}
              </div>
            );
          })}
          {(typingId || (isAi && aiTyping)) && <TypingBubble u={isAi ? null : users[typingId]} isAi={isAi} />}
        </div>
      </div>
      {!isAi && (
        <div className="hscroll quick-row">
          {QUICK_REPLIES.map((q) => (
            <button key={q} className="chip sm" onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
      <form className="composer" onSubmit={(e) => (e.preventDefault(), send())}>
        {!isAi && <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />}
        {!isAi && (
          <button type="button" className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Attach photo">
            <Icon name="clip" />
          </button>
        )}
        <input className="composer-in" value={text} onChange={(e) => setText(e.target.value)} placeholder={isAi ? "Ask about interviews, notes, resources…" : "Message…"} aria-label="Message" />
        {text.trim() ? (
          <button className="icon-btn filled send" aria-label="Send">
            <Icon name="send" />
          </button>
        ) : isAi ? (
          <button className="icon-btn filled send" aria-label="Send" disabled>
            <Icon name="send" />
          </button>
        ) : (
          <button type="button" className="icon-btn filled send" onClick={sendVoice} aria-label="Send voice message">
            <Icon name="mic" />
          </button>
        )}
      </form>
    </div>
  );
}

function AiIntro({ onPick }) {
  return (
    <div className="ai-intro">
      <span className="ai-avatar lg">
        <Icon name="sparkles" />
      </span>
      <h3>Hi, I'm Campus AI</h3>
      <p className="small soft-text center">Ask me to find resources, or ask what seniors learned from real interviews, internships and hackathons.</p>
      <div className="col gap-8 mt-16" style={{ width: "100%" }}>
        {SUGGESTIONS.map((q) => (
          <button key={q} className="chip" style={{ justifyContent: "flex-start" }} onClick={() => onPick(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ m, mine, isGroup, user, onReact, onDelete, resource, onOpenListing }) {
  const [open, setOpen] = useState(false);
  const reactions = Object.entries(m.reactions || {});
  return (
    <div className={`brow ${mine ? "mine" : ""}`}>
      {!mine && isGroup && <Avatar u={user} size="xs" />}
      <div className="bwrap">
        <div className={`bubble ${mine ? "mine" : ""} ${m.deleted ? "deleted" : ""}`} onClick={() => !m.deleted && setOpen((o) => !o)}>
          {!mine && isGroup && <b className="b-name">{user?.name.split(" ")[0]}</b>}
          {m.type === "listing" && resource && (
            <button className="bubble-card" onClick={(e) => (e.stopPropagation(), onOpenListing())}>
              <span className="bc-thumb">
                <CoverArt r={resource} />
              </span>
              <div className="grow" style={{ textAlign: "left" }}>
                <b className="small truncate">{resource.title}</b>
                <span className="tiny muted">{priceLabel(resource)}</span>
              </div>
            </button>
          )}
          {m.type === "image" && <img className="bubble-img" src={m.src} alt="Shared" />}
          {m.type === "voice" && <VoiceBubble secs={m.secs} mine={mine} />}
          {(m.type === "text" || !m.type || (m.type === "listing" && m.text)) && <span>{m.text}</span>}
          <span className="b-meta">
            {clock(m.at)}
            {mine && <Icon name="checks" size={14} style={{ marginLeft: 4, color: m.status === "read" ? "#bcefff" : undefined }} />}
          </span>
        </div>
        {reactions.length > 0 && (
          <div className="b-reacts">
            {reactions.map(([e, u]) => (
              <span key={e}>
                {e}
                {u.length > 1 ? u.length : ""}
              </span>
            ))}
          </div>
        )}
        {open && !m.deleted && (
          <div className="react-bar">
            {["👍", "❤️", "😂", "🔥", "🙏"].map((e) => (
              <button key={e} onClick={() => (onReact(e), setOpen(false))}>
                {e}
              </button>
            ))}
            {onDelete && (
              <button className="del" onClick={() => (onDelete(), setOpen(false))} aria-label="Delete">
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceBubble({ secs, mine }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setT((x) => (x + 0.2 >= secs ? (setPlaying(false), 0) : x + 0.2)), 200);
    return () => clearInterval(iv);
  }, [playing, secs]);
  const pct = Math.min(100, (t / secs) * 100);
  return (
    <div className="voice-row">
      <button className="v-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play voice message"}>
        <Icon name={playing ? "pause" : "play"} />
      </button>
      <div className="v-wave">
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{ height: 6 + Math.abs(Math.sin(i * 1.3 + secs)) * 14, background: (i / 22) * 100 < pct ? (mine ? "#fff" : "var(--primary)") : undefined }} />
        ))}
      </div>
      <span className="tiny num">{playing ? Math.ceil(secs - t) : secs}s</span>
    </div>
  );
}

function TypingBubble({ u, isAi }) {
  return (
    <div className="brow">
      {isAi ? (
        <span className="ai-avatar" style={{ width: 28, height: 28 }}>
          <Icon name="sparkles" size={14} />
        </span>
      ) : (
        <Avatar u={u} size="xs" />
      )}
      <div className="bubble typing">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function AiBubble({ m, nav, onPick }) {
  return (
    <div className="brow">
      <span className="ai-avatar" style={{ width: 28, height: 28 }}>
        <Icon name="sparkles" size={14} />
      </span>
      <div className="bwrap" style={{ maxWidth: "88%" }}>
        <div className="bubble ai">
          <p>{m.text}</p>
          {m.points?.map((p, i) => (
            <button key={i} className="ai-point" onClick={() => nav.push("post", { id: p.postId })}>
              <Icon name="ok" />
              <span>{p.text}</span>
            </button>
          ))}
          {m.sources?.length > 0 && (
            <div className="ai-sources">
              <span className="tiny muted">Sources:</span>
              {m.sources.map((id) => (
                <SourceChip key={id} id={id} nav={nav} />
              ))}
            </div>
          )}
          {m.cards?.length > 0 && <CardRow ids={m.cards} nav={nav} />}
        </div>
        {m.followups?.length > 0 && (
          <div className="hscroll" style={{ padding: "8px 0 0", margin: 0 }}>
            {m.followups.map((f) => (
              <button key={f} className="chip sm" onClick={() => onPick(f)}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function SourceChip({ id, nav }) {
  const p = useStore((s) => s.knowledge.find((k) => k.id === id));
  if (!p) return null;
  return (
    <button className="chip sm" onClick={() => nav.push("post", { id })}>
      {p.title.slice(0, 28)}…
    </button>
  );
}
function CardRow({ ids, nav }) {
  const resources = useStore((s) => s.resources);
  return (
    <div className="ai-cards">
      {ids.map(({ id, pct }) => {
        const r = resources.find((x) => x.id === id);
        if (!r) return null;
        return (
          <button key={id} className="ai-card" onClick={() => nav.push("item", { id })}>
            <span className="ac-thumb">
              <CoverArt r={r} />
            </span>
            <b className="tiny truncate">{r.title}</b>
            <span className="tiny primary-text bold">{priceLabel(r)}</span>
            <span className="badge solid" style={{ position: "absolute", top: 6, right: 6 }}>
              {pct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
