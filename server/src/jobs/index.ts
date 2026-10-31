import { startBillingJobs } from "../modules/billing/billing.jobs";

export function registerJobs(): void {
  // Member-owned jobs (auto-close, billing) will be registered here
  // during integration. Do not add other members' job logic in Phase 0.
  startBillingJobs(); // [M4] daily billing run at 00:05
}
