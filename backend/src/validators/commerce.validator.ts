import { MenuItemStatus, PaymentMethod } from "../generated/prisma/client";
import { z } from "zod";

export const addCartItemSchema = z.object({
  restaurantId: z.string().min(1),
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive().max(50)
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(50)
});

export const checkoutSchema = z.object({
  restaurantId: z.string().min(1),
  deliveryAddressId: z.string().min(1),
  promoCodeId: z.string().optional(),
  subtotalAmount: z.number().nonnegative().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  customerNotes: z.string().max(300).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().positive(),
      selectedOptionIds: z.array(z.string().min(1)).optional(),
      note: z.string().max(240).optional(),
      unitPrice: z.number().nonnegative().optional(),
      totalPrice: z.number().nonnegative().optional()
    })
  )
});

export const promoValidationSchema = z.object({
  code: z.string().min(2),
  orderAmount: z.number().nonnegative()
});

export const reviewSchema = z.object({
  restaurantId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

export const paymentInitializeSchema = z.object({
  orderId: z.string().min(1),
  email: z.string().email(),
  amount: z.number().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional()
});

export const paymentVerifySchema = z.object({
  reference: z.string().min(2)
});

export const availabilitySchema = z.object({
  isOnline: z.boolean()
});

export const riderLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const vendorOperatingStateSchema = z.object({
  restaurantId: z.string().min(1),
  operatingMode: z.enum(["LIVE", "BUSY", "PAUSED"]),
  busyUntil: z.string().datetime().optional(),
  pauseReason: z.string().max(200).optional()
});

export const vendorSettingsSchema = z.object({
  restaurantId: z.string().min(1),
  isOpen: z.boolean().optional(),
  autoAcceptOrders: z.boolean().optional(),
  notifyOnNewOrders: z.boolean().optional(),
  notifyOnPromotions: z.boolean().optional(),
  openingHours: z
    .array(
      z.object({
        label: z.string().min(1).max(40),
        open: z.string().max(20).optional(),
        close: z.string().max(20).optional(),
        isClosed: z.boolean().optional()
      })
    )
    .max(7)
    .optional(),
  payoutAccount: z.string().max(120).optional(),
  payoutBankName: z.string().max(80).optional(),
  payoutAccountNumber: z.string().max(30).optional(),
  payoutAccountName: z.string().max(120).optional(),
  payoutVerified: z.boolean().optional()
});

export const createVendorRestaurantSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(5).max(240),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryFee: z.number().nonnegative().optional(),
  minimumOrderAmount: z.number().nonnegative().optional(),
  estimatedDeliveryMins: z.number().int().positive().max(240).optional(),
  storyHeadline: z.string().max(120).optional(),
  storyBody: z.string().max(500).optional(),
  priceBand: z.string().max(20).optional()
});

export const updateVendorRestaurantSchema = createVendorRestaurantSchema.partial();

export const orderSupportTicketSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  subject: z.string().min(3).max(120),
  message: z.string().min(5).max(800),
  source: z.enum(["CUSTOMER", "VENDOR", "RIDER", "ADMIN"]).default("CUSTOMER")
});

export const deliveryProofSchema = z.object({
  proofType: z.enum(["PHOTO", "OTP", "SIGNATURE", "NOTE"]),
  imageUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
  otpCode: z.string().max(20).optional()
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "REJECTED",
    "PREPARING",
    "READY_FOR_PICKUP"
  ])
});

export const deliveryStatusUpdateSchema = z.object({
  status: z.enum(["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"])
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  role: z.enum(["CUSTOMER", "VENDOR", "RIDER", "ADMIN"]).optional()
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});

export const adminPromoteUserSchema = z.object({
  title: z.string().max(80).optional()
});

export const adminCreateVendorSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(30).optional(),
  password: z.string().min(8).max(120),
  businessName: z.string().min(2).max(120)
});

export const restaurantCollectionSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80),
  description: z.string().max(240).optional(),
  heroTitle: z.string().max(120).optional(),
  heroCopy: z.string().max(240).optional(),
  isFeatured: z.boolean().optional(),
  restaurantIds: z.array(z.string().min(1)).max(24).default([])
});

export const restaurantStorySchema = z.object({
  storyHeadline: z.string().max(120).optional(),
  storyBody: z.string().max(500).optional(),
  chefNote: z.string().max(240).optional(),
  ambianceNote: z.string().max(240).optional(),
  priceBand: z.string().max(20).optional(),
  heroAccent: z.string().max(30).optional(),
  isFeatured: z.boolean().optional()
});

export const restaurantStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"])
});

export const adminSettingsSchema = z.object({
  dispatchMode: z.enum(["AUTO", "MANUAL"]),
  supportEmail: z.string().email(),
  paymentMethods: z.array(z.nativeEnum(PaymentMethod)).min(1).max(3),
  vendorCommissionRate: z.number().min(0).max(100),
  riderCommissionRate: z.number().min(0).max(100),
  serviceFeeRate: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
  payoutDelayDays: z.number().int().min(0).max(60),
  minimumPayoutAmount: z.number().nonnegative(),
  platformSubscriptionEnabled: z.boolean(),
  defaultTrialDays: z.number().int().min(0).max(90),
  subscriptions: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(2).max(80),
        code: z.string().min(2).max(40),
        audienceLabel: z.string().min(2).max(80),
        monthlyPrice: z.number().nonnegative(),
        yearlyPrice: z.number().nonnegative().nullable().optional(),
        orderCommissionRate: z.number().min(0).max(100),
        deliveryCommissionRate: z.number().min(0).max(100),
        benefitsSummary: z.string().min(5).max(240),
        isActive: z.boolean(),
        sortOrder: z.number().int().min(0).max(1000)
      })
    )
    .max(12)
});

export const groupOrderSchema = z.object({
  restaurantId: z.string().min(1),
  title: z.string().min(3).max(100),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional()
});

export const scheduledOrderSchema = z.object({
  restaurantId: z.string().min(1),
  addressId: z.string().min(1),
  title: z.string().min(3).max(100),
  cadenceLabel: z.string().min(3).max(60),
  nextRunAt: z.string().datetime(),
  itemSummary: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().positive(),
      name: z.string().min(1)
    })
  )
});

export const mealPlanSchema = z.object({
  title: z.string().min(3).max(100),
  goal: z.string().max(180).optional(),
  weeklyBudget: z.number().nonnegative(),
  mealsPerWeek: z.number().int().positive().max(21),
  cuisineFocus: z.string().max(80).optional()
});

export const customerAddressSchema = z.object({
  label: z.string().min(2).max(80),
  fullAddress: z.string().min(5).max(240),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  instructions: z.string().max(200).optional()
});

export const assignRiderSchema = z.object({
  riderProfileId: z.string().min(1)
});

export const settlementActionSchema = z.object({
  target: z.enum(["VENDORS", "RIDERS", "ALL"])
});

export const payoutRequestSchema = z.object({
  note: z.string().max(240).optional()
});

export const payoutRequestReviewSchema = z.object({
  adminNote: z.string().max(240).optional()
});

export const createMenuItemSchema = z.object({
  restaurantId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  specialPrice: z.number().positive().optional(),
  specialPriceLabel: z.string().max(80).optional(),
  specialStartsAt: z.string().datetime().optional(),
  specialEndsAt: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
  status: z.nativeEnum(MenuItemStatus).optional(),
  preparationMins: z.number().int().positive().max(240).optional(),
  isSignature: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  badgeText: z.string().max(60).optional(),
  spiceLevel: z.number().int().min(0).max(5).optional(),
  calories: z.number().int().min(0).max(5000).optional(),
  modifierGroups: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        description: z.string().max(160).optional(),
        selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
        minSelect: z.number().int().min(0).max(20).optional(),
        maxSelect: z.number().int().min(1).max(20).nullable().optional(),
        isRequired: z.boolean().optional(),
        sortOrder: z.number().int().min(0).max(1000).optional(),
        options: z
          .array(
            z.object({
              name: z.string().min(1).max(80),
              priceDelta: z.number().min(0).optional(),
              isDefault: z.boolean().optional(),
              isAvailable: z.boolean().optional(),
              sortOrder: z.number().int().min(0).max(1000).optional()
            })
          )
          .min(1)
          .max(20)
      })
    )
    .max(12)
    .optional()
});

export const updateMenuItemSchema = createMenuItemSchema.partial().omit({
  restaurantId: true
});
