import { Client, Compression, Databases, IndexType, Permission, Role, Storage } from "node-appwrite";

const required = ["NEXT_PUBLIC_APPWRITE_ENDPOINT", "NEXT_PUBLIC_APPWRITE_PROJECT_ID", "APPWRITE_API_KEY"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  console.error("Copy .env.example to .env.local, set the values, then load them into your shell before running this command.");
  process.exit(1);
}

const ids = {
  database: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "lifeinbox",
  captures: process.env.NEXT_PUBLIC_APPWRITE_CAPTURES_COLLECTION_ID || "captures",
  actions: process.env.NEXT_PUBLIC_APPWRITE_ACTIONS_COLLECTION_ID || "actions",
  threads: process.env.NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || "threads",
  briefings: process.env.NEXT_PUBLIC_APPWRITE_BRIEFINGS_COLLECTION_ID || "briefings",
  usage: process.env.NEXT_PUBLIC_APPWRITE_USAGE_COLLECTION_ID || "usage",
  bucket: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "inbox-files",
};

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

const userCreate = [Permission.create(Role.users())];

const collections = [
  {
    id: ids.captures,
    name: "Captures",
    attributes: [
      { key: "userId", type: "string", size: 36, required: true },
      { key: "source", type: "string", size: 16, required: true },
      { key: "rawText", type: "string", size: 10000, required: false },
      { key: "fileId", type: "string", size: 36, required: false },
      { key: "contentHash", type: "string", size: 64, required: false },
      { key: "mode", type: "string", size: 32, required: false },
      { key: "status", type: "string", size: 20, required: true },
      { key: "needsReview", type: "boolean", required: true },
      { key: "confidence", type: "integer", required: true, min: 0, max: 100 },
      { key: "createdAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "captures_user_created", type: "key", attributes: ["userId", "createdAt"], orders: ["ASC", "DESC"] },
      { key: "captures_hash", type: "key", attributes: ["userId", "contentHash"] },
      { key: "captures_status", type: "key", attributes: ["userId", "status"] },
    ],
  },
  {
    id: ids.actions,
    name: "Actions",
    attributes: [
      { key: "userId", type: "string", size: 36, required: true },
      { key: "type", type: "string", size: 16, required: true },
      { key: "title", type: "string", size: 256, required: true },
      { key: "summary", type: "string", size: 2048, required: true },
      { key: "dueLabel", type: "string", size: 128, required: false },
      { key: "dueDate", type: "string", size: 32, required: false },
      { key: "time", type: "string", size: 16, required: false },
      { key: "amount", type: "string", size: 64, required: false },
      { key: "location", type: "string", size: 256, required: false },
      { key: "people", type: "string", size: 256, required: false, array: true },
      { key: "priority", type: "string", size: 16, required: true },
      { key: "confidence", type: "integer", required: true, min: 0, max: 100 },
      { key: "threadId", type: "string", size: 36, required: false },
      { key: "threadName", type: "string", size: 128, required: false },
      { key: "status", type: "string", size: 16, required: true },
      { key: "source", type: "string", size: 16, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "actions_user_created", type: "key", attributes: ["userId", "createdAt"], orders: ["ASC", "DESC"] },
      { key: "actions_user_status", type: "key", attributes: ["userId", "status"] },
      { key: "actions_user_due", type: "key", attributes: ["userId", "dueDate"] },
      { key: "actions_thread", type: "key", attributes: ["userId", "threadId"] },
      { key: "actions_search", type: "fulltext", attributes: ["title", "summary", "threadName"] },
    ],
  },
  {
    id: ids.threads,
    name: "Life Threads",
    attributes: [
      { key: "userId", type: "string", size: 36, required: true },
      { key: "name", type: "string", size: 128, required: true },
      { key: "summary", type: "string", size: 2048, required: false },
      { key: "nextStep", type: "string", size: 256, required: false },
      { key: "dateRange", type: "string", size: 64, required: false },
      { key: "color", type: "string", size: 16, required: false },
      { key: "itemIds", type: "string", size: 36, required: false, array: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "threads_user_updated", type: "key", attributes: ["userId", "updatedAt"], orders: ["ASC", "DESC"] },
      { key: "threads_search", type: "fulltext", attributes: ["name", "summary"] },
    ],
  },
  {
    id: ids.briefings,
    name: "Daily Briefings",
    attributes: [
      { key: "userId", type: "string", size: 36, required: true },
      { key: "date", type: "string", size: 10, required: true },
      { key: "content", type: "string", size: 4096, required: true },
      { key: "itemIds", type: "string", size: 36, required: false, array: true },
      { key: "versionHash", type: "string", size: 64, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
    indexes: [{ key: "briefing_unique", type: "unique", attributes: ["userId", "date"] }],
  },
  {
    id: ids.usage,
    name: "Usage",
    attributes: [
      { key: "userId", type: "string", size: 36, required: true },
      { key: "date", type: "string", size: 10, required: true },
      { key: "captures", type: "integer", required: true, min: 0 },
      { key: "inputTokens", type: "integer", required: true, min: 0 },
      { key: "outputTokens", type: "integer", required: true, min: 0 },
      { key: "ocrRuns", type: "integer", required: true, min: 0 },
      { key: "sttRuns", type: "integer", required: true, min: 0 },
      { key: "cacheHits", type: "integer", required: true, min: 0 },
      { key: "failures", type: "integer", required: true, min: 0 },
    ],
    indexes: [{ key: "usage_unique", type: "unique", attributes: ["userId", "date"] }],
  },
];

async function createOrKeep(label, create) {
  try { await create(); console.log(`Created ${label}`); }
  catch (error) {
    if (error?.code === 409) console.log(`Kept existing ${label}`);
    else throw error;
  }
}

await createOrKeep("database", () => databases.create({ databaseId: ids.database, name: "LifeInbox", enabled: true }));
for (const collection of collections) {
  await createOrKeep(`collection ${collection.id}`, () => databases.createCollection({
    databaseId: ids.database,
    collectionId: collection.id,
    name: collection.name,
    permissions: userCreate,
    documentSecurity: true,
    enabled: true,
    attributes: collection.attributes,
    indexes: collection.indexes.map((index) => ({ ...index, type: index.type === "fulltext" ? IndexType.Fulltext : index.type === "unique" ? IndexType.Unique : IndexType.Key })),
  }));
}

await createOrKeep("storage bucket", () => storage.createBucket({
  bucketId: ids.bucket,
  name: "LifeInbox Files",
  permissions: [Permission.create(Role.users())],
  fileSecurity: true,
  enabled: true,
  maximumFileSize: 10 * 1024 * 1024,
  allowedFileExtensions: ["pdf", "png", "jpg", "jpeg", "webp", "heic", "m4a", "mp3", "wav", "ogg"],
  compression: Compression.Gzip,
  encryption: true,
  antivirus: true,
  transformations: true,
}));

console.log("LifeInbox Appwrite resources are ready.");
console.log("Next: add a Web platform for localhost and your production domain, then deploy the two functions in appwrite.json.");
