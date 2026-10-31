import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../lib/app-error";
import { prisma } from "../../lib/prisma";
import { safeUserSelect, type SafeUser } from "../auth/auth.service";
import type {
  CreateUserInput,
  ListUsersQuery,
  SetUserActiveInput,
  UpdateUserInput,
} from "./users.schema";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * List users with optional role filtering and pagination.
 */
export async function listUsers(
  query: ListUsersQuery,
): Promise<PaginatedResult<SafeUser>> {
  const { role, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (role) {
    where.role = role;
  }

  const [total, users] = await Promise.all([
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
    data: users,
    meta: {
      page,
      limit,
      total,
    },
  };
}

/**
 * Create a new user with ADMIN or INTERNAL role.
 */
export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("Email is already in use", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      phone: input.phone ? input.phone.trim() : null,
      company: input.company ? input.company.trim() : null,
      address: input.address ? input.address.trim() : null,
      isActive: true,
    },
    select: safeUserSelect,
  });

  return user;
}

/**
 * Update permitted user details.
 */
export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.role !== undefined) data.role = input.role;
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

/**
 * Activate or deactivate a user.
 * Prevents an admin from deactivating their own account.
 */
export async function setUserActive(
  currentAdminId: number,
  targetUserId: number,
  input: SetUserActiveInput,
): Promise<SafeUser> {
  if (currentAdminId === targetUserId && !input.isActive) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: input.isActive },
    select: safeUserSelect,
  });

  return updated;
}

export const usersService = {
  listUsers,
  createUser,
  updateUser,
  setUserActive,
};
