import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./customers.schema";
import { customersService } from "./customers.service";

/**
 * GET /api/customers?search=
 * Searchable, paginated customer list.
 */
export const listCustomers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = listCustomersQuerySchema.parse(req.query);
    const result = await customersService.listCustomers(query);
    res.json(result);
  },
);

/**
 * GET /api/customers/:id
 * Retrieve customer details by ID.
 */
export const getCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = customerIdParamSchema.parse(req.params);
    const customer = await customersService.getCustomerById(id);
    res.json({ data: customer });
  },
);

/**
 * POST /api/customers
 * Create a new customer with CUSTOMER role and generate set-password link.
 */
export const createCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = createCustomerSchema.parse(req.body);
    const customer = await customersService.createCustomer(input);
    res.status(201).json({ data: customer });
  },
);

/**
 * PATCH /api/customers/:id
 * Update customer details.
 */
export const updateCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = customerIdParamSchema.parse(req.params);
    const input = updateCustomerSchema.parse(req.body);
    const customer = await customersService.updateCustomer(id, input);
    res.json({ data: customer });
  },
);
