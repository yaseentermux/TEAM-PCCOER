import type { Request, Response, NextFunction } from "express";

export function timing(_req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const end = res.end.bind(res);
  res.end = ((...args: any[]) => {
    if (!res.headersSent) res.setHeader("X-Response-Time", `${Number(process.hrtime.bigint() - start) / 1e6}ms`);
    return (end as any)(...args);
  }) as any;
  next();
}
