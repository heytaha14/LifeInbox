"use client";

import { Account, Client, Databases, Functions, ID, Permission, Query, Role, Storage } from "appwrite";
import type { LifeItem } from "./lifeinbox";

export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "lifeinbox",
  capturesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_CAPTURES_COLLECTION_ID ?? "captures",
  actionsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ACTIONS_COLLECTION_ID ?? "actions",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "inbox-files",
  aiFunctionId: process.env.NEXT_PUBLIC_APPWRITE_AI_FUNCTION_ID ?? "",
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

export async function uploadCaptureFile(file: File, userId: string) {
  return storage.createFile({
    bucketId: appwriteConfig.bucketId,
    fileId: ID.unique(),
    file,
    permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
  });
}

export async function saveLifeItem(item: LifeItem, userId: string) {
  return databases.createDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    documentId: item.id,
    data: { ...item, people: item.people ?? [], userId },
    permissions: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
  });
}

export async function listLifeItems(userId: string): Promise<LifeItem[]> {
  const result = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.actionsCollectionId,
    queries: [Query.equal("userId", [userId]), Query.orderDesc("createdAt"), Query.limit(50)],
  });
  return result.documents as unknown as LifeItem[];
}

export async function askOrExtract(route: "extract" | "ask" | "today-brief" | "regroup-thread", payload: Record<string, unknown>) {
  if (!appwriteConfig.aiFunctionId) return null;
  const execution = await appwriteFunctions.createExecution({
    functionId: appwriteConfig.aiFunctionId,
    body: JSON.stringify({ route, ...payload }),
    async: false,
    path: `/${route}`,
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  if (!execution.responseBody) return null;
  return JSON.parse(execution.responseBody) as Record<string, unknown>;
}
