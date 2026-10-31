// [M4] node-cron daily 00:05 billing run (imported by M1 jobs/index.ts)
import cron from "node-cron";
import { runBilling } from "./billing.service";

export function startBillingJobs() {
  cron.schedule("5 0 * * *", async () => {
    try {
      const r = await runBilling("CRON");
      console.log(`[billing] cron run #${r.id}: created ${r.created}, skipped ${r.skipped}, failed ${r.failed}`);
    } catch (e) {
      console.error("[billing] cron run failed", e);
    }
  });
}
