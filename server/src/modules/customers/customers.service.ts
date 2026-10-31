import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Role, type Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../lib/app-error";
import { sendPasswordResetEmail } from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import { safeUserSelect, type SafeUser } from "../auth/auth.service";
import type { PaginatedResult } from "../users/users.service";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "./customers.schema";

/**
 * List customers (users with role CUSTOMER) with search across name, email, and company.
 */
export async function listCustomers(
  query: ListCustomersQuery,
): Promise<PaginatedResult<SafeUser>> {
  const { search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: Role.CUSTOMER,
  };

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { company: { contains: term, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    data: customers,
    meta: {
      page,
      limit,
      total,
    },
  };
}

/**
 * Get customer by id.
 */
export async function getCustomerById(id: number): Promise<SafeUser> {
  const customer = await prisma.user.findFirst({
    where: {
      id,
      role: Role.CUSTOMER,
    },
    select: safeUserSelect,
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return customer;
}

/**
 * Create a customer with role CUSTOMER:
 * - Generates cryptographically random temporary password (never exposed in API response).
 * - Hashes temporary password using bcryptjs.
 * - Creates customer in database with role CUSTOMER.
 * - Generates secure 32-byte password-setup/reset token with 30-minute expiry.
 * - Stores SHA-256 hash in PasswordResetToken.
 * - Sends set-password link using existing mailer.
 * - Gracefully handles SMTP unavailability without breaking customer creation.
 */
export async function createCustomer(
  input: CreateCustomerInput,
): Promise<SafeUser> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("Email is already in use", 409);
  }

  // Generate cryptographically random temporary password meeting complexity requirements
  const randomHex = crypto.randomBytes(16).toString("hex");
  const temporaryPassword = `Tmp!${randomHex}Aa1`;
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const customer = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: Role.CUSTOMER,
      phone: input.phone ? input.phone.trim() : null,
      company: input.company ? input.company.trim() : null,
      address: input.address ? input.address.trim() : null,
      isActive: true,
    },
    select: safeUserSelect,
  });

  // Generate secure password setup token (30-minute expiration)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: customer.id,
      tokenHash,
      expiresAt,
    },
  });

  // Send password setup link: CLIENT_URL/reset-password?token=...
  const setPasswordUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}`;
  try {
    await sendPasswordResetEmail(customer.email, setPasswordUrl);
  } catch (err) {
    console.warn(
      `[customers.service] Failed to send set-password email to ${customer.email}:`,
      err,
    );
  }

  return customer;
}

/**
 * Update customer details.
 */
export async function updateCustomer(
  id: number,
  input: UpdateCustomerInput,
): Promise<SafeUser> {
  const existing = await prisma.user.findFirst({
    where: {
      id,
      role: Role.CUSTOMER,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Customer not found", 404);
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.phone !== undefined) {
    data.phone = input.phone ? input.phone.trim() : null;
  }
  if (input.company !== undefined) {
    data.company = input.company ? input.company.trim() : null;
  }
  if (input.address !== undefined) {
    data.address = input.address ? input.address.trim() : null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: safeUserSelect,
  });

  return updated;
}

export const customersService = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
};
