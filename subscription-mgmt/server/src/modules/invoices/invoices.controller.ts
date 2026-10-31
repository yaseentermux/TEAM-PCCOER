// [M4] HTTP handlers for invoices
import type { Request, Response } from "express";
import * as svc from "./invoices.service.js";
import type { ListInvoicesQuery } from "./invoices.schema.js";

const id = (req: Request) => Number(req.params.id);

export const list = async (req: Request, res: Response) => { res.json(await svc.list(req.query as unknown as ListInvoicesQuery)); };
export const stats = async (_req: Request, res: Response) => { res.json({ data: await svc.stats() }); };
export const detail = async (req: Request, res: Response) => { res.json({ data: await svc.getDetail(id(req)) }); };
export const fromSubscription = async (req: Request, res: Response) => {
  res.status(201).json({ data: await svc.createFromSubscription(Number(req.params.subscriptionId)) });
};
export const confirm = async (req: Request, res: Response) => { res.json({ data: await svc.confirm(id(req)) }); };
export const cancel = async (req: Request, res: Response) => { res.json({ data: await svc.cancel(id(req)) }); };
export const send = async (req: Request, res: Response) => { res.json({ data: await svc.send(id(req)) }); };
export const remind = async (req: Request, res: Response) => { res.json({ data: await svc.remind(id(req)) }); };

export const pdf = async (req: Request, res: Response) => {
  const { filename, buffer } = await svc.pdf(id(req));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${req.query.download ? "attachment" : "inline"}; filename="${filename}"`);
  res.send(buffer);
};
