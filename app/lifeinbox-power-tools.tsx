"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BookOpenText, CalendarDays, Check, CheckCircle2, Clock3, Command,
  FileText, Inbox, Layers3, ListTodo, MessageCircleQuestion, Pause, Pin, Play,
  Plus, RotateCcw, Search, Sparkles, TimerReset, X,
} from "lucide-react";
import { makeActionFromNote, type ItemType, type LifeItem, type LifeThread, type Priority } from "@/lib/lifeinbox";
import { useOverlayDialog } from "./use-overlay-dialog";

export type LifeInboxView = "today" | "inbox" | "notes" | "threads" | "ask" | "settings";

type CommandCenterProps = {
  items: LifeItem[];
  threads: LifeThread[];
  onClose: () => void;
  onOpenItem: (item: LifeItem) => void;
  onOpenThread: (thread: LifeThread) => void;
  onNavigate: (view: LifeInboxView) => void;
  onCapture: (intent: "organize" | "note") => void;
};

export function CommandCenter({ items, threads, onClose, onOpenItem, onOpenThread, onNavigate, onCapture }: CommandCenterProps) {
  const [query, setQuery] = useState("");
  const dialogRef = useOverlayDialog<HTMLDivElement>(onClose);
  const normalized = query.trim().toLocaleLowerCase("en");
  const matchingItems = useMemo(() => normalized ? items
    .filter((item) => `${item.title} ${item.summary} ${item.content || ""} ${item.threadName || ""}`.toLocaleLowerCase("en").includes(normalized))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
    .slice(0, 7) : [], [items, normalized]);
  const matchingThreads = useMemo(() => normalized ? threads
    .filter((thread) => `${thread.name} ${thread.eyebrow} ${thread.nextStep}`.toLocaleLowerCase("en").includes(normalized))
    .slice(0, 3) : [], [threads, normalized]);

  const navigate = (view: LifeInboxView) => { onNavigate(view); onClose(); };
  const capture = (intent: "organize" | "note") => { onClose(); onCapture(intent); };

  return <div className="modal-scrim command-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} className="command-center" role="dialog" aria-modal="true" aria-label="LifeInbox Spotlight">
      <div className="command-search">
        <Search size={19} />
        <input data-autofocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find anything in LifeInbox" aria-label="Find anything in LifeInbox" />
        <kbd><Command size={11} /> K</kbd>
        <button onClick={onClose} aria-label="Close command center"><X size={17} /></button>
      </div>
      {!normalized ? <div className="command-home">
        <span id="command-title">QUICK ACTIONS</span>
        <div className="command-actions">
          <button onClick={() => capture("organize")}><i><Plus size={17} /></i><span><b>New capture</b><small>Let AI organize anything</small></span><ArrowRight size={15} /></button>
          <button onClick={() => capture("note")}><i className="violet"><BookOpenText size={17} /></i><span><b>New permanent note</b><small>Save reference information</small></span><ArrowRight size={15} /></button>
          <button onClick={() => navigate("today")}><i className="blue"><TimerReset size={17} /></i><span><b>Open Smart Focus</b><small>See the clearest next move</small></span><ArrowRight size={15} /></button>
          <button onClick={() => navigate("ask")}><i className="gold"><Sparkles size={17} /></i><span><b>Ask Superbrain</b><small>Reason across your workspace</small></span><ArrowRight size={15} /></button>
        </div>
        <div className="command-jump">
          <span>JUMP TO</span>
          <button onClick={() => navigate("inbox")}><Inbox size={15} /> Inbox</button>
          <button onClick={() => navigate("notes")}><BookOpenText size={15} /> Notes</button>
          <button onClick={() => navigate("threads")}><Layers3 size={15} /> Threads</button>
          <button onClick={() => navigate("ask")}><MessageCircleQuestion size={15} /> Ask</button>
        </div>
      </div> : <div className="command-results">
        <div className="command-result-head"><span>RESULTS</span><small>{matchingItems.length + matchingThreads.length} found</small></div>
        {matchingItems.map((item) => {
          const Icon = item.type === "note" ? BookOpenText : item.type === "event" ? CalendarDays : item.type === "expense" ? FileText : CheckCircle2;
          return <button key={item.id} onClick={() => { onClose(); onOpenItem(item); }}>
            <i className={item.type}><Icon size={16} /></i>
            <span><b>{item.title}</b><small>{item.type === "note" ? "Note" : item.dueLabel || item.type}{item.threadName ? ` · ${item.threadName}` : ""}</small></span>
            {item.pinned && <Pin className="command-pin" size={13} />}
            <ArrowRight size={15} />
          </button>;
        })}
        {matchingThreads.map((thread) => <button key={thread.id} onClick={() => { onClose(); onOpenThread(thread); }}>
          <i className="thread"><Layers3 size={16} /></i>
          <span><b>{thread.name}</b><small>Life Thread · {thread.nextStep}</small></span>
          <ArrowRight size={15} />
        </button>)}
        {!matchingItems.length && !matchingThreads.length && <div className="command-empty"><Search size={22} /><b>No result for “{query.trim()}”</b><p>Try a title, person, thread, amount, or a phrase from a note.</p></div>}
      </div>}
      <div className="command-foot"><span><Command size={11} /> K to open</span><span>Esc to close</span><span>Your private workspace only</span></div>
    </div>
  </div>;
}

type FocusSessionProps = {
  item: LifeItem;
  onClose: () => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
};

export function FocusSession({ item, onClose, onComplete, onSnooze }: FocusSessionProps) {
  const sessionSeconds = 25 * 60;
  const [seconds, setSeconds] = useState(sessionSeconds);
  const [deadline, setDeadline] = useState<number | null>(null);
  const running = deadline !== null;
  const dialogRef = useOverlayDialog<HTMLElement>(onClose);
  useEffect(() => {
    if (deadline === null) return;
    const syncClock = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) setDeadline(null);
    };
    const timer = window.setInterval(syncClock, 250);
    const syncVisibleClock = () => { if (!document.hidden) syncClock(); };
    window.addEventListener("focus", syncClock);
    document.addEventListener("visibilitychange", syncVisibleClock);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncClock);
      document.removeEventListener("visibilitychange", syncVisibleClock);
    };
  }, [deadline]);
  const toggleTimer = () => {
    if (deadline !== null) {
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      setDeadline(null);
      return;
    }
    const duration = seconds <= 0 ? sessionSeconds : seconds;
    setSeconds(duration);
    setDeadline(Date.now() + duration * 1000);
  };
  const resetTimer = () => {
    setDeadline(null);
    setSeconds(sessionSeconds);
  };
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  const progress = Math.min(1, Math.max(0, 1 - seconds / sessionSeconds));

  return <div className="modal-scrim focus-scrim">
    <section ref={dialogRef} className="focus-session" role="dialog" aria-modal="true" aria-labelledby="focus-title">
      <div className="sheet-grabber" aria-hidden="true" />
      <header><span><TimerReset size={18} /> SMART FOCUS</span><button onClick={onClose} aria-label="Close focus session"><X size={19} /></button></header>
      <div className="focus-session-copy">
        <span className="focus-type">{item.pinned && <Pin size={12} />} {item.type} · {item.priority} priority</span>
        <h2 id="focus-title">{item.title}</h2>
        <p>{item.summary}</p>
        <div className="focus-context"><span><Clock3 size={14} /> {item.dueLabel || "No deadline"}</span>{item.threadName && <span><Layers3 size={14} /> {item.threadName}</span>}</div>
      </div>
      <div className="focus-clock" style={{ "--focus-progress": `${progress * 360}deg` } as React.CSSProperties}>
        <div><strong>{minutes}:{remainingSeconds}</strong><small>{seconds === 0 ? "FOCUS COMPLETE" : running ? "STAY WITH THIS" : "25-MINUTE SESSION"}</small></div>
      </div>
      <div className="focus-controls">
        <button className="focus-secondary" onClick={resetTimer}><RotateCcw size={17} /> Reset</button>
        <button className="focus-primary" onClick={toggleTimer}>{running ? <Pause size={20} /> : <Play size={20} />}{running ? "Pause" : seconds === 0 ? "Restart focus" : seconds < sessionSeconds ? "Resume" : "Start focus"}</button>
        <button className="focus-secondary" onClick={() => { onSnooze(item.id); onClose(); }}><Clock3 size={17} /> Later</button>
      </div>
      <button className="focus-complete" onClick={() => { onComplete(item.id); onClose(); }}><Check size={17} /> Mark complete</button>
    </section>
  </div>;
}

type NoteToActionModalProps = {
  note: LifeItem;
  onClose: () => void;
  onCreate: (item: LifeItem) => Promise<void> | void;
};

export function NoteToActionModal({ note, onClose, onCreate }: NoteToActionModalProps) {
  const [type, setType] = useState<Exclude<ItemType, "note">>("task");
  const [title, setTitle] = useState(note.title);
  const [summary, setSummary] = useState(note.summary);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [addToToday, setAddToToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const dialogRef = useOverlayDialog<HTMLElement>(onClose, { disabled: saving });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(makeActionFromNote(note, { type, title, summary, dueDate, priority, addToToday }));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-scrim">
    <section ref={dialogRef} className="small-modal note-action-modal" role="dialog" aria-modal="true" aria-labelledby="note-action-title">
      <div className="sheet-grabber" aria-hidden="true" />
      <div className="modal-head"><div><span><ListTodo size={18} /></span><div><h2 id="note-action-title">Turn note into action</h2><p>The new item keeps a backlink to “{note.title}”.</p></div></div><button className="modal-close" onClick={onClose} disabled={saving} aria-label="Close note to action"><X size={18} /></button></div>
      <form onSubmit={submit}>
        <div className="small-modal-body">
          <div className="action-type-picker" role="group" aria-label="Action type">
            {(["task", "event", "expense"] as const).map((value) => <button type="button" key={value} className={type === value ? "active" : ""} onClick={() => setType(value)}>{value === "task" ? <CheckCircle2 size={15} /> : value === "event" ? <CalendarDays size={15} /> : <FileText size={15} />}{value}</button>)}
          </div>
          <label>Action title<input data-autofocus value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>Useful context<textarea value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
          <div className="field-row"><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>
          <label className="today-toggle"><input type="checkbox" checked={addToToday} onChange={(event) => setAddToToday(event.target.checked)} /><span><b>Add to Today</b><small>Put this into the current Focus shortlist.</small></span></label>
        </div>
        <div className="capture-footer"><p><BookOpenText size={13} /> Source note stays unchanged</p><div><button type="button" className="button button-ghost" onClick={onClose} disabled={saving}>Cancel</button><button className="button" disabled={!title.trim() || saving}>{saving ? "Saving…" : "Create linked action"} <ArrowRight size={15} /></button></div></div>
      </form>
    </section>
  </div>;
}
