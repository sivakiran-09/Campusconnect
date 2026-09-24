import { useState } from "react";
import "../styles/post.css";
import { Icon } from "../lib/icons.jsx";
import { Avatar, BackBar, Empty } from "../components/kit.jsx";
import { actions, useStore, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { timeAgoLong } from "../lib/format.js";

const TYPES = ["Interview", "Placement", "Internship", "Hackathon", "Certification", "Notes", "Project", "Career"];

export default function PostDetail({ id, compose }) {
  return compose ? <Compose /> : <ReadPost id={id} />;
}

function ReadPost({ id }) {
  const nav = useNav();
  const p = useStore((s) => s.knowledge.find((k) => k.id === id));
  const author = useStore((s) => s.users[p?.authorId]);
  const liked = useStore((s) => !!s.kLikes[id]);
  const saved = useStore((s) => !!s.kSaved[id]);
  const comments = useStore((s) => s.postComments[id] || []);
  const users = useStore((s) => s.users);
  const [c, setC] = useState("");
  if (!p) return <div className="screen"><Empty icon="news" title="Post not found" action={<button className="btn" onClick={nav.pop}>Go back</button>} /></div>;
  const paras = p.body.split("\n\n");

  return (
    <div className="screen">
      <BackBar title={p.type} onBack={nav.pop} right={<button className="icon-btn" onClick={() => nav.push("chat", { id: "ai", ask: `What did seniors share about ${p.title}?` })} aria-label="Ask Campus AI"><Icon name="sparkles" /></button>} />
      <div className="scroll pb-safe pad">
        <div className="row mt-8">
          <button onClick={() => nav.push("user", { id: author.id })} aria-label="Author profile"><Avatar u={author} tick={author.role !== "Student"} /></button>
          <div className="grow"><b>{author.name}</b><div className="tiny muted">{author.role !== "Student" ? author.role + " · " : ""}{author.batch} · {timeAgoLong(p.createdAt)}</div></div>
          <span className={`badge ${p.type === "Notes" ? "green" : ""}`}>{p.type}</span>
        </div>
        <h1 className="post-title mt-12">{p.title}</h1>
        {p.company && <div className="badge amber mt-8">{p.company}</div>}
        <div className="post-body mt-16">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>
        <div className="row wrap gap-6 mt-16">{p.tags.map((t) => <span key={t} className="tagpill">#{t}</span>)}</div>

        <div className="pactions mt-16" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
          <button className={liked ? "on" : ""} onClick={() => actions.toggleLikePost(p.id)} aria-pressed={liked}><Icon name="heart" style={{ fill: liked ? "currentColor" : "none" }} />{p.likes}</button>
          <button><Icon name="comment" />{comments.length}</button>
          <span className="grow" />
          <button className={saved ? "on" : ""} onClick={() => actions.toggleSavePost(p.id)} aria-pressed={saved}><Icon name="bookmark" style={{ fill: saved ? "currentColor" : "none" }} />Save</button>
        </div>
        <div className="tiny muted mt-8"><Icon name="thumb" size={12} style={{ verticalAlign: "-2px" }} /> Helped {p.helpful} juniors on campus</div>

        <h2 className="h-md mt-24">Comments</h2>
        <div className="col mt-8">
          {comments.map((cm) => <div key={cm.id} className="comment"><Avatar u={users[cm.userId]} size="sm" /><div className="grow"><div className="small"><b>{users[cm.userId]?.name.split(" ")[0]}</b> <span className="muted">{timeAgoLong(cm.at)}</span></div><div>{cm.text}</div></div></div>)}
          {!comments.length && <div className="small muted">Be the first to ask a follow-up.</div>}
          <form className="comment-in mt-8" onSubmit={(e) => { e.preventDefault(); if (c.trim()) (actions.addPostComment(p.id, c.trim()), setC("")); }}>
            <input value={c} onChange={(e) => setC(e.target.value)} placeholder="Ask a follow-up question…" aria-label="Add a comment" />
            <button className="icon-btn" disabled={!c.trim()} aria-label="Post comment"><Icon name="send" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Compose() {
  const nav = useNav();
  const me = useMe();
  const [type, setType] = useState("Interview");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const ok = title.trim().length > 6 && body.trim().length > 40;
  const publish = () => {
    const p = actions.createPost({ type, title: title.trim(), company: company.trim(), body: body.trim(), tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) });
    nav.replace("post", { id: p.id });
  };
  return (
    <div className="screen">
      <BackBar title="Share an experience" sub={`Posting as ${me.name}`} onBack={nav.pop} />
      <div className="scroll pb-safe pad">
        <div className="field mt-8"><span className="lbl">Type</span><div className="wrap row gap-8">{TYPES.map((t) => <button key={t} className={`chip ${type === t ? "on" : ""}`} onClick={() => setType(t)}>{t}</button>)}</div></div>
        <label className="field mt-16"><span className="lbl">Title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TCS Digital: my 3-round experience" /></label>
        <label className="field mt-16"><span className="lbl">Company / context (optional)</span><input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. TCS Digital" /></label>
        <label className="field mt-16"><span className="lbl">Share the details</span><textarea className="textarea" style={{ minHeight: 200 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happened in each round? What should juniors prepare? Separate paragraphs with a blank line." /></label>
        <label className="field mt-16"><span className="lbl">Tags (comma separated)</span><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tcs, placement, sql" /></label>
        <div className="pipeline-note mt-16"><Icon name="sparkles" /><span>This becomes part of Campus AI's knowledge base, cited and searchable by every junior after you.</span></div>
        <button className="btn lg block mt-16" disabled={!ok} onClick={publish}>Publish to Knowledge Hub<Icon name="check" /></button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
