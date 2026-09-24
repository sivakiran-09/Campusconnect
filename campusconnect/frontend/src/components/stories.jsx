import { useEffect, useRef, useState } from "react";
import { Icon } from "../lib/icons.jsx";
import { Avatar } from "./kit.jsx";
import { CoverArt } from "./cover.jsx";
import { actions, useStore } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { timeAgoLong } from "../lib/format.js";

const DURATION = 5200;

/** Full-screen story viewer: tap left/right, hold to pause, auto-advances, swipe down to close. */
export function StoryViewer({ story, onClose, onNextStory }) {
  const nav = useNav();
  const { toast } = useUI();
  const author = useStore((s) => s.users[story.authorId]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reply, setReply] = useState("");
  const holdT = useRef();
  const held = useRef(false);
  const f = story.frames[i];

  useEffect(() => {
    actions.markStorySeen(story.id);
  }, [story.id]);
  useEffect(() => {
    setI(0);
  }, [story.id]);

  const next = () => (i < story.frames.length - 1 ? setI(i + 1) : onNextStory ? onNextStory() : onClose());
  const prev = () => (i > 0 ? setI(i - 1) : null);

  const down = () => {
    held.current = false;
    holdT.current = setTimeout(() => ((held.current = true), setPaused(true)), 220);
  };
  const up = (e) => {
    clearTimeout(holdT.current);
    setPaused(false);
    if (held.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    (e.clientX - r.left) / r.width < 0.32 ? prev() : next();
  };
  const cta = () => {
    onClose();
    setTimeout(() => nav.route(f.cta.to), 60);
  };
  const send = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const id = actions.openChat(story.authorId);
    actions.sendMessage(id, { text: reply.trim() });
    setReply("");
    setPaused(false);
    toast({ title: "Reply sent", body: `to ${author.name.split(" ")[0]}`, icon: "send" });
  };

  return (
    <div className="story" style={{ background: `linear-gradient(165deg, hsl(${f.hue} 62% 22%), hsl(${(f.hue + 40) % 360} 60% 34%))` }}>
      <div className="story-bars">
        {story.frames.map((_, k) => (
          <span key={k}><i className={k < i ? "done" : k === i ? "run" : ""} style={k === i ? { animationDuration: `${DURATION}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} onAnimationEnd={k === i ? next : undefined} /></span>
        ))}
      </div>
      <div className="story-head">
        <Avatar u={author} size="sm" />
        <div className="grow"><b>{author.name}</b><span className="muted-w"> · {timeAgoLong(Date.now() - 3 * 3600e3)}</span></div>
        <button className="icon-btn white" onClick={onClose} aria-label="Close story"><Icon name="x" /></button>
      </div>
      <div className="story-body" onPointerDown={down} onPointerUp={up} onPointerLeave={() => (clearTimeout(holdT.current), setPaused(false))} key={`${story.id}-${i}`}>
        <span className="story-kicker">{f.kicker}</span>
        {f.art && <div className="story-art"><CoverArt art={f.art} /></div>}
        <h2>{f.title}</h2>
        <p>{f.text}</p>
      </div>
      <div className="story-foot">
        {f.cta && <button className="btn lg block story-cta" onClick={cta}>{f.cta.label}<Icon name="arrow" /></button>}
        <form className="story-reply" onSubmit={send}>
          <input value={reply} onChange={(e) => setReply(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} placeholder={`Reply to ${author.name.split(" ")[0]}…`} aria-label="Reply to story" />
          <button type="button" className={`icon-btn white ${liked ? "liked" : ""}`} onClick={() => setLiked(!liked)} aria-label="Like story" aria-pressed={liked}><Icon name="heart" style={{ fill: liked ? "#ff5c7a" : "none", color: liked ? "#ff5c7a" : "#fff" }} /></button>
          <button className="icon-btn white" aria-label="Send reply"><Icon name="send" /></button>
        </form>
      </div>
    </div>
  );
}
