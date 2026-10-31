import cron from "node-cron";
import { prisma } from "../lib/prisma";

/**
 * Result object returned by the auto-close function for manual-trigger responses.
 */
export interface AutoCloseResult {
  processed: number;
  closedIds: number[];
  errors: { subscriptionId: number; error: string }[];
}

/**
 * Auto-close expired subscriptions.
 *
 * Finds all ACTIVE subscriptions where:
 *   - plan.autoClose = true
 *   - expiryDate is not null
 *   - expiryDate < start of today
 *
 * For each matching subscription, atomically:
 *   1. Updates status to CLOSED.
 *   2. Creates a SubscriptionEvent (fromStatus: ACTIVE, toStatus: CLOSED).
 *
 * One subscription's failure does NOT prevent processing of others.
 */
export async function autoCloseExpiredSubscriptions(): Promise<AutoCloseResult> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan: { autoClose: true },
      expiryDate: {
        not: null,
        lt: startOfToday,
      },
    },
    select: {
      id: true,
      number: true,
    },
  });

  const result: AutoCloseResult = {
    processed: expiredSubscriptions.length,
    closedIds: [],
    errors: [],
  };

  for (const sub of expiredSubscriptions) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "CLOSED" },
        });

        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: sub.id,
            fromStatus: "ACTIVE",
            toStatus: "CLOSED",
            userId: null,
            note: "Automatically closed because subscription expired",
          },
        });
      });

      result.closedIds.push(sub.id);
      console.log(
        `[auto-close] Closed subscription ${sub.number ?? sub.id} (expired)`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ subscriptionId: sub.id, error: message });
      console.error(
        `[auto-close] Failed to close subscription ${sub.number ?? sub.id}: ${message}`
      );
    }
  }

  console.log(
    `[auto-close] Finished: ${result.closedIds.length}/${result.processed} closed, ${result.errors.length} errors`
  );

  return result;
}

/**
 * Registers the subscription cron jobs.
 * Runs daily at 00:10.
 */
export function registerSubscriptionJobs(): void {
  cron.schedule("10 0 * * *", async () => {
    console.log("[auto-close] Running scheduled auto-close job...");
    try {
      await autoCloseExpiredSubscriptions();
    } catch (err) {
      console.error("[auto-close] Unhandled error in cron job:", err);
    }
  });

  console.log("[jobs] Subscription auto-close job scheduled (daily at 00:10)");
}

