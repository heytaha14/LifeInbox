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
  assert.match(client, /content: item\.content/);
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
  assert.match(serviceWorker, /lifeinbox-shell-v7/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(client, /beforeinstallprompt/);
  assert.match(client, /controllerchange/);
  await access(new URL("../public/icons/icon-192.png", import.meta.url));
  await access(new URL("../public/icons/icon-512.png", import.meta.url));
  await access(new URL("../public/icons/apple-touch-icon.png", import.meta.url));
});
