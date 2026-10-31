// [M4] Bills the seeded ACTIVE subscriptions up to today, confirms invoices, adds full/partial payments, leaves some overdue.
import type { PrismaClient, PaymentMethod } from "@prisma/client";
import dayjs from "dayjs";
import { runBilling } from "../../src/modules/billing/billing.service.js";
import { registerPayment } from "../../src/modules/payments/payments.service.js";

export async function seedBilling(prisma: PrismaClient) {
  const run = await runBilling("MANUAL");

  // Keep the newest invoice of a few subscriptions in DRAFT, so the confirm flow can be demoed.
  const invoices = await prisma.invoice.findMany({ orderBy: [{ subscriptionId: "asc" }, { periodStart: "asc" }] });
  const latestBySub = new Map<number, number>();
  for (const inv of invoices) latestBySub.set(inv.subscriptionId, inv.id);
  const draftIds = new Set([...latestBySub.values()].filter((_, i) => i % 3 === 0));
  await prisma.invoice.updateMany({ where: { id: { notIn: [...draftIds] } }, data: { status: "CONFIRMED" } });

  const staff = await prisma.user.findFirst({ where: { role: "INTERNAL" } });
  const methods: PaymentMethod[] = ["BANK_TRANSFER", "UPI", "CARD", "CASH"];
  let paid = 0, partial = 0;
  for (const [i, inv] of invoices.entries()) {
    if (draftIds.has(inv.id)) continue;
    const ageDays = dayjs().diff(inv.invoiceDate, "day");
    if (ageDays < 20) continue; // recent: still open
    const total = Number(inv.total);
    if (i % 7 === 3) continue; // left unpaid -> overdue
    const amount = i % 5 === 2 ? Math.round(total * 0.5 * 100) / 100 : total; // some partial payments
    await registerPayment(
      { invoiceId: inv.id, method: methods[i % methods.length], amount,
        paymentDate: dayjs(inv.invoiceDate).add(3 + (i % 10), "day").toDate(), note: `Ref TXN${100000 + inv.id}` },
      staff?.id ?? null,
    );
    amount < total ? partial++ : paid++;
  }
  console.log(`[seed] billing: ${run.created} invoices (${draftIds.size} left in draft), ${paid} paid, ${partial} partially paid`);
}
