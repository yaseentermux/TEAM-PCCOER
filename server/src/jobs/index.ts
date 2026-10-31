import { registerSubscriptionJobs } from "./subscriptions.jobs";

export function registerJobs(): void {
  // M3: Auto-close expired subscriptions daily at 00:10
  registerSubscriptionJobs();
}
