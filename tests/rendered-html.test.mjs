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
  assert.match(html, /Your life, finally/);
  assert.match(html, /Start capturing free/);
  assert.match(html, /Private by design/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps Appwrite and secrets behind explicit boundaries", async () => {
  const [client, env, orchestrator, layout] = await Promise.all([
    readFile(new URL("../lib/appwrite.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../functions/ai-orchestrator/src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(client, /NEXT_PUBLIC_APPWRITE_PROJECT_ID/);
  assert.doesNotMatch(client, /OPENAI_API_KEY|APPWRITE_API_KEY/);
  assert.match(env, /^APPWRITE_API_KEY=/m);
  assert.doesNotMatch(env, /NEXT_PUBLIC_(OPENAI|APPWRITE_API_KEY)/);
  assert.match(orchestrator, /x-appwrite-user-id/i);
  assert.match(orchestrator, /json_schema/);
  assert.match(layout, /\/og-bright\.png/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/og-bright.png", import.meta.url));
  await access(new URL("appwrite.json", root));
});
