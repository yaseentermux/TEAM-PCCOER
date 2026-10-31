// [M4] zod schemas for billing endpoints
import { z } from "zod";

export const runsQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) });
