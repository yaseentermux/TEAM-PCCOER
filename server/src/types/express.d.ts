import type { Role } from "@prisma/client";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}
