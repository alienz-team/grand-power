// Seed: npm run db:seed  (requires DATABASE_URL / DIRECT_URL)
// Idempotent — existing rows are left untouched (upsert with empty update).
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SETTINGS, SEED_SLIDES } from "../src/lib/data/seed-data";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@gpower.store").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Set ADMIN_PASSWORD in .env before seeding (used for the admin user).");

  await prisma.$transaction([
    prisma.siteSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...SEED_SETTINGS }, update: {} }),
    ...SEED_CATEGORIES.map(({ id, ...c }) => prisma.category.upsert({ where: { key: c.key }, create: { id, ...c }, update: {} })),
    ...SEED_SLIDES.map(({ id, ...s }) => prisma.heroSlide.upsert({ where: { id }, create: { id, ...s }, update: {} })),
    ...SEED_PRODUCTS.map(({ id, ...p }) => prisma.vehicleProduct.upsert({ where: { code: p.code }, create: { id, ...p }, update: {} })),
    prisma.user.upsert({
      where: { email },
      create: { email, name: "GRAND POWER Admin", role: "ADMIN", passwordHash: hashPassword(password) },
      update: {},
    }),
  ]);
  if ((await prisma.servicePackage.count()) === 0) {
    await prisma.servicePackage.createMany({
      data: [
        { titleAr: "فحص فني شامل", titleEn: "Full Technical Inspection", features: ["Engine", "Chassis", "Electronics"], sortOrder: 0 },
        { titleAr: "تركيب الكماليات", titleEn: "Accessories Fitting", features: ["Rims", "Brakes", "Lighting"], sortOrder: 1 },
      ],
    });
  }
  console.log(`✔ Seeded ${SEED_PRODUCTS.length} products, ${SEED_SLIDES.length} slides, ${SEED_CATEGORIES.length} categories, admin ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
