import { appwriteHeaders, appwriteServerConfig, readSessionCookie } from "@/lib/appwrite-server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  if (!/^\/(?:account|databases|storage|functions)(?:\/|$)/.test(pathname)) {
    return Response.json({ message: "Unsupported Appwrite route." }, { status: 404 });
  }

  const incoming = new URL(request.url);
  const upstream = new URL(`${appwriteServerConfig.endpoint}${pathname}`);
  upstream.search = incoming.search;

  const headers = appwriteHeaders(readSessionCookie(request));
  for (const name of ["accept", "content-type", "x-appwrite-locale", "x-appwrite-response-format"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(upstream, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  for (const name of ["content-type", "content-disposition", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
