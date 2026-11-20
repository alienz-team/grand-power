// Edge-safe session token helpers (used by middleware and server code).
import { jwtVerify } from "jose/jwt/verify";
import { SignJWT } from "jose/jwt/sign";

export const SESSION_COOKIE = "gp_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export const DEFAULT_ADMIN_EMAIL = "admin@gpower.store";

// Last-resort key when no secret is configured: random per isolate, so sessions are never forgeable
// (they just don't survive restarts). Always set ADMIN_SESSION_SECRET in production.
let ephemeralKey: string | undefined;
function ephemeral(): string {
  if (!ephemeralKey) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    ephemeralKey = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return ephemeralKey;
}

function secretKey(): Uint8Array {
  const explicit = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  const pass = process.env.ADMIN_PASSWORD;
  const material =
    explicit && explicit.length >= 32
      ? explicit
      : pass
        ? `gpower-fallback::${pass}::${process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL}`
        : ephemeral();
  return new TextEncoder().encode(material);
}

export interface SessionPayload {
  sub: string; // email
  role: "ADMIN";
}

export async function signSession(email: string): Promise<string> {
  return new SignJWT({ role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setIssuer("gpower.store")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "gpower.store", algorithms: ["HS256"] });
    if (payload.role !== "ADMIN" || typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: "ADMIN" };
  } catch {
    return null;
  }
}
