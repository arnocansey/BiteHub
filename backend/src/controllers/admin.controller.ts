import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { ApprovalStatus, DeliveryStatus, PaymentMethod, RestaurantStatus, UserRole } from "../generated/prisma/client";
import { DispatchMode, GroupOrderStatus, PayoutRequestStatus, PayoutRequestTarget, ScheduledOrderStatus, SubscriptionStatus } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";
import { emitOrderUpdate } from "../realtime/socket";
import { createDeliveryEvent, upsertEtaPrediction } from "../services/order-trust.service";
import { calculateSettlementBreakdown } from "../services/settlement.service";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceInKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

const adminProfilePublicSelect = {
  id: true,
  userId: true,
  title: true
} as const;

const platformSettingsDelegate = prisma as typeof prisma & {
  platformSettings: any;
};
const payoutRequestDelegate = prisma as typeof prisma & {
  payoutRequest: any;
};

async function getPlatformSettingsRecord() {
  return platformSettingsDelegate.platformSettings.upsert({
    where: { key: "DEFAULT" },
    update: {},
    create: {
      key: "DEFAULT",
      dispatchMode: DispatchMode.AUTO,
      supportEmail: "ops@bitehub.app",
      paymentMethods: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.MOBILE_MONEY],
      vendorCommissionRate: "15.00",
      riderCommissionRate: "2.50",
      serviceFeeRate: "5.00",
      taxRate: "7.50",
      payoutDelayDays: 2,
      minimumPayoutAmount: "5000.00",
      platformSubscriptionEnabled: true,
      defaultTrialDays: 14,
      subscriptions: {
        create: [
          {
            name: "Starter",
            code: "STARTER",
            audienceLabel: "Small vendors",
            monthlyPrice: "0.00",
            yearlyPrice: "0.00",
            orderCommissionRate: "15.00",
            deliveryCommissionRate: "2.50",
            benefitsSummary: "Basic listing, standard analytics, and live order management.",
            isActive: true,
            sortOrder: 0
          },
          {
            name: "Growth",
            code: "GROWTH",
            audienceLabel: "Scaling kitchens",
            monthlyPrice: "25000.00",
            yearlyPrice: "250000.00",
            orderCommissionRate: "12.50",
            deliveryCommissionRate: "2.00",
            benefitsSummary: "Featured placement, retention tools, and richer operational analytics.",
            isActive: true,
            sortOrder: 1
          }
        ]
      }
    },
    include: {
      subscriptions: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });
}

async function buildSettlementPreview() {
  const [settings, deliveredOrders, batches, payoutRequests] = (await Promise.all([
    getPlatformSettingsRecord(),
    prisma.order.findMany({
      where: {
        status: "DELIVERED",
        payment: {
          status: "PAID"
        }
      },
      include: {
        restaurant: {
          include: {
            vendorProfile: {
              include: {
                user: true
              }
            }
          }
        },
        delivery: {
          include: {
            riderProfile: {
              include: {
                user: true
              }
            }
          }
        },
        payment: true,
        settlement: true
      },
      orderBy: { deliveredAt: "desc" }
    } as any),
    prisma.auditLog.findMany({
      where: { entityType: "SETTLEMENT_BATCH" },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    payoutRequestDelegate.payoutRequest.findMany({
      include: {
        requester: true,
        vendorProfile: {
          include: {
            user: true
          }
        },
        riderProfile: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ])) as [any, any[], any[], any[]];

  const vendorBuckets = new Map<string, any>();
  const riderBuckets = new Map<string, any>();
  const minimumPayout = Number(settings.minimumPayoutAmount);
  const requestSummaries = payoutRequests.map((request) => ({
    id: request.id,
    targetType: request.targetType,
    status: request.status,
    requestedAmount: Number(request.requestedAmount),
    approvedAmount: Number(request.approvedAmount ?? request.requestedAmount),
    createdAt: request.createdAt,
    reviewedAt: request.reviewedAt,
    paidAt: request.paidAt,
    note: request.note ?? null,
    adminNote: request.adminNote ?? null,
    payeeName:
      request.targetType === PayoutRequestTarget.VENDOR
        ? request.vendorProfile?.businessName ?? "Vendor"
        : `${request.riderProfile?.user?.firstName ?? ""} ${request.riderProfile?.user?.lastName ?? ""}`.trim() || "Rider",
    contactName:
      request.targetType === PayoutRequestTarget.VENDOR
        ? `${request.vendorProfile?.user?.firstName ?? ""} ${request.vendorProfile?.user?.lastName ?? ""}`.trim()
        : request.requester?.email ?? "",
    requesterUserId: request.requesterUserId
  }));

  deliveredOrders.forEach((order) => {
    const vendor = order.restaurant.vendorProfile;
    const rider = order.delivery?.riderProfile;
    const settlement =
      order.settlement ??
      calculateSettlementBreakdown({
        subtotalAmount: order.subtotalAmount,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        vendorCommissionRate: settings.vendorCommissionRate,
        riderCommissionRate: settings.riderCommissionRate,
        serviceFeeRate: settings.serviceFeeRate,
        taxRate: settings.taxRate
      });
    const vendorNet = Number(settlement.vendorPayoutAmount ?? 0);
    const riderNet = Number(settlement.riderPayoutAmount ?? 0);

    if (vendor?.id) {
      const current = vendorBuckets.get(vendor.id) ?? {
        profileId: vendor.id,
        userId: vendor.userId,
        payeeName: vendor.businessName,
        contactName: `${vendor.user?.firstName ?? ""} ${vendor.user?.lastName ?? ""}`.trim(),
        payoutBankName: vendor.payoutBankName,
        payoutAccountNumber: vendor.payoutAccountNumber,
        payoutVerified: vendor.payoutVerified,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        availableAmount: 0,
        orders: []
      };
      current.totalAmount += vendorNet;
      current.orders.push({
        orderId: order.id,
        restaurantName: order.restaurant.name,
        amount: vendorNet
      });
      vendorBuckets.set(vendor.id, current);
    }

    if (rider?.id) {
      const current = riderBuckets.get(rider.id) ?? {
        profileId: rider.id,
        userId: rider.userId,
        payeeName: `${rider.user?.firstName ?? ""} ${rider.user?.lastName ?? ""}`.trim() || "Rider",
        vehicleType: rider.vehicleType,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        availableAmount: 0,
        orders: []
      };
      current.totalAmount += riderNet;
      current.orders.push({
        orderId: order.id,
        restaurantName: order.restaurant.name,
        amount: riderNet
      });
      riderBuckets.set(rider.id, current);
    }
  });

  requestSummaries.forEach((request) => {
    if (request.targetType === PayoutRequestTarget.VENDOR) {
      const vendorProfileId = payoutRequests.find((item) => item.id === request.id)?.vendorProfileId;
      if (vendorProfileId && vendorBuckets.has(vendorProfileId)) {
        const bucket = vendorBuckets.get(vendorProfileId);
        if (request.status === PayoutRequestStatus.PENDING) bucket.pendingAmount += request.requestedAmount;
        if (request.status === PayoutRequestStatus.APPROVED) bucket.approvedAmount += request.approvedAmount;
        if (request.status === PayoutRequestStatus.PAID) bucket.paidAmount += request.approvedAmount;
      }
    }

    if (request.targetType === PayoutRequestTarget.RIDER) {
      const riderProfileId = payoutRequests.find((item) => item.id === request.id)?.riderProfileId;
      if (riderProfileId && riderBuckets.has(riderProfileId)) {
        const bucket = riderBuckets.get(riderProfileId);
        if (request.status === PayoutRequestStatus.PENDING) bucket.pendingAmount += request.requestedAmount;
        if (request.status === PayoutRequestStatus.APPROVED) bucket.approvedAmount += request.approvedAmount;
        if (request.status === PayoutRequestStatus.PAID) bucket.paidAmount += request.approvedAmount;
      }
    }
  });

  const vendors = Array.from(vendorBuckets.values())
    .map((item) => ({
      ...item,
      totalAmount: Number(item.totalAmount.toFixed(2)),
      pendingAmount: Number(item.pendingAmount.toFixed(2)),
      approvedAmount: Number(item.approvedAmount.toFixed(2)),
      paidAmount: Number(item.paidAmount.toFixed(2)),
      availableAmount: Number(
        Math.max(item.totalAmount - item.pendingAmount - item.approvedAmount - item.paidAmount, 0).toFixed(2)
      ),
      eligible: false
    }))
    .map((item) => ({
      ...item,
      eligible: item.availableAmount >= minimumPayout && Boolean(item.payoutVerified)
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const riders = Array.from(riderBuckets.values())
    .map((item) => ({
      ...item,
      totalAmount: Number(item.totalAmount.toFixed(2)),
      pendingAmount: Number(item.pendingAmount.toFixed(2)),
      approvedAmount: Number(item.approvedAmount.toFixed(2)),
      paidAmount: Number(item.paidAmount.toFixed(2)),
      availableAmount: Number(
        Math.max(item.totalAmount - item.pendingAmount - item.approvedAmount - item.paidAmount, 0).toFixed(2)
      ),
      eligible: false
    }))
    .map((item) => ({
      ...item,
      eligible: item.availableAmount >= minimumPayout
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const pendingRequests = requestSummaries.filter((item) => item.status === PayoutRequestStatus.PENDING);
  const approvedRequests = requestSummaries.filter((item) => item.status === PayoutRequestStatus.APPROVED);

  return {
    settings: {
      payoutDelayDays: settings.payoutDelayDays,
      minimumPayoutAmount: Number(settings.minimumPayoutAmount)
    },
    summary: {
      eligibleVendorCount: vendors.filter((item) => item.eligible).length,
      eligibleRiderCount: riders.filter((item) => item.eligible).length,
      vendorPayoutDue: Number(vendors.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)),
      riderPayoutDue: Number(riders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)),
      pendingRequestCount: pendingRequests.length,
      approvedRequestCount: approvedRequests.length,
      approvedRequestAmount: Number(
        approvedRequests.reduce((sum, item) => sum + item.approvedAmount, 0).toFixed(2)
      )
    },
    vendors,
    riders,
    batches,
    payoutRequests: {
      pending: pendingRequests,
      approved: approvedRequests,
      recent: requestSummaries.slice(0, 12)
    }
  };
}

async function buildRiderFleetWorkspace() {
  const [riders, pendingRiders, activeIncentives, payoutRequests] = await Promise.all([
    prisma.riderProfile.findMany({
      include: {
        user: true,
        deliveries: {
          include: {
            order: {
              include: {
                customer: true,
                restaurant: true,
                deliveryAddress: true,
                payment: true,
                settlement: true
              }
            }
          },
          orderBy: { deliveredAt: "desc" }
        },
        incentives: {
          orderBy: { createdAt: "desc" }
        },
        qualityScores: {
          orderBy: { measuredAt: "desc" }
        }
      },
      orderBy: [{ isOnline: "desc" }, { approvalStatus: "asc" }, { updatedAt: "desc" }]
    } as any),
    prisma.riderProfile.findMany({
      where: { approvalStatus: ApprovalStatus.PENDING },
      include: { user: true },
      orderBy: { user: { createdAt: "desc" } }
    } as any),
    prisma.riderIncentive.findMany({
      where: { isActive: true },
      include: {
        riderProfile: {
          include: { user: true }
        }
      },
      orderBy: { startsAt: "asc" }
    }),
    payoutRequestDelegate.payoutRequest.findMany({
      where: { targetType: PayoutRequestTarget.RIDER },
      include: {
        riderProfile: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const riderRows = riders.map((rider: any) => {
    const deliveries = rider.deliveries ?? [];
    const completedTrips = deliveries.filter((delivery: any) => delivery.status === DeliveryStatus.DELIVERED);
    const activeTrips = deliveries.filter((delivery: any) =>
      [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT].includes(delivery.status)
    );
    const failedTrips = deliveries.filter((delivery: any) => delivery.status === DeliveryStatus.FAILED);
    const paidTrips = completedTrips.filter((delivery: any) => delivery.order?.payment?.status === "PAID");
    const cashTrips = paidTrips.filter((delivery: any) => delivery.order?.payment?.method === PaymentMethod.CASH);
    const cashlessTrips = paidTrips.filter((delivery: any) => delivery.order?.payment?.method !== PaymentMethod.CASH);
    const earnings = paidTrips.reduce(
      (sum: number, delivery: any) => sum + Number(delivery.order?.settlement?.riderPayoutAmount ?? 0),
      0
    );
    const bonuses = (rider.incentives ?? []).reduce((sum: number, incentive: any) => sum + Number(incentive.bonusAmount ?? 0), 0);
    const firstActivityAt = deliveries
      .map((delivery: any) => delivery.pickedUpAt ?? delivery.order?.placedAt ?? null)
      .filter(Boolean)
      .sort()[0];
    const lastActivityAt = deliveries
      .map((delivery: any) => delivery.deliveredAt ?? delivery.order?.placedAt ?? null)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];
    const activityHours =
      firstActivityAt && lastActivityAt
        ? Number((((new Date(lastActivityAt).getTime() - new Date(firstActivityAt).getTime()) / 36e5) || 0).toFixed(1))
        : 0;
    const qualityScore = rider.qualityScores?.[0] ? Number(rider.qualityScores[0].scoreValue ?? 0) : null;
    const completionRate = deliveries.length ? Math.round((completedTrips.length / deliveries.length) * 100) : 0;
    const acceptanceRate = deliveries.length ? Math.round(((deliveries.length - failedTrips.length) / deliveries.length) * 100) : 0;

    return {
      id: rider.id,
      userId: rider.userId,
      name: `${rider.user?.firstName ?? ""} ${rider.user?.lastName ?? ""}`.trim() || "Rider",
      email: rider.user?.email ?? "",
      phone: rider.user?.phone ?? "",
      vehicleType: rider.vehicleType ?? "Not set",
      approvalStatus: rider.approvalStatus,
      isOnline: rider.isOnline,
      isActive: rider.user?.isActive ?? true,
      currentLatitude: rider.currentLatitude,
      currentLongitude: rider.currentLongitude,
      metrics: {
        finishedOrders: completedTrips.length,
        activeTrips: activeTrips.length,
        failedTrips: failedTrips.length,
        completionRate,
        acceptanceRate,
        onlineHours: activityHours,
        earnings: Number(earnings.toFixed(2)),
        bonuses: Number(bonuses.toFixed(2)),
        cashTrips: cashTrips.length,
        cashlessTrips: cashlessTrips.length,
        qualityScore
      },
      recentTrips: deliveries.slice(0, 10).map((delivery: any) => ({
        id: delivery.id,
        orderId: delivery.orderId,
        status: delivery.status,
        customerName: `${delivery.order?.customer?.firstName ?? ""} ${delivery.order?.customer?.lastName ?? ""}`.trim() || "Customer",
        pickupAddress: delivery.order?.restaurant?.address ?? "Restaurant address unavailable",
        deliveryAddress: delivery.order?.deliveryAddress?.fullAddress ?? "Delivery address unavailable",
        restaurantName: delivery.order?.restaurant?.name ?? "Restaurant",
        paymentMethod: delivery.order?.payment?.method ?? null,
        price: Number(delivery.order?.totalAmount ?? 0),
        riderPayout: Number(delivery.order?.settlement?.riderPayoutAmount ?? 0),
        placedAt: delivery.order?.placedAt,
        deliveredAt: delivery.deliveredAt,
        pickupEtaMins: delivery.pickupEtaMins,
        deliveryEtaMins: delivery.deliveryEtaMins,
        distanceKm:
          typeof delivery.order?.restaurant?.latitude === "number" &&
          typeof delivery.order?.restaurant?.longitude === "number" &&
          typeof delivery.order?.deliveryAddress?.latitude === "number" &&
          typeof delivery.order?.deliveryAddress?.longitude === "number"
            ? Number(
                distanceInKm(
                  delivery.order.restaurant.latitude,
                  delivery.order.restaurant.longitude,
                  delivery.order.deliveryAddress.latitude,
                  delivery.order.deliveryAddress.longitude
                ).toFixed(2)
              )
            : null
      }))
    };
  });

  const allTrips = riderRows
    .flatMap((rider) =>
      rider.recentTrips.map((trip: any) => ({
        ...trip,
        riderId: rider.id,
        riderName: rider.name
      }))
    )
    .sort((left, right) => new Date(right.placedAt ?? 0).getTime() - new Date(left.placedAt ?? 0).getTime());

  const payoutSummary = payoutRequests.reduce(
    (acc: any, request: any) => {
      const amount = Number(request.approvedAmount ?? request.requestedAmount ?? 0);
      if (request.status === PayoutRequestStatus.PENDING) acc.pendingAmount += amount;
      if (request.status === PayoutRequestStatus.APPROVED) acc.approvedAmount += amount;
      if (request.status === PayoutRequestStatus.PAID) acc.paidAmount += amount;
      return acc;
    },
    { pendingAmount: 0, approvedAmount: 0, paidAmount: 0 }
  );

  const liveRoutes = riderRows
    .filter((rider) => rider.isOnline && typeof rider.currentLatitude === "number" && typeof rider.currentLongitude === "number")
    .map((rider) => ({
      riderId: rider.id,
      riderName: rider.name,
      currentLatitude: rider.currentLatitude,
      currentLongitude: rider.currentLongitude,
      activity: rider.recentTrips[0]
        ? {
            restaurantName: rider.recentTrips[0].restaurantName,
            pickupAddress: rider.recentTrips[0].pickupAddress,
            deliveryAddress: rider.recentTrips[0].deliveryAddress,
            status: rider.recentTrips[0].status
          }
        : null
    }));

  const fleetIncome = riderRows.reduce((sum, rider) => sum + rider.metrics.earnings, 0);
  const bonusIncome = riderRows.reduce((sum, rider) => sum + rider.metrics.bonuses, 0);

  return {
    summary: {
      courierCount: riderRows.length,
      onlineCouriers: riderRows.filter((rider) => rider.isOnline).length,
      availableCouriers: riderRows.filter((rider) => rider.isOnline && rider.metrics.activeTrips === 0).length,
      onTripCouriers: riderRows.filter((rider) => rider.metrics.activeTrips > 0).length,
      leadsCount: pendingRiders.length,
      finishedOrders: riderRows.reduce((sum, rider) => sum + rider.metrics.finishedOrders, 0),
      fleetIncome: Number(fleetIncome.toFixed(2)),
      cashTrips: riderRows.reduce((sum, rider) => sum + rider.metrics.cashTrips, 0),
      cashlessTrips: riderRows.reduce((sum, rider) => sum + rider.metrics.cashlessTrips, 0),
      bonusIncome: Number(bonusIncome.toFixed(2)),
      averageAcceptanceRate: riderRows.length
        ? Math.round(riderRows.reduce((sum, rider) => sum + rider.metrics.acceptanceRate, 0) / riderRows.length)
        : 0
    },
    couriers: riderRows,
    courierLeads: pendingRiders.map((rider: any) => ({
      id: rider.id,
      name: `${rider.user?.firstName ?? ""} ${rider.user?.lastName ?? ""}`.trim() || "Rider applicant",
      email: rider.user?.email ?? "",
      phone: rider.user?.phone ?? "",
      vehicleType: rider.vehicleType ?? "Not set",
      createdAt: rider.user?.createdAt ?? null,
      approvalStatus: rider.approvalStatus
    })),
    liveRoutes,
    tripHistory: allTrips.slice(0, 50),
    financials: {
      totalFleetIncome: Number(fleetIncome.toFixed(2)),
      cashTrips: riderRows.reduce((sum, rider) => sum + rider.metrics.cashTrips, 0),
      cashlessTrips: riderRows.reduce((sum, rider) => sum + rider.metrics.cashlessTrips, 0),
      bonusIncome: Number(bonusIncome.toFixed(2)),
      tipsTracked: null,
      payoutRequests: {
        pendingAmount: Number(payoutSummary.pendingAmount.toFixed(2)),
        approvedAmount: Number(payoutSummary.approvedAmount.toFixed(2)),
        paidAmount: Number(payoutSummary.paidAmount.toFixed(2)),
        recent: payoutRequests.slice(0, 12).map((request: any) => ({
          id: request.id,
          status: request.status,
          requestedAmount: Number(request.requestedAmount),
          approvedAmount: Number(request.approvedAmount ?? request.requestedAmount),
          createdAt: request.createdAt,
          paidAt: request.paidAt,
          riderName:
            `${request.riderProfile?.user?.firstName ?? ""} ${request.riderProfile?.user?.lastName ?? ""}`.trim() || "Rider"
        }))
      }
    },
    campaigns: activeIncentives.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      zoneLabel: campaign.zoneLabel,
      bonusAmount: Number(campaign.bonusAmount),
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      riderName:
        `${campaign.riderProfile?.user?.firstName ?? ""} ${campaign.riderProfile?.user?.lastName ?? ""}`.trim() || "Assigned rider"
    }))
  };
}

export const adminController = {
  async overview(_req: Request, res: Response) {
    const [users, orders, restaurants] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.restaurant.count()
    ]);

    res.json({ users, orders, restaurants });
  },

  async users(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
      include: {
        customerProfile: true,
        vendorProfile: true,
        riderProfile: true,
        adminProfile: {
          select: adminProfilePublicSelect
        }
      }
    });
    res.json(users);
  },

  async vendors(_req: Request, res: Response) {
    const vendors = await prisma.vendorProfile.findMany({
      include: {
        user: true,
        restaurants: {
          include: {
            orders: {
              include: {
                payment: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: {
        businessName: "asc"
      }
    });

    res.json(vendors);
  },

  async createVendor(req: Request, res: Response) {
    const { firstName, lastName, email, phone, password, businessName } = req.body as {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
      businessName: string;
    };

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "A user with this email or phone already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const vendor = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: UserRole.VENDOR,
        vendorProfile: {
          create: {
            businessName
          }
        }
      },
      include: {
        vendorProfile: {
          include: {
            user: true,
            restaurants: true
          }
        }
      }
    });

    res.status(201).json(vendor.vendorProfile);
  },

  async promoteCustomerToAdmin(req: Request, res: Response) {
    const userId = String(req.params.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true, adminProfile: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== UserRole.CUSTOMER || !user.customerProfile) {
      return res.status(400).json({ message: "Only customer accounts can be promoted to admin." });
    }

    const promoted = await prisma.user.update({
      where: { id: userId },
      data: {
        role: UserRole.ADMIN,
        adminProfile: user.adminProfile
          ? {
              update: {
                title: req.body.title ?? user.adminProfile.title ?? "Platform Administrator"
              }
            }
          : {
              create: {
                title: req.body.title ?? "Platform Administrator"
              }
            }
      },
      include: {
        customerProfile: true,
        vendorProfile: true,
        riderProfile: true,
        adminProfile: {
          select: adminProfilePublicSelect
        }
      }
    });

    res.json(promoted);
  },

  async pendingVendors(_req: Request, res: Response) {
    const vendors = await prisma.vendorProfile.findMany({
      where: { approvalStatus: ApprovalStatus.PENDING },
      include: { user: true, restaurants: true }
    });
    res.json(vendors);
  },

  async pendingRiders(_req: Request, res: Response) {
    const riders: any[] = await prisma.riderProfile.findMany({
      where: { approvalStatus: ApprovalStatus.PENDING },
      include: { user: true }
    });
    res.json(riders);
  },

  async ridersFleet(_req: Request, res: Response) {
    const fleet = await buildRiderFleetWorkspace();
    res.json(fleet);
  },

  async createRider(req: Request, res: Response) {
    const { firstName, lastName, email, phone, password, vehicleType } = req.body as {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
      vehicleType?: string;
    };

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "A user with this email or phone already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rider = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: UserRole.RIDER,
        riderProfile: {
          create: {
            vehicleType: vehicleType ?? null,
            approvalStatus: ApprovalStatus.APPROVED
          }
        }
      },
      include: {
        riderProfile: {
          include: { user: true }
        }
      }
    });

    res.status(201).json(rider.riderProfile);
  },

  async liveRiders(_req: Request, res: Response) {
    const riders = await prisma.riderProfile.findMany({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        isOnline: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null }
      },
      include: {
        user: true,
        deliveries: {
          where: {
            status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT] }
          },
          include: {
            order: {
              include: {
                restaurant: true
              }
            }
          }
        }
      }
    } as any);

    res.json(
      riders.map((rider: any) => ({
        id: rider.id,
        isOnline: rider.isOnline,
        vehicleType: rider.vehicleType,
        currentLatitude: rider.currentLatitude,
        currentLongitude: rider.currentLongitude,
        user: rider.user,
        activeDelivery: rider.deliveries[0]
          ? {
              id: rider.deliveries[0].id,
              status: rider.deliveries[0].status,
              orderId: rider.deliveries[0].orderId,
              restaurantName: rider.deliveries[0].order?.restaurant?.name ?? null
            }
          : null
      }))
    );
  },

  async orders(_req: Request, res: Response) {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        restaurant: true,
        delivery: {
          include: {
            riderProfile: {
              include: {
                user: true
              }
            }
          }
        },
        payment: true,
        settlement: true,
        etaPredictions: {
          orderBy: { predictedAt: "desc" },
          take: 1
        }
      },
      orderBy: { placedAt: "desc" }
    } as any);

    res.json(orders);
  },

  async nearbyRiders(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, deliveryAddress: true }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const riders = await prisma.riderProfile.findMany({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        isOnline: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null }
      },
      include: { user: true }
    });

    const nearby = riders
      .map((rider) => {
        const restaurantDistanceKm =
          typeof rider.currentLatitude === "number" && typeof rider.currentLongitude === "number"
            ? distanceInKm(order.restaurant.latitude, order.restaurant.longitude, rider.currentLatitude, rider.currentLongitude)
            : Number.POSITIVE_INFINITY;
        const customerDistanceKm =
          typeof rider.currentLatitude === "number" && typeof rider.currentLongitude === "number"
            ? distanceInKm(order.deliveryAddress.latitude, order.deliveryAddress.longitude, rider.currentLatitude, rider.currentLongitude)
            : Number.POSITIVE_INFINITY;

        return {
          id: rider.id,
          isOnline: rider.isOnline,
          vehicleType: rider.vehicleType,
          currentLatitude: rider.currentLatitude,
          currentLongitude: rider.currentLongitude,
          user: rider.user,
          restaurantDistanceKm: Number(restaurantDistanceKm.toFixed(2)),
          customerDistanceKm: Number(customerDistanceKm.toFixed(2))
        };
      })
      .sort((a, b) => a.restaurantDistanceKm - b.restaurantDistanceKm)
      .slice(0, 8);

    res.json(nearby);
  },

  async assignRider(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const riderProfileId = String(req.body.riderProfileId);
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      include: { user: true }
    });

    if (!rider || rider.approvalStatus !== ApprovalStatus.APPROVED || !rider.isOnline) {
      return res.status(400).json({ message: "Selected rider is not available for assignment." });
    }

    const delivery = await prisma.delivery.upsert({
      where: { orderId },
      update: {
        riderProfileId,
        status: DeliveryStatus.ASSIGNED
      },
      create: {
        orderId,
        riderProfileId,
        status: DeliveryStatus.ASSIGNED
      },
      include: {
        riderProfile: {
          include: { user: true }
        }
      }
    });

    await Promise.all([
      createDeliveryEvent({
        orderId,
        deliveryStatus: delivery.status,
        actorRole: UserRole.ADMIN,
        description: `Admin assigned ${rider.user.firstName} ${rider.user.lastName} to this delivery.`
      }),
      upsertEtaPrediction(orderId),
      prisma.notification.create({
        data: {
          userId: rider.userId,
          title: "New delivery assignment",
          body: "A nearby BiteHub order has been assigned to you.",
          payload: { orderId, deliveryId: delivery.id, type: "RIDER_ASSIGNMENT" }
        }
      })
    ]);

    emitOrderUpdate(orderId, {
      orderId,
      deliveryId: delivery.id,
      deliveryStatus: delivery.status,
      riderId: riderProfileId
    });

    res.json(delivery);
  },

  async approveVendor(req: Request, res: Response) {
    const vendorId = String(req.params.vendorId);
    const vendor = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { approvalStatus: ApprovalStatus.APPROVED }
    });

    res.json(vendor);
  },

  async approveRider(req: Request, res: Response) {
    const riderId = String(req.params.riderId);
    const rider = await prisma.riderProfile.update({
      where: { id: riderId },
      data: { approvalStatus: ApprovalStatus.APPROVED }
    });

    res.json(rider);
  },

  async reviewRider(req: Request, res: Response) {
    const riderId = String(req.params.riderId);
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderId },
      include: { user: true }
    });

    if (!rider) {
      return res.status(404).json({ message: "Rider not found." });
    }

    const status = req.body.status as ApprovalStatus;
    const updated = await prisma.riderProfile.update({
      where: { id: riderId },
      data: {
        approvalStatus: status
      },
      include: { user: true }
    });

    await prisma.notification.create({
      data: {
        userId: rider.userId,
        title: status === ApprovalStatus.APPROVED ? "Courier application approved" : "Courier application update",
        body:
          status === ApprovalStatus.APPROVED
            ? "Your BiteHub courier application was approved. You can now sign in and go online."
            : req.body.note ?? "Your BiteHub courier application was reviewed. Please contact support for more details.",
        payload: {
          type: "RIDER_APPLICATION_REVIEW",
          status
        }
      }
    });

    res.json(updated);
  },

  async updateRider(req: Request, res: Response) {
    const riderId = String(req.params.riderId);
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderId },
      include: { user: true }
    });

    if (!rider) {
      return res.status(404).json({ message: "Rider not found." });
    }

    const updated = await prisma.riderProfile.update({
      where: { id: riderId },
      data: {
        vehicleType: req.body.vehicleType === undefined ? undefined : req.body.vehicleType,
        isOnline: req.body.isOnline === undefined ? undefined : req.body.isOnline
      },
      include: { user: true }
    });

    const user = await prisma.user.update({
      where: { id: rider.userId },
      data: {
        firstName: req.body.firstName === undefined ? undefined : req.body.firstName,
        lastName: req.body.lastName === undefined ? undefined : req.body.lastName,
        phone: req.body.phone === undefined ? undefined : req.body.phone,
        isActive: req.body.isActive === undefined ? undefined : req.body.isActive
      }
    });

    res.json({
      ...updated,
      user
    });
  },

  async categories(_req: Request, res: Response) {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });

    res.json(categories);
  },

  async restaurantsCatalog(_req: Request, res: Response) {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        vendorProfile: {
          include: {
            user: true
          }
        },
        category: true,
        orders: {
          include: {
            payment: true
          }
        },
        menuItems: {
          include: {
            dietaryTags: {
              include: { dietaryTag: true }
            }
          }
        },
        collectionPlacements: {
          include: { collection: true },
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }]
    });

    res.json(restaurants);
  },

  async updateRestaurantStatus(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: req.body.status as RestaurantStatus
      }
    });

    res.json(restaurant);
  },

  async createCategory(req: Request, res: Response) {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  },

  async updateCategory(req: Request, res: Response) {
    const categoryId = String(req.params.categoryId);
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: req.body
    });

    res.json(category);
  },

  async deleteCategory(req: Request, res: Response) {
    const categoryId = String(req.params.categoryId);
    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.status(204).send();
  },

  async collections(_req: Request, res: Response) {
    const collections = await prisma.restaurantCollection.findMany({
      include: {
        restaurants: {
          include: {
            restaurant: {
              include: {
                category: true
              }
            }
          },
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
    });

    res.json(collections);
  },

  async createCollection(req: Request, res: Response) {
    const { restaurantIds = [], ...collectionData } = req.body as {
      restaurantIds?: string[];
      name: string;
      slug: string;
      description?: string;
      heroTitle?: string;
      heroCopy?: string;
      isFeatured?: boolean;
    };

    const collection = await prisma.restaurantCollection.create({
      data: {
        ...collectionData,
        restaurants: {
          create: restaurantIds.map((restaurantId, index) => ({
            restaurantId,
            sortOrder: index
          }))
        }
      },
      include: {
        restaurants: {
          include: { restaurant: true },
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    res.status(201).json(collection);
  },

  async updateCollection(req: Request, res: Response) {
    const collectionId = String(req.params.collectionId);
    const { restaurantIds = [], ...collectionData } = req.body as {
      restaurantIds?: string[];
      name?: string;
      slug?: string;
      description?: string;
      heroTitle?: string;
      heroCopy?: string;
      isFeatured?: boolean;
    };

    const collection = await prisma.restaurantCollection.update({
      where: { id: collectionId },
      data: {
        ...collectionData,
        restaurants: {
          deleteMany: {},
          create: restaurantIds.map((restaurantId, index) => ({
            restaurantId,
            sortOrder: index
          }))
        }
      },
      include: {
        restaurants: {
          include: { restaurant: true },
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    res.json(collection);
  },

  async updateRestaurantStory(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: req.body
    });

    res.json(restaurant);
  },

  async revenueReport(_req: Request, res: Response) {
    const [payments, settings, activeSubscriptions] = (await Promise.all([
      prisma.payment.findMany({
        where: { status: "PAID" },
        include: {
          order: {
            include: {
              settlement: true
            }
          }
        }
      } as any),
      getPlatformSettingsRecord(),
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE }
      })
    ])) as [any[], any, any[]];

    const grossOrderValue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const settlements = payments.map((payment) =>
      payment.order.settlement ??
      calculateSettlementBreakdown({
        subtotalAmount: payment.order.subtotalAmount,
        deliveryFee: payment.order.deliveryFee,
        totalAmount: payment.order.totalAmount,
        vendorCommissionRate: settings.vendorCommissionRate,
        riderCommissionRate: settings.riderCommissionRate,
        serviceFeeRate: settings.serviceFeeRate,
        taxRate: settings.taxRate
      })
    );
    const orderCommissionRevenue = settlements.reduce(
      (sum, settlement) => sum + Number(settlement.vendorCommissionAmount ?? 0),
      0
    );
    const deliveryPlatformRevenue = settlements.reduce(
      (sum, settlement) => sum + Number(settlement.deliveryPlatformFeeAmount ?? 0),
      0
    );
    const serviceFeeRevenue = settlements.reduce(
      (sum, settlement) => sum + Number(settlement.serviceFeeAmount ?? 0),
      0
    );
    const taxPayable = settlements.reduce((sum, settlement) => sum + Number(settlement.taxAmount ?? 0), 0);
    const subscriptionRevenue = activeSubscriptions.reduce(
      (sum, subscription) => sum + Number(subscription.monthlyPrice),
      0
    );
    const platformRevenue =
      orderCommissionRevenue + deliveryPlatformRevenue + serviceFeeRevenue + subscriptionRevenue;

    res.json({
      revenue: platformRevenue,
      transactions: payments.length,
      grossOrderValue,
      orderCommissionRevenue,
      deliveryPlatformRevenue,
      serviceFeeRevenue,
      subscriptionRevenue,
      taxPayable
    });
  },

  async retentionReport(_req: Request, res: Response) {
    const [activeSubscriptions, liveMealPlans, openGroupOrders, activeScheduledOrders, loyaltyWallets] =
      await Promise.all([
        prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        prisma.mealPlan.count(),
        prisma.groupOrder.count({ where: { status: { in: [GroupOrderStatus.OPEN, GroupOrderStatus.LOCKED] } } }),
        prisma.scheduledOrder.count({ where: { status: ScheduledOrderStatus.ACTIVE } }),
        prisma.loyaltyWallet.findMany()
      ]);

    const averagePoints =
      loyaltyWallets.length > 0
        ? Math.round(loyaltyWallets.reduce((sum, wallet) => sum + wallet.pointsBalance, 0) / loyaltyWallets.length)
        : 0;

    res.json({
      activeSubscriptions,
      liveMealPlans,
      openGroupOrders,
      activeScheduledOrders,
      loyaltyMembers: loyaltyWallets.length,
      averagePoints
    });
  },

  async settlementPreview(_req: Request, res: Response) {
    const preview = await buildSettlementPreview();
    res.json(preview);
  },

  async payoutRequests(_req: Request, res: Response) {
    const preview = await buildSettlementPreview();
    res.json(preview.payoutRequests);
  },

  async approvePayoutRequest(req: Request, res: Response) {
    const requestId = String(req.params.requestId);
    const payoutRequest = await payoutRequestDelegate.payoutRequest.findUnique({
      where: { id: requestId },
      include: {
        vendorProfile: {
          include: { user: true }
        },
        riderProfile: {
          include: { user: true }
        }
      }
    });

    if (!payoutRequest) {
      return res.status(404).json({ message: "Payout request not found." });
    }

    if (payoutRequest.status !== PayoutRequestStatus.PENDING) {
      return res.status(400).json({ message: "Only pending payout requests can be approved." });
    }

    const updated = await payoutRequestDelegate.payoutRequest.update({
      where: { id: requestId },
      data: {
        status: PayoutRequestStatus.APPROVED,
        approvedAmount: payoutRequest.requestedAmount,
        adminNote: req.body.adminNote ?? null,
        reviewedById: req.user!.sub,
        reviewedAt: new Date()
      }
    });

    const targetUserId = payoutRequest.targetType === PayoutRequestTarget.VENDOR
      ? payoutRequest.vendorProfile?.userId
      : payoutRequest.riderProfile?.userId;

    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "Payout request approved",
          body: `Your payout request for GHS ${Number(updated.approvedAmount ?? updated.requestedAmount).toLocaleString()} was approved by admin.`,
          payload: {
            type: "PAYOUT_REQUEST_APPROVED",
            requestId: updated.id
          }
        }
      });
    }

    res.json(updated);
  },

  async rejectPayoutRequest(req: Request, res: Response) {
    const requestId = String(req.params.requestId);
    const payoutRequest = await payoutRequestDelegate.payoutRequest.findUnique({
      where: { id: requestId },
      include: {
        vendorProfile: true,
        riderProfile: true
      }
    });

    if (!payoutRequest) {
      return res.status(404).json({ message: "Payout request not found." });
    }

    if (payoutRequest.status !== PayoutRequestStatus.PENDING) {
      return res.status(400).json({ message: "Only pending payout requests can be rejected." });
    }

    const updated = await payoutRequestDelegate.payoutRequest.update({
      where: { id: requestId },
      data: {
        status: PayoutRequestStatus.REJECTED,
        adminNote: req.body.adminNote ?? null,
        reviewedById: req.user!.sub,
        reviewedAt: new Date()
      }
    });

    const targetUserId = payoutRequest.targetType === PayoutRequestTarget.VENDOR
      ? payoutRequest.vendorProfile?.userId
      : payoutRequest.riderProfile?.userId;

    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "Payout request rejected",
          body: "Your payout request was reviewed and needs attention before it can be paid out.",
          payload: {
            type: "PAYOUT_REQUEST_REJECTED",
            requestId: updated.id
          }
        }
      });
    }

    res.json(updated);
  },

  async createSettlementBatch(req: Request, res: Response) {
    const preview = await buildSettlementPreview();
    const target = String(req.body.target);
    const approvedRequests = (preview.payoutRequests?.approved ?? []).filter((item: any) => {
      if (target === "ALL") return true;
      if (target === "VENDORS") return item.targetType === PayoutRequestTarget.VENDOR;
      return item.targetType === PayoutRequestTarget.RIDER;
    });
    const totalAmount = approvedRequests.reduce((sum: number, item: any) => sum + item.approvedAmount, 0);

    const vendors = approvedRequests.filter((item: any) => item.targetType === PayoutRequestTarget.VENDOR);
    const riders = approvedRequests.filter((item: any) => item.targetType === PayoutRequestTarget.RIDER);

    const batch = await prisma.auditLog.create({
      data: {
        userId: req.user!.sub,
        action: "SETTLEMENT_BATCH_CREATED",
        entityType: "SETTLEMENT_BATCH",
        entityId: `settlement-${Date.now()}`,
        metadata: {
          target,
          totalAmount: Number(totalAmount.toFixed(2)),
          payoutDelayDays: preview.settings.payoutDelayDays,
          minimumPayoutAmount: preview.settings.minimumPayoutAmount,
          vendorCount: vendors.length,
          riderCount: riders.length,
          vendors,
          riders
        }
      }
    });

    if (approvedRequests.length) {
      await payoutRequestDelegate.payoutRequest.updateMany({
        where: {
          id: { in: approvedRequests.map((item: any) => item.id) }
        },
        data: {
          status: PayoutRequestStatus.PAID,
          paidAt: new Date()
        }
      });
    }

    res.status(201).json({
      created: true,
      batch
    });
  },

  async operationsIntelligence(_req: Request, res: Response) {
    const [heatmap, qualityScores, forecasts, riderIncentives] = await Promise.all([
      prisma.marketHeatmap.findMany({
        orderBy: [{ demandLevel: "desc" }, { updatedAt: "desc" }],
        take: 8
      }),
      prisma.qualityScore.findMany({
        include: {
          restaurant: true,
          vendorProfile: true,
          riderProfile: { include: { user: true } }
        },
        orderBy: { measuredAt: "desc" },
        take: 10
      }),
      prisma.forecastSnapshot.findMany({
        include: { restaurant: true },
        orderBy: [{ forecastDate: "asc" }, { createdAt: "desc" }],
        take: 10
      }),
      prisma.riderIncentive.count({
        where: { isActive: true }
      })
    ]);

    res.json({
      heatmap,
      qualityScores,
      forecasts,
      activeRiderIncentives: riderIncentives
    });
  },

  async supportTickets(_req: Request, res: Response) {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        order: { include: { restaurant: true, customer: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(tickets);
  },

  async trustOverview(_req: Request, res: Response) {
    const [tickets, busyRestaurants, riskyEtas] = await Promise.all([
      prisma.supportTicket.count({
        where: {
          status: { in: ["OPEN", "IN_REVIEW"] }
        }
      }),
      prisma.restaurant.count({
        where: {
          operatingMode: { in: ["BUSY", "PAUSED"] }
        }
      }),
      prisma.etaPrediction.count({
        where: {
          confidencePercent: { lt: 80 }
        }
      })
    ]);

    res.json({
      openSupportTickets: tickets,
      stressedRestaurants: busyRestaurants,
      lowConfidenceEtas: riskyEtas
    });
  },

  async settings(_req: Request, res: Response) {
    const settings = await getPlatformSettingsRecord();
    res.json(settings);
  },

  async updateSettings(req: Request, res: Response) {
    const plans = req.body.subscriptions as Array<{
      id?: string;
      name: string;
      code: string;
      audienceLabel: string;
      monthlyPrice: number;
      yearlyPrice?: number | null;
      orderCommissionRate: number;
      deliveryCommissionRate: number;
      benefitsSummary: string;
      isActive: boolean;
      sortOrder: number;
    }>;

    const settings = await platformSettingsDelegate.platformSettings.upsert({
      where: { key: "DEFAULT" },
      update: {
        dispatchMode: req.body.dispatchMode as DispatchMode,
        supportEmail: req.body.supportEmail,
        paymentMethods: req.body.paymentMethods as PaymentMethod[],
        vendorCommissionRate: req.body.vendorCommissionRate,
        riderCommissionRate: req.body.riderCommissionRate,
        serviceFeeRate: req.body.serviceFeeRate,
        taxRate: req.body.taxRate,
        payoutDelayDays: req.body.payoutDelayDays,
        minimumPayoutAmount: req.body.minimumPayoutAmount,
        platformSubscriptionEnabled: req.body.platformSubscriptionEnabled,
        defaultTrialDays: req.body.defaultTrialDays,
        subscriptions: {
          deleteMany: {},
          create: plans.map((plan) => ({
            name: plan.name,
            code: plan.code.trim().toUpperCase(),
            audienceLabel: plan.audienceLabel,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice ?? null,
            orderCommissionRate: plan.orderCommissionRate,
            deliveryCommissionRate: plan.deliveryCommissionRate,
            benefitsSummary: plan.benefitsSummary,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder
          }))
        }
      },
      create: {
        key: "DEFAULT",
        dispatchMode: req.body.dispatchMode as DispatchMode,
        supportEmail: req.body.supportEmail,
        paymentMethods: req.body.paymentMethods as PaymentMethod[],
        vendorCommissionRate: req.body.vendorCommissionRate,
        riderCommissionRate: req.body.riderCommissionRate,
        serviceFeeRate: req.body.serviceFeeRate,
        taxRate: req.body.taxRate,
        payoutDelayDays: req.body.payoutDelayDays,
        minimumPayoutAmount: req.body.minimumPayoutAmount,
        platformSubscriptionEnabled: req.body.platformSubscriptionEnabled,
        defaultTrialDays: req.body.defaultTrialDays,
        subscriptions: {
          create: plans.map((plan) => ({
            name: plan.name,
            code: plan.code.trim().toUpperCase(),
            audienceLabel: plan.audienceLabel,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice ?? null,
            orderCommissionRate: plan.orderCommissionRate,
            deliveryCommissionRate: plan.deliveryCommissionRate,
            benefitsSummary: plan.benefitsSummary,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder
          }))
        }
      },
      include: {
        subscriptions: {
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    res.json({
      saved: true,
      settings
    });
  }
};
