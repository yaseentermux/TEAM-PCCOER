import type { NextFunction, Request, Response } from "express";

export function responseTime(_req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  const originalWriteHead = res.writeHead.bind(res);

  res.writeHead = ((...args: unknown[]) => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    res.setHeader("X-Response-Time", `${elapsedMs.toFixed(1)}ms`);
    return originalWriteHead(...(args as Parameters<Response["writeHead"]>));
  }) as typeof res.writeHead;

  next();
}
