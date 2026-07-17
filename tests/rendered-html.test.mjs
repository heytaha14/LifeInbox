import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished LifeInbox product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>LifeInbox - Drop it in\. Know what matters next\.<\/title>/i);
  assert.match(html, /LifeInbox/);
  assert.match(html, /Opening your LifeInbox|Drop it in/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  const appSource = await readFile(new URL("../app/lifeinbox-app.tsx", import.meta.url), "utf8");
  assert.match(appSource, /Start capturing free/);
  assert.match(appSource, /Private by design/);
});

test("keeps Appwrite and secrets behind explicit boundaries", async () => {
  const [client, setup, orchestrator, ops, layout] = await Promise.all([
    readFile(new URL("../lib/appwrite.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/setup-appwrite.mjs", import.meta.url), "utf8"),
    readFile(new URL("../functions/ai-orchestrator/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/ops/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(client, /NEXT_PUBLIC_APPWRITE_PROJECT_ID/);
  assert.match(client, /https:\/\/fra\.cloud\.appwrite\.io\/v1/);
  assert.match(client, /6a572c3f0008220bd0cf/);
  assert.match(client, /NEXT_PUBLIC_APPWRITE_AI_FUNCTION_ID \|\| "ai-orchestrator"/);
  assert.doesNotMatch(client, /OPENAI_API_KEY|APPWRITE_API_KEY/);
  assert.match(setup, /APPWRITE_API_KEY/);
  assert.match(orchestrator, /x-appwrite-user-id/i);
  assert.match(orchestrator, /x-appwrite-key/i);
  assert.doesNotMatch(orchestrator, /process\.env\.APPWRITE_API_KEY/);
  assert.doesNotMatch(ops, /process\.env\.APPWRITE_API_KEY/);
  assert.match(ops, /trigger === "schedule"/);
  assert.match(orchestrator, /json_schema/);
  assert.match(layout, /\/og\.png/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("appwrite.config.json", root));
});

test("keeps real workspaces free of demo state and persists production flows", async () => {
  const [app, client, orchestrator] = await Promise.all([
    readFile(new URL("../app/lifeinbox-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/appwrite.ts", import.meta.url), "utf8"),
    readFile(new URL("../functions/ai-orchestrator/src/main.js", import.meta.url), "utf8"),
  ]);
  assert.match(app, /useState<LifeItem\[]>\(\[\]\)/);
  assert.match(app, /setItems\(seedItems\); setCustomThreads\(seedThreads\)/);
  assert.doesNotMatch(app, /items\.length \+ 13/);
  assert.match(app, /deleteLifeThread/);
  assert.match(app, /status: "completed"/);
  assert.match(client, /LifeItemUpdate/);
  assert.match(client, /id: document\.\$id/);
  assert.match(client, /responseStatusCode >= 400/);
  assert.match(orchestrator, /gpt-5\.6-terra/);
  assert.match(orchestrator, /reasoning: \{ effort: "high" \}/);
  assert.match(orchestrator, /lifeinbox_superbrain/);
  assert.match(orchestrator, /nextActions/);
  assert.match(orchestrator, /parseModelJson/);
  assert.match(orchestrator, /MAX_EXTRACTED_ITEMS = 20/);
  assert.match(orchestrator, /required: \["items"\]/);
  assert.match(orchestrator, /sourceExcerpt/);
  assert.match(orchestrator, /captureIntent === "note"/);
  assert.match(orchestrator, /Notes are reference knowledge/);
  assert.match(app, /onReview: \(drafts: LifeItem\[\]/);
  assert.match(app, /Save as note/);
  assert.match(app, /function NotesView/);
  assert.match(client, /META_PREFIX = "__li_meta_v1__:"/);
  assert.match(client, /packPeople\(item\.people, metaFromItem\(item\)\)/);
  assert.match(client, /decoded\.meta\.c/);
  assert.match(client, /decoded\.meta\.p/);
  assert.match(client, /decoded\.meta\.z/);
  assert.match(orchestrator, /hydrateStoredAction/);
  const strictSchemas = orchestrator.slice(orchestrator.indexOf("const atomicItemSchema"), orchestrator.indexOf("function json"));
  assert.doesNotMatch(strictSchemas, /maxLength|minItems|maxItems|minimum|maximum/);
  assert.match(orchestrator, /cleanLimitedString/);
  assert.match(orchestrator, /\.map\(hydrateStoredAction\)[\s\S]*?\.sort\(\(a, b\) => Number\(Boolean\(b\.pinned\)\)/);
});

test("hardens capture ownership, AI budgets, retention, and optimistic deletion", async () => {
  const [app, orchestrator, ops, envExample, readme, security] = await Promise.all([
    readFile(new URL("../app/lifeinbox-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../functions/ai-orchestrator/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/ops/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/SECURITY.md", import.meta.url), "utf8"),
  ]);

  assert.match(app, /askOrExtract\("extract", \{[\s\S]*?fileId, captureId,/);
  assert.match(orchestrator, /APPWRITE_CAPTURES_COLLECTION_ID/);
  assert.match(orchestrator, /databases\.getDocument\([\s\S]*?documentId: captureId/);
  assert.match(orchestrator, /capture\.userId[\s\S]*?capture\.fileId/);
  assert.match(orchestrator, /storage\.getFile\(\{ bucketId: BUCKET, fileId \}\)/);
  assert.match(orchestrator, /Permission\.read\(Role\.user\(userId\)\)/);

  assert.match(orchestrator, /FREE_DAILY_AI_TOKEN_LIMIT/);
  for (const route of ["extract", "ask", "briefing", "regroup"]) {
    const start = orchestrator.indexOf(`async function ${route}(`);
    const end = orchestrator.indexOf("\nasync function ", start + 1);
    const body = orchestrator.slice(start, end === -1 ? undefined : end);
    assert.ok(start >= 0, `${route} route must exist`);
    assert.match(body, /checkDailyLimits/, `${route} must enforce the shared daily AI budget`);
  }

  assert.match(ops, /async function deleteOwnedFile/);
  assert.match(ops, /Permission\.read\(Role\.user\(String\(userId\)\)\)/);
  assert.ok((ops.match(/deleteOwnedFile\(/g) || []).length >= 3, "owned-file deletion must protect cleanup and account deletion");
  assert.match(ops, /scheduled && !requestedRoute \? "cleanup" : requestedRoute/);

  const deleteStart = app.indexOf("async function deleteItem(");
  const deleteEnd = app.indexOf("\n  async function ", deleteStart + 1);
  const deleteBody = app.slice(deleteStart, deleteEnd);
  assert.match(deleteBody, /setItems\(\(all\) => all\.filter/);
  assert.match(deleteBody, /await deleteLifeItem\(id\)/);
  assert.match(deleteBody, /restored\.splice/);
  assert.match(deleteBody, /item was restored/i);

  assert.match(app, /automatically removed after 30 days/);
  assert.doesNotMatch(app, /retentionDays|setRetentionDays|Delete after processing/i);
  assert.match(envExample, /FREE_DAILY_AI_TOKEN_LIMIT=250000/);
  assert.match(readme, /deployment-wide 30-day retention period/);
  assert.match(security, /rather than presented as a per-user control/);
});

test("ships the focus, command center, note-to-action, and thread cockpit workflow", async () => {
  const [app, powerTools, lifeInbox] = await Promise.all([
    readFile(new URL("../app/lifeinbox-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lifeinbox-power-tools.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/lifeinbox.ts", import.meta.url), "utf8"),
  ]);
  assert.match(app, /<CommandCenter/);
  assert.match(app, /<FocusSession/);
  assert.match(app, /Turn into action/);
  assert.match(app, /Thread cockpit/);
  assert.match(app, /Pinned to Smart Focus/);
  assert.match(powerTools, /Find anything/);
  assert.match(powerTools, /NoteToActionModal/);
  assert.match(powerTools, /25-MINUTE SESSION/);
  assert.match(lifeInbox, /sortForFocus/);
  assert.match(lifeInbox, /linkedFromId/);
});

test("ranks focus safely and creates traceable actions from notes", async () => {
  const { makeActionFromNote, sortForFocus } = await import(new URL("../lib/lifeinbox.ts", import.meta.url));
  const base = {
    summary: "Context",
    priority: "medium",
    confidence: 100,
    source: "text",
    createdAt: "2026-07-16T00:00:00.000Z",
    status: "inbox",
  };
  const items = [
    { ...base, id: "normal", type: "task", title: "Normal task" },
    { ...base, id: "pinned", type: "task", title: "Pinned task", priority: "low", pinned: true },
    { ...base, id: "note", type: "note", title: "Reference note", content: "Useful context" },
    { ...base, id: "done", type: "task", title: "Finished", status: "done" },
    { ...base, id: "later", type: "task", title: "Snoozed", status: "snoozed" },
  ];
  const ranked = sortForFocus(items);
  assert.deepEqual(ranked.map((item) => item.id), ["pinned", "normal"]);

  const note = { ...base, id: "note-1", type: "note", title: "Trip brief", content: "A".repeat(1_000), threadId: "thread-1", threadName: "Japan trip" };
  const action = makeActionFromNote(note, { type: "task", title: "Book the train", priority: "high", addToToday: true });
  assert.equal(action.status, "today");
  assert.equal(action.linkedFromId, "note-1");
  assert.equal(action.linkedFromTitle, "Trip brief");
  assert.equal(action.threadId, "thread-1");
  assert.equal(action.sourceExcerpt.length, 600);
});

test("round-trips Appwrite Free metadata without leaking it into people", async () => {
  const { packPeople, unpackPeople } = await import(new URL("../lib/appwrite.ts", import.meta.url));
  const content = `Reference 🧠 ${"details ".repeat(1_100)}`;
  const encoded = packPeople(["Maya", "Aanya"], {
    c: content,
    p: true,
    f: "note-source",
    t: "Travel reference",
    z: "2026-07-17T09:00:00.000Z",
    m: ["Confirm terminal"],
    e: "book a dentist appointment",
  });
  assert.ok(encoded.every((entry) => Array.from(entry).length <= 256));
  assert.ok(encoded.some((entry) => entry.startsWith("__li_meta_v1__:")));
  const decoded = unpackPeople(encoded);
  assert.deepEqual(decoded.people, ["Maya", "Aanya"]);
  assert.equal(decoded.hasMeta, true);
  assert.equal(decoded.meta.v, 1);
  assert.equal(decoded.meta.c, content);
  assert.equal(decoded.meta.p, true);
  assert.equal(decoded.meta.f, "note-source");
  assert.deepEqual(decoded.meta.m, ["Confirm terminal"]);

  const cleared = unpackPeople(packPeople(["Maya"], {}));
  assert.equal(cleared.hasMeta, true);
  assert.equal(cleared.meta.v, 1);
  assert.equal(cleared.meta.c, undefined);
  assert.equal(cleared.meta.p, undefined);

  const legacy = unpackPeople(["Maya"]);
  assert.equal(legacy.hasMeta, false);
  assert.deepEqual(legacy.meta, {});
});

test("exports a designed PDF instead of raw JSON", async () => {
  const [app, pdfExport, packageJson] = await Promise.all([
    readFile(new URL("../app/lifeinbox-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/pdf-export.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(app, /await import\("@\/lib\/pdf-export"\)/);
  assert.match(app, /Export LifeInbox report/);
  assert.doesNotMatch(app, /lifeinbox-export\.json|application\/json/);
  assert.match(pdfExport, /Personal clarity report/);
  assert.match(pdfExport, /addPageNumbers/);
  assert.match(pdfExport, /groupItems/);
  assert.ok(JSON.parse(packageJson).dependencies.jspdf);
});

test("conservatively separates compound fallback captures", async () => {
  const { makeDrafts, makeNoteDraft } = await import(new URL("../lib/lifeinbox.ts", import.meta.url));
  const drafts = makeDrafts("Renew insurance, call Dr Mehta tomorrow, and pay Aanya ₹1,240", "text");
  assert.equal(drafts.length, 3);
  assert.deepEqual(drafts.map((item) => item.title), ["Renew insurance", "call Dr Mehta tomorrow", "pay Aanya ₹1,240"]);
  assert.equal(drafts[2].amount, "₹1,240");
  assert.ok(drafts.every((item) => item.confidence < 80 && item.missingFields.includes("AI verification")));

  const receipt = makeDrafts("Save this receipt for the project", "text")[0];
  assert.equal(receipt.amount, undefined);

  const note = makeNoteDraft("Venue access\nUse the east entrance after 6 PM.", "text");
  assert.equal(note.type, "note");
  assert.equal(note.content, "Venue access\nUse the east entrance after 6 PM.");
  assert.equal(note.status, "inbox");
  assert.deepEqual(note.missingFields, []);
});

test("generates a real multi-page PDF document", async () => {
  const [{ createLifeInboxPdf }, { seedItems }] = await Promise.all([
    import(new URL("../lib/pdf-export.ts", import.meta.url)),
    import(new URL("../lib/lifeinbox.ts", import.meta.url)),
  ]);
  const items = Array.from({ length: 6 }, (_, index) => seedItems.map((item) => ({ ...item, id: `${item.id}-${index}`, summary: `${item.summary} ${"Verified context. ".repeat(8)}` }))).flat();
  const pdf = createLifeInboxPdf(items, { ownerName: "Test User", generatedAt: new Date("2026-07-15T00:00:00Z") });
  const bytes = pdf.output("arraybuffer");
  assert.ok(bytes.byteLength > 10_000);
  assert.ok(pdf.getNumberOfPages() >= 3);
});

test("ships a complete installable PWA", async () => {
  const [manifest, serviceWorker, layout, client] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/pwa-client.tsx", import.meta.url), "utf8"),
  ]);
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.display, "standalone");
  assert.ok(parsed.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(parsed.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
  assert.match(serviceWorker, /lifeinbox-shell-v10/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /if \(url\.search\)/);
  assert.doesNotMatch(serviceWorker.match(/self\.addEventListener\("install"[\s\S]*?\n\}\);/)?.[0] ?? "", /skipWaiting/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(client, /beforeinstallprompt/);
  assert.match(client, /controllerchange/);
  assert.match(client, /A fresh LifeInbox is ready/);
  assert.match(client, /document\.querySelector\('\[role="dialog"\], \.review-resume-card'\)/);
  await access(new URL("../public/icons/icon-192.png", import.meta.url));
  await access(new URL("../public/icons/icon-512.png", import.meta.url));
  await access(new URL("../public/icons/apple-touch-icon.png", import.meta.url));
});
