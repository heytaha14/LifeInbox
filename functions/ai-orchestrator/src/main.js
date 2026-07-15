import crypto from "node:crypto";
import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";
import OpenAI from "openai";

const DB = process.env.APPWRITE_DATABASE_ID || "lifeinbox";
const ACTIONS = process.env.APPWRITE_ACTIONS_COLLECTION_ID || "actions";
const BRIEFINGS = process.env.APPWRITE_BRIEFINGS_COLLECTION_ID || "briefings";
const USAGE = process.env.APPWRITE_USAGE_COLLECTION_ID || "usage";
const MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";
const DAILY_LIMIT = Number(process.env.FREE_DAILY_CAPTURE_LIMIT || 50);

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["task", "event", "expense", "note"] },
    title: { type: "string", maxLength: 256 },
    summary: { type: "string", maxLength: 1200 },
    dueDate: { type: ["string", "null"], description: "ISO date YYYY-MM-DD when known" },
    time: { type: ["string", "null"], description: "24-hour HH:mm when known" },
    amount: { type: ["string", "null"] },
    currency: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    people: { type: "array", items: { type: "string" } },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    threadHint: { type: ["string", "null"] },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    missingFields: { type: "array", items: { type: "string" } },
  },
  required: ["type", "title", "summary", "dueDate", "time", "amount", "currency", "location", "people", "priority", "threadHint", "confidence", "missingFields"],
};

function json(res, body, status = 200) { return res.json(body, status); }
function today() { return new Date().toISOString().slice(0, 10); }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function services() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return { databases: new Databases(client), openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) };
}

async function getUsage(databases, userId) {
  const id = hash(`${userId}:${today()}`).slice(0, 36);
  try { return await databases.getDocument({ databaseId: DB, collectionId: USAGE, documentId: id }); }
  catch (error) {
    if (error.code !== 404) throw error;
    return databases.createDocument({
      databaseId: DB, collectionId: USAGE, documentId: id,
      data: { userId, date: today(), captures: 0, inputTokens: 0, outputTokens: 0, ocrRuns: 0, sttRuns: 0, cacheHits: 0, failures: 0 },
      permissions: [Permission.read(Role.user(userId))],
    });
  }
}

async function addUsage(databases, userId, usage, extra = {}) {
  const current = await getUsage(databases, userId);
  const bump = (key) => Number(current[key] || 0) + Number(extra[key] || 0);
  await databases.updateDocument({
    databaseId: DB, collectionId: USAGE, documentId: current.$id,
    data: {
      captures: bump("captures"), inputTokens: bump("inputTokens") + Number(usage?.input_tokens || 0),
      outputTokens: bump("outputTokens") + Number(usage?.output_tokens || 0), ocrRuns: bump("ocrRuns"),
      sttRuns: bump("sttRuns"), cacheHits: bump("cacheHits"), failures: bump("failures"),
    },
  });
}

function parseBody(req) {
  if (!req.bodyRaw) return {};
  try { return typeof req.bodyRaw === "string" ? JSON.parse(req.bodyRaw) : req.bodyRaw; }
  catch { throw new Error("Request body must be valid JSON"); }
}

async function extract({ openai, databases, userId, body }) {
  const usage = await getUsage(databases, userId);
  if (usage.captures >= DAILY_LIMIT) return { status: 429, body: { error: "daily_limit_reached", message: "Your daily capture limit is reached. Existing items remain available." } };
  const input = String(body.input || "").trim();
  if (!input) return { status: 400, body: { error: "input_required" } };
  const response = await openai.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: "You extract calm, useful life-admin actions. Never invent dates, amounts, people, or locations. Prefer one clear item. If information is ambiguous, lower confidence and list the missing field. A confidence below 80 always requires review." },
      { role: "user", content: `Source type: ${body.source || "text"}\nCapture:\n${input.slice(0, 16000)}` },
    ],
    text: { format: { type: "json_schema", name: "lifeinbox_item", strict: true, schema: extractionSchema } },
    max_output_tokens: 900,
  });
  const extracted = JSON.parse(response.output_text);
  const item = {
    ...extracted,
    id: ID.unique(), status: "inbox", source: body.source || "text", threadName: extracted.threadHint,
    dueLabel: extracted.dueDate || "No date", createdAt: new Date().toISOString(),
  };
  await addUsage(databases, userId, response.usage, { captures: 1 });
  return { status: 200, body: { item, needsReview: extracted.confidence < 80 || extracted.missingFields.length > 0, model: MODEL } };
}

async function relevantActions(databases, userId, queries = []) {
  const result = await databases.listDocuments({
    databaseId: DB, collectionId: ACTIONS,
    queries: [Query.equal("userId", [userId]), Query.notEqual("status", "done"), ...queries, Query.limit(40)],
  });
  return result.documents.map(({ $id, title, summary, dueDate, dueLabel, priority, threadName, type, amount }) => ({ id: $id, title, summary, dueDate, dueLabel, priority, threadName, type, amount }));
}

async function ask({ openai, databases, userId, body }) {
  const question = String(body.question || "").trim();
  if (question.length < 3) return { status: 400, body: { error: "question_too_short" } };
  let items;
  const words = question.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((word) => word.length >= 3);
  try { items = words.length ? await relevantActions(databases, userId, [Query.search("title", words.slice(0, 4).join(" "))]) : []; }
  catch { items = []; }
  if (!items.length) items = await relevantActions(databases, userId);
  const response = await openai.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: "Answer only from the supplied LifeInbox items. Be concise, practical, and transparent about uncertainty. Cite supporting item IDs in square brackets. Never claim an action was completed." },
      { role: "user", content: `Question: ${question}\n\nItems:\n${JSON.stringify(items).slice(0, 18000)}` },
    ],
    max_output_tokens: 600,
  });
  await addUsage(databases, userId, response.usage);
  const citations = [...response.output_text.matchAll(/\[([A-Za-z0-9._-]+)\]/g)].map((match) => match[1]).filter((id) => items.some((item) => item.id === id));
  return { status: 200, body: { answer: response.output_text, citations: [...new Set(citations)] } };
}

async function briefing({ openai, databases, userId }) {
  const items = await relevantActions(databases, userId, [Query.orderAsc("dueDate")]);
  const versionHash = hash(JSON.stringify(items.map((item) => [item.id, item.dueDate, item.priority])));
  const cached = await databases.listDocuments({ databaseId: DB, collectionId: BRIEFINGS, queries: [Query.equal("userId", [userId]), Query.equal("date", [today()]), Query.limit(1)] });
  if (cached.documents[0]?.versionHash === versionHash) {
    await addUsage(databases, userId, null, { cacheHits: 1 });
    return { status: 200, body: { briefing: cached.documents[0].content, itemIds: cached.documents[0].itemIds, cached: true } };
  }
  const focused = items.filter((item) => item.priority === "high" || item.dueDate).slice(0, 12);
  const response = await openai.responses.create({
    model: MODEL,
    input: `Create a warm, direct daily briefing in 70 words or fewer. Mention at most three things and lead with the clearest next step. Use only these items: ${JSON.stringify(focused)}`,
    max_output_tokens: 220,
  });
  const data = { userId, date: today(), content: response.output_text, itemIds: focused.map((item) => item.id), versionHash, createdAt: new Date().toISOString() };
  if (cached.documents[0]) await databases.updateDocument({ databaseId: DB, collectionId: BRIEFINGS, documentId: cached.documents[0].$id, data });
  else await databases.createDocument({ databaseId: DB, collectionId: BRIEFINGS, documentId: ID.unique(), data, permissions: [Permission.read(Role.user(userId))] });
  await addUsage(databases, userId, response.usage);
  return { status: 200, body: { briefing: data.content, itemIds: data.itemIds, cached: false } };
}

async function regroup({ openai, databases, userId }) {
  const items = await relevantActions(databases, userId);
  const deterministic = items.filter((item) => item.threadName).reduce((groups, item) => ({ ...groups, [item.threadName]: [...(groups[item.threadName] || []), item.id] }), {});
  if (Object.keys(deterministic).length || items.length < 2) return { status: 200, body: { groups: deterministic, source: "deterministic" } };
  const response = await openai.responses.create({ model: MODEL, input: `Group only clearly related items. Return compact JSON mapping thread names to item IDs. Do not force unrelated items together: ${JSON.stringify(items)}`, max_output_tokens: 500 });
  await addUsage(databases, userId, response.usage);
  return { status: 200, body: { groups: JSON.parse(response.output_text), source: "model" } };
}

async function handler({ req, res, log, error }) {
  const userId = req.headers["x-appwrite-user-id"] || req.headers["X-Appwrite-User-Id"];
  if (!userId) return json(res, { error: "authentication_required" }, 401);
  if (!process.env.APPWRITE_API_KEY || !process.env.OPENAI_API_KEY) return json(res, { error: "function_not_configured" }, 503);
  try {
    const body = parseBody(req);
    const route = String(body.route || req.path || "").replace(/^\//, "");
    const { databases, openai } = services();
    const context = { databases, openai, userId, body };
    const result = route === "extract" ? await extract(context)
      : route === "ask" ? await ask(context)
      : route === "today-brief" ? await briefing(context)
      : route === "regroup-thread" ? await regroup(context)
      : { status: 404, body: { error: "route_not_found" } };
    log(`${route} completed for ${userId.slice(0, 6)}...`);
    return json(res, result.body, result.status);
  } catch (caught) {
    error(caught instanceof Error ? caught.stack || caught.message : String(caught));
    return json(res, { error: "request_failed", message: "LifeInbox could not process this request safely. Your original capture is unchanged." }, 500);
  }
}

export default handler;
