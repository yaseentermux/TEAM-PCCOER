// Seed entry point. Team version (M1) calls: users -> catalog -> subscriptions -> billing.
import { prisma } from "../../src/lib/prisma";
import { seedDevFixtures } from "./dev-fixtures.seed"; // [M4] STAND-IN: replace with the M1/M2/M3 seeds
import { seedBilling } from "./billing.seed";

async function main() {
  await seedDevFixtures(prisma);
  await seedBilling(prisma);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
