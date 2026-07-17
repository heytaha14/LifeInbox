export type ItemType = "task" | "event" | "expense" | "note";
export type Priority = "high" | "medium" | "low";
export type ItemStatus = "inbox" | "today" | "done" | "snoozed";

export type LifeItem = {
  id: string;
  type: ItemType;
  title: string;
  summary: string;
  /** Full durable note body. Tasks may leave this unset. */
  content?: string;
  dueLabel?: string;
  dueDate?: string;
  time?: string;
  amount?: string;
  location?: string;
  people?: string[];
  priority: Priority;
  confidence: number;
  threadId?: string;
  threadName?: string;
  status: ItemStatus;
  source: "text" | "image" | "pdf" | "voice";
  createdAt: string;
  /** User-selected items are promoted in Focus without changing their status. */
  pinned?: boolean;
  /** Backlink created when a durable note becomes an actionable item. */
  linkedFromId?: string;
  linkedFromTitle?: string;
  /** Exact time when a snoozed action should return to the open inbox. */
  snoozedUntil?: string;
  missingFields?: string[];
  sourceExcerpt?: string;
};

export type LifeThread = {
  id: string;
  name: string;
  eyebrow: string;
  color: string;
  itemIds: string[];
  nextStep: string;
  dateRange: string;
};

export function makeDraft(input: string, source: LifeItem["source"]): LifeItem {
  const text = input.trim() || (source === "voice" ? "Call the dentist tomorrow at 10am" : "Untitled capture");
  const lower = text.toLowerCase();
  const isExpense = /₹|rs\.?|paid|receipt|split|amount/.test(lower);
  const isEvent = /flight|meeting|appointment|event|at \d/.test(lower);
  const statedAmount = text.match(/(?:₹|rs\.?\s*)([\d,.]+)/i);
  return {
    id: `li-${Date.now()}`,
    type: isExpense ? "expense" : isEvent ? "event" : "task",
    title: text.length > 62 ? `${text.slice(0, 59)}...` : text.replace(/[.!]$/, ""),
    summary: "LifeInbox extracted this action from your capture. Review the details before saving.",
    dueLabel: /tomorrow/.test(lower) ? "Tomorrow" : /today/.test(lower) ? "Today" : "No date",
    amount: statedAmount ? `₹${statedAmount[1]}` : undefined,
    priority: /urgent|today|asap/.test(lower) ? "high" : "medium",
    confidence: text.length < 12 ? 42 : 62,
    status: "inbox",
    source,
    createdAt: new Date().toISOString(),
    missingFields: ["AI verification", ...(isExpense && !statedAmount ? ["amount"] : [])],
    sourceExcerpt: text,
  };
}

export function makeDrafts(input: string, source: LifeItem["source"]): LifeItem[] {
  const normalized = input.trim();
  const lineItems = normalized
    .split(/\r?\n+/)
    .map((part) => part.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((part) => part.length > 3);
  const sentenceItems = normalized
    .split(/(?:[.;]\s+|\s+(?:and then|then|also)\s+|,\s+(?:and\s+)?(?=(?:call|pay|send|book|renew|buy|email|message|submit|schedule|cancel|review|confirm|register|order|return|collect|upload|download)\b))/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 6);
  const parts = lineItems.length > 1 ? lineItems : sentenceItems.length > 1 ? sentenceItems : [normalized];

  return parts.slice(0, 8).map((part, index) => {
    const draft = makeDraft(part, source);
    return { ...draft, id: `${draft.id}-${index + 1}`, sourceExcerpt: part };
  });
}

export function makeNoteDraft(input: string, source: LifeItem["source"]): LifeItem {
  const content = input.trim() || (source === "voice" ? "Recorded voice note" : "Untitled note");
  const firstLine = content.split(/\r?\n/).find((line) => line.trim())?.trim() || "Untitled note";
  const title = firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine.replace(/[.!]$/, "");
  return {
    id: `li-${Date.now()}`,
    type: "note",
    title,
    summary: content.length > 220 ? `${content.slice(0, 217)}...` : content,
    content,
    priority: "low",
    confidence: source === "text" ? 100 : 62,
    status: "inbox",
    source,
    createdAt: new Date().toISOString(),
    missingFields: source === "text" ? [] : ["AI verification"],
    sourceExcerpt: content.slice(0, 600),
  };
}

export type NoteActionInput = {
  type: Exclude<ItemType, "note">;
  title: string;
  summary?: string;
  dueDate?: string;
  priority: Priority;
  addToToday?: boolean;
};

export function makeActionFromNote(note: LifeItem, input: NoteActionInput): LifeItem {
  const title = input.title.trim() || note.title;
  const summary = input.summary?.trim() || `Created from the note “${note.title}”.`;
  return {
    id: `li-${Date.now()}`,
    type: input.type,
    title,
    summary,
    dueDate: input.dueDate || undefined,
    dueLabel: input.dueDate || "No date",
    priority: input.priority,
    confidence: 100,
    threadId: note.threadId,
    threadName: note.threadName,
    status: input.addToToday ? "today" : "inbox",
    source: "text",
    createdAt: new Date().toISOString(),
    linkedFromId: note.id,
    linkedFromTitle: note.title,
    sourceExcerpt: (note.content || note.summary).slice(0, 600),
  };
}

const priorityWeight: Record<Priority, number> = { high: 30, medium: 20, low: 10 };

export function sortForFocus(items: readonly LifeItem[]): LifeItem[] {
  const today = new Date().toLocaleDateString("en-CA");
  return items
    .filter((item) => item.type !== "note" && item.status !== "done" && item.status !== "snoozed")
    .map((item, index) => ({
      item,
      index,
      score:
        (item.pinned ? 100 : 0) +
        (item.status === "today" ? 45 : 0) +
        priorityWeight[item.priority] +
        (item.dueDate === today ? 35 : item.dueDate && item.dueDate < today ? 50 : 0),
    }))
    .sort((a, b) =>
      b.score - a.score ||
      String(a.item.dueDate || "9999-12-31").localeCompare(String(b.item.dueDate || "9999-12-31")) ||
      a.index - b.index
    )
    .map(({ item }) => item);
}
