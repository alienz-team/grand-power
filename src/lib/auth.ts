import "server-only";
import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import {
  DEFAULT_ADMIN_EMAIL,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/auth-token";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab); // keep timing roughly constant
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Checks env credentials first, then ADMIN users stored in the database. */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  const envEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  // Env credentials only apply when ADMIN_PASSWORD is set — there is no hardcoded default password.
  const envPass = process.env.ADMIN_PASSWORD;
  if (envPass && safeEqual(e, envEmail) && safeEqual(password, envPass)) return true;

  const prisma = getPrisma();
  if (!prisma) return false;
  try {
    const user = await prisma.user.findUnique({ where: { email: e } });
    return !!user && user.role === "ADMIN" && verifyHash(password, user.passwordHash);
  } catch {
    return false;
  }
}

export async function createSession(email: string): Promise<void> {
  const token = await signSession(email);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Guard for admin pages AND server actions. Redirects to login when unauthenticated. */
export async function assertAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

// ── Naive in-memory login throttle (per server instance) ────────────────────
const attempts = new Map<string, { count: number; until: number }>();

export function isThrottled(key: string): boolean {
  const rec = attempts.get(key);
  return !!rec && rec.count >= 5 && rec.until > Date.now();
}

export function recordFailure(key: string): void {
  const rec = attempts.get(key);
  const now = Date.now();
  if (!rec || rec.until < now) attempts.set(key, { count: 1, until: now + 15 * 60_000 });
  else rec.count += 1;
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
