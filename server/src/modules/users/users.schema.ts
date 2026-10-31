import { z } from "zod";
import { Role } from "@prisma/client";
import { emailSchema, passwordSchema } from "../auth/auth.schema";

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum([Role.ADMIN, Role.INTERNAL], {
    message: "Role must be ADMIN or INTERNAL",
  }),
  phone: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  role: z.nativeEnum(Role).optional(),
  phone: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export const setUserActiveSchema = z.object({
  isActive: z.boolean({ message: "isActive is required" }),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid user ID"),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;
