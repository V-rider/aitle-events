import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { Env, SessionUser } from "./types";
import { json, normalizeEmail, originOf } from "./util";

const COOKIE = "aitle_session";
const MAX_AGE = 60 * 60 * 24 * 14;

async function secretKey(env: Env): Promise<CryptoKey> {
  const raw = env.SESSION_SECRET || "dev-insecure-session-secret-change-me";
  const bytes = new TextEncoder().encode(raw.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function signSession(
  env: Env,
  user: SessionUser,
): Promise<string> {
  const payload = JSON.stringify({ ...user, exp: Date.now() + MAX_AGE * 1000 });
  const key = await secretKey(env);
  const data = new TextEncoder().encode(payload);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${b64url(data)}.${b64url(sig)}`;
}

export async function readSession(
  env: Env,
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  const [p, s] = token.split(".");
  if (!p || !s) return null;
  const key = await secretKey(env);
  const data = b64urlDecode(p);
  const sig = b64urlDecode(s);
  const ok = await crypto.subtle.verify("HMAC", key, sig, data);
  if (!ok) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(data)) as SessionUser & {
      exp: number;
    };
    if (parsed.exp < Date.now()) return null;
    return { email: parsed.email, name: parsed.name, picture: parsed.picture };
  } catch {
    return null;
  }
}

export function setSessionCookie(c: Context<{ Bindings: Env }>, token: string) {
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: c.req.url.startsWith("https://"),
  });
}

export function clearSessionCookie(c: Context<{ Bindings: Env }>) {
  deleteCookie(c, COOKIE, { path: "/" });
}

export async function currentUser(
  c: Context<{ Bindings: Env }>,
): Promise<SessionUser | null> {
  return readSession(c.env, getCookie(c, COOKIE));
}

export async function requireAdmin(c: Context<{ Bindings: Env }>) {
  const user = await currentUser(c);
  if (!user) return { error: json({ error: "Unauthorized" }, 401) };
  const admin = await c.env.DB.prepare(
    "SELECT * FROM admins WHERE email = ?",
  )
    .bind(normalizeEmail(user.email))
    .first();
  if (!admin) return { error: json({ error: "Forbidden" }, 403) };
  return { user };
}

export async function upsertAdminFromLogin(
  env: Env,
  user: SessionUser,
  googleSub?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const email = normalizeEmail(user.email);
  const existing = await env.DB.prepare(
    "SELECT id FROM admins WHERE email = ?",
  )
    .bind(email)
    .first();

  const now = new Date().toISOString();

  if (existing) {
    await env.DB.prepare(
      "UPDATE admins SET name = ?, last_signed_in = ?, google_sub = COALESCE(?, google_sub) WHERE email = ?",
    )
      .bind(user.name, now, googleSub ?? null, email)
      .run();
    await env.DB.prepare(
      "UPDATE admin_invites SET status = 'accepted' WHERE email = ?",
    )
      .bind(email)
      .run();
    return { ok: true };
  }

  const adminCount = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM admins",
  ).first<{ n: number }>();
  const invite = await env.DB.prepare(
    "SELECT id FROM admin_invites WHERE email = ?",
  )
    .bind(email)
    .first();

  if ((adminCount?.n ?? 0) === 0 || invite) {
    await env.DB.prepare(
      "INSERT INTO admins (id, email, name, role, last_signed_in, google_sub) VALUES (?, ?, ?, 'admin', ?, ?)",
    )
      .bind(crypto.randomUUID(), email, user.name, now, googleSub ?? null)
      .run();
    if (invite) {
      await env.DB.prepare(
        "UPDATE admin_invites SET status = 'accepted' WHERE email = ?",
      )
        .bind(email)
        .run();
    } else {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO admin_invites (id, email, status, created_at) VALUES (?, ?, 'accepted', ?)",
      )
        .bind(crypto.randomUUID(), email, now)
        .run();
    }
    return { ok: true };
  }

  return {
    ok: false,
    reason: "This Google account is not invited as an admin.",
  };
}

export function googleAuthUrl(env: Env, request: Request): string | null {
  if (!env.GOOGLE_CLIENT_ID) return null;
  const redirect = `${originOf(request, env.APP_URL)}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(
  env: Env,
  request: Request,
  code: string,
): Promise<SessionUser & { sub: string }> {
  const redirect = `${originOf(request, env.APP_URL)}/api/auth/callback`;
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID || "",
    client_secret: env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: redirect,
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error("Failed to exchange Google code");
  }
  const tokens = (await tokenRes.json()) as { access_token: string };
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Failed to load Google profile");
  const profile = (await profileRes.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };
  return {
    email: profile.email,
    name: profile.name || profile.email,
    picture: profile.picture,
    sub: profile.sub,
  };
}
