import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./users.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");
  await seedUsers();
  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
