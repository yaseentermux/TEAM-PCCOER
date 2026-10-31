import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixSequences() {
  const tables = ["Plan", "Tax", "Discount", "Product", "ProductVariant", "User", "Subscription", "Invoice", "Payment"];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "${table}";`
      );
      console.log(`Reset sequence for ${table}`);
    } catch (e: any) {
      console.log(`Skipped sequence for ${table}: ${e.message}`);
    }
  }
}

fixSequences()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
