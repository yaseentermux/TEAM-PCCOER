// [M4] HTTP handlers for reports
import type { Request, Response } from "express";
import * as svc from "./reports.service";
import type { ReportFilter } from "./reports.schema";

const f = (req: Request) => req.query as unknown as ReportFilter;

export const summary = async (req: Request, res: Response) => { res.json({ data: await svc.summary(f(req)) }); };
export const revenueTrend = async (req: Request, res: Response) => { res.json({ data: await svc.revenueTrend(f(req).months, f(req).planId) }); };
export const byStatus = async (req: Request, res: Response) => { res.json({ data: await svc.subscriptionsByStatus(f(req).planId) }); };
export const topPlans = async (req: Request, res: Response) => { res.json({ data: await svc.topPlans(f(req).limit) }); };
export const overdue = async (req: Request, res: Response) => { res.json({ data: await svc.overdue(f(req).limit, f(req).planId) }); };
