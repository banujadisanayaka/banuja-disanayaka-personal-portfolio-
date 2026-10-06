import { createHmac, timingSafeEqual } from "node:crypto";

function env(name: string) {
  return Netlify.env.get(name) || "";
}

function parsePins() {
  const raw = env("MOMENTS_GALLERY_PINS_JSON");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sign(slug: string, expiresAt: number, secret: string) {
  return createHmac("sha256", secret).update(`${slug}|${expiresAt}`).digest("base64url");
}

function json(body: unknown, status = 200, extraHeaders: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return json({ok:false, message:"Method not allowed."}, 405, {Allow:"POST"});
  }

  let body: {slug?: unknown; pin?: unknown};
  try {
    body = await req.json();
  } catch {
    return json({ok:false, message:"Invalid request."}, 400);
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";

  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !/^\d{4}$/.test(pin)) {
    return json({ok:false, message:"Enter a valid 4-digit code."}, 400);
  }

  const pins = parsePins() as Record<string, unknown>;
  const expected = typeof pins[slug] === "string" ? String(pins[slug]) : "";
  if (!expected) {
    return json({ok:false, message:"This gallery is not configured for private access."}, 404);
  }

  if (!safeEqual(pin, expected)) {
    await new Promise(resolve => setTimeout(resolve, 450));
    return json({ok:false, message:"That code did not match. Please try again."}, 401);
  }

  const secret = env("MOMENTS_AUTH_SECRET");
  if (secret.length < 32) {
    return json({ok:false, message:"Private gallery access is temporarily unavailable."}, 503);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const signature = sign(slug, expiresAt, secret);
  const token = `${expiresAt}.${signature}`;
  const cookieName = `tdg_moment_${slug.replace(/-/g, "_")}`;
  const cookie = [
    `${cookieName}=${token}`,
    `Path=/moments/${slug}/`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 12}`
  ].join("; ");

  return json({ok:true, expiresAt}, 200, {"set-cookie":cookie});
};
