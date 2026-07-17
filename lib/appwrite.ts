"use client";

import { Account, Client, Databases, ExecutionMethod, Functions, ID, Permission, Query, Role, Storage } from "appwrite";
import type { LifeItem, LifeThread } from "./lifeinbox";

export const appwriteConfig = {
  // These are public Appwrite identifiers, not secrets. Keeping production-safe
  // defaults prevents cloud source builds from silently disabling auth and AI
  // when NEXT_PUBLIC_* values are not present in the build environment.
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a572c3f0008220bd0cf",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "lifeinbox",
  capturesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_CAPTURES_COLLECTION_ID || "captures",
  actionsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ACTIONS_COLLECTION_ID || "actions",
  threadsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || "threads",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "inbox-files",
  aiFunctionId: process.env.NEXT_PUBLIC_APPWRITE_AI_FUNCTION_ID || "ai-orchestrator",
  opsFunctionId: process.env.NEXT_PUBLIC_APPWRITE_OPS_FUNCTION_ID || "ops",
};

export const isAppwriteConfigured = Boolean(appwriteConfig.endpoint && appwriteConfig.projectId);
const client = new Client();
if (isAppwriteConfigured) client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const appwriteFunctions = new Functions(client);

export type AuthUser = { id: string; name: string; email: string };

function isConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && Number((error as { code?: unknown }).code) === 409;
}

const META_PREFIX = "__li_meta_v1__:";
const META_CHUNK_SIZE = 220;

type StoredLifeItemMeta = {
  v?: 1;
  c?: string;
  p?: true;
  f?: string;
  t?: string;
  z?: string;
  m?: string[];
  e?: string;
};

function compactMeta(meta: StoredLifeItemMeta): StoredLifeItemMeta {
  return {
    v: 1,
    c: meta.c || undefined,
    p: meta.p || undefined,
    f: meta.f || undefined,
    t: meta.t || undefined,
    z: meta.z || undefined,
    m: meta.m?.length ? meta.m : undefined,
    e: meta.e || undefined,
  };
}

export function packPeople(people: readonly string[] | undefined, meta: StoredLifeItemMeta): string[] {
  const visiblePeople = (people ?? []).map(String).filter((person) => person && !person.startsWith(META_PREFIX));
  const serialized = JSON.stringify(compactMeta(meta));
  const characters = Array.from(serialized);
  const chunks: string[] = [];
  for (let offset = 0, index = 0; offset < characters.length; offset += META_CHUNK_SIZE, index += 1) {
    chunks.push(`${META_PREFIX}${String(index).padStart(3, "0")}:${characters.slice(offset, offset + META_CHUNK_SIZE).join("")}`);
  }
  return [...visiblePeople, ...chunks];
}

export function unpackPeople(value: unknown): { people: string[]; meta: StoredLifeItemMeta; hasMeta: boolean } {
  const entries = Array.isArray(value) ? value.map(String) : [];
  const people = entries.filter((entry) => !entry.startsWith(META_PREFIX));
  const chunks = entries
    .filter((entry) => entry.startsWith(META_PREFIX))
    .map((entry) => {
      const payload = entry.slice(META_PREFIX.length);
      const separator = payload.indexOf(":");
      return { index: Number(payload.slice(0, separator)), value: separator >= 0 ? payload.slice(separator + 1) : "" };
    })
    .filter((chunk) => Number.isInteger(chunk.index) && chunk.index >= 0)
    .sort((a, b) => a.index - b.index);
  if (!chunks.length) return { people, meta: {}, hasMeta: false };
  try {
    const parsed = JSON.parse(chunks.map((chunk) => chunk.value).join("")) as StoredLifeItemMeta;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { people, meta: {}, hasMeta: false };
    return { people, meta: compactMeta(parsed), hasMeta: true };
  } catch {
    return { people, meta: {}, hasMeta: false };
  }
}

function metaFromItem(item: Partial<LifeItem>): StoredLifeItemMeta {
  return compactMeta({
    c: item.content,
    p: item.pinned ? true : undefined,
    f: item.linkedFromId,
    t: item.linkedFromTitle,
    z: item.snoozedUntil,
    m: item.missingFields,
    e: item.sourceExcerpt,
  });
}

const hasOwn = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isAppwriteConfigured) return null;
  try {
    const user = await account.get();
    return { id: user.$id, name: user.name || user.email.split("@")[0], email: user.email };
  } catch { return null; }
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  return { id: user.$id, name: user.name || email.split("@")[0], email };
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const user = await account.create({ userId: ID.unique(), email, password, name });
  await account.createEmailPasswordSession(email, password);
  return { id: user.$id, name: user.name || name, email };
}

export async function signOut(): Promise<void> {
  if (isAppwriteConfigured) await account.deleteSession({ sessionId: "current" });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await account.createRecovery({ email, url: `${window.location.origin}/?recovery=1` });
}

export async function completePasswordReset(userId: string, secret: string, password: string): Promise<void> {
  await account.updateRecovery({ userId, secret, password });
}

export async function uploadCaptureFile(file: File, userId: string) {
  return storage.createFile({
    bucketId: appwriteConfig.bucketId,
    fileId: ID.unique(),
    file,
    permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
  });
}

export async function saveLifeItem(item: LifeItem, userId: string) {
  const data = {
    userId,
    type: item.type,
    title: item.title,
    summary: item.summary,
    dueLabel: item.dueLabel,
    dueDate: item.dueDate,
    time: item.time,
    amount: item.amount,
    location: item.location,
    people: packPeople(item.people, metaFromItem(item)),
    priority: item.priority,
    confidence: item.confidence,
    threadId: item.threadId,
    threadName: item.threadName,
    status: item.status,
    source: item.source,
    createdAt: item.createdAt,
  };
  try {
    return await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.actionsCollectionId,
      documentId: item.id,
      data,
      permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
    });
  } catch (error) {
    if (!isConflict(error)) throw error;
    return databases.updateDocument({ databaseId: appwriteConfig.databaseId, collectionId: appwriteConfig.actionsCollectionId, documentId: item.id, data });
  }
}

type LifeItemUpdate = Partial<Omit<LifeItem, "threadId" | "threadName" | "snoozedUntil">> & {
  threadId?: string | null;
  threadName?: string | null;
  snoozedUntil?: string | null;
};

export async function updateLifeItem(itemId: string, data: LifeItemUpdate) {
  const metadataKeys: Array<keyof LifeItemUpdate> = ["content", "pinned", "linkedFromId", "linkedFromTitle", "snoozedUntil", "missingFields", "sourceExcerpt", "people"];
  const directKeys: Array<keyof LifeItemUpdate> = ["type", "title", "summary", "dueLabel", "dueDate", "time", "amount", "location", "priority", "confidence", "threadId", "threadName", "status", "source", "createdAt"];
  const payload: Record<string, unknown> = {};
  for (const key of directKeys) {
    if (hasOwn(data, key) && data[key] !== undefined) payload[key] = data[key];
  }

  if (metadataKeys.some((key) => hasOwn(data, key))) {
    const document = await databases.getDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.actionsCollectionId,
      documentId: itemId,
    });
    const decoded = unpackPeople(document.people);
    const meta = decoded.hasMeta
      ? compactMeta(decoded.meta)
      : compactMeta({
          c: typeof document.content === "string" ? document.content : undefined,
          p: document.pinned === true ? true : undefined,
          f: typeof document.linkedFromId === "string" ? document.linkedFromId : undefined,
          t: typeof document.linkedFromTitle === "string" ? document.linkedFromTitle : undefined,
          z: typeof document.snoozedUntil === "string" ? document.snoozedUntil : undefined,
          m: Array.isArray(document.missingFields) ? document.missingFields.map(String) : undefined,
          e: typeof document.sourceExcerpt === "string" ? document.sourceExcerpt : undefined,
        });
    if (hasOwn(data, "content")) meta.c = data.content || undefined;
    if (hasOwn(data, "pinned")) meta.p = data.pinned ? true : undefined;
    if (hasOwn(data, "linkedFromId")) meta.f = data.linkedFromId || undefined;
    if (hasOwn(data, "linkedFromTitle")) meta.t = data.linkedFromTitle || undefined;
    if (hasOwn(data, "snoozedUntil")) meta.z = data.snoozedUntil || undefined;
    if (hasOwn(data, "missingFields")) meta.m = data.missingFields?.length ? data.missingFields : undefined;
    if (hasOwn(data, "sourceExcerpt")) meta.e = data.sourceExcerpt || undefined;
    const people = hasOwn(data, "people") ? data.people : decoded.people;
    payload.people = packPeople(people, meta);
  }

  return databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    documentId: itemId,
    data: payload,
  });
}

export async function deleteLifeItem(itemId: string) {
  return databases.deleteDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    documentId: itemId,
  });
}

export async function saveCaptureRecord(data: { source: LifeItem["source"]; rawText?: string; fileId?: string }, userId: string) {
  return databases.createDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.capturesCollectionId,
    documentId: ID.unique(),
    data: {
      userId,
      source: data.source,
      rawText: data.rawText ?? "",
      fileId: data.fileId ?? "",
      status: "processing",
      needsReview: true,
      confidence: 0,
      createdAt: new Date().toISOString(),
    },
    permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
  });
}

export async function updateCaptureRecord(captureId: string, data: { status?: string; needsReview?: boolean; confidence?: number; mode?: string }) {
  return databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.capturesCollectionId,
    documentId: captureId,
    data,
  });
}

export async function saveLifeThread(thread: LifeThread, userId: string) {
  const data = { userId, name: thread.name, summary: thread.eyebrow, nextStep: thread.nextStep, dateRange: thread.dateRange, color: thread.color, itemIds: thread.itemIds, updatedAt: new Date().toISOString() };
  try {
    return await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.threadsCollectionId,
      documentId: thread.id,
      data,
      permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
    });
  } catch (error) {
    if (!isConflict(error)) throw error;
    return databases.updateDocument({ databaseId: appwriteConfig.databaseId, collectionId: appwriteConfig.threadsCollectionId, documentId: thread.id, data });
  }
}

export async function updateLifeThread(thread: LifeThread) {
  return databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.threadsCollectionId,
    documentId: thread.id,
    data: { name: thread.name, summary: thread.eyebrow, nextStep: thread.nextStep, dateRange: thread.dateRange, color: thread.color, itemIds: thread.itemIds, updatedAt: new Date().toISOString() },
  });
}

export async function deleteLifeThread(threadId: string) {
  return databases.deleteDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.threadsCollectionId,
    documentId: threadId,
  });
}

export async function savePreferences(prefs: Record<string, string | number | boolean>) {
  return account.updatePrefs({ prefs });
}

export async function updateProfileName(name: string) {
  return account.updateName({ name });
}

export async function listLifeItems(userId: string): Promise<LifeItem[]> {
  const documents: Array<Record<string, unknown> & { $id: string }> = [];
  const pageSize = 100;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  while (documents.length < total) {
    const result = await databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.actionsCollectionId,
      queries: [Query.equal("userId", [userId]), Query.orderDesc("createdAt"), Query.limit(pageSize), Query.offset(offset)],
    });
    documents.push(...result.documents);
    total = result.total;
    if (result.documents.length < pageSize) break;
    offset += result.documents.length;
  }
  return documents.map((document) => {
    const decoded = unpackPeople(document.people);
    const type = ["task", "event", "expense", "note"].includes(String(document.type)) ? String(document.type) as LifeItem["type"] : "task";
    const priority = ["high", "medium", "low"].includes(String(document.priority)) ? String(document.priority) as LifeItem["priority"] : "medium";
    const status = ["inbox", "today", "done", "snoozed"].includes(String(document.status)) ? String(document.status) as LifeItem["status"] : "inbox";
    const source = ["text", "image", "pdf", "voice"].includes(String(document.source)) ? String(document.source) as LifeItem["source"] : "text";
    const optionalString = (value: unknown) => typeof value === "string" && value ? value : undefined;
    return {
      id: document.$id,
      type,
      title: String(document.title || "Untitled item"),
      summary: String(document.summary || ""),
      content: decoded.hasMeta ? decoded.meta.c : optionalString(document.content),
      dueLabel: optionalString(document.dueLabel),
      dueDate: optionalString(document.dueDate),
      time: optionalString(document.time),
      amount: optionalString(document.amount),
      location: optionalString(document.location),
      people: decoded.people,
      priority,
      confidence: Number(document.confidence || 0),
      threadId: optionalString(document.threadId),
      threadName: optionalString(document.threadName),
      status,
      source,
      createdAt: String(document.createdAt || document.$createdAt || new Date().toISOString()),
      pinned: decoded.hasMeta ? Boolean(decoded.meta.p) : document.pinned === true,
      linkedFromId: decoded.hasMeta ? decoded.meta.f : optionalString(document.linkedFromId),
      linkedFromTitle: decoded.hasMeta ? decoded.meta.t : optionalString(document.linkedFromTitle),
      snoozedUntil: decoded.hasMeta ? decoded.meta.z : optionalString(document.snoozedUntil),
      missingFields: decoded.hasMeta
        ? decoded.meta.m ?? []
        : (Array.isArray(document.missingFields) ? document.missingFields.map(String) : []),
      sourceExcerpt: decoded.hasMeta ? decoded.meta.e : optionalString(document.sourceExcerpt),
    };
  });
}

export async function listLifeThreads(userId: string): Promise<LifeThread[]> {
  const result = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.threadsCollectionId,
    queries: [Query.equal("userId", [userId]), Query.orderDesc("updatedAt"), Query.limit(50)],
  });
  return result.documents.map((document) => ({
    id: document.$id,
    name: String(document.name),
    eyebrow: String(document.summary || "Personal"),
    color: String(document.color || "#7c5cff"),
    itemIds: Array.isArray(document.itemIds) ? document.itemIds.map(String) : [],
    nextStep: String(document.nextStep || "Add the first item"),
    dateRange: String(document.dateRange || "New"),
  }));
}

export async function askOrExtract(route: "extract" | "ask" | "today-brief" | "regroup-thread", payload: Record<string, unknown>) {
  if (!appwriteConfig.aiFunctionId) throw new Error("AI function is not configured.");
  const execution = await appwriteFunctions.createExecution({
    functionId: appwriteConfig.aiFunctionId,
    body: JSON.stringify({ route, ...payload }),
    async: false,
    xpath: `/${route}`,
    method: ExecutionMethod.POST,
    headers: { "content-type": "application/json" },
  });
  let response: Record<string, unknown> = {};
  if (execution.responseBody) {
    try { response = JSON.parse(execution.responseBody) as Record<string, unknown>; }
    catch { throw new Error("LifeInbox AI returned an unreadable response."); }
  }
  if (execution.status === "failed" || execution.responseStatusCode >= 400) {
    throw new Error(String(response.message || response.error || "LifeInbox AI could not complete this request."));
  }
  return response;
}

export async function runOps(route: "delete-account", payload: Record<string, unknown> = {}) {
  if (!appwriteConfig.opsFunctionId) return null;
  const execution = await appwriteFunctions.createExecution({
    functionId: appwriteConfig.opsFunctionId,
    body: JSON.stringify({ route, ...payload }),
    async: false,
    xpath: `/${route}`,
    method: ExecutionMethod.POST,
    headers: { "content-type": "application/json" },
  });
  if (!execution.responseBody) return null;
  return JSON.parse(execution.responseBody) as Record<string, unknown>;
}
