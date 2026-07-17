export const appwriteServerConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a572c3f0008220bd0cf",
};

export const SESSION_COOKIE = "lifeinbox_session";

export function readSessionCookie(request: Request): string | undefined {
  const cookies = request.headers.get("cookie") || "";
  for (const entry of cookies.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0 || entry.slice(0, separator).trim() !== SESSION_COOKIE) continue;
    try { return decodeURIComponent(entry.slice(separator + 1).trim()); }
    catch { return undefined; }
  }
  return undefined;
}

export function sessionCookie(session: string, expire?: string, secure = true): string {
  const expires = expire && !Number.isNaN(new Date(expire).valueOf()) ? `; Expires=${new Date(expire).toUTCString()}` : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(session)}; HttpOnly${secure ? "; Secure" : ""}; SameSite=Lax; Path=/${expires}`;
}

export function expiredSessionCookie(secure = true): string {
  return `${SESSION_COOKIE}=; HttpOnly${secure ? "; Secure" : ""}; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function appwriteHeaders(session?: string): Headers {
  const headers = new Headers({ "x-appwrite-project": appwriteServerConfig.projectId });
  if (session) headers.set("x-appwrite-session", session);
  return headers;
}

export function safeJson(body: Record<string, unknown>, status = 200, cookie?: string): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'",
    "x-content-type-options": "nosniff",
  });
  if (cookie) headers.set("set-cookie", cookie);
  return Response.json(body, { status, headers });
}
