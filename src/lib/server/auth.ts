/**
 * Gate for the demo account. This is intentionally simple: one shared login for
 * judges and the account owner, not a multi-user identity system. Credentials
 * come from environment variables and are never hardcoded, so they never sit
 * in the git history.
 *
 * The session is a signed, revocable token: signing proves the browser holds a
 * cookie this server issued, and a server-side active-session set makes logout
 * actually end the session instead of just clearing the browser's copy. The
 * set lives in process memory, matching every other piece of mutable state in
 * this app (see server/store.ts) and its single-instance deployment.
 *
 * Signing uses the Web Crypto API (globalThis.crypto.subtle) rather than
 * Node's `crypto` module. This file is imported from src/proxy.ts, which in
 * Next.js 16 always runs on Node.js (the old middleware.ts convention it
 * replaces could default to the Edge Runtime instead). Web Crypto works in
 * both runtimes, so keeping this implementation Edge-compatible costs
 * nothing and avoids a rewrite if a future Next.js version changes that
 * default again.
 */
export const SESSION_COOKIE = "adpilot_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim() === "") {
    // Fail loudly rather than silently signing with an empty key, which
    // would make every session forgeable.
    throw new Error(
      "SESSION_SECRET is not set. Add it to the environment before serving this app.",
    );
  }
  return secret;
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(value: string): Promise<string> {
  const key = await importSigningKey(getSessionSecret());
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return toHex(signature);
}

/**
 * Constant-time string comparison so response timing cannot leak how many
 * leading characters were correct. Implemented by hand instead of using
 * Node's `crypto.timingSafeEqual`, since this file also runs in contexts
 * (Edge Runtime, if a future Next.js version reintroduces it here) where that
 * API is not available.
 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = new TextEncoder().encode(a);
  const bufferB = new TextEncoder().encode(b);
  if (bufferA.length !== bufferB.length) return false;
  let mismatch = 0;
  for (let index = 0; index < bufferA.length; index += 1) {
    mismatch |= bufferA[index] ^ bufferB[index];
  }
  return mismatch === 0;
}

/**
 * Active session ids, keyed on globalThis so a hot reload in development does
 * not silently sign everyone out. Cleared on process restart, same as the
 * rest of the demo account's state.
 */
const globalSessions = globalThis as typeof globalThis & {
  adpilotActiveSessions?: Set<string>;
};

function activeSessions(): Set<string> {
  globalSessions.adpilotActiveSessions ??= new Set();
  return globalSessions.adpilotActiveSessions;
}

function randomSessionId(): string {
  return toHex(globalThis.crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/** Issues a new session id, registers it as active, and returns the signed cookie value. */
export async function createSession(): Promise<string> {
  const id = randomSessionId();
  activeSessions().add(id);
  return `${id}.${await sign(id)}`;
}

/** Removes a session id from the active set, ending it regardless of cookie expiry. */
export function revokeSessionCookie(cookieValue: string | undefined): void {
  const id = cookieValue?.split(".")[0];
  if (id) activeSessions().delete(id);
}

export async function isValidSessionCookie(
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  const [id, signature] = cookieValue.split(".");
  if (!id || !signature) return false;
  if (!activeSessions().has(id)) return false;
  return safeEqual(signature, await sign(id));
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export interface Credentials {
  email: string;
  password: string;
}

/**
 * Both the expected email and password come from the environment. If either
 * is missing, login is refused outright instead of falling back to a default
 * that would end up baked into a build.
 */
export function verifyCredentials(input: Credentials): boolean {
  const expectedEmail = process.env.DEMO_LOGIN_EMAIL;
  const expectedPassword = process.env.DEMO_LOGIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;

  const emailOk = safeEqual(
    input.email.trim().toLowerCase(),
    expectedEmail.trim().toLowerCase(),
  );
  const passwordOk = safeEqual(input.password, expectedPassword);
  return emailOk && passwordOk;
}
