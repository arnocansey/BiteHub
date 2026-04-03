import { UserRole } from "../generated/prisma/client";
import { z } from "zod";

const baseRegisterSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  password: z.string().min(8)
});

export const adminTitleValues = [
  "Admin User Manager",
  "Admin Rider Manager",
  "Admin Finance Manager",
  "Admin Customer Service Manager",
  "Admin Vendor Manager"
] as const;

export const customerRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(UserRole.CUSTOMER).default(UserRole.CUSTOMER)
});

export const vendorRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(UserRole.VENDOR).default(UserRole.VENDOR),
  businessName: z.string().min(2)
});

export const riderRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(UserRole.RIDER).default(UserRole.RIDER),
  vehicleType: z.string().min(2)
});

export const adminRegisterSchema = baseRegisterSchema.extend({
  role: z.literal(UserRole.ADMIN).default(UserRole.ADMIN),
  title: z.enum(adminTitleValues)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8)
});
