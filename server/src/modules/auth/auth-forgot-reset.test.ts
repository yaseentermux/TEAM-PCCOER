import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { env } from "../../config/env";
import * as mailer from "../../lib/mailer";
import {
  forgotPassword,
  resetPassword,
  login,
} from "./auth.service";
import { PASSWORD_REGEX } from "./auth.schema";

describe("Forgot Password & Reset Password Flow", () => {
  // In-memory test state to simulate Prisma database safely
  let users: any[] = [];
  let resetTokens: any[] = [];
  let tokenIdCounter = 1;
  let userIdCounter = 1;

  beforeEach(() => {
    // Reset test state
    users = [
      {
        id: 1,
        name: "Active Customer",
        email: "customer@brightloop.com",
        passwordHash: bcrypt.hashSync("OldP@ssw0rd9!", 10),
        role: Role.CUSTOMER,
        phone: "9876543210",
        company: "Brightloop",
        address: "Bangalore",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Inactive User",
        email: "inactive@brightloop.com",
        passwordHash: bcrypt.hashSync("OldP@ssw0rd9!", 10),
        role: Role.CUSTOMER,
        phone: null,
        company: null,
        address: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    resetTokens = [];
    tokenIdCounter = 1;
    userIdCounter = 3;

    // Reset mailer transporter
    mailer.resetTransporterInstance();

    // Mock Prisma methods
    (prisma.user.findUnique as any) = async ({ where }: any) => {
      if (where.id) return users.find((u) => u.id === where.id) || null;
      if (where.email) return users.find((u) => u.email === where.email) || null;
      return null;
    };

    (prisma.user.update as any) = async ({ where, data }: any) => {
      const user = users.find((u) => u.id === where.id);
      if (!user) throw new Error("User not found in mock");
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    };

    (prisma.passwordResetToken.create as any) = async ({ data }: any) => {
      const record = {
        id: tokenIdCounter++,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
        user: users.find((u) => u.id === data.userId),
      };
      resetTokens.push(record);
      return record;
    };

    (prisma.passwordResetToken.findUnique as any) = async ({ where, include }: any) => {
      const token = resetTokens.find((t) => t.tokenHash === where.tokenHash);
      if (!token) return null;
      if (include?.user) {
        token.user = users.find((u) => u.id === token.userId);
      }
      return token;
    };

    (prisma.passwordResetToken.update as any) = async ({ where, data }: any) => {
      const token = resetTokens.find((t) => t.id === where.id);
      if (!token) throw new Error("Token not found in mock");
      Object.assign(token, data);
      return token;
    };

    (prisma.passwordResetToken.updateMany as any) = async ({ where, data }: any) => {
      let count = 0;
      for (const token of resetTokens) {
        if (token.userId === where.userId && (where.usedAt === null ? token.usedAt === null : true)) {
          Object.assign(token, data);
          count++;
        }
      }
      return { count };
    };

    (prisma.$transaction as any) = async (fn: any) => {
      return fn({
        user: { update: prisma.user.update },
        passwordResetToken: {
          update: prisma.passwordResetToken.update,
          updateMany: prisma.passwordResetToken.updateMany,
        },
      });
    };
  });

  // Test 1: Registered email forgot-password request
  test("1. Registered active email generates secure reset token with 30-min expiry", async () => {
    const res = await forgotPassword({ email: "CUSTOMER@brightloop.com " });
    assert.strictEqual(res.success, true);
    assert.strictEqual(typeof res.message, "string");

    // Token hash must be stored in DB
    assert.strictEqual(resetTokens.length, 1);
    const tokenRecord = resetTokens[0];
    assert.strictEqual(tokenRecord.userId, 1);
    assert.strictEqual(tokenRecord.usedAt, null);

    // Expiry must be approximately 30 minutes in the future
    const now = Date.now();
    const diffMins = (tokenRecord.expiresAt.getTime() - now) / (60 * 1000);
    assert.ok(diffMins >= 29 && diffMins <= 30.1, "Token expiry must be 30 minutes");
  });

  // Test 2: Unregistered email response
  test("2. Unregistered email returns generic success without creating token or revealing status", async () => {
    const res = await forgotPassword({ email: "unknown@nowhere.com" });
    assert.strictEqual(res.success, true);
    assert.strictEqual(
      res.message,
      "If an account with that email exists, a password reset link has been sent.",
    );
    // No token created for unregistered email
    assert.strictEqual(resetTokens.length, 0);
  });

  // Test 2b: Inactive user forgot-password request
  test("2b. Inactive user returns generic success without creating token or revealing status", async () => {
    const res = await forgotPassword({ email: "inactive@brightloop.com" });
    assert.strictEqual(res.success, true);
    assert.strictEqual(resetTokens.length, 0);
  });

  // Test 3: Token generation and SHA-256 hashing verification
  test("3. Stored token is SHA-256 hash and raw token is not stored in plaintext", async () => {
    await forgotPassword({ email: "customer@brightloop.com" });
    const tokenRecord = resetTokens[0];
    // SHA-256 hex is exactly 64 characters
    assert.strictEqual(tokenRecord.tokenHash.length, 64);
    assert.match(tokenRecord.tokenHash, /^[a-f0-9]{64}$/);
  });

  // Test 4: Invalid token rejection
  test("4. Invalid/non-existent token is rejected with 400", async () => {
    await assert.rejects(
      async () => {
        await resetPassword({
          token: "completely-invalid-nonexistent-token",
          newPassword: "NewStrongPassword1!",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, "Invalid or expired reset token");
        return true;
      },
    );
  });

  // Test 5: Expired token rejection
  test("5. Expired token is rejected with 400", async () => {
    const rawToken = "my-expired-test-token-value-123456789";
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    resetTokens.push({
      id: 99,
      userId: 1,
      tokenHash,
      expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 mins ago
      usedAt: null,
      user: users[0],
    });

    await assert.rejects(
      async () => {
        await resetPassword({
          token: rawToken,
          newPassword: "NewStrongPassword1!",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, "Invalid or expired reset token");
        return true;
      },
    );
  });

  // Test 6: Reusing an already-used token rejection
  test("6. Reusing an already-used token is rejected with 400", async () => {
    const rawToken = "my-already-used-test-token-123456789";
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    resetTokens.push({
      id: 100,
      userId: 1,
      tokenHash,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      usedAt: new Date(Date.now() - 2 * 60 * 1000), // Already used
      user: users[0],
    });

    await assert.rejects(
      async () => {
        await resetPassword({
          token: rawToken,
          newPassword: "NewStrongPassword1!",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, "Invalid or expired reset token");
        return true;
      },
    );
  });

  // Test 7: Successful password reset & token invalidation
  test("7. Successful password reset updates password and marks token used", async () => {
    const rawToken = "valid-active-token-to-reset-password-123";
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    resetTokens.push({
      id: 101,
      userId: 1,
      tokenHash,
      expiresAt: new Date(Date.now() + 25 * 60 * 1000),
      usedAt: null,
      user: users[0],
    });

    // Also add an older unused token for the same user to verify multi-token invalidation
    const olderRawToken = "older-unused-token-for-user-1";
    const olderTokenHash = crypto.createHash("sha256").update(olderRawToken).digest("hex");
    resetTokens.push({
      id: 102,
      userId: 1,
      tokenHash: olderTokenHash,
      expiresAt: new Date(Date.now() + 25 * 60 * 1000),
      usedAt: null,
      user: users[0],
    });

    const res = await resetPassword({
      token: rawToken,
      newPassword: "BrandNewSecurePassword9#",
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.message, "Password has been reset successfully");

    // Both tokens for this user must now be marked used
    const primary = resetTokens.find((t) => t.id === 101);
    const older = resetTokens.find((t) => t.id === 102);
    assert.ok(primary.usedAt !== null, "Primary token must have usedAt timestamp");
    assert.ok(older.usedAt !== null, "All prior tokens for user must be invalidated");

    // User's passwordHash must match the new password
    const user = users.find((u) => u.id === 1);
    const matchesNew = await bcrypt.compare("BrandNewSecurePassword9#", user.passwordHash);
    assert.strictEqual(matchesNew, true);
  });

  // Test 8: Login with new password succeeds
  test("8. User can log in with new password", async () => {
    // User 1 has password "BrandNewSecurePassword9#" from Test 7
    users[0].passwordHash = await bcrypt.hash("BrandNewSecurePassword9#", 10);

    const loginRes = await login({
      email: "customer@brightloop.com",
      password: "BrandNewSecurePassword9#",
    });

    assert.ok(loginRes.token, "Must return JWT token");
    assert.strictEqual(loginRes.user.email, "customer@brightloop.com");
  });

  // Test 9: Login with old password fails
  test("9. User cannot log in with old password (rejected with 401)", async () => {
    users[0].passwordHash = await bcrypt.hash("BrandNewSecurePassword9#", 10);

    await assert.rejects(
      async () => {
        await login({
          email: "customer@brightloop.com",
          password: "OldP@ssw0rd9!",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.message, "Invalid email or password");
        return true;
      },
    );
  });

  // Test 10: SMTP failure handling (never return fake success when delivery fails)
  test("10a. When SMTP is configured and delivery fails, forgotPassword throws 500 error", async () => {
    // Mock SMTP configured
    (env as any).SMTP_HOST = "smtp.mailtrap.io";
    (env as any).SMTP_USER = "user";
    (env as any).SMTP_PASS = "pass";

    // Inject mock transporter that rejects delivery
    const mockFailingTransporter = {
      sendMail: async () => {
        throw new Error("SMTP connection refused: connect ECONNREFUSED 127.0.0.1:587");
      },
    } as any;
    mailer.setTransporterInstance(mockFailingTransporter);

    await assert.rejects(
      async () => {
        await forgotPassword({ email: "customer@brightloop.com" });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 500);
        assert.strictEqual(
          err.message,
          "Failed to deliver password reset email. Please try again later.",
        );
        return true;
      },
    );

    // Clean up mock transporter and env
    mailer.resetTransporterInstance();
    (env as any).SMTP_HOST = "";
    (env as any).SMTP_USER = "";
    (env as any).SMTP_PASS = "";
  });

  test("10b. When SMTP is configured and delivery succeeds, forgotPassword reports emailSent: true", async () => {
    (env as any).SMTP_HOST = "smtp.mailtrap.io";
    (env as any).SMTP_USER = "user";
    (env as any).SMTP_PASS = "pass";

    let emailSentTo = "";
    const mockSuccessTransporter = {
      sendMail: async (opts: any) => {
        emailSentTo = opts.to;
        return { messageId: "mock-12345" };
      },
    } as any;
    mailer.setTransporterInstance(mockSuccessTransporter);

    const res = await forgotPassword({ email: "customer@brightloop.com" });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.emailSent, true);
    assert.strictEqual(emailSentTo, "customer@brightloop.com");

    mailer.resetTransporterInstance();
    (env as any).SMTP_HOST = "";
    (env as any).SMTP_USER = "";
    (env as any).SMTP_PASS = "";
  });

  test("10c. When SMTP is not configured, forgotPassword generates token and clearly reports emailSent: false", async () => {
    (env as any).SMTP_HOST = "";
    (env as any).SMTP_USER = "";
    (env as any).SMTP_PASS = "";
    mailer.resetTransporterInstance();

    const res = await forgotPassword({ email: "customer@brightloop.com" });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.emailSent, false);
    assert.strictEqual(resetTokens.length, 1);
  });
});
