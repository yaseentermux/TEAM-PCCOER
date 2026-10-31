// [M4] HTTP handlers for customer invoice portal
import type { Request, Response } from "express";
import * as svc from "./portal-invoices.service";
import type { ListInvoicesQuery } from "../invoices/invoices.schema";

const me = (req: Request) => req.user!.id;
const id = (req: Request) => Number(req.params.id);

export const list = async (req: Request, res: Response) => { res.json(await svc.list(me(req), req.query as unknown as ListInvoicesQuery)); };
export const stats = async (req: Request, res: Response) => { res.json({ data: await svc.stats(me(req)) }); };
export const detail = async (req: Request, res: Response) => { res.json({ data: await svc.detail(me(req), id(req)) }); };
export const pay = async (req: Request, res: Response) => { res.json({ data: await svc.pay(me(req), id(req)) }); };
export const pdf = async (req: Request, res: Response) => {
  const { filename, buffer } = await svc.pdf(me(req), id(req));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${req.query.download ? "attachment" : "inline"}; filename="${filename}"`);
  res.send(buffer);
};
