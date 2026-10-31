import { z } from "zod";
import { emailSchema } from "../auth/auth.schema";

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  phone: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  phone: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export const customerIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid customer ID"),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
