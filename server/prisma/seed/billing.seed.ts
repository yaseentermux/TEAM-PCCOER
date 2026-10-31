// [M4] Bills the seeded ACTIVE subscriptions up to today, confirms invoices, adds full/partial payments, leaves some overdue.
import type { PrismaClient, PaymentMethod } from "@prisma/client";
import dayjs from "dayjs";
import { runBilling, generateInvoice } from "../../src/modules/billing/billing.service";
import { registerPayment } from "../../src/modules/payments/payments.service";

export async function seedBilling(prisma: PrismaClient) {
  // 1. First ensure all active subscriptions get billed
  const activeSubs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  for (const s of activeSubs) {
    try {
      await generateInvoice(s.id, new Date());
    } catch {
      // Ignore if already billed or skipped
    }
  }

  const run = await runBilling("MANUAL");

  // Keep the newest invoice of only 1 subscription in DRAFT, so the confirm flow can be demoed.
  const invoices = await prisma.invoice.findMany({ orderBy: [{ subscriptionId: "asc" }, { periodStart: "asc" }] });
  const latestBySub = new Map<number, number>();
  for (const inv of invoices) latestBySub.set(inv.subscriptionId, inv.id);
  const draftIds = new Set([...latestBySub.values()].slice(0, 1));
  await prisma.invoice.updateMany({ where: { id: { notIn: [...draftIds] } }, data: { status: "CONFIRMED" } });

  const staff = await prisma.user.findFirst({ where: { role: "INTERNAL" } });
  const methods: PaymentMethod[] = ["BANK_TRANSFER", "UPI", "CARD", "CASH"];
  let paid = 0, partial = 0;
  for (const [i, inv] of invoices.entries()) {
    if (draftIds.has(inv.id)) continue;
    const total = Number(inv.total);
    if (i % 3 === 0) continue; // leave some unpaid so user can click "Pay Now" or "Register payment"
    const amount = i % 2 === 0 ? Math.round(total * 0.5 * 100) / 100 : total; // some partial payments
    await registerPayment(
      {
        invoiceId: inv.id,
        method: methods[i % methods.length],
        amount,
        paymentDate: dayjs(inv.invoiceDate).add(2, "day").toDate(),
        note: `Ref TXN${100000 + inv.id}`,
      },
      staff?.id ?? null,
    );
    amount < total ? partial++ : paid++;
  }
  console.log(`[seed] billing: ${invoices.length} invoices (${draftIds.size} left in draft), ${paid} paid, ${partial} partially paid`);
}
