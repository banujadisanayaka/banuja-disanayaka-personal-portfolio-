function env(name: string) {
  return Netlify.env.get(name) || "";
}

function privateSlugs() {
  const raw = env("MOMENTS_GALLERY_PINS_JSON");
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw);
    return new Set(
      Object.keys(parsed || {}).filter(slug => /^[a-z0-9-]{1,80}$/.test(slug))
    );
  } catch {
    return new Set<string>();
  }
}

function readCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signature(slug: string, expiresAt: number, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {name:"HMAC", hash:"SHA-256"},
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${slug}|${expiresAt}`)
  );
  return toBase64Url(new Uint8Array(signed));
}

async function validToken(req: Request, slug: string, secret: string) {
  const cookieName = `tdg_moment_${slug.replace(/-/g, "_")}`;
  const token = readCookie(req, cookieName);
  const match = token.match(/^(\d+)\.([A-Za-z0-9_-]+)$/);
  if (!match) return false;

  const expiresAt = Number(match[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = await signature(slug, expiresAt, secret);
  return expected === match[2];
}

export default async (req: Request, context: any) => {
  const url = new URL(req.url);
  const match = url.pathname.match(/^\/moments\/([^/]+)(?:\/|$)/);
  if (!match) return context.next();

  const slug = match[1];
  const protectedSlugs = privateSlugs();
  if (!protectedSlugs.has(slug)) return context.next();

  const secret = env("MOMENTS_AUTH_SECRET");
  if (secret.length < 32) {
    return new Response("Private gallery access is temporarily unavailable.", {
      status: 503,
      headers: {"cache-control":"no-store", "x-robots-tag":"noindex, nofollow, noarchive"}
    });
  }

  if (await validToken(req, slug, secret)) {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set("x-robots-tag", "noindex, nofollow, noarchive, noimageindex");
    headers.set("cache-control", "private, max-age=0, must-revalidate");
    return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
  }

  const acceptsHtml = (req.headers.get("accept") || "").includes("text/html")
    || req.headers.get("sec-fetch-dest") === "document";
  if (acceptsHtml) {
    const target = new URL("/moments/", req.url);
    target.searchParams.set("unlock", slug);
    return Response.redirect(target, 302);
  }

  return new Response("Private Moment. Unlock required.", {
    status: 401,
    headers: {"cache-control":"no-store", "x-robots-tag":"noindex, nofollow, noarchive"}
  });
};

export const config = {
  path: "/moments/*"
};
