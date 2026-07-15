"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  Archive, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleDollarSign, Clock3, FileText, Fingerprint, HelpCircle, Home, Image as ImageIcon, Inbox, Layers3,
  LoaderCircle, LockKeyhole, LogOut, Menu, MessageCircleQuestion, Mic, MoreHorizontal, Paperclip,
  Plus, Search, Send, Settings, ShieldCheck, Sparkles, Tag, Trash2, UploadCloud, User, WandSparkles, X,
  Zap,
} from "lucide-react";
import {
  askOrExtract, getCurrentUser, isAppwriteConfigured, listLifeItems, saveLifeItem, signIn, signOut, signUp,
  uploadCaptureFile, type AuthUser,
} from "@/lib/appwrite";
import { makeDraft, seedItems, seedThreads, type ItemType, type LifeItem, type LifeThread } from "@/lib/lifeinbox";

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

function LogoCloud() {
  return (
    <div className="proof-row" aria-label="Supported capture formats">
      <span><FileText size={15} /> PDFs</span><span><ImageIcon size={15} /> Images</span><span><Mic size={15} /> Voice</span><span><MessageCircleQuestion size={15} /> Text</span>
    </div>
  );
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
        <nav aria-label="Main navigation"><a href="#how">How it works</a><a href="#privacy">Privacy</a><a href="#pricing">Pricing</a></nav>
        <div className="nav-actions"><button className="text-button" onClick={() => onAuth("signin")}>Log in</button><button className="button button-small" onClick={() => onAuth("signup")}>Start free</button></div>
      </header>

      <main>
        <section className="hero-section">
          <div className="eyebrow" data-hero><Sparkles size={14} /> Your calm command center</div>
          <h1 data-hero>Your life, finally<br />out of your <em>head.</em></h1>
          <p data-hero>Drop in a screenshot, receipt, voice note, PDF, or messy thought. LifeInbox finds what matters and turns it into a clear next step.</p>
          <div className="hero-actions" data-hero><button className="button button-large" onClick={() => onAuth("signup")}>Start capturing free <ArrowRight size={17} /></button><button className="button button-large button-ghost" onClick={onDemo}>Explore the demo</button></div>
          <div data-hero><LogoCloud /></div>

          <div className="hero-product" data-demo>
            <div className="demo-sidebar"><Brand compact /><div className="demo-nav-lines"><i /><i /><i /><i /></div><div className="demo-avatar" /></div>
            <div className="demo-main">
              <div className="demo-top"><div><small>WEDNESDAY, 15 JULY</small><h3>Good morning, Taha.</h3></div><button><Plus size={15} /> Capture</button></div>
              <div className="brief-demo"><div><span><Sparkles size={16} /> TODAY&apos;S BRIEFING</span><h4>Three things deserve your attention.</h4><p>Renew your car insurance before 5 PM. Your Goa flight check-in opens tomorrow.</p></div><div className="brief-orb">3</div></div>
              <div className="demo-grid">
                <div className="demo-list"><b>Up next</b>{seedItems.slice(0, 3).map((item) => <MiniItem key={item.id} item={item} />)}</div>
                <div className="demo-capture"><span><WandSparkles size={17} /></span><b>Capture anything</b><p>Paste a thought, drop a file, or record a note.</p><div><Paperclip size={14} /> Type or drop here...</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="statement"><p>Life admin arrives everywhere.</p><h2>LifeInbox gives it one quiet place to land.</h2></section>

        <section id="how" className="how-section">
          <div className="section-heading"><span className="eyebrow">One simple flow</span><h2>Capture now. Understand instantly.<br />Act when it matters.</h2></div>
          <div className="step-grid">
            <article><span>01</span><div className="step-visual capture-visual"><div><Plus size={18} /></div><p>“Dinner with Aanya ₹2,480, split equally”</p></div><h3>Capture without organizing</h3><p>Text, talk, upload, or drag in whatever is in front of you.</p></article>
            <article><span>02</span><div className="step-visual extract-visual"><i>Expense</i><b>Split dinner with Aanya</b><small>₹1,240 · This week</small><div className="confidence"><span style={{ width: "87%" }} /> 87% confidence</div></div><h3>Review what LifeInbox found</h3><p>Every extracted detail stays editable. Nothing important happens without you.</p></article>
            <article><span>03</span><div className="step-visual thread-visual"><span>GO</span><div><b>Goa weekend</b><small>4 items · 17-20 Jul</small></div><ChevronRight size={17} /></div><h3>See the bigger picture</h3><p>Related plans, tasks, people, and files gather into searchable Life Threads.</p></article>
          </div>
        </section>

        <section id="privacy" className="privacy-section">
          <div><span className="eyebrow"><ShieldCheck size={14} /> Private by design</span><h2>Your life stays yours.</h2><p>Files and records are permissioned to your account. AI keys stay on secure server functions, and retention controls put you in charge of what is kept.</p><ul><li><Check size={16} /> User-owned rows and files</li><li><Check size={16} /> Review before save</li><li><Check size={16} /> Clear retention and deletion controls</li></ul></div>
          <div className="privacy-card"><div className="shield-orbit"><ShieldCheck size={42} /><i /><i /><i /></div><p>Encrypted in transit</p><span>Built on Appwrite permissions</span></div>
        </section>

        <section id="pricing" className="pricing-section">
          <div className="section-heading center"><span className="eyebrow">Simple pricing</span><h2>Start calm. Grow only if you need to.</h2><p>No card required. Your free workspace includes every core LifeInbox flow.</p></div>
          <div className="price-grid">
            <article><span>Free</span><h3>₹0 <small>/ forever</small></h3><p>For clearing the everyday clutter.</p><ul><li><Check size={15} /> 50 captures each month</li><li><Check size={15} /> Inbox, Today, and Threads</li><li><Check size={15} /> Ask LifeInbox</li><li><Check size={15} /> 30-day file retention</li></ul><button className="button button-full button-ghost" onClick={() => onAuth("signup")}>Start free</button></article>
            <article className="featured-price"><div className="price-badge">COMING SOON</div><span>Plus</span><h3>₹299 <small>/ month</small></h3><p>For heavier life admin and longer memory.</p><ul><li><Check size={15} /> Unlimited text captures</li><li><Check size={15} /> Higher file and voice limits</li><li><Check size={15} /> 1-year file retention</li><li><Check size={15} /> Priority processing</li></ul><button className="button button-full" onClick={() => onAuth("signup")}>Join with Free</button></article>
          </div>
        </section>

        <section className="faq-section"><h2>Questions, answered.</h2><div>{[
          ["Does LifeInbox act without asking me?", "No. Low-confidence captures always go through review, and you stay in control of every saved action."],
          ["What can I capture?", "Text, images, PDFs, receipts, screenshots, and voice notes. Audio is transcribed before it is organized."],
          ["Can I delete my data?", "Yes. Delete individual items, set a retention window, or remove your workspace from Settings."],
        ].map(([q, a]) => <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>)}</div></section>

        <section className="final-cta"><span className="brand-mark"><span /></span><h2>Make room for what matters.</h2><p>Your first 50 captures are free.</p><button className="button button-large" onClick={() => onAuth("signup")}>Start your LifeInbox <ArrowRight size={17} /></button></section>
      </main>
      <footer><Brand /><p>© 2026 LifeInbox. Built for calmer days.</p><div><a href="#privacy">Privacy</a><a href="#pricing">Pricing</a><a href="mailto:hello@lifeinbox.app">Contact</a></div></footer>
    </div>
  );
}

function MiniItem({ item }: { item: LifeItem }) {
  const Icon = typeMeta[item.type].icon;
  return <div className="mini-item"><span className={`type-icon ${typeMeta[item.type].color}`}><Icon size={14} /></span><div><b>{item.title}</b><small>{item.dueLabel}</small></div></div>;
}

function AuthScreen({ initialMode, onBack, onSuccess, onDemo }: { initialMode: AuthMode; onBack: () => void; onSuccess: (user: AuthUser) => void; onDemo: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

function Sidebar({ view, setView, user, demo, onCapture, onLogout }: { view: View; setView: (v: View) => void; user: AuthUser; demo: boolean; onCapture: () => void; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links: { id: View; label: string; icon: typeof Home; badge?: string }[] = [
    { id: "today", label: "Today", icon: Home }, { id: "inbox", label: "Inbox", icon: Inbox, badge: "3" },
    { id: "threads", label: "Life Threads", icon: Layers3 }, { id: "ask", label: "Ask LifeInbox", icon: MessageCircleQuestion },
  ];
  const choose = (id: View) => { setView(id); setMobileOpen(false); };
  return <>
    <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sidebar-top"><Brand /><button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
      <button className="capture-button" onClick={onCapture}><Plus size={18} /> New capture <kbd>C</kbd></button>
      <nav aria-label="App navigation">{links.map((link) => <button key={link.id} className={view === link.id ? "active" : ""} onClick={() => choose(link.id)}><link.icon size={18} /><span>{link.label}</span>{link.badge && <i>{link.badge}</i>}</button>)}</nav>
      <div className="sidebar-bottom">
        {demo && <div className="demo-mode"><Sparkles size={14} /><div><b>Demo mode</b><small>Sample data only</small></div></div>}
        <button className={view === "settings" ? "active" : ""} onClick={() => choose("settings")}><Settings size={18} /> Settings</button>
        <div className="user-menu"><span>{user.name.charAt(0).toUpperCase()}</span><div><b>{user.name}</b><small>{demo ? "Free demo" : user.email}</small></div><button onClick={onLogout} aria-label="Log out"><LogOut size={16} /></button></div>
      </div>
    </aside>
  </>;
}

function Topbar({ view, onCapture, query, setQuery }: { view: View; onCapture: () => void; query: string; setQuery: (q: string) => void }) {
  const labels: Record<View, string> = { today: "Today", inbox: "Inbox", threads: "Life Threads", ask: "Ask LifeInbox", settings: "Settings" };
  return <header className="app-topbar"><div><span>{labels[view]}</span></div><div className="top-actions">{view === "inbox" && <label className="top-search"><Search size={16} /><input aria-label="Search inbox" placeholder="Search your inbox" value={query} onChange={(e) => setQuery(e.target.value)} /></label>}<button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button><button className="top-capture" onClick={onCapture}><Plus size={16} /> Capture</button></div></header>;
}

function TodayView({ items, name, onDone, onCapture, onOpen }: { items: LifeItem[]; name: string; onDone: (id: string) => void; onCapture: () => void; onOpen: (item: LifeItem) => void }) {
  const todayItems = items.filter((i) => i.status === "today" || (i.priority === "high" && i.status !== "done"));
  return <div className="view today-view">
    <div className="view-heading" data-animate><span className="date-label">WEDNESDAY, 15 JULY</span><h1>Good morning, {name.split(" ")[0]}.</h1><p>Here’s the small set of things worth seeing today.</p></div>
    <section className="briefing-card" data-animate><div className="briefing-copy"><span><Sparkles size={15} /> TODAY&apos;S BRIEFING</span><h2>Three things deserve your attention.</h2><p>Renew your car insurance before 5 PM. Your Goa flight check-in opens tomorrow, and there’s one payment to settle this week.</p><div><button>Show me what to do first <ArrowRight size={15} /></button><small>Updated 8:30 AM</small></div></div><div className="briefing-art"><span className="orb-main">3</span><span /><span /><span /></div></section>
    <div className="today-grid">
      <section className="panel" data-animate><div className="panel-head"><div><span>Up next</span><small>{todayItems.length} active items</small></div><button>View all <ArrowRight size={14} /></button></div><div className="focus-list">{todayItems.map((item) => <LifeItemRow key={item.id} item={item} onDone={onDone} onOpen={onOpen} />)}</div></section>
      <aside className="right-stack">
        <section className="panel progress-panel" data-animate><div className="panel-head"><div><span>This week</span><small>A steady start</small></div><b>68%</b></div><div className="progress-track"><span /></div><div className="stats"><div><b>5</b><small>Completed</small></div><div><b>4</b><small>Remaining</small></div><div><b>2</b><small>Threads</small></div></div></section>
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
    <button className="more-button" aria-label={`More actions for ${item.title}`}><MoreHorizontal size={18} /></button>
  </article>;
}

function InboxView({ items, query, onDone, onOpen, onCapture }: { items: LifeItem[]; query: string; onDone: (id: string) => void; onOpen: (item: LifeItem) => void; onCapture: () => void }) {
  const [filter, setFilter] = useState<"all" | ItemType>("all");
  const filtered = items.filter((item) => item.status !== "done" && (filter === "all" || item.type === filter) && (`${item.title} ${item.summary} ${item.threadName}`.toLowerCase().includes(query.toLowerCase())));
  return <div className="view inbox-view">
    <div className="view-heading split" data-animate><div><span className="date-label">EVERYTHING YOU&apos;VE CAPTURED</span><h1>Your inbox</h1><p>{filtered.length} items ready to review, schedule, or file away.</p></div><button className="button" onClick={onCapture}><Plus size={16} /> New capture</button></div>
    <div className="filter-row" data-animate>{(["all", "task", "event", "expense", "note"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All items" : typeMeta[value].label}{value === "all" && <span>{items.filter((i) => i.status !== "done").length}</span>}</button>)}<button className="filter-more"><ChevronDown size={15} /> More filters</button></div>
    <section className="inbox-panel panel" data-animate>{filtered.length ? <>{filtered.map((item) => <LifeItemRow key={item.id} item={item} onDone={onDone} onOpen={onOpen} dense />)}<div className="list-end"><CheckCircle2 size={16} /> You’re all caught up beyond these items.</div></> : <div className="empty-state"><span><Inbox size={24} /></span><h3>No items found</h3><p>Try another filter or capture something new.</p><button onClick={onCapture}>Capture anything</button></div>}</section>
  </div>;
}

function ThreadsView({ threads, items, onOpen }: { threads: LifeThread[]; items: LifeItem[]; onOpen: (item: LifeItem) => void }) {
  const [selected, setSelected] = useState<LifeThread | null>(null);
  return <div className="view threads-view">
    <div className="view-heading split" data-animate><div><span className="date-label">THE BIGGER PICTURE</span><h1>Life Threads</h1><p>Related details gather here automatically, so plans stay connected.</p></div><button className="button button-ghost"><Plus size={16} /> New thread</button></div>
    <div className="thread-grid" data-animate>{threads.map((thread) => { const active = thread.itemIds.filter((id) => items.find((i) => i.id === id)?.status !== "done").length; return <button className="thread-card" key={thread.id} onClick={() => setSelected(thread)}><div className="thread-card-top"><span className="thread-monogram" style={{ backgroundColor: `${thread.color}20`, color: thread.color }}>{thread.name.slice(0, 2).toUpperCase()}</span><MoreHorizontal size={18} /></div><span className="thread-eyebrow">{thread.eyebrow}</span><h3>{thread.name}</h3><p>{active} active {active === 1 ? "item" : "items"} · {thread.dateRange}</p><div className="thread-next"><small>NEXT STEP</small><span>{thread.nextStep}<ArrowRight size={14} /></span></div><div className="thread-dots">{thread.itemIds.slice(0, 4).map((id, idx) => <i key={id} style={{ backgroundColor: idx === 0 ? thread.color : undefined }} />)}</div></button>; })}</div>
    <section className="thread-recent panel" data-animate><div className="panel-head"><div><span>Recently added</span><small>Items LifeInbox grouped for you</small></div></div>{items.slice(0, 3).map((item) => <LifeItemRow dense key={item.id} item={item} onDone={() => {}} onOpen={onOpen} />)}</section>
    {selected && <div className="drawer-scrim" onClick={() => setSelected(null)}><aside className="thread-drawer" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button><span className="thread-monogram large" style={{ backgroundColor: `${selected.color}20`, color: selected.color }}>{selected.name.slice(0, 2).toUpperCase()}</span><span className="date-label">{selected.eyebrow}</span><h2>{selected.name}</h2><p>{selected.dateRange}</p><div className="drawer-summary"><Sparkles size={16} /><span><b>Thread summary</b>Everything related to this plan lives together. Your next best step is <strong>{selected.nextStep.toLowerCase()}</strong>.</span></div><h3>Items in this thread</h3>{selected.itemIds.map((id) => { const item = items.find((i) => i.id === id); return item ? <LifeItemRow dense key={id} item={item} onDone={() => {}} onOpen={onOpen} /> : null; })}</aside></div>}
  </div>;
}

function AskView({ items }: { items: LifeItem[] }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; citations?: string[] }[]>([{ role: "assistant", text: "Ask me about anything you’ve saved. I’ll use your own items and show exactly where the answer came from." }]);
  const [input, setInput] = useState(""); const [thinking, setThinking] = useState(false);
  async function ask(question: string) {
    if (!question.trim()) return; setMessages((m) => [...m, { role: "user", text: question }]); setInput(""); setThinking(true);
    let answer = "You have two time-sensitive items: renew your car insurance today, then send the hotel confirmation before tomorrow. The Goa flight itself is Friday morning.";
    let citations = items.filter((i) => i.priority === "high" || i.threadId === "goa").slice(0, 3).map((i) => i.id);
    try { const result = isAppwriteConfigured ? await askOrExtract("ask", { question }) : null; if (result?.answer) answer = String(result.answer); if (Array.isArray(result?.citations)) citations = result.citations.map(String); } catch { /* Use graceful local answer. */ }
    setThinking(false); setMessages((m) => [...m, { role: "assistant", text: answer, citations }]);
  }
  return <div className="view ask-view">
    <div className="ask-header" data-animate><span className="ask-spark"><Sparkles size={22} /></span><h1>Ask LifeInbox</h1><p>Answers grounded in the things you’ve captured.</p></div>
    <div className="chat-panel" data-animate><div className="chat-messages">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><span>{message.role === "assistant" ? <Sparkles size={15} /> : <User size={15} />}</span><div><p>{message.text}</p>{message.citations && <div className="citations">{message.citations.map((id) => { const item = items.find((i) => i.id === id); return item && <button key={id}><FileText size={12} /> {item.title}</button>; })}</div>}</div></div>)}{thinking && <div className="message assistant"><span><Sparkles size={15} /></span><div className="typing"><i /><i /><i /></div></div>}</div>
      {messages.length === 1 && <div className="suggestions"><span>Try asking</span>{["What is due this week?", "Show my Goa trip items", "What should I do first?"].map((q) => <button key={q} onClick={() => ask(q)}>{q}<ArrowRight size={14} /></button>)}</div>}
      <form className="ask-box" onSubmit={(e) => { e.preventDefault(); void ask(input); }}><MessageCircleQuestion size={18} /><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about dates, plans, payments, people..." aria-label="Ask LifeInbox" /><button disabled={!input.trim() || thinking} aria-label="Send question"><Send size={16} /></button></form><small className="ask-note"><ShieldCheck size={12} /> Answers only use items in your LifeInbox. Citations are always shown.</small></div>
  </div>;
}

function SettingsView({ demo, onLogout }: { demo: boolean; onLogout: () => void }) {
  const [retention, setRetention] = useState("30"); const [briefing, setBriefing] = useState(true); const [review, setReview] = useState(true);
  return <div className="view settings-view"><div className="view-heading" data-animate><span className="date-label">YOUR WORKSPACE</span><h1>Settings</h1><p>Manage your preferences, usage, privacy, and plan.</p></div>
    <div className="settings-layout" data-animate><nav><button className="active"><User size={16} /> Profile</button><button><Zap size={16} /> Usage & plan</button><button><ShieldCheck size={16} /> Privacy</button><button><Bell size={16} /> Notifications</button></nav><div className="settings-content">
      <section className="settings-section"><div><h2>Profile</h2><p>Your LifeInbox identity and account details.</p></div><div className="profile-row"><span>TA</span><div><b>Taha Ahmed</b><small>{demo ? "demo@lifeinbox.app" : "Your connected Appwrite account"}</small></div><button>Edit profile</button></div></section>
      <section className="settings-section"><div><h2>Usage this month</h2><p>Your free plan resets on 1 August.</p></div><div className="usage-box"><div><span><b>18</b> / 50 captures</span><small>36% used</small></div><div className="usage-track"><span /></div><div className="usage-stats"><span><FileText size={15} /> 12 text</span><span><ImageIcon size={15} /> 4 images</span><span><Mic size={15} /> 2 voice</span></div></div><button className="button button-ghost button-small">View plans</button></section>
      <section className="settings-section"><div><h2>Capture preferences</h2><p>Choose how LifeInbox handles extracted information.</p></div><SettingToggle title="Always review before save" text="Open the review screen even when confidence is high." checked={review} setChecked={setReview} /><SettingToggle title="Morning briefing" text="Prepare a concise daily briefing from relevant items." checked={briefing} setChecked={setBriefing} /></section>
      <section className="settings-section"><div><h2>Privacy & retention</h2><p>Control how long original uploaded files are kept.</p></div><label className="select-setting"><div><b>Original file retention</b><small>Extracted actions stay until you delete them.</small></div><select value={retention} onChange={(e) => setRetention(e.target.value)}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="0">Delete after processing</option></select></label><button className="plain-action"><Archive size={15} /> Export my data</button></section>
      <section className="settings-section danger-section"><div><h2>Account</h2><p>Manage this session or permanently remove your workspace.</p></div><div><button className="button button-ghost" onClick={onLogout}><LogOut size={15} /> Log out</button><button className="danger-button"><Trash2 size={15} /> Delete workspace</button></div></section>
    </div></div>
  </div>;
}

function SettingToggle({ title, text, checked, setChecked }: { title: string; text: string; checked: boolean; setChecked: (v: boolean) => void }) {
  return <label className="toggle-setting"><div><b>{title}</b><small>{text}</small></div><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /><span /></label>;
}

function CaptureModal({ user, onClose, onReview }: { user: AuthUser; onClose: () => void; onReview: (draft: LifeItem, original: string, fileName?: string) => void }) {
  const [source, setSource] = useState<LifeItem["source"]>("text"); const [text, setText] = useState(""); const [file, setFile] = useState<File | null>(null); const [processing, setProcessing] = useState(false); const [drag, setDrag] = useState(false);
  async function process() {
    if (!text.trim() && !file) return; setProcessing(true);
    try {
      if (file && isAppwriteConfigured && user.id !== "demo") await uploadCaptureFile(file, user.id);
      let draft = makeDraft(text || file?.name || "New capture", source);
      if (isAppwriteConfigured) { const result = await askOrExtract("extract", { input: text, source, fileName: file?.name }); if (result?.item) draft = { ...draft, ...(result.item as Partial<LifeItem>) }; }
      else await new Promise((resolve) => window.setTimeout(resolve, 720));
      onReview(draft, text || "Uploaded file", file?.name);
    } catch { onReview(makeDraft(text || file?.name || "New capture", source), text || "Uploaded file", file?.name); }
    finally { setProcessing(false); }
  }
  return <div className="modal-scrim"><section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title"><div className="modal-head"><div><span><WandSparkles size={18} /></span><div><h2 id="capture-title">Capture anything</h2><p>Don’t organize it. LifeInbox will help.</p></div></div><button className="modal-close" onClick={onClose} aria-label="Close capture"><X size={18} /></button></div>
    <div className="source-tabs">{([{ id: "text", label: "Text", icon: FileText }, { id: "image", label: "Image", icon: ImageIcon }, { id: "pdf", label: "PDF", icon: Paperclip }, { id: "voice", label: "Voice", icon: Mic }] as const).map((option) => <button key={option.id} className={source === option.id ? "active" : ""} onClick={() => setSource(option.id)}><option.icon size={15} /> {option.label}</button>)}</div>
    {source === "text" ? <div className="capture-input"><textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a message, jot down a thought, or type what you need to remember..." /><div><span>{text.length} characters</span><small>Tip: dates, names, and amounts help.</small></div></div> : source === "voice" ? <div className="voice-capture"><button onClick={() => setText(text ? "" : "Call the dentist tomorrow at 10 AM")} className={text ? "recording" : ""}><Mic size={24} /></button><h3>{text ? "Voice note captured" : "Tap to record"}</h3><p>{text || "Your audio will be transcribed before LifeInbox extracts actions."}</p></div> : <label className={`drop-zone ${drag ? "drag" : ""}`} onDragEnter={(e) => { e.preventDefault(); setDrag(true); }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); const dropped = e.dataTransfer.files[0]; if (dropped) setFile(dropped); }}><input type="file" accept={source === "pdf" ? "application/pdf" : "image/*"} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><span><UploadCloud size={23} /></span><h3>{file ? file.name : `Drop your ${source === "pdf" ? "PDF" : "image"} here`}</h3><p>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB ready to process` : "or click to choose a file · max 10 MB"}</p></label>}
    <div className="capture-footer"><p><LockKeyhole size={13} /> Private to your workspace</p><div><button className="button button-ghost" onClick={onClose}>Cancel</button><button className="button" onClick={() => void process()} disabled={processing || (!text.trim() && !file)}>{processing ? <><LoaderCircle className="spin" size={16} /> Understanding...</> : <>Review capture <ArrowRight size={15} /></>}</button></div></div></section></div>;
}

function ReviewModal({ draft, original, fileName, onClose, onApprove, onReject }: { draft: LifeItem; original: string; fileName?: string; onClose: () => void; onApprove: (item: LifeItem) => void; onReject: () => void }) {
  const [item, setItem] = useState(draft); const low = item.confidence < 80;
  return <div className="modal-scrim"><section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title"><div className="review-header"><div><span className="review-check"><WandSparkles size={17} /></span><div><h2 id="review-title">Review capture</h2><p>Check the details before they enter your inbox.</p></div></div><div><span className={`confidence-badge ${low ? "low" : ""}`}>{low ? <HelpCircle size={13} /> : <CheckCircle2 size={13} />}{item.confidence}% confidence</span><button className="modal-close" onClick={onClose}><X size={18} /></button></div></div>
    {low && <div className="low-confidence"><HelpCircle size={16} /><div><b>A quick check would help</b><p>The original capture is brief, so some details may need your confirmation.</p></div></div>}
    <div className="review-body"><section className="original-pane"><span>ORIGINAL</span>{fileName ? <div className="file-preview"><FileText size={32} /><b>{fileName}</b><small>Original file · private</small></div> : <blockquote>“{original}”</blockquote>}<div className="source-note"><ShieldCheck size={14} /> Original kept for 30 days</div></section><section className="fields-pane"><span>EXTRACTED DETAILS</span><div className="field-row"><label>Type<select value={item.type} onChange={(e) => setItem({ ...item, type: e.target.value as ItemType })}><option value="task">Task</option><option value="event">Event</option><option value="expense">Expense</option><option value="note">Note</option></select></label><label>Priority<select value={item.priority} onChange={(e) => setItem({ ...item, priority: e.target.value as LifeItem["priority"] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div><label>Title<input value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} /></label><label>Summary<textarea value={item.summary} onChange={(e) => setItem({ ...item, summary: e.target.value })} /></label><div className="field-row"><label>Due date<input value={item.dueLabel ?? ""} onChange={(e) => setItem({ ...item, dueLabel: e.target.value })} placeholder="No date" /></label>{item.type === "expense" && <label>Amount<input value={item.amount ?? ""} onChange={(e) => setItem({ ...item, amount: e.target.value })} /></label>}</div><label>Life Thread<input value={item.threadName ?? ""} onChange={(e) => setItem({ ...item, threadName: e.target.value })} placeholder="LifeInbox will suggest one" /></label></section></div>
    <div className="review-footer"><button className="reject-button" onClick={onReject}><Trash2 size={15} /> Reject</button><div><span><kbd>⌘</kbd><kbd>↵</kbd> to approve</span><button className="button button-ghost" onClick={onClose}>Keep editing</button><button className="button" onClick={() => onApprove(item)}><Check size={16} /> Approve & save</button></div></div></section></div>;
}

function ItemDetail({ item, onClose, onDone, onDelete }: { item: LifeItem; onClose: () => void; onDone: (id: string) => void; onDelete: (id: string) => void }) {
  const meta = typeMeta[item.type]; const Icon = meta.icon;
  return <div className="drawer-scrim" onClick={onClose}><aside className="item-drawer" onClick={(e) => e.stopPropagation()}><div className="item-drawer-head"><span className={`type-icon ${meta.color}`}><Icon size={18} /></span><button className="modal-close" onClick={onClose}><X size={18} /></button></div><span className="date-label">{meta.label} · {item.confidence}% confidence</span><h2>{item.title}</h2><p>{item.summary}</p><div className="detail-grid"><div><span><Clock3 size={14} /> When</span><b>{item.dueLabel ?? "No date"}</b></div>{item.amount && <div><span><CircleDollarSign size={14} /> Amount</span><b>{item.amount}</b></div>}{item.location && <div><span><Tag size={14} /> Location</span><b>{item.location}</b></div>}<div><span><Layers3 size={14} /> Thread</span><b>{item.threadName ?? "Unsorted"}</b></div></div><div className="detail-source"><Fingerprint size={17} /><div><b>Captured from {item.source}</b><small>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></div></div><div className="drawer-actions"><button className="button" onClick={() => { onDone(item.id); onClose(); }}><Check size={15} /> Mark complete</button><button className="button button-ghost"><Clock3 size={15} /> Snooze</button><button className="danger-icon" onClick={() => { onDelete(item.id); onClose(); }}><Trash2 size={16} /></button></div></aside></div>;
}

export function LifeInboxApp() {
  const [screen, setScreen] = useState<"landing" | "auth" | "app">("landing"); const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<AuthUser | null>(null); const [demo, setDemo] = useState(false); const [loadingSession, setLoadingSession] = useState(isAppwriteConfigured);
  const [view, setView] = useState<View>("today"); const [items, setItems] = useState<LifeItem[]>(seedItems); const [query, setQuery] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false); const [review, setReview] = useState<{ draft: LifeItem; original: string; fileName?: string } | null>(null); const [selected, setSelected] = useState<LifeItem | null>(null); const [toast, setToast] = useState("");
  const appRoot = useRef<HTMLDivElement>(null);

  useEffect(() => { void (async () => { const current = await getCurrentUser(); if (current) { setUser(current); setScreen("app"); try { const remote = await listLifeItems(current.id); if (remote.length) setItems(remote); } catch {} } setLoadingSession(false); })(); }, []);
  useEffect(() => { if (screen !== "app" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const ctx = gsap.context(() => gsap.fromTo("[data-animate]", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .42, stagger: .045, ease: "power2.out" }), appRoot); return () => ctx.revert(); }, [screen, view]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setView("ask"); } else if (event.key.toLowerCase() === "c" && !captureOpen && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) setCaptureOpen(true); else if (event.key === "Escape") { setCaptureOpen(false); setReview(null); setSelected(null); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [captureOpen]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);

  const threads = useMemo(() => seedThreads.map((thread) => ({ ...thread, itemIds: items.filter((i) => i.threadId === thread.id).map((i) => i.id) })), [items]);
  function enterDemo() { setDemo(true); setUser({ id: "demo", name: "Taha Ahmed", email: "demo@lifeinbox.app" }); setScreen("app"); }
  async function logout() { try { await signOut(); } catch {} setUser(null); setDemo(false); setScreen("landing"); setView("today"); }
  function toggleDone(id: string) { setItems((all) => all.map((item) => item.id === id ? { ...item, status: item.status === "done" ? "inbox" : "done" } : item)); setToast("Item updated"); }
  function deleteItem(id: string) { setItems((all) => all.filter((item) => item.id !== id)); setToast("Item removed"); }
  async function approve(item: LifeItem) { setItems((all) => [item, ...all]); setReview(null); setCaptureOpen(false); setToast("Saved to your inbox"); if (isAppwriteConfigured && user && user.id !== "demo") { try { await saveLifeItem(item, user.id); } catch { setToast("Saved locally; Appwrite sync needs attention"); } } }

  if (loadingSession) return <div className="boot-screen"><Brand /><LoaderCircle className="spin" size={24} /><p>Opening your LifeInbox…</p></div>;
  if (screen === "landing") return <Landing onAuth={(mode) => { setAuthMode(mode); setScreen("auth"); }} onDemo={enterDemo} />;
  if (screen === "auth") return <AuthScreen initialMode={authMode} onBack={() => setScreen("landing")} onSuccess={(nextUser) => { setUser(nextUser); setDemo(false); setScreen("app"); }} onDemo={enterDemo} />;
  if (!user) return null;

  return <div ref={appRoot} className="app-shell"><Sidebar view={view} setView={setView} user={user} demo={demo} onCapture={() => setCaptureOpen(true)} onLogout={() => void logout()} /><main className="app-main"><Topbar view={view} onCapture={() => setCaptureOpen(true)} query={query} setQuery={setQuery} />{view === "today" && <TodayView items={items} name={user.name} onDone={toggleDone} onCapture={() => setCaptureOpen(true)} onOpen={setSelected} />}{view === "inbox" && <InboxView items={items} query={query} onDone={toggleDone} onOpen={setSelected} onCapture={() => setCaptureOpen(true)} />}{view === "threads" && <ThreadsView threads={threads} items={items} onOpen={setSelected} />}{view === "ask" && <AskView items={items} />}{view === "settings" && <SettingsView demo={demo} onLogout={() => void logout()} />}</main>{captureOpen && <CaptureModal user={user} onClose={() => setCaptureOpen(false)} onReview={(draft, original, fileName) => { setReview({ draft, original, fileName }); setCaptureOpen(false); }} />}{review && <ReviewModal {...review} onClose={() => setReview(null)} onReject={() => { setReview(null); setToast("Capture discarded"); }} onApprove={(item) => void approve(item)} />}{selected && <ItemDetail item={selected} onClose={() => setSelected(null)} onDone={toggleDone} onDelete={deleteItem} />}{toast && <div className="toast"><CheckCircle2 size={16} /> {toast}</div>}</div>;
}
