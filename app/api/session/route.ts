import {
  appwriteHeaders, appwriteServerConfig, expiredSessionCookie, readSessionCookie, safeJson, sessionCookie,
} from "@/lib/appwrite-server";

export async function POST(request: Request): Promise<Response> {
  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json() as { email?: unknown; password?: unknown };
  } catch {
    return safeJson({ message: "Invalid login request." }, 400);
  }

  const email = String(credentials.email || "").trim();
  const password = String(credentials.password || "");
  if (!email || !password) return safeJson({ message: "Email and password are required." }, 400);

  const response = await fetch(`${appwriteServerConfig.endpoint}/account/sessions/email`, {
    method: "POST",
    headers: { ...Object.fromEntries(appwriteHeaders()), "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({})) as { message?: string; expire?: string };
  if (!response.ok) return safeJson({ message: payload.message || "LifeInbox could not create a secure session." }, response.status);

  try {
    const fallback = JSON.parse(response.headers.get("x-fallback-cookies") || "{}") as Record<string, unknown>;
    const session = fallback[`a_session_${appwriteServerConfig.projectId}`];
    if (typeof session !== "string" || !session) throw new Error("missing session");
    const accountResponse = await fetch(`${appwriteServerConfig.endpoint}/account`, { headers: appwriteHeaders(session) });
    const account = await accountResponse.json().catch(() => ({})) as { $id?: string; name?: string; email?: string; message?: string };
    if (!accountResponse.ok || !account.$id || !account.email) {
      return safeJson({ message: account.message || "Appwrite could not verify the new session." }, accountResponse.status || 401);
    }
    return safeJson(
      { user: { id: account.$id, name: account.name || account.email.split("@")[0], email: account.email } },
      200,
      sessionCookie(session, payload.expire, new URL(request.url).protocol === "https:"),
    );
  } catch {
    return safeJson({ message: "Appwrite created a session but did not return a usable browser token." }, 502);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = readSessionCookie(request);
  if (session) {
    await fetch(`${appwriteServerConfig.endpoint}/account/sessions/current`, {
      method: "DELETE",
      headers: appwriteHeaders(session),
    }).catch(() => undefined);
  }
  return safeJson({ deleted: true }, 200, expiredSessionCookie(new URL(request.url).protocol === "https:"));
}
