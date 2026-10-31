// [M4] Performance demo data: 500 customers, 5,000 subscriptions, 30,000 invoices + payments (npm run seed:bulk).
// Run after the normal seed. Uses createMany / set-based SQL, so it takes seconds, not minutes.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
import { prisma } from "../../src/lib/prisma";

const SUBS = 5000, INVOICES_PER_SUB = 6, CUSTOMERS = 500;

async function main() {
  const t0 = Date.now();
  const [plans, products, anyUser] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true } }),
    prisma.product.findMany({ where: { isActive: true }, include: { taxes: true } }),
    prisma.user.findFirst({ select: { passwordHash: true } }),
  ]);
  if (!plans.length || !products.length || !anyUser) throw new Error("Run `npm run seed` first (needs plans, products, users)");

  const tag = Date.now().toString(36);
  const customers = await prisma.user.createManyAndReturn({
    data: Array.from({ length: CUSTOMERS }, (_, i) => ({
      name: `Bulk Customer ${i + 1}`, company: `Bulk Co ${i + 1}`, email: `bulk-${tag}-${i + 1}@brightloop.test`,
      passwordHash: anyUser.passwordHash, role: "CUSTOMER" as const,
    })),
    select: { id: true },
  });

  const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "PAUSED", "CLOSED", "CONFIRMED", "QUOTATION"] as const;
  const subs = await prisma.subscription.createManyAndReturn({
    data: Array.from({ length: SUBS }, (_, i) => {
      const status = statuses[i % statuses.length];
      const start = dayjs.utc().subtract(INVOICES_PER_SUB, "month").startOf("day");
      return {
        customerId: customers[i % customers.length].id, planId: plans[i % plans.length].id, status,
        startDate: start.toDate(), paymentTerms: "NET_15" as const,
        nextInvoiceDate: status === "ACTIVE" ? start.add(INVOICES_PER_SUB + 1, "month").toDate() : null,
      };
    }),
    select: { id: true, customerId: true },
  });

  const lines = subs.map((s, i) => {
    const p = products[i % products.length];
    const quantity = 1 + (i % 15);
    return { subscriptionId: s.id, productId: p.id, quantity, unitPrice: p.salesPrice, amount: Number(p.salesPrice) * quantity };
  });
  await prisma.subscriptionLine.createMany({ data: lines });

  const invoiceRows = subs.flatMap((s, i) => {
    const amount = lines[i].amount;
    const taxRate = Number(products[i % products.length].taxes[0]?.amount ?? 0) / 100;
    const tax = Math.round(amount * taxRate * 100) / 100;
    return Array.from({ length: INVOICES_PER_SUB }, (_, k) => {
      const periodStart = dayjs.utc().subtract(INVOICES_PER_SUB - k, "month").startOf("day");
      const recent = k >= INVOICES_PER_SUB - 1;
      const status = recent ? (i % 2 ? "CONFIRMED" : "DRAFT") : (i + k) % 9 === 0 ? "CONFIRMED" : "PAID";
      const total = amount + tax;
      return {
        subscriptionId: s.id, customerId: s.customerId, status: status as "DRAFT" | "CONFIRMED" | "PAID",
        invoiceDate: periodStart.toDate(), dueDate: periodStart.add(15, "day").endOf("day").toDate(),
        periodStart: periodStart.toDate(), periodEnd: periodStart.add(1, "month").subtract(1, "day").endOf("day").toDate(),
        subtotal: amount, taxTotal: tax, total, amountPaid: status === "PAID" ? total : 0,
      };
    });
  });
  for (let i = 0; i < invoiceRows.length; i += 5000) {
    await prisma.invoice.createMany({ data: invoiceRows.slice(i, i + 5000), skipDuplicates: true });
  }

  const minSub = subs[0].id;
  await prisma.$executeRaw`UPDATE "Subscription" SET number = 'SUB-' || lpad(id::text, 5, '0') WHERE number IS NULL`;
  await prisma.$executeRaw`UPDATE "Invoice" SET number = 'INV-' || lpad(id::text, 5, '0') WHERE number IS NULL`;
  await prisma.$executeRaw`
    INSERT INTO "InvoiceLine" ("invoiceId", "productId", description, quantity, "unitPrice", "taxAmount", amount)
    SELECT i.id, l."productId", p.name, l.quantity, l."unitPrice", i."taxTotal", l.amount
    FROM "Invoice" i JOIN "SubscriptionLine" l ON l."subscriptionId" = i."subscriptionId" JOIN "Product" p ON p.id = l."productId"
    WHERE i."subscriptionId" >= ${minSub}`;
  await prisma.$executeRaw`
    INSERT INTO "Payment" ("invoiceId", method, amount, "paymentDate", note)
    SELECT id, (ARRAY['BANK_TRANSFER','UPI','CARD','CASH'])[1 + id % 4]::"PaymentMethod", total, "invoiceDate" + interval '5 days', 'Bulk seed'
    FROM "Invoice" WHERE "subscriptionId" >= ${minSub} AND status = 'PAID'`;
  await prisma.$executeRawUnsafe(`ANALYZE`);

  console.log(`[seed:bulk] ${CUSTOMERS} customers, ${SUBS} subscriptions, ${invoiceRows.length} invoices in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
