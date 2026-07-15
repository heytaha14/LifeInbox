export type ItemType = "task" | "event" | "expense" | "note";
export type Priority = "high" | "medium" | "low";
export type ItemStatus = "inbox" | "today" | "done" | "snoozed";

export type LifeItem = {
  id: string;
  type: ItemType;
  title: string;
  summary: string;
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

export const seedItems: LifeItem[] = [
  {
    id: "li-1", type: "task", title: "Renew car insurance", summary: "Policy expires Friday. Compare renewal quote before paying.",
    dueLabel: "Today, 5:00 PM", dueDate: "2026-07-15", time: "17:00", priority: "high", confidence: 96,
    threadId: "home", threadName: "Home & admin", status: "today", source: "pdf", createdAt: "2026-07-15T08:14:00Z",
  },
  {
    id: "li-2", type: "event", title: "Flight to Goa", summary: "IndiGo 6E 2127 from Delhi T1. Web check-in opens tomorrow.",
    dueLabel: "Fri, 7:10 AM", dueDate: "2026-07-17", time: "07:10", location: "Delhi Airport T1", priority: "high", confidence: 93,
    threadId: "goa", threadName: "Goa weekend", status: "inbox", source: "image", createdAt: "2026-07-14T18:40:00Z",
  },
  {
    id: "li-3", type: "expense", title: "Split dinner with Aanya", summary: "Your share from Sunday dinner at Sienna Cafe.",
    amount: "₹1,240", people: ["Aanya"], dueLabel: "This week", priority: "medium", confidence: 87,
    threadId: "money", threadName: "Money to settle", status: "inbox", source: "image", createdAt: "2026-07-14T12:10:00Z",
  },
  {
    id: "li-4", type: "note", title: "Ideas for Mum's birthday", summary: "Book the pottery workshop or plan a quiet lunch at Olive.",
    dueLabel: "Before 24 Jul", dueDate: "2026-07-24", priority: "low", confidence: 78,
    threadId: "family", threadName: "Mum's birthday", status: "inbox", source: "voice", createdAt: "2026-07-13T09:24:00Z",
  },
  {
    id: "li-5", type: "task", title: "Send hotel confirmation to Kabir", summary: "Share the booking PDF and airport pickup details.",
    dueLabel: "Tomorrow", dueDate: "2026-07-16", people: ["Kabir"], priority: "medium", confidence: 91,
    threadId: "goa", threadName: "Goa weekend", status: "today", source: "pdf", createdAt: "2026-07-12T16:05:00Z",
  },
];

export const seedThreads: LifeThread[] = [
  { id: "goa", name: "Goa weekend", eyebrow: "Travel", color: "#ed7c4b", itemIds: ["li-2", "li-5"], nextStep: "Send hotel confirmation", dateRange: "17-20 Jul" },
  { id: "home", name: "Home & admin", eyebrow: "Personal", color: "#71856f", itemIds: ["li-1"], nextStep: "Renew car insurance", dateRange: "Ongoing" },
  { id: "family", name: "Mum's birthday", eyebrow: "Family", color: "#a17fc0", itemIds: ["li-4"], nextStep: "Choose a celebration plan", dateRange: "24 Jul" },
  { id: "money", name: "Money to settle", eyebrow: "Finance", color: "#c1a14d", itemIds: ["li-3"], nextStep: "Pay Aanya ₹1,240", dateRange: "This week" },
];

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
