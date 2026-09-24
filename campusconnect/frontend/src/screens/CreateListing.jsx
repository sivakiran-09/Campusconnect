import { useRef, useState } from "react";
import "../styles/create.css";
import { Icon, CAT_ICON, MODE_ICON } from "../lib/icons.jsx";
import { BackBar } from "../components/kit.jsx";
import { CoverArt } from "../components/cover.jsx";
import { actions, useMe } from "../lib/store.jsx";
import { useNav } from "../lib/nav.jsx";
import { useUI } from "../lib/ui.jsx";
import { CATEGORIES, SAFE_ZONES } from "../lib/seed.js";
import { compressImage, uploadWithProgress, validateImage } from "../lib/image.js";
import { API_URL, getToken } from "../lib/api.js";
import { inr, hueOf } from "../lib/format.js";

const STEPS = ["Mode & category", "Details", "Photos", "Price & pickup", "Review"];
const MODES = [
  { id: "LEND", label: "Lend", hint: "Rent by the week or day", icon: "repeat" },
  { id: "SELL", label: "Sell", hint: "One-time, price-capped sale", icon: "tag" },
  { id: "DONATE", label: "Donate", hint: "Free pass-down to a junior", icon: "gift" },
];
const CONDITIONS = ["Excellent", "Good", "Minor damage", "Fair"];
const BRANCHES = ["ALL", "CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"];

const initial = { mode: "LEND", category: "books", title: "", subtitle: "", desc: "", subject: "", code: "", sem: null, branch: "ALL", condition: "Good", price: "", deposit: "", maxDays: 14, pickup: "lib", photos: [] };

export default function CreateListing() {
  const nav = useNav();
  const ui = useUI();
  const me = useMe();
  const [step, setStep] = useState(0);
  const [d, setD] = useState(initial);
  const set = (patch) => setD((x) => ({ ...x, ...patch }));

  const valid = [
    true,
    d.title.trim().length > 2,
    true,
    !!d.pickup && (d.mode === "DONATE" || Number(d.price) > 0),
    true,
  ];

  const publish = () => {
    const hue = hueOf(d.title || d.category);
    const r = actions.createListing({
      title: d.title.trim(),
      subtitle: d.subtitle.trim() || `${d.condition} condition`,
      mode: d.mode,
      category: d.category,
      subject: d.subject.trim() || CATEGORIES.find((c) => c.id === d.category)?.label,
      code: d.code.trim(),
      sem: d.sem,
      branch: d.branch,
      condition: d.condition,
      desc: d.desc.trim() || `Listed by ${me.name.split(" ")[0]}.`,
      price: d.mode === "DONATE" ? 0 : Number(d.price) || 0,
      deposit: Number(d.deposit) || 0,
      maxDays: d.mode === "LEND" ? Number(d.maxDays) || 14 : 14,
      pickup: d.pickup,
      images: d.photos.map((p) => p.dataUrl),
      art: { kind: d.category === "books" ? "book" : d.category === "tech" ? "calc" : d.category === "music" ? "guitar" : d.category === "cycles" ? "bike" : d.category === "lab" ? "kit" : "notes", hue, label: d.title.slice(0, 9) || CATEGORIES.find((c) => c.id === d.category)?.label },
      tags: [d.subject, d.category].filter(Boolean).map((s) => s.toLowerCase()),
    });
    ui.toast({ title: "Listed on campus", body: d.mode === "DONATE" ? "Juniors will see it right away." : "You'll be notified when someone requests it.", tone: "success", icon: "check" });
    nav.replace("item", { id: r.id });
  };

  return (
    <div className="screen">
      <BackBar title="List a resource" sub={STEPS[step]} onBack={() => (step === 0 ? nav.pop() : setStep(step - 1))} />
      <div className="stepbar"><div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <div className="scroll pad pb-safe">
        {step === 0 && <StepMode d={d} set={set} />}
        {step === 1 && <StepDetails d={d} set={set} />}
        {step === 2 && <StepPhotos d={d} set={set} ui={ui} />}
        {step === 3 && <StepPrice d={d} set={set} />}
        {step === 4 && <StepReview d={d} />}
        <div style={{ height: 90 }} />
      </div>
      <div className="dock">
        {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn lg grow" disabled={!valid[step]} onClick={() => (step === STEPS.length - 1 ? publish() : setStep(step + 1))}>
          {step === STEPS.length - 1 ? "Publish listing" : "Continue"}
          <Icon name={step === STEPS.length - 1 ? "check" : "arrow"} />
        </button>
      </div>
    </div>
  );
}

function StepMode({ d, set }) {
  return (
    <>
      <h2 className="h-md">How are you sharing it?</h2>
      <div className="col gap-10 mt-12">
        {MODES.map((m) => (
          <button key={m.id} className={`mode-opt ${d.mode === m.id ? "on" : ""}`} onClick={() => set({ mode: m.id })}>
            <span className="icon-tile"><Icon name={m.icon} /></span>
            <div className="grow" style={{ textAlign: "left" }}><b>{m.label}</b><div className="small muted">{m.hint}</div></div>
            <i className="radio" />
          </button>
        ))}
      </div>
      <h2 className="h-md mt-24">Category</h2>
      <div className="cat-grid mt-12">
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`cat-opt ${d.category === c.id ? "on" : ""}`} onClick={() => set({ category: c.id })}>
            <Icon name={CAT_ICON[c.id]} size={22} />
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function StepDetails({ d, set }) {
  return (
    <div className="col gap-16">
      <label className="field"><span className="lbl">Title</span><input className="input" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Database System Concepts, 7th Ed." autoFocus /></label>
      <label className="field"><span className="lbl">Subtitle</span><input className="input" value={d.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Author, edition, extras included" /></label>
      <label className="field"><span className="lbl">Description</span><textarea className="textarea" value={d.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Condition details, what's included, any notes for the borrower" /></label>
      <div className="row gap-12">
        <label className="field grow"><span className="lbl">Subject</span><input className="input" value={d.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="e.g. DBMS" /></label>
        <label className="field grow"><span className="lbl">Course code</span><input className="input" value={d.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g. CS 305" /></label>
      </div>
      <div className="field"><span className="lbl">Semester</span><div className="wrap row gap-8">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <button key={n} className={`chip ${d.sem === n ? "on" : ""}`} style={{ minWidth: 42, justifyContent: "center" }} onClick={() => set({ sem: d.sem === n ? null : n })}>{n}</button>)}</div></div>
      <div className="field"><span className="lbl">Branch</span><div className="wrap row gap-8">{BRANCHES.map((b) => <button key={b} className={`chip ${d.branch === b ? "on" : ""}`} onClick={() => set({ branch: b })}>{b === "ALL" ? "All branches" : b}</button>)}</div></div>
      <div className="field"><span className="lbl">Condition</span><div className="wrap row gap-8">{CONDITIONS.map((c) => <button key={c} className={`chip ${d.condition === c ? "on" : ""}`} onClick={() => set({ condition: c })}>{c}</button>)}</div></div>
    </div>
  );
}

function StepPhotos({ d, set, ui }) {
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);
  const onPick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - d.photos.length);
    e.target.value = "";
    let arr = d.photos;
    const sync = () => set({ photos: arr });
    for (const file of files) {
      const v = validateImage(file);
      if (!v.ok) {
        ui.toast({ title: "Skipped a photo", body: v.reason, tone: "alert" });
        continue;
      }
      setBusy(true);
      try {
        const compressed = await compressImage(file);
        const item = { id: Math.random().toString(36).slice(2), dataUrl: compressed.dataUrl, progress: 0, originalSize: compressed.originalSize, size: compressed.size };
        arr = [...arr, item];
        sync();
        await uploadWithProgress(compressed.blob, {
          url: API_URL,
          token: getToken(),
          onProgress: (p) => {
            arr = arr.map((x) => (x.id === item.id ? { ...x, progress: p } : x));
            sync();
          },
        });
      } catch (err) {
        ui.toast({ title: "Couldn't process that photo", body: err.message, tone: "alert" });
      }
      setBusy(false);
    }
  };
  const remove = (id) => set({ photos: d.photos.filter((p) => p.id !== id) });
  return (
    <>
      <h2 className="h-md">Add photos</h2>
      <p className="small soft-text mt-4">Photos are compressed and stripped of location metadata automatically. Up to 4 photos.</p>
      <div className="photo-grid mt-12">
        {d.photos.map((p) => (
          <div key={p.id} className="photo-tile">
            <img src={p.dataUrl} alt="Upload preview" />
            {p.progress < 100 && (
              <div className="p-overlay">
                <svg viewBox="0 0 36 36" className="p-ring"><circle cx="18" cy="18" r="15.5" /><circle cx="18" cy="18" r="15.5" strokeDasharray={97.4} strokeDashoffset={97.4 * (1 - p.progress / 100)} /></svg>
                <span className="tiny num">{p.progress}%</span>
              </div>
            )}
            <button className="p-remove" onClick={() => remove(p.id)} aria-label="Remove photo"><Icon name="x" size={14} /></button>
            {p.progress >= 100 && <span className="p-size tiny num">{Math.round(p.size / 1024)} KB</span>}
          </div>
        ))}
        {d.photos.length < 4 && (
          <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name={busy ? "cloudUp" : "addImage"} />
            <span>{busy ? "Processing…" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
      <div className="pipeline-note mt-16">
        <Icon name="shield" />
        <span>Validate → compress → crop → secure upload → server re-check → cloud storage. EXIF/GPS data is removed before anything is stored.</span>
      </div>
      {!d.photos.length && (
        <div className="col gap-8 mt-16">
          <div className="small bold muted">No photos yet? A designed cover will represent your item until you add one.</div>
          <div style={{ width: 120, height: 90, borderRadius: 16, overflow: "hidden" }}><CoverArt art={{ kind: d.category === "books" ? "book" : "kit", hue: hueOf(d.title || d.category), label: d.title.slice(0, 9) || "Preview" }} /></div>
        </div>
      )}
    </>
  );
}

function StepPrice({ d, set }) {
  return (
    <div className="col gap-16">
      {d.mode !== "DONATE" ? (
        <label className="field"><span className="lbl">{d.mode === "LEND" ? "Price per week" : "Sale price"}</span>
          <div className="input-icon"><span style={{ position: "absolute", left: 15, top: 13, fontWeight: 700, color: "var(--ink-3)" }}>₹</span><input className="input" style={{ paddingLeft: 30 }} inputMode="numeric" value={d.price} onChange={(e) => set({ price: e.target.value.replace(/\D/g, "") })} placeholder={d.mode === "LEND" ? "20" : "800"} /></div>
          {d.mode === "SELL" && <div className="help">Price-capped: keep it fair for fellow students.</div>}
        </label>
      ) : (
        <div className="card tint pad-card"><Icon name="gift" style={{ verticalAlign: "-3px" }} className="green-text" /> This item will be listed as free for any student to claim.</div>
      )}
      {d.mode === "LEND" && (
        <>
          <label className="field"><span className="lbl">Refundable deposit (optional)</span><div className="input-icon"><span style={{ position: "absolute", left: 15, top: 13, fontWeight: 700, color: "var(--ink-3)" }}>₹</span><input className="input" style={{ paddingLeft: 30 }} inputMode="numeric" value={d.deposit} onChange={(e) => set({ deposit: e.target.value.replace(/\D/g, "") })} placeholder="0" /></div></label>
          <div className="field"><span className="lbl row between"><span>Maximum rental period</span><b className="primary-text">{d.maxDays} days</b></span><input type="range" min="3" max="30" value={d.maxDays} onChange={(e) => set({ maxDays: +e.target.value })} /></div>
        </>
      )}
      <div className="field"><span className="lbl">Pickup Safe Zone</span>
        <div className="col gap-8">{SAFE_ZONES.map((z) => (
          <button key={z.id} className={`zone-opt ${d.pickup === z.id ? "on" : ""}`} onClick={() => set({ pickup: z.id })}><Icon name="pin" /><div className="grow" style={{ textAlign: "left" }}><b>{z.name}</b><div className="tiny muted">{z.spot}</div></div><i className="radio" /></button>
        ))}</div>
      </div>
    </div>
  );
}

function StepReview({ d }) {
  return (
    <>
      <h2 className="h-md">Review your listing</h2>
      <div className="preview-card mt-12">
        <div className="pv-media">{d.photos[0] ? <img src={d.photos[0].dataUrl} alt="" /> : <CoverArt art={{ kind: d.category === "books" ? "book" : "kit", hue: hueOf(d.title || d.category), label: d.title.slice(0, 9) }} />}</div>
        <div className="pv-body">
          <span className={`badge solid ${d.mode === "SELL" ? "amber" : d.mode === "DONATE" ? "green" : ""}`}><Icon name={MODE_ICON[d.mode]} />{d.mode === "DONATE" ? "Free" : d.mode === "LEND" ? `${inr(Number(d.price) || 0)}/wk` : inr(Number(d.price) || 0)}</span>
          <h3 className="mt-8">{d.title || "Untitled listing"}</h3>
          <p className="small soft-text">{d.subtitle || d.condition + " condition"}</p>
        </div>
      </div>
      <div className="review-list mt-16">
        <Row k="Category" v={CATEGORIES.find((c) => c.id === d.category)?.label} />
        <Row k="Condition" v={d.condition} />
        {d.sem && <Row k="Semester" v={`${d.sem} · ${d.branch}`} />}
        <Row k="Pickup" v={SAFE_ZONES.find((z) => z.id === d.pickup)?.name} />
        {d.mode === "LEND" && <Row k="Max rental" v={`${d.maxDays} days`} />}
        {!!Number(d.deposit) && <Row k="Deposit" v={inr(Number(d.deposit))} />}
        <Row k="Photos" v={`${d.photos.length} attached`} />
      </div>
      <div className="pipeline-note mt-16"><Icon name="shield" /><span>Once published, classmates can request it. You'll confirm a QR handover at your chosen Safe Zone.</span></div>
    </>
  );
}
const Row = ({ k, v }) => <div className="row between review-row"><span className="muted small">{k}</span><b className="small">{v}</b></div>;
