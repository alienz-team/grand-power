import "server-only";
import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/** True only when a real Postgres URL is configured. Without it the site runs on seed data. */
export const isDbConfigured = (): boolean => {
  const url = process.env.DATABASE_URL || "";
  return /^postgres(ql)?:\/\//.test(url) && !url.includes("<");
};

/**
 * One Prisma client per request, backed by the Neon serverless driver (WebSocket).
 * Cloudflare Workers forbid sharing I/O objects across requests, so the client is
 * memoised with React `cache` (request-scoped) instead of a process-wide global.
 */
const createClient = cache((): PrismaClient => {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
});

/** Lazily created client — never instantiated when no DB is configured. */
export function getPrisma(): PrismaClient | null {
  if (!isDbConfigured()) return null;
  return createClient();
}
