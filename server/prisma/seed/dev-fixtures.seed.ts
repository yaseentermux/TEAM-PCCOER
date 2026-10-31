// [M4] STAND-IN for the M1 (users), M2 (catalog) and M3 (subscriptions) seeds so M4 has data to bill.
// Once the team seeds exist, delete this file and its call in index.ts.
import { PrismaClient, type BillingPeriod, type SubscriptionStatus, type PaymentTerms } from "@prisma/client";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export async function seedDevFixtures(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`TRUNCATE "Payment","InvoiceLine","Invoice","BillingRun","SubscriptionEvent","SubscriptionLine",
    "Subscription","QuotationTemplateLine","QuotationTemplate","Discount","Plan","ProductVariant","Product","Tax",
    "PasswordResetToken","User" RESTART IDENTITY CASCADE`);

  const hash = (p: string) => bcrypt.hashSync(p, 10);
  await prisma.user.createMany({
    data: [
      { name: "Asha Admin", email: "admin@brightloop.test", passwordHash: hash("Admin@1234"), role: "ADMIN" },
      { name: "Sam Staff", email: "staff@brightloop.test", passwordHash: hash("Staff@1234"), role: "INTERNAL" },
    ],
  });
  const customerNames = [
    ["Corner Bakery", "Priya Nair"], ["Northwind Traders", "Arjun Mehta"], ["Bluefin Logistics", "Meera Iyer"],
    ["Sunrise Clinic", "Kabir Shah"], ["Pixel Studio", "Ananya Rao"], ["Greenleaf Retail", "Rohan Das"],
    ["Atlas Manufacturing", "Isha Kapoor"], ["Orbit Telecom", "Vikram Singh"],
  ];
  const custHash = hash("Customer@1234");
  await prisma.user.createMany({
    data: customerNames.map(([company, name], i) => ({
      name, company, email: i === 0 ? "customer@brightloop.test" : `customer${i + 1}@brightloop.test`,
      passwordHash: custHash, role: "CUSTOMER" as const, phone: `+91 98${String(10000000 + i * 1234567).slice(0, 8)}`,
    })),
  });
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { id: "asc" } });

  const gst18 = await prisma.tax.create({ data: { name: "GST 18%", type: "PERCENT", amount: 18 } });
  const gst5 = await prisma.tax.create({ data: { name: "GST 5%", type: "PERCENT", amount: 5 } });

  const crm = await prisma.product.create({
    data: {
      name: "Brightloop CRM", type: "SERVICE", salesPrice: 1000, costPrice: 300, taxes: { connect: [{ id: gst18.id }] },
      variants: { create: [{ attribute: "Brand", value: "Odoo", extraPrice: 560 }, { attribute: "Brand", value: "Generic", extraPrice: 0 }] },
    },
    include: { variants: true },
  });
  const hr = await prisma.product.create({ data: { name: "Brightloop HR", salesPrice: 800, costPrice: 250, taxes: { connect: [{ id: gst18.id }] } } });
  const storage = await prisma.product.create({ data: { name: "Extra Storage 100GB", type: "ADDON", salesPrice: 200, costPrice: 40, taxes: { connect: [{ id: gst5.id }] } } });
  const support = await prisma.product.create({ data: { name: "Priority Support", type: "ADDON", salesPrice: 500, costPrice: 150, taxes: { connect: [{ id: gst18.id }] } } });

  const yearAgo = dayjs.utc().subtract(1, "year").toDate();
  const plan = (name: string, billingPeriod: BillingPeriod, price: number, extra = {}) =>
    prisma.plan.create({ data: { name, billingPeriod, price, startDate: yearAgo, ...extra } });
  const monthly = await plan("Monthly", "MONTHLY", 0);
  const yearly = await plan("Yearly", "YEARLY", 0, { autoClose: true });
  const weekly = await plan("Weekly Starter", "WEEKLY", 99);
  await plan("Daily Trial", "DAILY", 49, { minQuantity: 1 });

  await prisma.discount.create({
    data: { name: "Bulk 10+ seats 10%", type: "PERCENT", value: 10, scope: "PRODUCT", minQuantity: 10, usageLimit: 50,
      startDate: yearAgo, products: { connect: [{ id: crm.id }, { id: hr.id }] } },
  });
  const flat = await prisma.discount.create({
    data: { name: "Flat 500 off", type: "FIXED", value: 500, scope: "SUBSCRIPTION", minPurchase: 5000, startDate: yearAgo },
  });

  const odoo = crm.variants.find((v) => v.value === "Odoo")!;
  type L = { productId: number; variantId?: number; quantity: number; unitPrice: number; taxId: number };
  const subs: { c: number; planId: number; status: SubscriptionStatus; monthsAgo: number; lines: L[]; terms?: PaymentTerms; discountId?: number }[] = [
    { c: 0, planId: monthly.id, status: "ACTIVE", monthsAgo: 4, lines: [{ productId: crm.id, variantId: odoo.id, quantity: 3, unitPrice: 1560, taxId: gst18.id }] },
    { c: 1, planId: monthly.id, status: "ACTIVE", monthsAgo: 3, terms: "NET_15", lines: [{ productId: crm.id, quantity: 12, unitPrice: 1000, taxId: gst18.id }, { productId: support.id, quantity: 1, unitPrice: 500, taxId: gst18.id }] },
    { c: 2, planId: monthly.id, status: "ACTIVE", monthsAgo: 5, terms: "NET_30", discountId: flat.id, lines: [{ productId: hr.id, quantity: 8, unitPrice: 800, taxId: gst18.id }] },
    { c: 3, planId: weekly.id, status: "ACTIVE", monthsAgo: 1, lines: [{ productId: storage.id, quantity: 2, unitPrice: 200, taxId: gst5.id }] },
    { c: 4, planId: yearly.id, status: "ACTIVE", monthsAgo: 2, terms: "NET_30", lines: [{ productId: crm.id, variantId: odoo.id, quantity: 25, unitPrice: 15600, taxId: gst18.id }] },
    { c: 5, planId: monthly.id, status: "ACTIVE", monthsAgo: 2, terms: "NET_7", lines: [{ productId: hr.id, quantity: 4, unitPrice: 800, taxId: gst18.id }, { productId: storage.id, quantity: 1, unitPrice: 200, taxId: gst5.id }] },
    { c: 6, planId: monthly.id, status: "ACTIVE", monthsAgo: 6, terms: "NET_15", lines: [{ productId: crm.id, quantity: 20, unitPrice: 1000, taxId: gst18.id }] },
    { c: 7, planId: monthly.id, status: "PAUSED", monthsAgo: 3, lines: [{ productId: crm.id, quantity: 2, unitPrice: 1000, taxId: gst18.id }] },
    { c: 0, planId: monthly.id, status: "QUOTATION", monthsAgo: 0, lines: [{ productId: support.id, quantity: 1, unitPrice: 500, taxId: gst18.id }] },
    { c: 1, planId: yearly.id, status: "DRAFT", monthsAgo: 0, lines: [{ productId: hr.id, quantity: 30, unitPrice: 9600, taxId: gst18.id }] },
    { c: 2, planId: monthly.id, status: "CONFIRMED", monthsAgo: 0, lines: [{ productId: storage.id, quantity: 5, unitPrice: 200, taxId: gst5.id }] },
    { c: 3, planId: monthly.id, status: "CLOSED", monthsAgo: 8, lines: [{ productId: crm.id, quantity: 1, unitPrice: 1000, taxId: gst18.id }] },
  ];

  for (const s of subs) {
    const startDate = dayjs.utc().subtract(s.monthsAgo, "month").startOf("day").toDate();
    const created = await prisma.subscription.create({
      data: {
        customerId: customers[s.c].id, planId: s.planId, status: s.status, startDate,
        paymentTerms: s.terms ?? "IMMEDIATE", discountId: s.discountId,
        nextInvoiceDate: s.status === "ACTIVE" ? startDate : null,
        lines: {
          create: s.lines.map((l) => ({
            productId: l.productId, variantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice,
            amount: l.quantity * l.unitPrice, taxes: { connect: [{ id: l.taxId }] },
          })),
        },
      },
    });
    await prisma.subscription.update({ where: { id: created.id }, data: { number: `SUB-${String(created.id).padStart(5, "0")}` } });
  }
  console.log(`[seed] dev fixtures: ${customers.length} customers, 4 products, 4 plans, ${subs.length} subscriptions`);
}
