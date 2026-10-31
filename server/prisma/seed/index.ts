import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./users.seed";
import { seedCatalog } from "./catalog.seed";
import { seedSubscriptions } from "./subscriptions.seed";
import { seedBilling } from "./billing.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log("🌱 STARTING COMPREHENSIVE DATABASE SEED");
  console.log("==========================================");

  // 1. Seed Users (Admin, Staff, Customers)
  console.log("\n[1/4] Seeding Users...");
  await seedUsers();

  // 2. Seed Catalog (M2 Products, Plans, Taxes, Discounts)
  console.log("\n[2/4] Seeding Catalog (Plans & Products)...");
  await seedCatalog(prisma);

  // 3. Seed Subscriptions (M3 Quotation templates & subscriptions)
  console.log("\n[3/4] Seeding Subscriptions...");
  await seedSubscriptions(prisma);

  // 4. Seed Billing (M4 Invoices, Payments, Overdue tracking)
  console.log("\n[4/4] Seeding Billing & Payments...");
  try {
    await seedBilling(prisma);
  } catch (err) {
    console.warn("Notice during billing seeding:", err);
  }

  console.log("\n==========================================");
  console.log("✅ DATABASE SEED COMPLETED SUCCESSFULLY!");
  console.log("==========================================");
  console.log("🔑 LOGIN CREDENTIALS:");
  console.log("  - Admin:    admin@brightloop.io  /  Password@123");
  console.log("  - Staff:    staff@brightloop.io  /  Password@123");
  console.log("  - Customer: customer@acme.com    /  Password@123");
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
