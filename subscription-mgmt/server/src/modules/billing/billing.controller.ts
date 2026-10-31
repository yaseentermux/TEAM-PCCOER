// [M4] HTTP handlers for billing run + run history
import type { Request, Response } from "express";
import * as billing from "./billing.service.js";

export async function run(_req: Request, res: Response) {
  res.json({ data: await billing.runBilling("MANUAL") });
}

export async function runs(req: Request, res: Response) {
  res.json({ data: await billing.listRuns(Number(req.query.limit)) });
}
