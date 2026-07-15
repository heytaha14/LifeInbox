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
  assert.match(html, /<title>LifeInbox - Turn life admin into a clear next step<\/title>/i);
  assert.match(html, /LifeInbox/);
  assert.match(html, /Opening your LifeInbox|Your life, finally/);
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
  assert.match(orchestrator, /json_schema/);
  assert.match(layout, /\/og-bright\.png/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/og-bright.png", import.meta.url));
  await access(new URL("appwrite.config.json", root));
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
  assert.match(serviceWorker, /lifeinbox-shell-v4/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(client, /beforeinstallprompt/);
  await access(new URL("../public/icons/icon-192.png", import.meta.url));
  await access(new URL("../public/icons/icon-512.png", import.meta.url));
  await access(new URL("../public/icons/apple-touch-icon.png", import.meta.url));
});
