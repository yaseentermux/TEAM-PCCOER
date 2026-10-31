// Seed entry point. Team version (M1) calls: users -> catalog -> subscriptions -> billing.
import { prisma } from "../../src/lib/prisma.js";
import { seedDevFixtures } from "./dev-fixtures.seed.js"; // LOCAL ONLY: replace with the M1/M2/M3 seeds
import { seedBilling } from "./billing.seed.js";

async function main() {
  await seedDevFixtures(prisma);
  await seedBilling(prisma);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
