"use client";

import { Account, Client, Databases, Functions, ID, Permission, Query, Role, Storage } from "appwrite";
import type { LifeItem, LifeThread } from "./lifeinbox";

export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "lifeinbox",
  capturesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_CAPTURES_COLLECTION_ID ?? "captures",
  actionsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ACTIONS_COLLECTION_ID ?? "actions",
  threadsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID ?? "threads",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "inbox-files",
  aiFunctionId: process.env.NEXT_PUBLIC_APPWRITE_AI_FUNCTION_ID ?? "",
  opsFunctionId: process.env.NEXT_PUBLIC_APPWRITE_OPS_FUNCTION_ID ?? "",
};

export const isAppwriteConfigured = Boolean(appwriteConfig.endpoint && appwriteConfig.projectId);
const client = new Client();
if (isAppwriteConfigured) client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const appwriteFunctions = new Functions(client);

export type AuthUser = { id: string; name: string; email: string };

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
    people: item.people ?? [],
    priority: item.priority,
    confidence: item.confidence,
    threadId: item.threadId,
    threadName: item.threadName,
    status: item.status,
    source: item.source,
    createdAt: item.createdAt,
  };
  return databases.createDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    documentId: item.id,
    data,
    permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
  });
}

type LifeItemUpdate = Partial<Omit<LifeItem, "threadId" | "threadName">> & { threadId?: string | null; threadName?: string | null };

export async function updateLifeItem(itemId: string, data: LifeItemUpdate) {
  return databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    documentId: itemId,
    data,
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
  return databases.createDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.threadsCollectionId,
    documentId: thread.id,
    data: { userId, name: thread.name, summary: thread.eyebrow, nextStep: thread.nextStep, dateRange: thread.dateRange, color: thread.color, itemIds: thread.itemIds, updatedAt: new Date().toISOString() },
    permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
  });
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
  const result = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    queries: [Query.equal("userId", [userId]), Query.orderDesc("createdAt"), Query.limit(50)],
  });
  return result.documents as unknown as LifeItem[];
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
    path: `/${route}`,
    method: "POST",
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

export async function runOps(route: "delete-account" | "export", payload: Record<string, unknown> = {}) {
  if (!appwriteConfig.opsFunctionId) return null;
  const execution = await appwriteFunctions.createExecution({
    functionId: appwriteConfig.opsFunctionId,
    body: JSON.stringify({ route, ...payload }),
    async: false,
    path: `/${route}`,
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  if (!execution.responseBody) return null;
  return JSON.parse(execution.responseBody) as Record<string, unknown>;
}
