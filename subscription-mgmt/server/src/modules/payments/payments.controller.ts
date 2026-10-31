// [M4] HTTP handlers for payments
import type { Request, Response } from "express";
import * as svc from "./payments.service.js";
import type { CreatePaymentBody, ListPaymentsQuery } from "./payments.schema.js";

export const create = async (req: Request, res: Response) => {
  res.status(201).json({ data: await svc.registerPayment(req.body as CreatePaymentBody, req.user!.id) });
};
export const list = async (req: Request, res: Response) => { res.json(await svc.list(req.query as unknown as ListPaymentsQuery)); };
export const remove = async (req: Request, res: Response) => { await svc.deletePayment(Number(req.params.id)); res.json({ data: true }); };
