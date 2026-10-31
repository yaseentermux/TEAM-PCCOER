import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log("Seeding development users...");

  // Password satisfying password complexity policy (/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/)
  const defaultPassword = "Password@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const users = [
    {
      name: "System Administrator",
      email: "admin@brightloop.io",
      passwordHash,
      role: Role.ADMIN,
      company: "Brightloop Software",
      phone: "+1-555-0101",
      address: "100 Innovation Way, Suite 400",
      isActive: true,
    },
    {
      name: "Sales Representative",
      email: "staff@brightloop.io",
      passwordHash,
      role: Role.INTERNAL,
      company: "Brightloop Software",
      phone: "+1-555-0102",
      address: "100 Innovation Way, Suite 400",
      isActive: true,
    },
    {
      name: "Acme Customer",
      email: "customer@acme.com",
      passwordHash,
      role: Role.CUSTOMER,
      company: "Acme Corporation",
      phone: "+1-555-0103",
      address: "500 Market Street",
      isActive: true,
    },
    // Also upsert the old emails to avoid breaking anyone who already seeded
    {
      name: "System Administrator",
      email: "admin@brightloop.com",
      passwordHash,
      role: Role.ADMIN,
      company: "Brightloop Software",
      phone: "+1-555-0101",
      address: "100 Innovation Way, Suite 400",
      isActive: true,
    },
    {
      name: "Sales Representative",
      email: "staff@brightloop.com",
      passwordHash,
      role: Role.INTERNAL,
      company: "Brightloop Software",
      phone: "+1-555-0102",
      address: "100 Innovation Way, Suite 400",
      isActive: true,
    },
    {
      name: "Acme Customer",
      email: "customer@brightloop.com",
      passwordHash,
      role: Role.CUSTOMER,
      company: "Acme Corporation",
      phone: "+1-555-0103",
      address: "500 Market Street",
      isActive: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        company: user.company,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        passwordHash: user.passwordHash,
      },
      create: user,
    });
    console.log(`  - Seeded user: ${user.email} (${user.role})`);
  }

  console.log("User seeding complete.");
  console.log("");
  console.log("=== LOGIN CREDENTIALS ===");
  console.log("Admin:    admin@brightloop.io  /  Password@123");
  console.log("Staff:    staff@brightloop.io  /  Password@123");
  console.log("Customer: customer@acme.com    /  Password@123");
  console.log("=========================");
}

// Run standalone if executed directly
if (require.main === module) {
  seedUsers()
    .catch((err) => {
      console.error("Error during user seeding:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
