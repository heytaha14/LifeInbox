import { jsPDF } from "jspdf";

import type { LifeItem } from "./lifeinbox";

type Rgb = readonly [number, number, number];

export type LifeInboxPdfOptions = {
  /** Displayed on the cover. Omit it for a neutral personal export. */
  ownerName?: string;
  /** Defaults to `LifeInbox - Personal clarity report`. */
  title?: string;
  /** Defaults to a short explanation of the report. */
  subtitle?: string;
  /** Used for date and number formatting. */
  locale?: string;
  /** Makes exports deterministic in tests and previews. */
  generatedAt?: Date;
  /** Defaults to a dated, filesystem-safe PDF filename. */
  fileName?: string;
};

const PAGE = {
  margin: 17,
  top: 25,
  bottom: 20,
} as const;

const COLORS = {
  paper: [250, 251, 253] as Rgb,
  white: [255, 255, 255] as Rgb,
  ink: [18, 23, 32] as Rgb,
  secondary: [100, 111, 128] as Rgb,
  line: [225, 229, 236] as Rgb,
  surface: [244, 246, 249] as Rgb,
  lime: [120, 233, 87] as Rgb,
  limeSoft: [234, 252, 228] as Rgb,
} as const;

const TYPE_STYLE: Record<LifeItem["type"], { label: string; color: Rgb; soft: Rgb }> = {
  task: { label: "TASK", color: COLORS.ink, soft: COLORS.limeSoft },
  event: { label: "EVENT", color: COLORS.ink, soft: COLORS.limeSoft },
  expense: { label: "EXPENSE", color: COLORS.ink, soft: COLORS.limeSoft },
  note: { label: "NOTE", color: COLORS.ink, soft: COLORS.limeSoft },
};

const PRIORITY_ORDER: Record<LifeItem["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function setFill(doc: jsPDF, color: Rgb) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setStroke(doc: jsPDF, color: Rgb) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function setText(doc: jsPDF, color: Rgb) {
  doc.setTextColor(color[0], color[1], color[2]);
}

/**
 * jsPDF's bundled Helvetica font is WinAnsi-based. Normalizing text prevents
 * missing-glyph squares while keeping common punctuation and currency readable.
 */
function pdfSafeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00e2\u201a\u00b9/g, "INR ")
    .replace(/\u20b9/g, "INR ")
    .replace(/\u20ac/g, "EUR ")
    .replace(/\u00a3/g, "GBP ")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u00a0/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function splitLines(doc: jsPDF, value: unknown, width: number): string[] {
  const text = pdfSafeText(value);
  if (!text) return [];
  return doc.splitTextToSize(text, width) as string[];
}

function clipLines(lines: string[], limit: number): string[] {
  if (lines.length <= limit) return lines;
  const clipped = lines.slice(0, limit);
  clipped[limit - 1] = `${clipped[limit - 1].replace(/[. ]+$/, "")}...`;
  return clipped;
}

function statusLabel(status: LifeItem["status"]): string {
  if (status === "done") return "Completed";
  if (status === "today") return "Today";
  if (status === "snoozed") return "Snoozed";
  return "Inbox";
}

function formatGeneratedDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function defaultFileName(date: Date): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `lifeinbox-export-${isoDate}.pdf`;
}

function safeFileName(value: string): string {
  const normalized = value
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 100);
  return `${normalized || "lifeinbox-export"}.pdf`;
}

function sortItems(items: LifeItem[]): LifeItem[] {
  return [...items].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    const priorityDifference = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDifference !== 0) return priorityDifference;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function groupItems(items: LifeItem[]): Array<{ name: string; items: LifeItem[] }> {
  const groups = new Map<string, LifeItem[]>();
  for (const item of items) {
    const groupName = item.threadName?.trim() || "Unsorted items";
    groups.set(groupName, [...(groups.get(groupName) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === "Unsorted items") return 1;
      if (b === "Unsorted items") return -1;
      return a.localeCompare(b);
    })
    .map(([name, grouped]) => ({ name, items: sortItems(grouped) }));
}

function drawBrandMark(doc: jsPDF, x: number, y: number, size: number) {
  setFill(doc, COLORS.ink);
  doc.roundedRect(x, y, size, size, size * 0.3, size * 0.3, "F");
  setFill(doc, COLORS.lime);
  doc.circle(x + size * 0.73, y + size * 0.27, size * 0.12, "F");
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 1.55);
  doc.text("L", x + size * 0.28, y + size * 0.74);
}

function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  accent: Rgb,
) {
  setFill(doc, COLORS.white);
  setStroke(doc, COLORS.line);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, 27, 4, 4, "FD");
  setFill(doc, accent);
  doc.roundedRect(x + 5, y + 5, 3, 17, 1.5, 1.5, "F");
  setText(doc, COLORS.secondary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(label.toUpperCase(), x + 13, y + 9.5);
  setText(doc, COLORS.ink);
  doc.setFontSize(18);
  doc.text(value, x + 13, y + 20.5);
}

function drawCover(doc: jsPDF, items: LifeItem[], options: Required<Pick<LifeInboxPdfOptions, "title" | "subtitle" | "locale" | "generatedAt">> & Pick<LifeInboxPdfOptions, "ownerName">) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  setFill(doc, COLORS.paper);
  doc.rect(0, 0, width, height, "F");

  setFill(doc, COLORS.limeSoft);
  doc.circle(width + 5, 5, 44, "F");
  setFill(doc, COLORS.surface);
  doc.circle(width - 14, 24, 18, "F");
  setFill(doc, COLORS.surface);
  doc.circle(-5, height - 18, 30, "F");

  drawBrandMark(doc, PAGE.margin, 19, 13);
  setText(doc, COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LifeInbox", PAGE.margin + 18, 27);

  setText(doc, COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(formatGeneratedDate(options.generatedAt, options.locale), width - PAGE.margin, 27, { align: "right" });

  const greeting = options.ownerName?.trim() ? `${pdfSafeText(options.ownerName)}'s personal report` : "Your personal clarity report";
  setText(doc, COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(greeting.toUpperCase(), PAGE.margin, 69);

  setText(doc, COLORS.ink);
  doc.setFontSize(31);
  const titleLines = clipLines(splitLines(doc, options.title, width - PAGE.margin * 2), 3);
  doc.text(titleLines, PAGE.margin, 85, { lineHeightFactor: 1.05 });

  const titleBottom = 85 + Math.max(titleLines.length, 1) * 11;
  setText(doc, COLORS.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const subtitleLines = clipLines(splitLines(doc, options.subtitle, width - PAGE.margin * 2 - 25), 3);
  doc.text(subtitleLines, PAGE.margin, titleBottom + 6, { lineHeightFactor: 1.35 });

  const total = items.length;
  const open = items.filter((item) => item.status !== "done").length;
  const completed = items.filter((item) => item.status === "done").length;
  const averageConfidence = total
    ? Math.round(items.reduce((sum, item) => sum + Math.max(0, Math.min(100, item.confidence || 0)), 0) / total)
    : 0;
  const cardGap = 6;
  const cardWidth = (width - PAGE.margin * 2 - cardGap) / 2;
  const metricsY = Math.max(151, titleBottom + 33);
  drawMetricCard(doc, PAGE.margin, metricsY, cardWidth, "Approved items", String(total), COLORS.lime);
  drawMetricCard(doc, PAGE.margin + cardWidth + cardGap, metricsY, cardWidth, "Open items", String(open), COLORS.lime);
  drawMetricCard(doc, PAGE.margin, metricsY + 33, cardWidth, "Completed", String(completed), COLORS.lime);
  drawMetricCard(doc, PAGE.margin + cardWidth + cardGap, metricsY + 33, cardWidth, "AI confidence", `${averageConfidence}%`, COLORS.lime);

  const highPriority = items.filter((item) => item.priority === "high" && item.status !== "done").length;
  const threads = new Set(items.map((item) => item.threadName?.trim()).filter(Boolean)).size;
  const snapshotY = metricsY + 79;
  setFill(doc, COLORS.ink);
  doc.roundedRect(PAGE.margin, snapshotY, width - PAGE.margin * 2, 35, 5, 5, "F");
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FOCUS SNAPSHOT", PAGE.margin + 7, snapshotY + 10);
  doc.setFontSize(13);
  doc.text(`${highPriority} high-priority open`, PAGE.margin + 7, snapshotY + 23);
  setText(doc, [194, 201, 211]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${threads} organized ${threads === 1 ? "thread" : "threads"}`, width - PAGE.margin - 7, snapshotY + 23, { align: "right" });

  setText(doc, COLORS.secondary);
  doc.setFontSize(7.5);
  doc.text("Private by design  |  Created from your approved LifeInbox items", width / 2, height - 14, { align: "center" });
}

class ContentLayout {
  private y = PAGE.top;
  private readonly width: number;
  private readonly height: number;
  private readonly doc: jsPDF;
  private readonly generatedLabel: string;

  constructor(doc: jsPDF, generatedLabel: string) {
    this.doc = doc;
    this.generatedLabel = generatedLabel;
    this.width = doc.internal.pageSize.getWidth();
    this.height = doc.internal.pageSize.getHeight();
  }

  addPage(context?: string) {
    this.doc.addPage();
    setFill(this.doc, COLORS.white);
    this.doc.rect(0, 0, this.width, this.height, "F");
    drawBrandMark(this.doc, PAGE.margin, 11, 8);
    setText(this.doc, COLORS.ink);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.5);
    this.doc.text("LifeInbox", PAGE.margin + 12, 16.4);
    setText(this.doc, COLORS.secondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7.5);
    this.doc.text(context ? pdfSafeText(context) : this.generatedLabel, this.width - PAGE.margin, 16.4, { align: "right" });
    setStroke(this.doc, COLORS.line);
    this.doc.setLineWidth(0.25);
    this.doc.line(PAGE.margin, 20.5, this.width - PAGE.margin, 20.5);
    this.y = PAGE.top;
  }

  private maxY() {
    return this.height - PAGE.bottom;
  }

  private available() {
    return this.maxY() - this.y;
  }

  ensureSpace(height: number, context?: string) {
    if (this.available() < height) this.addPage(context);
  }

  drawReportIntro(items: LifeItem[]) {
    this.ensureSpace(30);
    setText(this.doc, COLORS.ink);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(20);
    this.doc.text("Everything, in its place.", PAGE.margin, this.y + 8);
    setText(this.doc, COLORS.secondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    const intro = items.length
      ? `${items.length} approved ${items.length === 1 ? "item" : "items"}, grouped into clear life threads.`
      : "Your export is ready for the first item you approve.";
    this.doc.text(intro, PAGE.margin, this.y + 17);
    this.y += 28;
  }

  drawEmptyState() {
    this.ensureSpace(55);
    setFill(this.doc, COLORS.surface);
    this.doc.roundedRect(PAGE.margin, this.y, this.width - PAGE.margin * 2, 49, 6, 6, "F");
    setFill(this.doc, COLORS.limeSoft);
    this.doc.circle(PAGE.margin + 14, this.y + 15, 6, "F");
    setText(this.doc, COLORS.ink);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.text("+", PAGE.margin + 14, this.y + 16.5, { align: "center" });
    setText(this.doc, COLORS.ink);
    this.doc.setFontSize(12);
    this.doc.text("A calm, empty inbox", PAGE.margin + 25, this.y + 14);
    setText(this.doc, COLORS.secondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.text("Drop in a thought, image, document, or voice note. LifeInbox will organize the next export for you.", PAGE.margin + 25, this.y + 24, {
      maxWidth: this.width - PAGE.margin * 2 - 34,
    });
    this.y += 55;
  }

  drawGroupHeader(name: string, count: number) {
    // Reserve enough room for the heading and the start of its first item so a
    // thread label is never orphaned at the bottom of a page.
    this.ensureSpace(61, name);
    if (this.y > PAGE.top + 2) this.y += 3;
    setFill(this.doc, COLORS.surface);
    this.doc.roundedRect(PAGE.margin, this.y, this.width - PAGE.margin * 2, 13, 3.5, 3.5, "F");
    setText(this.doc, COLORS.ink);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.text(pdfSafeText(name), PAGE.margin + 5, this.y + 8.2);
    setText(this.doc, COLORS.secondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.text(`${count} ${count === 1 ? "item" : "items"}`, this.width - PAGE.margin - 5, this.y + 8.2, { align: "right" });
    this.y += 18;
  }

  drawItem(item: LifeItem, groupName: string) {
    const contentWidth = this.width - PAGE.margin * 2;
    const innerWidth = contentWidth - 12;
    const titleLines = clipLines(splitLines(this.doc, item.title || "Untitled capture", innerWidth - 30), 4);
    const printableBody = item.type === "note" ? item.content || item.summary : item.summary;
    const summaryLines = splitLines(this.doc, printableBody || "No summary was saved for this item.", innerWidth);
    const metadata = [
      statusLabel(item.status),
      `${item.priority[0].toUpperCase()}${item.priority.slice(1)} priority`,
      item.dueLabel?.trim() ? `Due ${pdfSafeText(item.dueLabel)}` : undefined,
      item.amount?.trim() ? pdfSafeText(item.amount) : undefined,
      item.location?.trim() ? pdfSafeText(item.location) : undefined,
      `${Math.round(Math.max(0, Math.min(100, item.confidence || 0)))}% confidence`,
    ].filter((value): value is string => Boolean(value));
    const metadataLines = clipLines(splitLines(this.doc, metadata.join("  |  "), innerWidth), 3);

    let remainingSummary = summaryLines.length ? summaryLines : ["No summary was saved for this item."];
    let firstChunk = true;

    while (remainingSummary.length) {
      const titleHeight = titleLines.length * 5.1;
      const fixedHeight = 8 + 5 + titleHeight + 4 + 6;
      const finalMetadataHeight = metadataLines.length * 4.1 + 4;
      const fullCardHeight = fixedHeight + remainingSummary.length * 4.2 + finalMetadataHeight;
      const freshPageCapacity = this.maxY() - PAGE.top;
      let take: number;

      if (fullCardHeight <= freshPageCapacity) {
        // If the whole card can fit on one page, move it intact rather than
        // creating an unnecessary continuation for a few lines.
        this.ensureSpace(fullCardHeight, groupName);
        take = remainingSummary.length;
      } else {
        const minimumChunkHeight = fixedHeight + 4.2 + 3;
        this.ensureSpace(minimumChunkHeight, groupName);
        const availableBodyHeight = Math.max(4.2, this.available() - fixedHeight - 3);
        const maxChunkLines = Math.max(1, Math.floor(availableBodyHeight / 4.2));
        // Leave at least one line for the final chunk, which also carries the
        // metadata footer. Metadata is capped above so that chunk always fits.
        take = Math.max(1, Math.min(remainingSummary.length - 1, maxChunkLines));
      }

      const chunkLines = remainingSummary.slice(0, take);
      const isFinalChunk = take === remainingSummary.length;
      const cardHeight = fixedHeight + chunkLines.length * 4.2 + (isFinalChunk ? finalMetadataHeight : 3);
      const top = this.y;

      setFill(this.doc, COLORS.paper);
      setStroke(this.doc, COLORS.line);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(PAGE.margin, top, contentWidth, cardHeight, 4, 4, "FD");
      const style = TYPE_STYLE[item.type];
      setFill(this.doc, style.color);
      this.doc.roundedRect(PAGE.margin, top + 4, 2.5, cardHeight - 8, 1.2, 1.2, "F");

      setFill(this.doc, style.soft);
      this.doc.roundedRect(PAGE.margin + 6, top + 5, 20, 6.5, 3, 3, "F");
      setText(this.doc, style.color);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(6.5);
      this.doc.text(firstChunk ? style.label : "CONTINUED", PAGE.margin + 16, top + 9.3, { align: "center" });

      setText(this.doc, COLORS.secondary);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(6.8);
      this.doc.text(pdfSafeText(item.source).toUpperCase(), this.width - PAGE.margin - 6, top + 9.3, { align: "right" });

      setText(this.doc, COLORS.ink);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(11.5);
      const titleY = top + 17;
      this.doc.text(titleLines, PAGE.margin + 6, titleY, { lineHeightFactor: 1.15 });

      const summaryY = titleY + titleHeight + 1;
      setText(this.doc, COLORS.secondary);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8.6);
      this.doc.text(chunkLines, PAGE.margin + 6, summaryY, { lineHeightFactor: 1.3 });

      if (isFinalChunk) {
        const metadataY = summaryY + chunkLines.length * 4.2 + 3;
        setText(this.doc, COLORS.ink);
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(7.2);
        this.doc.text(metadataLines, PAGE.margin + 6, metadataY, { lineHeightFactor: 1.25 });
      }

      this.y += cardHeight + 5;
      remainingSummary = remainingSummary.slice(take);
      firstChunk = false;
      if (remainingSummary.length) this.addPage(groupName);
    }
  }
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setText(doc, page === 1 ? COLORS.secondary : [145, 153, 165]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${page} / ${pageCount}`, width - PAGE.margin, height - 9, { align: "right" });
  }
}

/** Builds a polished PDF without downloading it, useful for previews and tests. */
export function createLifeInboxPdf(items: readonly LifeItem[], options: LifeInboxPdfOptions = {}): jsPDF {
  const generatedAt = options.generatedAt ?? new Date();
  const locale = options.locale ?? "en-IN";
  const title = options.title ?? "LifeInbox - Personal clarity report";
  const subtitle = options.subtitle ?? "A calm, structured view of the tasks, plans, expenses, events, and notes that matter next.";
  const safeItems = items.filter((item): item is LifeItem => Boolean(item && item.id));
  const generatedLabel = `Generated ${formatGeneratedDate(generatedAt, locale)}`;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });

  doc.setProperties({
    title: pdfSafeText(title),
    subject: "A private export of approved LifeInbox items",
    author: "LifeInbox",
    creator: "LifeInbox",
    keywords: "LifeInbox, personal assistant, tasks, life admin",
  });

  drawCover(doc, safeItems, { title, subtitle, locale, generatedAt, ownerName: options.ownerName });

  const layout = new ContentLayout(doc, generatedLabel);
  layout.addPage();
  layout.drawReportIntro(safeItems);

  if (!safeItems.length) {
    layout.drawEmptyState();
  } else {
    for (const group of groupItems(safeItems)) {
      layout.drawGroupHeader(group.name, group.items.length);
      for (const item of group.items) layout.drawItem(item, group.name);
    }
  }

  addPageNumbers(doc);
  return doc;
}

/** Creates and immediately downloads a dated PDF in the browser. */
export function exportLifeInboxPdf(items: readonly LifeItem[], options: LifeInboxPdfOptions = {}): jsPDF {
  const doc = createLifeInboxPdf(items, options);
  const generatedAt = options.generatedAt ?? new Date();
  doc.save(safeFileName(options.fileName ?? defaultFileName(generatedAt)));
  return doc;
}

/** Creates a Blob for an object-URL preview, share sheet, or upload flow. */
export function createLifeInboxPdfBlob(items: readonly LifeItem[], options: LifeInboxPdfOptions = {}): Blob {
  return createLifeInboxPdf(items, options).output("blob");
}
