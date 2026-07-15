import { Client, Databases, Query, Storage, Users } from "node-appwrite";

const DB = process.env.APPWRITE_DATABASE_ID || "lifeinbox";
const CAPTURES = process.env.APPWRITE_CAPTURES_COLLECTION_ID || "captures";
const USAGE = process.env.APPWRITE_USAGE_COLLECTION_ID || "usage";
const BUCKET = process.env.APPWRITE_BUCKET_ID || "inbox-files";
const ACTIONS = process.env.APPWRITE_ACTIONS_COLLECTION_ID || "actions";
const THREADS = process.env.APPWRITE_THREADS_COLLECTION_ID || "threads";
const BRIEFINGS = process.env.APPWRITE_BRIEFINGS_COLLECTION_ID || "briefings";

function services(req) {
  const dynamicKey = req.headers["x-appwrite-key"] || req.headers["X-Appwrite-Key"];
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
    .setKey(dynamicKey);
  return { databases: new Databases(client), storage: new Storage(client), users: new Users(client) };
}

function body(req) {
  try { return typeof req.bodyRaw === "string" ? JSON.parse(req.bodyRaw || "{}") : req.bodyRaw || {}; }
  catch { return {}; }
}

async function cleanup(databases, storage, log) {
  const retentionDays = Math.max(1, Number(process.env.FILE_RETENTION_DAYS || 30));
  const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();
  let cursor;
  let deletedFiles = 0;
  let deletedCaptures = 0;
  do {
    const queries = [Query.lessThan("createdAt", cutoff), Query.limit(100), Query.orderAsc("createdAt")];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await databases.listDocuments({ databaseId: DB, collectionId: CAPTURES, queries });
    for (const capture of page.documents) {
      if (capture.fileId) {
        try { await storage.deleteFile({ bucketId: BUCKET, fileId: capture.fileId }); deletedFiles += 1; }
        catch (error) { if (error.code !== 404) throw error; }
      }
      await databases.deleteDocument({ databaseId: DB, collectionId: CAPTURES, documentId: capture.$id });
      deletedCaptures += 1;
    }
    cursor = page.documents.length === 100 ? page.documents.at(-1).$id : undefined;
  } while (cursor);
  log(`Retention cleanup removed ${deletedFiles} files and ${deletedCaptures} capture records.`);
  return { deletedFiles, deletedCaptures, retentionDays };
}

async function usageSummary(databases) {
  const date = new Date().toISOString().slice(0, 10);
  const result = await databases.listDocuments({ databaseId: DB, collectionId: USAGE, queries: [Query.equal("date", [date]), Query.limit(100)] });
  return result.documents.reduce((sum, row) => ({
    users: sum.users + 1,
    captures: sum.captures + Number(row.captures || 0),
    inputTokens: sum.inputTokens + Number(row.inputTokens || 0),
    outputTokens: sum.outputTokens + Number(row.outputTokens || 0),
    ocrRuns: sum.ocrRuns + Number(row.ocrRuns || 0),
    sttRuns: sum.sttRuns + Number(row.sttRuns || 0),
    cacheHits: sum.cacheHits + Number(row.cacheHits || 0),
    failures: sum.failures + Number(row.failures || 0),
  }), { date, users: 0, captures: 0, inputTokens: 0, outputTokens: 0, ocrRuns: 0, sttRuns: 0, cacheHits: 0, failures: 0 });
}

async function deleteAccount(databases, storage, users, userId) {
  const collections = [CAPTURES, ACTIONS, THREADS, BRIEFINGS, USAGE];
  for (const collectionId of collections) {
    let cursor;
    do {
      const queries = [Query.equal("userId", [userId]), Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const page = await databases.listDocuments({ databaseId: DB, collectionId, queries });
      for (const document of page.documents) {
        if (collectionId === CAPTURES && document.fileId) await storage.deleteFile({ bucketId: BUCKET, fileId: document.fileId }).catch(() => {});
        await databases.deleteDocument({ databaseId: DB, collectionId, documentId: document.$id });
      }
      cursor = page.documents.length === 100 ? page.documents.at(-1).$id : undefined;
    } while (cursor);
  }
  await users.delete({ userId });
  return { deleted: true };
}

async function handler({ req, res, log, error }) {
  if (!req.headers["x-appwrite-key"]) return res.json({ error: "function_not_configured" }, 503);
  const request = body(req);
  const route = String(request.route || req.path || "cleanup").replace(/^\//, "");
  const userId = req.headers["x-appwrite-user-id"] || req.headers["X-Appwrite-User-Id"];
  const trigger = String(req.headers["x-appwrite-trigger"] || req.headers["X-Appwrite-Trigger"] || "").toLowerCase();
  const scheduled = trigger === "schedule";
  const suppliedSecret = req.headers["x-ops-secret"] || req.headers["X-Ops-Secret"];
  const userOwnedRoute = route === "delete-account" && Boolean(userId);
  if (!scheduled && !userOwnedRoute && (!process.env.OPS_SECRET || suppliedSecret !== process.env.OPS_SECRET)) return res.json({ error: "forbidden" }, 403);
  try {
    const { databases, storage, users } = services(req);
    if (route === "delete-account") return res.json(await deleteAccount(databases, storage, users, userId));
    if (route === "cleanup") return res.json(await cleanup(databases, storage, log));
    if (route === "usage") return res.json(await usageSummary(databases));
    if (route === "billing-webhook") {
      log(`Billing event staged: ${String(request.event || "unknown")}`);
      return res.json({ accepted: true, provider: "mock", readyForProvider: true }, 202);
    }
    if (route === "health") return res.json({ ok: true, service: "lifeinbox-ops" });
    return res.json({ error: "route_not_found" }, 404);
  } catch (caught) {
    error(caught instanceof Error ? caught.stack || caught.message : String(caught));
    return res.json({ error: "ops_failed" }, 500);
  }
}

export default handler;
