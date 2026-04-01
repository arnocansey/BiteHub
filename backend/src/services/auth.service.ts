import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { UserRole } from "../generated/prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt";

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  businessName?: string;
  vehicleType?: string;
  title?: string;
}

const publicAdminProfileSelect = {
  id: true,
  userId: true,
  title: true,
  isSuperAdmin: true
} as const;

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        customerProfile:
          input.role === UserRole.CUSTOMER ? { create: {} } : undefined,
        vendorProfile:
          input.role === UserRole.VENDOR
            ? { create: { businessName: input.businessName ?? "New Vendor" } }
            : undefined,
        riderProfile:
          input.role === UserRole.RIDER
            ? { create: { vehicleType: input.vehicleType } }
            : undefined,
        adminProfile:
          input.role === UserRole.ADMIN
            ? { create: { title: input.title ?? "Platform Administrator" } }
            : undefined
      },
      include: {
        adminProfile: {
          select: publicAdminProfileSelect
        }
      }
    });

    const payload = { sub: user.id, role: user.role, email: user.email };

    return {
      user,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload)
    };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        adminProfile: {
          select: publicAdminProfileSelect
        }
      }
    });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const payload = { sub: user.id, role: user.role, email: user.email };

    return {
      user,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload)
    };
  },

  async me(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        vendorProfile: true,
        riderProfile: true,
        adminProfile: {
          select: publicAdminProfileSelect
        }
      }
    });
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload)
    };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        message: "If an account exists for this email, a reset link has been prepared."
      };
    }

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    });

    const token = crypto.randomBytes(24).toString("hex");
    const reset = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Password reset requested",
        body: "A password reset token was issued for your account.",
        payload: {
          token: reset.token,
          expiresAt: reset.expiresAt
        }
      }
    });

    return {
      message: "Password reset instructions created.",
      ...(env.nodeEnv === "production" ? {} : { resetToken: reset.token })
    };
  },

  async resetPassword(token: string, password: string) {
    const reset = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new ApiError(400, "Reset token is invalid or expired");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() }
      })
    ]);

    return {
      message: "Password updated successfully."
    };
  }
};
