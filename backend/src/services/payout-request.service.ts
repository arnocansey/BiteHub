import { ApprovalStatus } from "../generated/prisma/client";
import { PayoutRequestStatus, PayoutRequestTarget } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";

type ProfileRequest = {
  id: string;
  status: PayoutRequestStatus;
  requestedAmount: number;
  approvedAmount: number;
  note: string | null;
  adminNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  paidAt: Date | null;
};

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

const payoutRequestDelegate = prisma as typeof prisma & {
  payoutRequest: any;
};

async function getSettings() {
  const platformSettingsDelegate = prisma as typeof prisma & {
    platformSettings: {
      upsert: Function;
    };
  };

  return platformSettingsDelegate.platformSettings.upsert({
    where: { key: "DEFAULT" },
    update: {},
    create: {
      key: "DEFAULT",
      supportEmail: "ops@bitehub.app",
      paymentMethods: ["CASH", "CARD", "MOBILE_MONEY"],
      vendorCommissionRate: "15.00",
      riderCommissionRate: "2.50",
      serviceFeeRate: "5.00",
      taxRate: "7.50",
      payoutDelayDays: 2,
      minimumPayoutAmount: "5000.00",
      platformSubscriptionEnabled: true,
      defaultTrialDays: 14
    }
  });
}

function buildRequestTotals(requests: ProfileRequest[]) {
  const pendingAmount = requests
    .filter((item) => item.status === PayoutRequestStatus.PENDING)
    .reduce((sum, item) => sum + item.requestedAmount, 0);
  const approvedAmount = requests
    .filter((item) => item.status === PayoutRequestStatus.APPROVED)
    .reduce((sum, item) => sum + (item.approvedAmount || item.requestedAmount), 0);
  const paidAmount = requests
    .filter((item) => item.status === PayoutRequestStatus.PAID)
    .reduce((sum, item) => sum + (item.approvedAmount || item.requestedAmount), 0);

  return {
    pendingAmount: roundCurrency(pendingAmount),
    approvedAmount: roundCurrency(approvedAmount),
    paidAmount: roundCurrency(paidAmount)
  };
}

export async function getVendorPayoutSnapshot(userId: string) {
  const [vendor, settings, requests] = await Promise.all([
    prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        restaurants: {
          select: { id: true, name: true }
        }
      }
    }),
    getSettings(),
    payoutRequestDelegate.payoutRequest.findMany({
      where: {
        requesterUserId: userId,
        targetType: PayoutRequestTarget.VENDOR
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!vendor) {
    throw new Error("Vendor profile not found.");
  }

  const cutoff = new Date(Date.now() - settings.payoutDelayDays * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      restaurant: {
        vendorProfileId: vendor.id
      },
      status: "DELIVERED",
      deliveredAt: {
        lte: cutoff
      },
      payment: {
        status: "PAID"
      }
    },
    include: {
      settlement: true,
      restaurant: {
        select: { id: true, name: true }
      }
    }
  } as any);

  const eligibleAmount = roundCurrency(
    (orders as any[]).reduce((sum, order: any) => sum + Number(order.settlement?.vendorPayoutAmount ?? 0), 0)
  );
  const requestHistory: ProfileRequest[] = (requests as any[]).map((request: any) => ({
    id: request.id,
    status: request.status,
    requestedAmount: Number(request.requestedAmount),
    approvedAmount: Number(request.approvedAmount ?? request.requestedAmount),
    note: request.note ?? null,
    adminNote: request.adminNote ?? null,
    createdAt: request.createdAt,
    reviewedAt: request.reviewedAt ?? null,
    paidAt: request.paidAt ?? null
  }));
  const totals = buildRequestTotals(requestHistory);
  const availableAmount = roundCurrency(
    Math.max(eligibleAmount - totals.pendingAmount - totals.approvedAmount - totals.paidAmount, 0)
  );

  return {
    targetType: PayoutRequestTarget.VENDOR,
    profileId: vendor.id,
    payeeName: vendor.businessName,
    contactName: `${vendor.user.firstName} ${vendor.user.lastName}`.trim(),
    payoutVerified: Boolean(vendor.payoutVerified),
    approvalStatus: vendor.approvalStatus,
    minimumPayoutAmount: Number(settings.minimumPayoutAmount),
    payoutDelayDays: settings.payoutDelayDays,
    eligibleAmount,
    availableAmount,
    ...totals,
    requests: requestHistory,
    canRequest:
      vendor.approvalStatus === ApprovalStatus.APPROVED &&
      Boolean(vendor.payoutVerified) &&
      availableAmount >= Number(settings.minimumPayoutAmount)
  };
}

export async function getRiderPayoutSnapshot(userId: string) {
  const [rider, settings, requests] = await Promise.all([
    prisma.riderProfile.findUnique({
      where: { userId },
      include: {
        user: true
      }
    }),
    getSettings(),
    payoutRequestDelegate.payoutRequest.findMany({
      where: {
        requesterUserId: userId,
        targetType: PayoutRequestTarget.RIDER
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!rider) {
    throw new Error("Rider profile not found.");
  }

  const cutoff = new Date(Date.now() - settings.payoutDelayDays * 24 * 60 * 60 * 1000);
  const deliveries = await prisma.delivery.findMany({
    where: {
      riderProfileId: rider.id,
      status: "DELIVERED",
      deliveredAt: {
        lte: cutoff
      },
      order: {
        payment: {
          status: "PAID"
        }
      }
    },
    include: {
      order: {
        include: {
          settlement: true
        }
      }
    }
  } as any);

  const eligibleAmount = roundCurrency(
    (deliveries as any[]).reduce((sum, delivery: any) => sum + Number(delivery.order?.settlement?.riderPayoutAmount ?? 0), 0)
  );
  const requestHistory: ProfileRequest[] = (requests as any[]).map((request: any) => ({
    id: request.id,
    status: request.status,
    requestedAmount: Number(request.requestedAmount),
    approvedAmount: Number(request.approvedAmount ?? request.requestedAmount),
    note: request.note ?? null,
    adminNote: request.adminNote ?? null,
    createdAt: request.createdAt,
    reviewedAt: request.reviewedAt ?? null,
    paidAt: request.paidAt ?? null
  }));
  const totals = buildRequestTotals(requestHistory);
  const availableAmount = roundCurrency(
    Math.max(eligibleAmount - totals.pendingAmount - totals.approvedAmount - totals.paidAmount, 0)
  );

  return {
    targetType: PayoutRequestTarget.RIDER,
    profileId: rider.id,
    payeeName: `${rider.user.firstName} ${rider.user.lastName}`.trim() || "Rider",
    vehicleType: rider.vehicleType ?? null,
    approvalStatus: rider.approvalStatus,
    minimumPayoutAmount: Number(settings.minimumPayoutAmount),
    payoutDelayDays: settings.payoutDelayDays,
    eligibleAmount,
    availableAmount,
    ...totals,
    requests: requestHistory,
    canRequest:
      rider.approvalStatus === ApprovalStatus.APPROVED &&
      availableAmount >= Number(settings.minimumPayoutAmount)
  };
}
