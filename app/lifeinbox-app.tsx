"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, Download, FileText, Fingerprint, Gift, HelpCircle, Home, Image as ImageIcon, Inbox, Layers3,
  LoaderCircle, LockKeyhole, LogOut, Menu, MessageCircleQuestion, Mic, MoreHorizontal, Paperclip,
  Plus, Search, Send, Settings, ShieldCheck, Sparkles, Tag, Trash2, UploadCloud, User, WandSparkles, X,
  Zap,
} from "lucide-react";
import {
  askOrExtract, completePasswordReset, deleteLifeItem, deleteLifeThread, getCurrentUser, isAppwriteConfigured, listLifeItems, listLifeThreads, requestPasswordReset,
  runOps, saveCaptureRecord, saveLifeItem, saveLifeThread, savePreferences, signIn, signOut, signUp, updateCaptureRecord, updateLifeItem,
  updateLifeThread, updateProfileName, uploadCaptureFile, type AuthUser,
} from "@/lib/appwrite";
import { makeDrafts, seedItems, seedThreads, type ItemType, type LifeItem, type LifeThread } from "@/lib/lifeinbox";

type View = "today" | "inbox" | "threads" | "ask" | "settings";
type AuthMode = "signin" | "signup";

const typeMeta: Record<ItemType, { label: string; icon: typeof CheckCircle2; color: string }> = {
  task: { label: "Task", icon: CheckCircle2, color: "sage" },
  event: { label: "Event", icon: CalendarDays, color: "blue" },
  expense: { label: "Expense", icon: CircleDollarSign, color: "gold" },
  note: { label: "Note", icon: FileText, color: "violet" },
};

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="brand-mark"><span /></span>{!compact && <span>LifeInbox</span>}</div>;
}

function Landing({ onAuth, onDemo }: { onAuth: (mode: AuthMode) => void; onDemo: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-hero]", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .75, stagger: .08, ease: "power3.out" });
      gsap.fromTo("[data-demo]", { y: 30, opacity: 0, rotateX: 4 }, { y: 0, opacity: 1, rotateX: 0, duration: .9, delay: .25, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="landing">
      <header className="landing-nav">
        <Brand />
        <nav aria-label="Main navigation"><a href="#intelligence">Intelligence</a><a href="#features">Features</a><a href="#privacy">Privacy</a></nav>
        <div className="nav-actions"><button className="text-button" onClick={() => onAuth("signin")}>Log in</button><button className="button button-small" onClick={() => onAuth("signup")}>Open LifeInbox</button></div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-app-icon" data-hero><span className="brand-mark"><span /></span><i /><i /></div>
          <div className="eyebrow" data-hero><Sparkles size={14} /> Built with GPT-5.6 for OpenAI Build Week</div>
          <h1 data-hero>Drop it in.<br /><em>LifeInbox handles the rest.</em></h1>
          <p data-hero>A private AI workspace that turns screenshots, PDFs, voice notes, receipts, and messy thoughts into small, organized next steps.</p>
          <div className="hero-actions" data-hero><button className="button button-large" onClick={() => onAuth("signup")}>Start capturing free <ArrowRight size={17} /></button><button className="button button-large button-ghost" onClick={onDemo}>See it in action</button></div>
          <div className="hero-trust" data-hero><span><ShieldCheck size={14} /> Private by design</span><span><CheckCircle2 size={14} /> Review before save</span><span><Zap size={14} /> Powered by GPT-5.6</span></div>

          <div className="hero-product" data-demo aria-label="LifeInbox smart capture preview">
            <div className="hero-window-bar"><Brand /><span>Smart capture</span><i /><i /><i /></div>
            <div className="hero-capture-grid">
              <section className="hero-drop-card">
                <span className="hero-card-label"><Plus size={14} /> ONE CAPTURE</span>
                <blockquote>“Book the dentist for Friday, send Mum the hotel details, and pay Aanya ₹1,240 tomorrow.”</blockquote>
                <div className="hero-drop-types"><span><FileText size={14} /> Text</span><span><ImageIcon size={14} /> Image</span><span><Mic size={14} /> Voice</span><span><Paperclip size={14} /> PDF</span></div>
              </section>
              <div className="hero-ai-core"><span><WandSparkles size={22} /></span><b>Understood</b><small>3 focused items · 94% avg.</small></div>
              <section className="hero-result-stack">
                <div><span className="type-icon blue"><CalendarDays size={15} /></span><p><b>Book dentist appointment</b><small>Friday · Health</small></p><strong>96%</strong></div>
                <div><span className="type-icon violet"><FileText size={15} /></span><p><b>Send hotel details to Mum</b><small>Family trip</small></p><strong>93%</strong></div>
                <div><span className="type-icon gold"><CircleDollarSign size={15} /></span><p><b>Pay Aanya ₹1,240</b><small>Tomorrow · Money</small></p><strong>94%</strong></div>
              </section>
            </div>
            <div className="hero-window-foot"><span><LockKeyhole size={13} /> Your capture stays permissioned to you</span><button onClick={onDemo}>Open demo <ArrowRight size={14} /></button></div>
          </div>
        </section>

        <section className="proof-band" aria-label="LifeInbox product summary">
          <div><strong>4</strong><span>capture formats</span></div><i /><div><strong>1</strong><span>calm inbox</span></div><i /><div><strong>0</strong><span>manual sorting required</span></div>
        </section>

        <section id="intelligence" className="intelligence-section">
          <div className="section-heading center"><span className="eyebrow"><WandSparkles size={14} /> Intelligence that earns trust</span><h2>One messy thought.<br />Every useful next step.</h2><p>LifeInbox identifies independent intentions, keeps the original meaning, and makes uncertainty visible before anything is saved.</p></div>
          <div className="intelligence-canvas">
            <div className="raw-capture-card"><span>RAW CAPTURE</span><p>Need to renew insurance, call Dr Mehta after lunch, save the venue address, and remember that the deposit was ₹8,500.</p><small><Mic size={14} /> 18-second voice note</small></div>
            <div className="intelligence-line"><span><WandSparkles size={18} /></span></div>
            <div className="atomic-items">
              <article><span>01</span><div><b>Renew insurance</b><small>Task · High priority</small></div><CheckCircle2 size={17} /></article>
              <article><span>02</span><div><b>Call Dr Mehta</b><small>Task · After lunch</small></div><CheckCircle2 size={17} /></article>
              <article><span>03</span><div><b>Save venue address</b><small>Note · Needs location</small></div><HelpCircle size={17} /></article>
              <article><span>04</span><div><b>Deposit paid</b><small>Expense · ₹8,500</small></div><CheckCircle2 size={17} /></article>
            </div>
          </div>
        </section>

        <section id="features" className="feature-section">
          <div className="section-heading"><span className="eyebrow">Everything connected</span><h2>A life-admin system,<br />not another to-do list.</h2></div>
          <div className="feature-bento">
            <article className="feature-card feature-card-large"><div className="feature-icon"><Layers3 size={20} /></div><span>Life Threads</span><h3>Plans organize themselves.</h3><p>Related tasks, expenses, events, people, and notes gather into connected stories without losing their original context.</p><div className="thread-preview"><span>TR</span><div><b>Tokyo relocation</b><small>8 items · Next: upload visa scan</small></div><ChevronRight size={18} /></div></article>
            <article className="feature-card"><div className="feature-icon"><MessageCircleQuestion size={20} /></div><span>Grounded Ask</span><h3>Answers that point back.</h3><p>Ask across your own workspace and open the exact saved item behind every answer.</p><div className="citation-preview">“Start with the insurance renewal.” <b>[1]</b></div></article>
            <article className="feature-card"><div className="feature-icon"><Download size={20} /></div><span>Designed PDF export</span><h3>Your life, beautifully portable.</h3><p>Export a polished, readable report with priorities, dates, threads, status, and summary metrics.</p><div className="pdf-preview"><i /><div><b>LifeInbox</b><span>Personal workspace report</span><em /></div></div></article>
            <article className="feature-card"><div className="feature-icon"><ShieldCheck size={20} /></div><span>Private by design</span><h3>Your data stays yours.</h3><p>Per-user Appwrite permissions, server-only AI keys, editable review, retention controls, and complete deletion.</p><ul><li><Check size={14} /> No keys in the browser</li><li><Check size={14} /> User-owned rows and files</li></ul></article>
            <article className="feature-card feature-card-wide"><div><div className="feature-icon"><Zap size={20} /></div><span>Made for every screen</span><h3>Phone in your pocket. Tablet on the sofa. Desktop at work.</h3><p>Install the PWA and get a navigation, capture flow, and review experience shaped for the device in your hand.</p></div><div className="device-preview"><i /><i /><i /></div></article>
          </div>
        </section>

        <section className="workflow-section">
          <div className="section-heading center"><span className="eyebrow">A simpler loop</span><h2>Capture. Check. Continue.</h2></div>
          <div className="workflow-steps">
            <article><span>1</span><h3>Drop anything</h3><p>Type, talk, upload, or drag a file into one universal capture surface.</p></article>
            <article><span>2</span><h3>Review the understanding</h3><p>Edit atomic items, confidence, dates, priorities, and Life Thread suggestions together.</p></article>
            <article><span>3</span><h3>Work from clarity</h3><p>Use Today, Inbox, grounded Ask, and connected Threads to know what matters next.</p></article>
          </div>
        </section>

        <section id="privacy" className="privacy-section">
          <div><span className="eyebrow"><ShieldCheck size={14} /> Private by design</span><h2>Personal intelligence<br />without the black box.</h2><p>LifeInbox keeps you in the decision loop. Every extracted item is editable, uncertainty is shown, and deletion remains under your control.</p><ul><li><Check size={16} /> AI keys stay in server functions</li><li><Check size={16} /> Original files follow your retention window</li><li><Check size={16} /> Export or delete your full workspace anytime</li></ul></div>
          <div className="privacy-card"><div className="privacy-lock"><LockKeyhole size={38} /><span /><span /><span /></div><strong>Your workspace</strong><p>Protected by Appwrite permissions</p></div>
        </section>

        <section className="final-cta"><div className="hero-app-icon"><span className="brand-mark"><span /></span></div><span className="eyebrow">Life is already complicated</span><h2>Your inbox shouldn&apos;t be.</h2><p>Capture first. Let GPT-5.6 create the structure. Stay in control of the result.</p><div className="hero-actions"><button className="button button-large" onClick={() => onAuth("signup")}>Create your LifeInbox <ArrowRight size={17} /></button><button className="button button-large button-ghost" onClick={onDemo}>Explore the demo</button></div></section>
      </main>
      <footer><Brand /><p>© 2026 LifeInbox · Built with Codex and GPT-5.6</p><div><a href="#intelligence">Intelligence</a><a href="#privacy">Privacy</a><button onClick={() => onAuth("signin")}>Log in</button></div></footer>
    </div>
  );
}

function AuthScreen({ initialMode, onBack, onSuccess, onDemo }: { initialMode: AuthMode; onBack: () => void; onSuccess: (user: AuthUser) => void; onDemo: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!isAppwriteConfigured) { setError("Appwrite is not connected yet. Use the demo now, or add the environment values to enable real accounts."); return; }
    try {
      setLoading(true);
      const user = mode === "signup" ? await signUp(name, email, password) : await signIn(email, password);
      onSuccess(user);
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't complete that request."); }
    finally { setLoading(false); }
  }

  async function recover() {
    setError("");
    if (!email) { setError("Enter your email address first."); return; }
    if (!isAppwriteConfigured) { setError("Connect Appwrite first to send real recovery emails."); return; }
    try { setLoading(true); await requestPasswordReset(email); setRecoverySent(true); }
    catch (err) { setError(err instanceof Error ? err.message : "We couldn't send the recovery email."); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand"><Brand /><button onClick={onBack}><ArrowLeft size={17} /> Back home</button></div>
      <div className="auth-layout">
        <section className="auth-story"><span className="eyebrow"><Sparkles size={14} /> Less remembering. More living.</span><h1>One place for all the things life throws at you.</h1><div className="auth-proof"><div className="capture-pill"><Mic size={16} /> “Remind me to send the visa documents tomorrow”</div><div className="extract-card"><span><WandSparkles size={15} /> LifeInbox found</span><b>Send visa documents</b><small>Tomorrow · High priority</small></div></div><p><ShieldCheck size={16} /> Your data is private and permissioned to you.</p></section>
        <section className="auth-card">
          <span className="auth-kicker">{mode === "signup" ? "Create your workspace" : "Welcome back"}</span>
          <h2>{mode === "signup" ? "Start clearing your head." : "Your inbox is waiting."}</h2>
          <p>{mode === "signup" ? "Free to start. No card required." : "Log in to pick up where you left off."}</p>
          <form onSubmit={submit}>
            {mode === "signup" && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Taha Ahmed" required autoComplete="name" /></label>}
            <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" required autoComplete="email" /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" type="password" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
            {mode === "signin" && <button type="button" className="forgot-button" onClick={() => void recover()}>Forgot password?</button>}
            {recoverySent && <div className="auth-success"><CheckCircle2 size={16} /> Recovery email sent. Check your inbox.</div>}
            {error && <div className="auth-error"><HelpCircle size={16} /> {error}</div>}
            <button className="button button-full button-large" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : null}{mode === "signup" ? "Create free account" : "Log in"}<ArrowRight size={17} /></button>
          </form>
          <button className="demo-entry" onClick={onDemo}><Sparkles size={15} /> Explore with sample data instead</button>
          <p className="auth-switch">{mode === "signup" ? "Already have an account?" : "New to LifeInbox?"} <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}>{mode === "signup" ? "Log in" : "Create one"}</button></p>
          <small>By continuing, you agree to the Terms and Privacy Policy.</small>
        </section>
      </div>
    </div>
  );
}

function RecoveryScreen({ userId, secret, onDone }: { userId: string; secret: string; onDone: () => void }) {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (password !== confirm) { setError("Passwords do not match."); return; } try { setLoading(true); await completePasswordReset(userId, secret, password); onDone(); } catch (caught) { setError(caught instanceof Error ? caught.message : "We couldn't reset the password."); } finally { setLoading(false); } }
  return <div className="auth-page"><div className="auth-brand"><Brand /></div><div className="recovery-wrap"><section className="auth-card"><span className="auth-kicker">Fresh start</span><h2>Choose a new password.</h2><p>Use at least eight characters you haven&apos;t used here before.</p><form onSubmit={submit}><label>New password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirm password<input type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>{error && <div className="auth-error"><HelpCircle size={16} /> {error}</div>}<button className="button button-full button-large" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} Reset password</button></form></section></div></div>;
}

function Sidebar({ view, setView, user, demo, inboxCount, onCapture, onLogout }: { view: View; setView: (v: View) => void; user: AuthUser; demo: boolean; inboxCount: number; onCapture: () => void; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links: { id: View; label: string; icon: typeof Home; badge?: string }[] = [
    { id: "today", label: "Today", icon: Home }, { id: "inbox", label: "Inbox", icon: Inbox, badge: inboxCount ? String(inboxCount) : undefined },
    { id: "threads", label: "Life Threads", icon: Layers3 }, { id: "ask", label: "Ask LifeInbox", icon: MessageCircleQuestion },
  ];
  const choose = (id: View) => { setView(id); setMobileOpen(false); };
  return <>
    <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sidebar-top"><Brand /><button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
      <button className="capture-button" onClick={onCapture}><Plus size={18} /><span>New capture</span><kbd>C</kbd></button>
      <nav aria-label="App navigation">{links.map((link) => <button key={link.id} className={view === link.id ? "active" : ""} onClick={() => choose(link.id)}><link.icon size={18} /><span>{link.label}</span>{link.badge && <i>{link.badge}</i>}</button>)}</nav>
      <div className="sidebar-bottom">
        {demo && <div className="demo-mode"><Sparkles size={14} /><div><b>Demo mode</b><small>Sample data only</small></div></div>}
        <button className={view === "settings" ? "active" : ""} onClick={() => choose("settings")}><Settings size={18} /><span>Settings</span></button>
        <div className="user-menu"><span>{user.name.charAt(0).toUpperCase()}</span><div><b>{user.name}</b><small>{demo ? "Free demo" : user.email}</small></div><button onClick={onLogout} aria-label="Log out"><LogOut size={16} /></button></div>
      </div>
    </aside>
    <nav className="mobile-tabbar" aria-label="Mobile app navigation">
      {links.slice(0, 2).map((link) => <button key={link.id} className={view === link.id ? "active" : ""} aria-current={view === link.id ? "page" : undefined} onClick={() => choose(link.id)}><link.icon size={20} /><span>{link.label}</span></button>)}
      <button className="mobile-capture" onClick={onCapture} aria-label="New capture"><Plus size={25} /><span>Capture</span></button>
      {links.slice(2).map((link) => <button key={link.id} className={view === link.id ? "active" : ""} aria-current={view === link.id ? "page" : undefined} onClick={() => choose(link.id)}><link.icon size={20} /><span>{link.id === "threads" ? "Threads" : "Ask"}</span></button>)}
    </nav>
  </>;
}

function Topbar({ view, onCapture, query, setQuery }: { view: View; onCapture: () => void; query: string; setQuery: (q: string) => void }) {
  const labels: Record<View, string> = { today: "Today", inbox: "Inbox", threads: "Life Threads", ask: "Ask LifeInbox", settings: "Settings" };
  return <header className="app-topbar"><div><span>{labels[view]}</span></div><div className="top-actions">{view === "inbox" && <label className="top-search"><Search size={16} /><input aria-label="Search inbox" placeholder="Search your inbox" value={query} onChange={(e) => setQuery(e.target.value)} /></label>}<button className="top-capture" onClick={onCapture}><Plus size={16} /> Capture</button></div></header>;
}

function TodayView({ items, name, briefing, onDone, onCapture, onOpen, onViewAll }: { items: LifeItem[]; name: string; briefing: string; onDone: (id: string) => void; onCapture: () => void; onOpen: (item: LifeItem) => void; onViewAll: () => void }) {
  const todayItems = items.filter((i) => i.status === "today" || (i.priority === "high" && i.status !== "done"));
  const completed = items.filter((item) => item.status === "done").length;
  const remaining = items.length - completed;
  const threadCount = new Set(items.map((item) => item.threadId || item.threadName).filter(Boolean)).size;
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;
  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const attention = Math.min(3, todayItems.length);
  return <div className="view today-view">
    <div className="view-heading" data-animate><span className="date-label">{dateLabel}</span><h1>{greeting}, {name.split(" ")[0]}.</h1><p>{items.length ? "Here’s the small set of things worth seeing today." : "Your workspace is ready for its first capture."}</p></div>
    <section className="briefing-card" data-animate><div className="briefing-copy"><span><Sparkles size={15} /> TODAY&apos;S BRIEFING</span><h2>{attention ? `${attention} ${attention === 1 ? "thing deserves" : "things deserve"} your attention.` : "A clear slate for today."}</h2><p>{briefing}</p><div>{items.length ? <button onClick={onViewAll}>Show me what to do first <ArrowRight size={15} /></button> : <button onClick={onCapture}>Capture your first item <ArrowRight size={15} /></button>}<small>Updated just now</small></div></div><div className="briefing-art"><span className="orb-main">{attention}</span><span /><span /><span /></div></section>
    <div className="today-grid">
      <section className="panel" data-animate><div className="panel-head"><div><span>Up next</span><small>{todayItems.length} active {todayItems.length === 1 ? "item" : "items"}</small></div>{items.length > 0 && <button onClick={onViewAll}>View all <ArrowRight size={14} /></button>}</div><div className="focus-list">{todayItems.length ? todayItems.map((item) => <LifeItemRow key={item.id} item={item} onDone={onDone} onOpen={onOpen} />) : <div className="empty-state compact"><span><Sparkles size={22} /></span><h3>Nothing urgent</h3><p>Capture a thought and LifeInbox will turn it into a clear next step.</p><button onClick={onCapture}>New capture</button></div>}</div></section>
      <aside className="right-stack">
        <section className="panel progress-panel" data-animate><div className="panel-head"><div><span>This week</span><small>{completed ? "Keep the momentum going" : "A fresh start"}</small></div><b>{progress}%</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="stats"><div><b>{completed}</b><small>Completed</small></div><div><b>{remaining}</b><small>Remaining</small></div><div><b>{threadCount}</b><small>Threads</small></div></div></section>
        <section className="quick-capture-card" data-animate><span><WandSparkles size={19} /></span><h3>What’s on your mind?</h3><p>Don’t organize it. Just get it out.</p><button onClick={onCapture}><Plus size={15} /> Capture anything</button></section>
      </aside>
    </div>
  </div>;
}

function LifeItemRow({ item, onDone, onOpen, dense = false }: { item: LifeItem; onDone: (id: string) => void; onOpen: (item: LifeItem) => void; dense?: boolean }) {
  const meta = typeMeta[item.type]; const Icon = meta.icon;
  return <article className={`life-row ${dense ? "dense" : ""} ${item.status === "done" ? "completed" : ""}`}>
    <button className="check-button" onClick={() => onDone(item.id)} aria-label={item.status === "done" ? `Mark ${item.title} incomplete` : `Complete ${item.title}`}>{item.status === "done" && <Check size={13} />}</button>
    <button className="row-main" onClick={() => onOpen(item)}><span className={`type-icon ${meta.color}`}><Icon size={16} /></span><div><b>{item.title}</b><p>{item.summary}</p><div className="row-meta"><span className={item.priority === "high" ? "urgent" : ""}><Clock3 size={12} /> {item.dueLabel ?? "No date"}</span>{item.threadName && <span><Tag size={12} /> {item.threadName}</span>}</div></div></button>
    <button className="more-button" onClick={() => onOpen(item)} aria-label={`More actions for ${item.title}`}><MoreHorizontal size={18} /></button>
  </article>;
}

function InboxView({ items, query, onDone, onOpen, onCapture }: { items: LifeItem[]; query: string; onDone: (id: string) => void; onOpen: (item: LifeItem) => void; onCapture: () => void }) {
  const [filter, setFilter] = useState<"all" | ItemType | "done">("all");
  const filtered = items.filter((item) => {
    const statusMatches = filter === "done" ? item.status === "done" : item.status !== "done";
    const typeMatches = filter === "all" || filter === "done" || item.type === filter;
    return statusMatches && typeMatches && `${item.title} ${item.summary} ${item.threadName}`.toLowerCase().includes(query.toLowerCase());
  });
  return <div className="view inbox-view">
    <div className="view-heading split" data-animate><div><span className="date-label">EVERYTHING YOU&apos;VE CAPTURED</span><h1>Your inbox</h1><p>{filtered.length} {filtered.length === 1 ? "item" : "items"} ready to review, schedule, or file away.</p></div><button className="button" onClick={onCapture}><Plus size={16} /> New capture</button></div>
    <div className="filter-row" data-animate>{(["all", "task", "event", "expense", "note", "done"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "Open" : value === "done" ? "Completed" : typeMeta[value].label}{(value === "all" || value === "done") && <span>{items.filter((item) => value === "done" ? item.status === "done" : item.status !== "done").length}</span>}</button>)}</div>
    <section className="inbox-panel panel" data-animate>{filtered.length ? <>{filtered.map((item) => <LifeItemRow key={item.id} item={item} onDone={onDone} onOpen={onOpen} dense />)}<div className="list-end"><CheckCircle2 size={16} /> You’re all caught up beyond these items.</div></> : <div className="empty-state"><span><Inbox size={24} /></span><h3>No items found</h3><p>Try another filter or capture something new.</p><button onClick={onCapture}>Capture anything</button></div>}</section>
  </div>;
}

function ThreadsView({ threads, items, onDone, onOpen, onDelete, onNewThread }: { threads: LifeThread[]; items: LifeItem[]; onDone: (id: string) => void; onOpen: (item: LifeItem) => void; onDelete: (thread: LifeThread) => void; onNewThread: () => void }) {
  const [selected, setSelected] = useState<LifeThread | null>(null);
  return <div className="view threads-view">
    <div className="view-heading split" data-animate><div><span className="date-label">THE BIGGER PICTURE</span><h1>Life Threads</h1><p>Related details gather here automatically, so plans stay connected.</p></div><button className="button button-ghost" onClick={onNewThread}><Plus size={16} /> New thread</button></div>
    {threads.length ? <div className="thread-grid" data-animate>{threads.map((thread) => { const active = thread.itemIds.filter((id) => { const item = items.find((entry) => entry.id === id); return item && item.status !== "done"; }).length; return <button className="thread-card" key={thread.id} onClick={() => setSelected(thread)}><div className="thread-card-top"><span className="thread-monogram" style={{ backgroundColor: `${thread.color}20`, color: thread.color }}>{thread.name.slice(0, 2).toUpperCase()}</span><ChevronRight size={18} /></div><span className="thread-eyebrow">{thread.eyebrow}</span><h3>{thread.name}</h3><p>{active} active {active === 1 ? "item" : "items"} · {thread.dateRange}</p><div className="thread-next"><small>NEXT STEP</small><span>{thread.nextStep}<ArrowRight size={14} /></span></div><div className="thread-dots">{thread.itemIds.slice(0, 4).map((id, idx) => <i key={id} style={{ backgroundColor: idx === 0 ? thread.color : undefined }} />)}</div></button>; })}</div> : <section className="panel empty-state thread-empty" data-animate><span><Layers3 size={24} /></span><h3>No Life Threads yet</h3><p>Create one yourself, or capture something and let LifeInbox suggest a connected plan.</p><button onClick={onNewThread}>Create your first thread</button></section>}
    {items.length > 0 && <section className="thread-recent panel" data-animate><div className="panel-head"><div><span>Recently added</span><small>Your newest captured items</small></div></div>{items.slice(0, 3).map((item) => <LifeItemRow dense key={item.id} item={item} onDone={onDone} onOpen={onOpen} />)}</section>}
    {selected && <div className="drawer-scrim" onClick={() => setSelected(null)}><aside className="thread-drawer" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button><span className="thread-monogram large" style={{ backgroundColor: `${selected.color}20`, color: selected.color }}>{selected.name.slice(0, 2).toUpperCase()}</span><span className="date-label">{selected.eyebrow}</span><h2>{selected.name}</h2><p>{selected.dateRange}</p><div className="drawer-summary"><Sparkles size={16} /><span><b>Thread summary</b>Everything related to this plan lives together. Your next best step is <strong>{selected.nextStep.toLowerCase()}</strong>.</span></div><h3>Items in this thread</h3>{selected.itemIds.length ? selected.itemIds.map((id) => { const item = items.find((i) => i.id === id); return item ? <LifeItemRow dense key={id} item={item} onDone={onDone} onOpen={onOpen} /> : null; }) : <p className="thread-drawer-empty">No items are linked yet.</p>}<button className="danger-button thread-delete" onClick={() => { onDelete(selected); setSelected(null); }}><Trash2 size={15} /> Delete Life Thread</button></aside></div>}
  </div>;
}

function NewThreadModal({ onClose, onCreate }: { onClose: () => void; onCreate: (thread: LifeThread) => void }) {
  const [name, setName] = useState("");
  const [nextStep, setNextStep] = useState("");
  return <div className="modal-scrim"><section className="small-modal" role="dialog" aria-modal="true" aria-labelledby="thread-title"><div className="modal-head"><div><span><Gift size={18} /></span><div><h2 id="thread-title">Start a Life Thread</h2><p>Give a plan, person, or project a calm home.</p></div></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="small-modal-body"><label>Thread name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Japan adventure" /></label><label>First next step<input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="e.g. Compare flights" /></label></div><div className="capture-footer"><p><Sparkles size={13} /> You can add items anytime</p><div><button className="button button-ghost" onClick={onClose}>Cancel</button><button className="button" disabled={!name.trim()} onClick={() => onCreate({ id: `thread-${Date.now()}`, name: name.trim(), eyebrow: "Personal", color: "#78e957", itemIds: [], nextStep: nextStep.trim() || "Add the first item", dateRange: "New" })}>Create thread <ArrowRight size={15} /></button></div></div></section></div>;
}

type BrainAction = { title: string; why: string; itemId?: string | null };
type AskMessage = { role: "user" | "assistant"; text: string; citations?: string[]; nextActions?: BrainAction[]; insights?: string[] };

function parseBrainActions(value: unknown): BrainAction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const action = entry as Record<string, unknown>;
    const title = String(action.title || "").trim();
    const why = String(action.why || "").trim();
    if (!title || !why) return [];
    return [{ title, why, itemId: action.itemId ? String(action.itemId) : null }];
  });
}

function BrainPlan({ actions, items, onOpen }: { actions: BrainAction[]; items: LifeItem[]; onOpen: (item: LifeItem) => void }) {
  return <div className="brain-plan"><b>Best next moves</b>{actions.map((action, index) => {
    const item = action.itemId ? items.find((candidate) => candidate.id === action.itemId) : undefined;
    const content = <><span>{index + 1}</span><div><strong>{action.title}</strong><small>{action.why}</small></div>{item && <ArrowRight size={14} />}</>;
    return item
      ? <button type="button" key={`${action.title}-${index}`} onClick={() => onOpen(item)}>{content}</button>
      : <div className="brain-action" key={`${action.title}-${index}`}>{content}</div>;
  })}</div>;
}

function AskView({ items, demo, onOpen }: { items: LifeItem[]; demo: boolean; onOpen: (item: LifeItem) => void }) {
  const [messages, setMessages] = useState<AskMessage[]>([{ role: "assistant", text: "Ask me anything you’ve saved. I’ll reason across your tasks, dates, payments, and plans—then tell you the clearest next move." }]);
  const [input, setInput] = useState(""); const [thinking, setThinking] = useState(false);
  async function ask(question: string) {
    if (!question.trim()) return; setMessages((m) => [...m, { role: "user", text: question }]); setInput(""); setThinking(true);
    let answer = items.length ? `Your most important saved items are: ${items.filter((item) => item.status !== "done").slice(0, 3).map((item) => item.title).join(", ")}.` : "Your LifeInbox is empty. Capture your first item and I can answer questions grounded in it.";
    let citations = items.filter((item) => item.status !== "done").slice(0, 3).map((item) => item.id);
    let nextActions: BrainAction[] = items.filter((item) => item.status !== "done").slice(0, 3).map((item) => ({ title: item.title, why: item.dueLabel || "This is one of your highest-priority open items.", itemId: item.id }));
    let insights: string[] = [];
    try {
      if (!demo) {
        const result = await askOrExtract("ask", { question });
        if (result.answer) answer = String(result.answer);
        citations = Array.isArray(result.citations) ? result.citations.map(String) : [];
        nextActions = parseBrainActions(result.nextActions);
        insights = Array.isArray(result.insights) ? result.insights.map(String).filter(Boolean) : [];
      }
    } catch (caught) {
      answer = caught instanceof Error ? `I couldn’t complete that request: ${caught.message}` : "I couldn’t complete that request right now. Please try again.";
      citations = [];
      nextActions = [];
      insights = [];
    } finally {
      setThinking(false);
    }
    setMessages((m) => [...m, { role: "assistant", text: answer, citations, nextActions, insights }]);
  }
  return <div className="view ask-view">
    <div className="ask-header" data-animate><span className="ask-spark"><Sparkles size={22} /></span><span className="brain-badge"><Zap size={12} /> GPT-5.6 Terra · high reasoning</span><h1>Ask LifeInbox</h1><p>Your private superbrain for deciding what matters and what to do next.</p></div>
    <div className="chat-panel" data-animate><div className="chat-messages">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><span>{message.role === "assistant" ? <Sparkles size={15} /> : <User size={15} />}</span><div><p>{message.text}</p>{message.nextActions && message.nextActions.length > 0 && <BrainPlan actions={message.nextActions} items={items} onOpen={onOpen} />}{message.insights && message.insights.length > 0 && <div className="brain-insights"><b>Worth noticing</b>{message.insights.map((insight) => <span key={insight}>{insight}</span>)}</div>}{message.citations && <div className="citations">{message.citations.map((id) => { const item = items.find((i) => i.id === id); return item && <button key={id} onClick={() => onOpen(item)}><FileText size={12} /> {item.title}</button>; })}</div>}</div></div>)}{thinking && <div className="message assistant"><span><Sparkles size={15} /></span><div className="thinking-copy"><div className="typing"><i /><i /><i /></div><small>Terra is checking priorities, dates, and dependencies…</small></div></div>}</div>
      {messages.length === 1 && <div className="suggestions"><span>Try asking</span>{["What is due this week?", "Show my Goa trip items", "What should I do first?"].map((q) => <button key={q} onClick={() => ask(q)}>{q}<ArrowRight size={14} /></button>)}</div>}
      <form className="ask-box" onSubmit={(e) => { e.preventDefault(); void ask(input); }}><MessageCircleQuestion size={18} /><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask what matters, what is blocked, or what to do next..." aria-label="Ask LifeInbox" /><button disabled={!input.trim() || thinking} aria-label="Send question"><Send size={16} /></button></form><small className="ask-note"><ShieldCheck size={12} /> Grounded only in your LifeInbox. Actions and citations stay linked to the source.</small></div>
  </div>;
}

function SettingsView({ demo, user, items, onLogout, onToast, onReset }: { demo: boolean; user: AuthUser; items: LifeItem[]; onLogout: () => void; onToast: (message: string) => void; onReset: () => void }) {
  const [section, setSection] = useState<"profile" | "usage" | "privacy" | "notifications">("profile");
  const [retention, setRetention] = useState("30"); const [briefing, setBriefing] = useState(true); const [review, setReview] = useState(true); const [alerts, setAlerts] = useState(true);
  const [editingName, setEditingName] = useState(false); const [displayName, setDisplayName] = useState(user.name); const [exporting, setExporting] = useState(false);
  async function persistPrefs() { if (!demo && isAppwriteConfigured) await savePreferences({ retentionDays: Number(retention), morningBriefing: briefing, alwaysReview: review, reminders: alerts }); onToast("Preferences saved"); }
  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const { exportLifeInboxPdf } = await import("@/lib/pdf-export");
      exportLifeInboxPdf(items, { ownerName: displayName });
      onToast("Your designed PDF report is ready");
    } catch {
      onToast("The PDF could not be created. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  async function deleteWorkspace() { if (!window.confirm("Delete this LifeInbox workspace and all of its data? This cannot be undone.")) return; if (demo) { onReset(); return; } const result = await runOps("delete-account"); if (result?.deleted) { onToast("Workspace deleted"); onLogout(); } else onToast("Account deletion needs the Ops function to be deployed"); }
  const nav = [{ id: "profile", label: "Profile", icon: User }, { id: "usage", label: "Usage & plan", icon: Zap }, { id: "privacy", label: "Privacy", icon: ShieldCheck }, { id: "notifications", label: "Notifications", icon: Bell }] as const;
  return <div className="view settings-view"><div className="view-heading" data-animate><span className="date-label">YOUR WORKSPACE</span><h1>Settings</h1><p>Manage your preferences, usage, privacy, and plan.</p></div>
    <div className="settings-layout" data-animate><nav>{nav.map((entry) => <button key={entry.id} className={section === entry.id ? "active" : ""} onClick={() => setSection(entry.id)}><entry.icon size={16} /> {entry.label}</button>)}</nav><div className="settings-content">
      {section === "profile" && <><section className="settings-section"><div><h2>Profile</h2><p>Your LifeInbox identity and account details.</p></div><div className="profile-row"><span>{displayName.slice(0, 2).toUpperCase()}</span><div>{editingName ? <input className="profile-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /> : <b>{displayName}</b>}<small>{user.email}</small></div><button onClick={() => { if (editingName) { if (!demo && isAppwriteConfigured) void updateProfileName(displayName); onToast("Profile name updated"); } setEditingName(!editingName); }}>{editingName ? "Save" : "Edit profile"}</button></div></section><section className="settings-section"><div><h2>Capture preferences</h2><p>Choose how LifeInbox handles extracted information.</p></div><SettingToggle title="Always review before save" text="Open the review screen even when confidence is high." checked={review} setChecked={setReview} /><SettingToggle title="Morning briefing" text="Prepare a concise daily briefing from relevant items." checked={briefing} setChecked={setBriefing} /><button className="button button-small settings-save" onClick={() => void persistPrefs()}>Save preferences</button></section></>}
      {section === "usage" && <section className="settings-section"><div><h2>Workspace overview</h2><p>Live totals from the items currently saved in your LifeInbox.</p></div><div className="usage-box"><div><span><b>{items.length}</b> approved items</span><small>{items.filter((item) => item.status !== "done").length} still open</small></div><div className="usage-stats"><span><CheckCircle2 size={15} /> {items.filter((item) => item.status === "done").length} completed</span><span><FileText size={15} /> {items.filter((item) => item.source === "text").length} text</span><span><ImageIcon size={15} /> {items.filter((item) => item.source === "image" || item.source === "pdf").length} files</span><span><Mic size={15} /> {items.filter((item) => item.source === "voice").length} voice</span></div></div><div className="plan-card"><Gift size={20} /><div><b>Build Week edition</b><small>Every core LifeInbox feature is available.</small></div><span>Free</span></div></section>}
      {section === "privacy" && <><section className="settings-section"><div><h2>Privacy & retention</h2><p>Control how long original uploaded files are kept.</p></div><label className="select-setting"><div><b>Original file retention</b><small>Extracted actions stay until you delete them.</small></div><select value={retention} onChange={(e) => setRetention(e.target.value)}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="0">Delete after processing</option></select></label><button className="export-card" onClick={() => void exportData()} disabled={exporting}><span>{exporting ? <LoaderCircle className="spin" size={19} /> : <Download size={19} />}</span><div><b>{exporting ? "Designing your report…" : "Export LifeInbox report"}</b><small>Branded PDF · summaries, priorities, threads, and page numbers</small></div><ArrowRight size={16} /></button><button className="button button-small settings-save" onClick={() => void persistPrefs()}>Save retention</button></section><section className="settings-section danger-section"><div><h2>Account</h2><p>Manage this session or permanently remove your workspace.</p></div><div><button className="button button-ghost" onClick={onLogout}><LogOut size={15} /> Log out</button><button className="danger-button" onClick={() => void deleteWorkspace()}><Trash2 size={15} /> Delete workspace</button></div></section></>}
      {section === "notifications" && <section className="settings-section"><div><h2>Notifications</h2><p>Choose when LifeInbox gives you a cheerful nudge.</p></div><SettingToggle title="Due-date reminders" text="Get a reminder before high-priority items are due." checked={alerts} setChecked={setAlerts} /><SettingToggle title="Morning briefing" text="Prepare your daily top three every morning." checked={briefing} setChecked={setBriefing} /><button className="button button-small settings-save" onClick={() => void persistPrefs()}>Save notifications</button></section>}
    </div></div>
  </div>;
}

function SettingToggle({ title, text, checked, setChecked }: { title: string; text: string; checked: boolean; setChecked: (v: boolean) => void }) {
  return <label className="toggle-setting"><div><b>{title}</b><small>{text}</small></div><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /><span /></label>;
}

function CaptureModal({ user, onClose, onReview }: { user: AuthUser; onClose: () => void; onReview: (drafts: LifeItem[], original: string, fileName?: string, captureId?: string, warning?: string) => void }) {
  const [source, setSource] = useState<LifeItem["source"]>("text"); const [text, setText] = useState(""); const [files, setFiles] = useState<Partial<Record<LifeItem["source"], File>>>({}); const [processing, setProcessing] = useState(false); const [processingStage, setProcessingStage] = useState("Reading capture…"); const [drag, setDrag] = useState(false); const [recording, setRecording] = useState(false); const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null); const streamRef = useRef<MediaStream | null>(null); const chunksRef = useRef<Blob[]>([]); const cancelledRef = useRef(false); const discardRecordingRef = useRef(false);
  const file = files[source];
  const hasCapture = source === "text" ? Boolean(text.trim()) : Boolean(file);
  function acceptFile(nextFile: File) { if (nextFile.size > 10 * 1024 * 1024) { setError("That file is over 10 MB. Choose a smaller version."); return; } setError(""); setFiles((current) => ({ ...current, [source]: nextFile })); }
  useEffect(() => () => {
    cancelledRef.current = true;
    discardRecordingRef.current = true;
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);
  function closeCapture() {
    if (processing) return;
    cancelledRef.current = true;
    discardRecordingRef.current = true;
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onClose();
  }
  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Voice recording is not available in this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = []; discardRecordingRef.current = false;
      const recorder = new MediaRecorder(stream); recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        if (!discardRecordingRef.current && !cancelledRef.current && chunksRef.current.length) {
          const voiceFile = new File(chunksRef.current, `voice-${Date.now()}.webm`, { type: mimeType });
          setFiles((current) => ({ ...current, voice: voiceFile }));
        }
        stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; recorderRef.current = null;
        if (!cancelledRef.current) setRecording(false);
      };
      recorder.start(); setRecording(true); setError("");
    } catch { setError("Microphone access was not available. You can still type the note instead."); }
  }
  async function process() {
    if (!hasCapture) return; setProcessing(true); setProcessingStage("Reading capture…");
    let captureId: string | undefined;
    try {
      let fileId: string | undefined;
      const captureText = source === "text" ? text.trim() : "";
      if (isAppwriteConfigured && user.id !== "demo") {
        if (file) { const uploaded = await uploadCaptureFile(file, user.id); fileId = uploaded.$id; }
        const capture = await saveCaptureRecord({ source, rawText: captureText, fileId }, user.id);
        captureId = capture.$id;
      }
      let drafts = makeDrafts(captureText || file?.name || "New capture", source);
      if (isAppwriteConfigured && user.id !== "demo") {
        setProcessingStage("Separating actions…");
        const now = new Date();
        const result = await askOrExtract("extract", { input: captureText, source, fileId, fileName: file?.name, mimeType: file?.type, localDate: now.toLocaleDateString("en-CA"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        const extracted = Array.isArray(result.items) ? result.items : result.item ? [result.item] : [];
        if (!extracted.length) throw new Error("AI extraction returned no items.");
        drafts = extracted.map((entry, index) => ({ ...makeDrafts(String((entry as Partial<LifeItem>).sourceExcerpt || captureText || file?.name || "New capture"), source)[0], ...(entry as Partial<LifeItem>), id: String((entry as Partial<LifeItem>).id || `li-${Date.now()}-${index + 1}`), source }));
        setProcessingStage("Linking threads…");
        const averageConfidence = Math.round(drafts.reduce((sum, item) => sum + item.confidence, 0) / drafts.length);
        if (captureId) await updateCaptureRecord(captureId, { status: "review", needsReview: Boolean(result.needsReview) || drafts.some((item) => item.confidence < 80 || item.missingFields?.length), confidence: averageConfidence, mode: String(result.mode || "ai-multi") }).catch(() => undefined);
      }
      else await new Promise((resolve) => window.setTimeout(resolve, 720));
      if (!cancelledRef.current) onReview(drafts, source === "text" ? captureText : source === "voice" ? "Recorded voice note" : "Uploaded file", file?.name, captureId);
    } catch (caught) {
      if (cancelledRef.current) return;
      if (captureId) await updateCaptureRecord(captureId, { status: "failed" }).catch(() => {});
      const warning = caught instanceof Error ? caught.message : "AI extraction was unavailable.";
      const fallbackText = source === "text" ? text.trim() : file?.name || "New capture";
      onReview(makeDrafts(fallbackText, source), source === "text" ? fallbackText : source === "voice" ? "Recorded voice note" : "Uploaded file", file?.name, captureId, `Opened manual drafts because ${warning}`);
    }
    finally { setProcessing(false); }
  }
  return <div className="modal-scrim"><section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title"><div className="modal-head"><div><span><WandSparkles size={18} /></span><div><h2 id="capture-title">Capture anything</h2><p>One drop can become several small, organized items.</p></div></div><button className="modal-close" onClick={closeCapture} disabled={processing} aria-label="Close capture"><X size={18} /></button></div>
    <div className="source-tabs">{([{ id: "text", label: "Text", icon: FileText }, { id: "image", label: "Image", icon: ImageIcon }, { id: "pdf", label: "PDF", icon: Paperclip }, { id: "voice", label: "Voice", icon: Mic }] as const).map((option) => <button key={option.id} className={source === option.id ? "active" : ""} disabled={processing || recording} onClick={() => { setSource(option.id); setError(""); }}><option.icon size={15} /> {option.label}</button>)}</div>
    {source === "text" ? <div className="capture-input"><textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Try: Renew insurance, call Dr Mehta tomorrow, and pay Aanya ₹1,240..." /><div><span>{text.length} characters</span><small>LifeInbox separates independent actions automatically.</small></div></div> : source === "voice" ? <div className="voice-capture"><button onClick={() => void toggleRecording()} className={recording ? "recording" : ""}><Mic size={24} /></button><h3>{recording ? "Recording... tap to stop" : file ? "Voice note captured!" : "Tap to record"}</h3><p>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB ready to transcribe` : "Your audio is transcribed securely, then separated into focused items."}</p></div> : <label className={`drop-zone ${drag ? "drag" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDrag(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDrag(false)} onDrop={(event) => { event.preventDefault(); setDrag(false); const dropped = event.dataTransfer.files[0]; if (dropped) acceptFile(dropped); }}><input type="file" accept={source === "pdf" ? "application/pdf" : "image/*"} onChange={(event) => { const selectedFile = event.target.files?.[0]; if (selectedFile) acceptFile(selectedFile); }} /><span><UploadCloud size={23} /></span><h3>{file ? file.name : `Drop your ${source === "pdf" ? "PDF" : "image"} here`}</h3><p>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB ready to process` : "or click to choose a file · max 10 MB"}</p></label>}
    {error && <div className="capture-error"><HelpCircle size={14} /> {error}</div>}
    <div className="capture-footer"><p><LockKeyhole size={13} /> Private to your workspace</p><div><button className="button button-ghost" onClick={closeCapture} disabled={processing}>Cancel</button><button className="button" onClick={() => void process()} disabled={processing || !hasCapture}>{processing ? <><LoaderCircle className="spin" size={16} /> {processingStage}</> : <>Let AI organize <ArrowRight size={15} /></>}</button></div></div></section></div>;
}

function ReviewModal({ drafts, original, fileName, threads, onChange, onClose, onApprove, onReject }: { drafts: LifeItem[]; original: string; fileName?: string; threads: LifeThread[]; onChange: (items: LifeItem[]) => void; onClose: () => void; onApprove: (items: LifeItem[]) => Promise<void>; onReject: () => void }) {
  const [items, setItems] = useState(drafts);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const item = items[Math.min(activeIndex, items.length - 1)];
  const low = item.confidence < 80 || Boolean(item.missingFields?.length);
  const averageConfidence = Math.round(items.reduce((sum, entry) => sum + entry.confidence, 0) / Math.max(1, items.length));
  function updateItem(patch: Partial<LifeItem>) { setItems((all) => { const next = all.map((entry, index) => index === activeIndex ? { ...entry, ...patch } : entry); onChange(next); return next; }); }
  function removeItem() {
    if (items.length === 1) { onReject(); return; }
    setItems((all) => { const next = all.filter((_, index) => index !== activeIndex); onChange(next); return next; });
    setActiveIndex((index) => Math.max(0, Math.min(index, items.length - 2)));
  }
  async function saveAll() { setSaving(true); try { await onApprove(items); } catch { setSaving(false); } }
  return <div className="modal-scrim"><section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title"><div className="review-header"><div><span className="review-check"><WandSparkles size={17} /></span><div><h2 id="review-title">Review {items.length} {items.length === 1 ? "item" : "items"}</h2><p>LifeInbox separated the capture into focused, editable pieces.</p></div></div><div><span className={`confidence-badge ${averageConfidence < 80 ? "low" : ""}`}><CheckCircle2 size={13} />{averageConfidence}% average</span><button className="modal-close" onClick={onClose} disabled={saving}><X size={18} /></button></div></div>
    <div className="review-summary"><WandSparkles size={15} /><b>{items.length} independent {items.length === 1 ? "item" : "items"} found.</b><span>Nothing is saved until you approve.</span></div>
    <div className="review-item-tabs" aria-label="Extracted items">{items.map((entry, index) => <button key={entry.id} className={activeIndex === index ? "active" : ""} onClick={() => setActiveIndex(index)}><span>{index + 1}</span><b>{entry.title}</b><small>{entry.confidence}%</small></button>)}</div>
    {low && <div className="low-confidence"><HelpCircle size={16} /><div><b>A quick check would help item {activeIndex + 1}</b><p>{item.missingFields?.length ? `Missing or uncertain: ${item.missingFields.join(", ")}.` : "Some details may need your confirmation."}</p></div></div>}
    <div className="review-body"><section className="original-pane"><span>ORIGINAL CAPTURE</span>{fileName ? <div className="file-preview"><FileText size={32} /><b>{fileName}</b><small>Original file · private</small></div> : <blockquote>“{original}”</blockquote>}<div className="source-note"><ShieldCheck size={14} /> Original kept for your selected retention window</div></section><section className="fields-pane"><div className="fields-pane-head"><span>ITEM {activeIndex + 1} OF {items.length}</span><button type="button" onClick={removeItem}><Trash2 size={13} /> Remove item</button></div>{item.sourceExcerpt && <div className="source-excerpt"><span>SUPPORTED BY</span><q>{item.sourceExcerpt}</q></div>}{item.missingFields?.length ? <div className="review-missing"><HelpCircle size={14} /><span>Review {item.missingFields.join(", ")} before saving.</span></div> : null}<div className="field-row"><label>Type<select value={item.type} onChange={(e) => updateItem({ type: e.target.value as ItemType })}><option value="task">Task</option><option value="event">Event</option><option value="expense">Expense</option><option value="note">Note</option></select></label><label>Priority<select value={item.priority} onChange={(e) => updateItem({ priority: e.target.value as LifeItem["priority"] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div><label>Title<input value={item.title} onChange={(e) => updateItem({ title: e.target.value })} /></label><label>Summary<textarea value={item.summary} onChange={(e) => updateItem({ summary: e.target.value })} /></label><div className="field-row"><label>Due date<input type="date" value={item.dueDate ?? ""} onChange={(e) => updateItem({ dueDate: e.target.value || undefined, dueLabel: e.target.value || "No date" })} /></label><label>Time<input type="time" value={item.time ?? ""} onChange={(e) => updateItem({ time: e.target.value || undefined })} /></label></div><div className="field-row"><label>Location<input value={item.location ?? ""} onChange={(e) => updateItem({ location: e.target.value || undefined })} placeholder="No location" /></label>{item.type === "expense" ? <label>Amount / currency<input value={item.amount ?? ""} onChange={(e) => updateItem({ amount: e.target.value || undefined })} placeholder="e.g. ₹1,240" /></label> : <label>People<input value={(item.people ?? []).join(", ")} onChange={(e) => updateItem({ people: e.target.value.split(",").map((name) => name.trim()).filter(Boolean) })} placeholder="Comma-separated names" /></label>}</div>{item.type === "expense" && <label>People<input value={(item.people ?? []).join(", ")} onChange={(e) => updateItem({ people: e.target.value.split(",").map((name) => name.trim()).filter(Boolean) })} placeholder="Comma-separated names" /></label>}<label>Life Thread<input list="life-thread-options" value={item.threadName ?? ""} onChange={(e) => updateItem({ threadName: e.target.value })} placeholder="Choose one or enter a new thread" /><datalist id="life-thread-options">{threads.map((thread) => <option key={thread.id} value={thread.name} />)}</datalist></label></section></div>
    <div className="review-footer"><button className="reject-button" onClick={onReject} disabled={saving}><Trash2 size={15} /> Discard capture</button><div><span>{items.length} ready to save</span><button className="button button-ghost" onClick={onClose} disabled={saving}>Finish later</button><button className="button" onClick={() => void saveAll()} disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} /> Saving safely…</> : <><Check size={16} /> Save {items.length === 1 ? "item" : `all ${items.length}`}</>}</button></div></div></section></div>;
}

function ItemDetail({ item, onClose, onDone, onDelete, onSnooze }: { item: LifeItem; onClose: () => void; onDone: (id: string) => void; onDelete: (id: string) => void; onSnooze: (id: string) => void }) {
  const meta = typeMeta[item.type]; const Icon = meta.icon;
  return <div className="drawer-scrim" onClick={onClose}><aside className="item-drawer" onClick={(e) => e.stopPropagation()}><div className="item-drawer-head"><span className={`type-icon ${meta.color}`}><Icon size={18} /></span><button className="modal-close" onClick={onClose} aria-label="Close item details"><X size={18} /></button></div><span className="date-label">{meta.label} · {item.confidence}% confidence</span><h2>{item.title}</h2><p>{item.summary}</p><div className="detail-grid"><div><span><Clock3 size={14} /> When</span><b>{item.dueLabel ?? "No date"}</b></div>{item.amount && <div><span><CircleDollarSign size={14} /> Amount</span><b>{item.amount}</b></div>}{item.location && <div><span><Tag size={14} /> Location</span><b>{item.location}</b></div>}<div><span><Layers3 size={14} /> Thread</span><b>{item.threadName ?? "Unsorted"}</b></div></div><div className="detail-source"><Fingerprint size={17} /><div><b>Captured from {item.source}</b><small>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></div></div><div className="drawer-actions"><button className="button" onClick={() => { onDone(item.id); onClose(); }}><Check size={15} /> Mark complete</button><button className="button button-ghost" onClick={() => { onSnooze(item.id); onClose(); }}><Clock3 size={15} /> Snooze</button><button className="danger-icon" aria-label={`Delete ${item.title}`} onClick={() => { onDelete(item.id); onClose(); }}><Trash2 size={16} /></button></div></aside></div>;
}

export function LifeInboxApp() {
  const [screen, setScreen] = useState<"landing" | "auth" | "recovery" | "app">("landing"); const [authMode, setAuthMode] = useState<AuthMode>("signup"); const [recovery, setRecovery] = useState<{ userId: string; secret: string } | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null); const [demo, setDemo] = useState(false); const [loadingSession, setLoadingSession] = useState(isAppwriteConfigured);
  const [view, setView] = useState<View>("today"); const [items, setItems] = useState<LifeItem[]>([]); const [query, setQuery] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false); const [newThreadOpen, setNewThreadOpen] = useState(false); const [customThreads, setCustomThreads] = useState<LifeThread[]>([]); const [review, setReview] = useState<{ drafts: LifeItem[]; original: string; fileName?: string; captureId?: string } | null>(null); const [reviewPaused, setReviewPaused] = useState(false); const [selected, setSelected] = useState<LifeItem | null>(null); const [toast, setToast] = useState("");
  const [dailyBriefing, setDailyBriefing] = useState("Your day is clear. Capture anything you want LifeInbox to remember, organize, or turn into a next step.");
  const appRoot = useRef<HTMLDivElement>(null);

  useEffect(() => { void (async () => { await Promise.resolve(); const params = new URLSearchParams(window.location.search); const userId = params.get("userId"); const secret = params.get("secret"); if (params.get("recovery") && userId && secret) { setRecovery({ userId, secret }); setScreen("recovery"); setLoadingSession(false); return; } const current = await getCurrentUser(); if (current) await openRealWorkspace(current); setLoadingSession(false); })(); }, []);
  useEffect(() => { if (screen !== "app" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const ctx = gsap.context(() => gsap.fromTo("[data-animate]", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .42, stagger: .045, ease: "power2.out" }), appRoot); return () => ctx.revert(); }, [screen, view]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setView("ask"); } else if (event.key.toLowerCase() === "c" && !captureOpen && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { if (review) setReviewPaused(false); else setCaptureOpen(true); } else if (event.key === "Escape") { if (selected) setSelected(null); else if (review && !reviewPaused) setReviewPaused(true); else if (newThreadOpen) setNewThreadOpen(false); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [captureOpen, newThreadOpen, review, reviewPaused, selected]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { if (view !== "today" || !user || demo || !isAppwriteConfigured || !items.length) return; void askOrExtract("today-brief", {}).then((result) => { if (result.briefing) setDailyBriefing(String(result.briefing)); }).catch(() => setDailyBriefing("Your items are safe, but the AI briefing is temporarily unavailable.")); }, [view, user, demo, items.length]);

  const threads = useMemo(() => customThreads.map((thread) => ({ ...thread, itemIds: [...new Set([...thread.itemIds, ...items.filter((item) => item.threadId === thread.id || (!item.threadId && item.threadName?.toLowerCase() === thread.name.toLowerCase())).map((item) => item.id)])] })), [items, customThreads]);
  async function openRealWorkspace(nextUser: AuthUser) {
    setDemo(false); setUser(nextUser); setItems([]); setCustomThreads([]); setReview(null); setReviewPaused(false); setDailyBriefing("Your day is clear. Capture anything you want LifeInbox to remember, organize, or turn into a next step."); setScreen("app");
    try { const [remote, remoteThreads] = await Promise.all([listLifeItems(nextUser.id), listLifeThreads(nextUser.id)]); setItems(remote); setCustomThreads(remoteThreads); }
    catch { setToast("Your account opened, but Appwrite sync needs attention."); }
  }
  function enterDemo() { setDemo(true); setItems(seedItems); setCustomThreads(seedThreads); setReview(null); setReviewPaused(false); setDailyBriefing("Renew your car insurance before 5 PM. Your Goa flight check-in opens tomorrow, and there’s one payment to settle this week."); setUser({ id: "demo", name: "Taha Ahmed", email: "demo@lifeinbox.app" }); setScreen("app"); }
  async function logout() { try { if (!demo) await signOut(); } catch {} setUser(null); setDemo(false); setItems([]); setCustomThreads([]); setReview(null); setReviewPaused(false); setScreen("landing"); setView("today"); }
  function toggleDone(id: string) { const current = items.find((item) => item.id === id); const status = current?.status === "done" ? "inbox" : "done"; setItems((all) => all.map((item) => item.id === id ? { ...item, status } : item)); setToast(status === "done" ? "Nice! Item completed" : "Item moved back to the inbox"); if (!demo && isAppwriteConfigured) void updateLifeItem(id, { status }); }
  function snoozeItem(id: string) { setItems((all) => all.map((item) => item.id === id ? { ...item, status: "snoozed", dueLabel: "Tomorrow" } : item)); setToast("Snoozed until tomorrow"); if (!demo && isAppwriteConfigured) void updateLifeItem(id, { status: "snoozed", dueLabel: "Tomorrow" }); }
  function deleteItem(id: string) { setItems((all) => all.filter((item) => item.id !== id)); setToast("Item removed"); if (!demo && isAppwriteConfigured) void deleteLifeItem(id); }
  async function createThread(thread: LifeThread) { setCustomThreads((all) => [...all, thread]); setNewThreadOpen(false); setToast("New Life Thread created"); if (!demo && isAppwriteConfigured && user) await saveLifeThread(thread, user.id).catch(() => setToast("Thread created locally; sync needs attention")); }
  async function removeThread(thread: LifeThread) {
    if (!window.confirm(`Delete “${thread.name}”? Its items will stay in your inbox.`)) return;
    const affected = items.filter((item) => item.threadId === thread.id || item.threadName?.toLowerCase() === thread.name.toLowerCase());
    setCustomThreads((all) => all.filter((entry) => entry.id !== thread.id));
    setItems((all) => all.map((item) => affected.some((entry) => entry.id === item.id) ? { ...item, threadId: undefined, threadName: undefined } : item));
    setToast("Life Thread deleted; its items remain in your inbox");
    if (!demo && isAppwriteConfigured) {
      try { await Promise.all([deleteLifeThread(thread.id), ...affected.map((item) => updateLifeItem(item.id, { threadId: null, threadName: null }))]); }
      catch { setToast("Thread removed locally; Appwrite sync needs attention"); }
    }
  }
  function resetDemo() { setItems(seedItems); setCustomThreads(seedThreads); setToast("Demo workspace reset"); setView("today"); }
  function openCapture() {
    if (review) { setReviewPaused(false); setToast("Finish the capture already waiting for review"); return; }
    setCaptureOpen(true);
  }
  function rejectReview() {
    if (!review) return;
    if (review.captureId) void updateCaptureRecord(review.captureId, { status: "rejected" });
    setReview(null); setReviewPaused(false); setToast("Capture discarded");
  }
  async function approveItems(drafts: LifeItem[], captureId?: string) {
    const originalThreadIds = new Set(customThreads.map((thread) => thread.id));
    let workingThreads = [...customThreads];
    const touchedThreads = new Map<string, LifeThread>();
    const stamp = Date.now();

    const nextItems = drafts.map((draft, index) => {
      const stableId = draft.id || `li-${stamp}-${index}`;
      let nextItem = { ...draft, id: stableId };
      const requestedThread = draft.threadName?.trim();
      if (!requestedThread) return nextItem;

      const existing = workingThreads.find((thread) => thread.name.toLowerCase() === requestedThread.toLowerCase());
      if (existing) {
        const updated = {
          ...existing,
          itemIds: [...new Set([...existing.itemIds, stableId])],
          nextStep: existing.itemIds.length ? existing.nextStep : draft.title,
        };
        workingThreads = workingThreads.map((thread) => thread.id === updated.id ? updated : thread);
        touchedThreads.set(updated.id, updated);
        nextItem = { ...nextItem, threadId: updated.id, threadName: updated.name };
      } else {
        const created: LifeThread = {
          id: `thread-${stamp}-${index}`,
          name: requestedThread,
          eyebrow: "AI suggested",
          color: "#78e957",
          itemIds: [stableId],
          nextStep: draft.title,
          dateRange: draft.dueLabel || "Ongoing",
        };
        workingThreads = [created, ...workingThreads];
        touchedThreads.set(created.id, created);
        nextItem = { ...nextItem, threadId: created.id, threadName: created.name };
      }
      return nextItem;
    });

    if (!demo && isAppwriteConfigured && user) {
      try {
        await Promise.all([
          ...[...touchedThreads.values()].map((thread) => originalThreadIds.has(thread.id) ? updateLifeThread(thread) : saveLifeThread(thread, user.id)),
          ...nextItems.map((item) => saveLifeItem(item, user.id)),
        ]);
        if (captureId) {
          const confidence = Math.round(nextItems.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, nextItems.length));
          await updateCaptureRecord(captureId, { status: "completed", needsReview: false, confidence }).catch(() => undefined);
        }
      } catch (error) {
        setToast("Sync was interrupted. Your review is safe—tap Save to retry.");
        throw error;
      }
    }

    setCustomThreads(workingThreads);
    setItems((all) => [...nextItems, ...all]);
    setReview(null);
    setReviewPaused(false);
    setCaptureOpen(false);
    setToast(`${nextItems.length} ${nextItems.length === 1 ? "item" : "items"} saved to your inbox`);
  }

  if (loadingSession) return <div className="boot-screen"><Brand /><LoaderCircle className="spin" size={24} /><p>Opening your LifeInbox…</p></div>;
  if (screen === "landing") return <Landing onAuth={(mode) => { setAuthMode(mode); setScreen("auth"); }} onDemo={enterDemo} />;
  if (screen === "auth") return <AuthScreen initialMode={authMode} onBack={() => setScreen("landing")} onSuccess={(nextUser) => void openRealWorkspace(nextUser)} onDemo={enterDemo} />;
  if (screen === "recovery" && recovery) return <RecoveryScreen {...recovery} onDone={() => { window.history.replaceState({}, "", window.location.pathname); setAuthMode("signin"); setScreen("auth"); setToast("Password reset. You can log in now."); }} />;
  if (!user) return null;

  return (
    <div ref={appRoot} className="app-shell">
      <Sidebar view={view} setView={setView} user={user} demo={demo} inboxCount={items.filter((item) => item.status !== "done").length} onCapture={openCapture} onLogout={() => void logout()} />
      <main className="app-main">
        <Topbar view={view} onCapture={openCapture} query={query} setQuery={setQuery} />
        {view === "today" && <TodayView items={items} name={user.name} briefing={dailyBriefing} onDone={toggleDone} onCapture={openCapture} onOpen={setSelected} onViewAll={() => setView("inbox")} />}
        {view === "inbox" && <InboxView items={items} query={query} onDone={toggleDone} onOpen={setSelected} onCapture={openCapture} />}
        {view === "threads" && <ThreadsView threads={threads} items={items} onDone={toggleDone} onOpen={setSelected} onDelete={(thread) => void removeThread(thread)} onNewThread={() => setNewThreadOpen(true)} />}
        {view === "ask" && <AskView items={items} demo={demo} onOpen={setSelected} />}
        {view === "settings" && <SettingsView demo={demo} user={user} items={items} onLogout={() => void logout()} onToast={setToast} onReset={resetDemo} />}
      </main>
      {captureOpen && <CaptureModal user={user} onClose={() => setCaptureOpen(false)} onReview={(drafts, original, fileName, captureId, warning) => { setReview({ drafts, original, fileName, captureId }); setReviewPaused(false); setCaptureOpen(false); if (warning) setToast(warning); }} />}
      {newThreadOpen && <NewThreadModal onClose={() => setNewThreadOpen(false)} onCreate={(thread) => void createThread(thread)} />}
      {review && !reviewPaused && <ReviewModal drafts={review.drafts} original={review.original} fileName={review.fileName} threads={threads} onChange={(drafts) => setReview((current) => current ? { ...current, drafts } : current)} onClose={() => setReviewPaused(true)} onReject={rejectReview} onApprove={(drafts) => approveItems(drafts, review.captureId)} />}
      {review && reviewPaused && <aside className="review-resume-card" role="status"><span><WandSparkles size={18} /></span><div><b>{review.drafts.length} {review.drafts.length === 1 ? "item is" : "items are"} waiting for review</b><small>Your edits are safe until you finish or discard this capture.</small></div><button className="button button-small" onClick={() => setReviewPaused(false)}>Resume</button><button className="resume-discard" onClick={rejectReview} aria-label="Discard pending capture"><Trash2 size={15} /></button></aside>}
      {selected && <ItemDetail item={selected} onClose={() => setSelected(null)} onDone={toggleDone} onDelete={deleteItem} onSnooze={snoozeItem} />}
      {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={16} /> {toast}</div>}
    </div>
  );
}
