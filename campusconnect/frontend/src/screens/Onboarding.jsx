import { useEffect, useRef, useState } from "react";
import "../styles/onboarding.css";
import { Icon } from "../lib/icons.jsx";
import { actions } from "../lib/store.jsx";
import { API_ON } from "../lib/api.js";
import { useUI } from "../lib/ui.jsx";
import { isCollegeEmail } from "../lib/store.jsx";
import welcome from "../assets/welcome.jpg";
import autumn from "../assets/autumn.jpg";
import mentor from "../assets/skill-mentor.webp";
import code from "../assets/skill-code.webp";
import guitar from "../assets/skill-guitar.webp";

const SLIDES = [
  { img: welcome, hero: true, title: "Don't buy what your campus already has.", body: "Lend, sell or donate books, calculators, cycles and lab gear. Only verified students, only on your campus." },
  { img: mentor, title: "Trust you can see", body: "Every student has a Campus Trust Score built from on-time returns, item condition and peer ratings. QR handovers and photo checks protect both sides.", points: [["qr", "QR handover at Safe Zones"], ["camera", "AI condition check on return"], ["shield", "College-email verified"]] },
  { img: code, title: "Don't lose what your seniors already know.", body: "Interview stories, notes, mentors and skill swaps. Ask Campus AI and get answers from real senior experience.", points: [["news", "Senior-to-junior knowledge hub"], ["swap", "Swap skills, earn credits"], ["sparkles", "Campus-only AI assistant"]] },
];
const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "IT"];
const SKILLS = ["Python", "Guitar basics", "Figma", "DSA", "Arduino", "Spoken English", "Resume review", "Machine Learning", "Photography", "Sketching"];

export default function Onboarding() {
  const [step, setStep] = useState("welcome");
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState({ name: "", branch: "CSE", sem: 5, teach: [], want: [] });

  if (step === "welcome") return <Welcome slide={slide} setSlide={setSlide} onDone={() => setStep("email")} onDemo={() => actions.loginDemo()} />;
  if (step === "email") return <EmailStep email={email} setEmail={setEmail} back={() => setStep("welcome")} next={() => setStep("otp")} />;
  if (step === "otp") return <OtpStep email={email} back={() => setStep("email")} next={(isNew) => (isNew ? setStep("profile") : null)} />;
  if (step === "profile") return <ProfileStep email={email} profile={profile} setProfile={setProfile} onDone={() => setStep("done")} />;
  return <Done name={profile.name} email={email} profile={profile} />;
}

function Welcome({ slide, setSlide, onDone, onDemo }) {
  const s = SLIDES[slide];
  const last = slide === SLIDES.length - 1;
  const drag = useRef(null);
  return (
    <div className="ob" onPointerDown={(e) => (drag.current = e.clientX)} onPointerUp={(e) => {
      if (drag.current == null) return;
      const dx = e.clientX - drag.current;
      if (dx < -50 && slide < 2) setSlide(slide + 1);
      if (dx > 50 && slide > 0) setSlide(slide - 1);
      drag.current = null;
    }}>
      <div className={`ob-art ${s.hero ? "hero" : ""}`} key={slide}>
        {s.hero ? <img src={s.img} alt="Students exchanging books and bikes on campus" /> : <div className="ob-circle"><img src={s.img} alt="" /></div>}
        <div className="ob-brand"><Icon name="shield" />CampusConnect</div>
        <button className="ob-skip" onClick={onDone}>Skip</button>
      </div>
      <div className="ob-panel" key={`p${slide}`}>
        <div className="ob-dots" role="tablist">{SLIDES.map((_, i) => <button key={i} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />)}</div>
        <h1>{s.title}</h1>
        <p>{s.body}</p>
        {s.points && <ul className="ob-points">{s.points.map(([ic, t]) => <li key={t}><span className="icon-tile"><Icon name={ic} /></span>{t}</li>)}</ul>}
        <div className="col gap-8 mt-16">
          <button className="btn lg block" onClick={() => (last ? onDone() : setSlide(slide + 1))}>{last ? "Get started" : "Next"}<Icon name="arrow" /></button>
          {slide === 0 && <button className="btn ghost block" onClick={onDone}>I already have an account</button>}
          {last && <button className="btn soft block" onClick={onDemo}><Icon name="rocket" />Explore the demo campus</button>}
        </div>
      </div>
    </div>
  );
}

function EmailStep({ email, setEmail, back, next }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await actions.requestOtp(email.trim());
      next();
    } catch (ex) {
      setErr(ex.message);
    }
    setBusy(false);
  };
  return (
    <div className="ob scroll-y">
      <div className="ob-top" style={{ backgroundImage: `url(${autumn})` }}>
        <button className="icon-btn white" onClick={back} aria-label="Back"><Icon name="back" /></button>
      </div>
      <form className="ob-form" onSubmit={submit}>
        <span className="icon-tile green big"><Icon name="shield" /></span>
        <h1>Sign in with your college email</h1>
        <p className="soft-text">We verify every student so the marketplace stays campus-only. We'll email a 6 digit code.</p>
        <label className="field mt-16">
          <span className="lbl">College email</span>
          <span className={`input-icon ${err ? "err" : ""}`}>
            <Icon name="mail" />
            <input className="input" style={{ paddingLeft: 44 }} type="email" inputMode="email" autoComplete="email" autoFocus placeholder="name@campusname.ac.in" value={email} onChange={(e) => (setEmail(e.target.value), setErr(""))} aria-invalid={!!err} />
          </span>
          {err ? <div className="help err" role="alert">{err}</div> : <div className="help">Works with .edu and .ac.in addresses. Personal emails aren't accepted.</div>}
        </label>
        <button className="btn lg block mt-16" disabled={!isCollegeEmail(email) || busy}>{busy ? "Sending…" : "Send verification code"}</button>
        {!API_ON && (
          <button type="button" className="btn soft block mt-8" onClick={() => actions.loginDemo()}>
            <Icon name="rocket" />Skip and explore as Rahul (Trust 94)
          </button>
        )}
        <p className="tiny muted center mt-16">By continuing you agree to the community rules: return on time, describe items honestly, meet at Safe Zones.</p>
      </form>
    </div>
  );
}

function OtpStep({ email, back, next }) {
  const [d, setD] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);
  const refs = useRef([]);
  const { toast } = useUI();
  useEffect(() => {
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const verify = async (code) => {
    setBusy(true);
    setErr("");
    try {
      const r = await actions.verifyOtp(email, code);
      next(r.isNew);
    } catch (e) {
      setErr(e.message);
      setD(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    }
    setBusy(false);
  };
  const setAt = (i, v) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      const arr = digits.slice(0, 6).split("");
      const nd = [...Array(6)].map((_, k) => arr[k] || "");
      setD(nd);
      refs.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length === 6) verify(arr.join(""));
      return;
    }
    const nd = [...d];
    nd[i] = digits;
    setD(nd);
    if (digits && i < 5) refs.current[i + 1]?.focus();
    if (nd.every(Boolean)) verify(nd.join(""));
  };
  return (
    <div className="ob scroll-y">
      <div className="ob-top small" style={{ backgroundImage: `url(${autumn})` }}>
        <button className="icon-btn white" onClick={back} aria-label="Back"><Icon name="back" /></button>
      </div>
      <div className="ob-form">
        <span className="icon-tile big"><Icon name="key" /></span>
        <h1>Enter the 6 digit code</h1>
        <p className="soft-text">Sent to <b>{email}</b></p>
        <div className="otp" role="group" aria-label="Verification code">
          {d.map((v, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} className={`otp-box ${err ? "err" : ""} ${v ? "fill" : ""}`} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6} value={v} aria-label={`Digit ${i + 1}`} autoFocus={i === 0}
              onChange={(e) => setAt(i, e.target.value)} onKeyDown={(e) => e.key === "Backspace" && !d[i] && i > 0 && refs.current[i - 1]?.focus()} />
          ))}
        </div>
        {err && <div className="help err" role="alert" style={{ textAlign: "center" }}>{err}</div>}
        {!API_ON && <div className="demo-hint"><Icon name="info" />Demo mode: your code is <b className="num">123456</b><button onClick={() => { setD("123456".split("")); verify("123456"); }}>Fill it</button></div>}
        <button className="btn lg block mt-16" disabled={d.some((x) => !x) || busy} onClick={() => verify(d.join(""))}>{busy ? "Verifying…" : "Verify and continue"}</button>
        <button className="btn ghost block mt-8" disabled={wait > 0} onClick={() => { setWait(30); toast({ title: "Code sent again", body: email, icon: "mail", tone: "success" }); }}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button>
      </div>
    </div>
  );
}

function ProfileStep({ email, profile, setProfile, onDone }) {
  const toggle = (k, v) => setProfile((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const ok = profile.name.trim().length >= 2;
  return (
    <div className="ob scroll-y">
      <div className="ob-form" style={{ paddingTop: 28 }}>
        <div className="steps-mini"><i className="on" /><i className="on" /><i className="on" /></div>
        <h1>Set up your campus profile</h1>
        <p className="soft-text">This is how classmates see you. It also powers smart matching for books and mentors.</p>
        <label className="field mt-16"><span className="lbl">Full name</span><input className="input" placeholder="e.g. Rahul Sharma" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} autoFocus /></label>
        <div className="field mt-16"><span className="lbl">Branch</span>
          <div className="wrap row gap-8">{BRANCHES.map((b) => <button key={b} className={`chip ${profile.branch === b ? "on" : ""}`} onClick={() => setProfile({ ...profile, branch: b })}>{b}</button>)}</div>
        </div>
        <div className="field mt-16"><span className="lbl">Current semester</span>
          <div className="wrap row gap-8">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <button key={n} className={`chip ${profile.sem === n ? "on" : ""}`} style={{ minWidth: 44, justifyContent: "center" }} onClick={() => setProfile({ ...profile, sem: n })}>{n}</button>)}</div>
        </div>
        <div className="field mt-16"><span className="lbl">I can teach</span>
          <div className="wrap row gap-8">{SKILLS.map((s) => <button key={s} className={`chip sm ${profile.teach.includes(s) ? "on" : ""}`} onClick={() => toggle("teach", s)}>{s}</button>)}</div>
        </div>
        <div className="field mt-16"><span className="lbl">I want to learn</span>
          <div className="wrap row gap-8">{SKILLS.map((s) => <button key={s} className={`chip sm ${profile.want.includes(s) ? "on" : ""}`} onClick={() => toggle("want", s)}>{s}</button>)}</div>
        </div>
        <button className="btn lg block mt-24" disabled={!ok} onClick={onDone}>Finish setup<Icon name="check" /></button>
      </div>
    </div>
  );
}

function Done({ name, email, profile }) {
  useEffect(() => {
    const t = setTimeout(() => actions.completeProfile({ ...profile, email }), 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="ob done">
      <div className="done-badge"><Icon name="shield" /></div>
      <h1>You're verified{name ? `, ${name.split(" ")[0]}` : ""}</h1>
      <p>Welcome to your campus. Your Trust Score starts now.</p>
    </div>
  );
}
