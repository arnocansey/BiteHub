import { DispatchMode, PaymentMethod } from "../generated/prisma/client";
import { prisma } from "../config/prisma";

const platformSettingsDelegate = prisma as typeof prisma & {
  platformSettings: any;
  orderSettlement: any;
};

function amount(value: unknown) {
  return Number(value ?? 0);
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

export async function getSettlementSettings() {
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
      defaultTrialDays: 14
    }
  });
}

export function calculateSettlementBreakdown(args: {
  subtotalAmount: unknown;
  deliveryFee: unknown;
  totalAmount: unknown;
  vendorCommissionRate: unknown;
  riderCommissionRate: unknown;
  serviceFeeRate: unknown;
  taxRate: unknown;
}) {
  const subtotal = amount(args.subtotalAmount);
  const deliveryFee = amount(args.deliveryFee);
  const grossAmount = amount(args.totalAmount);
  const vendorCommissionRate = amount(args.vendorCommissionRate);
  const deliveryPlatformFeeRate = amount(args.riderCommissionRate);
  const serviceFeeRate = amount(args.serviceFeeRate);
  const taxRate = amount(args.taxRate);

  const vendorCommissionAmount = round2(subtotal * (vendorCommissionRate / 100));
  const vendorPayoutAmount = round2(Math.max(0, subtotal - vendorCommissionAmount));
  const deliveryPlatformFeeAmount = round2(deliveryFee * (deliveryPlatformFeeRate / 100));
  const riderPayoutAmount = round2(Math.max(0, deliveryFee - deliveryPlatformFeeAmount));
  const serviceFeeAmount = round2(grossAmount * (serviceFeeRate / 100));
  const taxAmount = round2(grossAmount * (taxRate / 100));
  const netPlatformRevenue = round2(
    vendorCommissionAmount + deliveryPlatformFeeAmount + serviceFeeAmount
  );

  return {
    grossAmount: round2(grossAmount),
    vendorGrossSales: round2(subtotal),
    vendorCommissionRate: round2(vendorCommissionRate),
    vendorCommissionAmount,
    vendorPayoutAmount,
    riderGrossDelivery: round2(deliveryFee),
    deliveryPlatformFeeRate: round2(deliveryPlatformFeeRate),
    deliveryPlatformFeeAmount,
    riderPayoutAmount,
    serviceFeeRate: round2(serviceFeeRate),
    serviceFeeAmount,
    taxRate: round2(taxRate),
    taxAmount,
    netPlatformRevenue,
    currency: "GHS"
  };
}

export async function ensureOrderSettlement(input: {
  orderId: string;
  subtotalAmount: unknown;
  deliveryFee: unknown;
  totalAmount: unknown;
}) {
  const settings = await getSettlementSettings();
  const breakdown = calculateSettlementBreakdown({
    subtotalAmount: input.subtotalAmount,
    deliveryFee: input.deliveryFee,
    totalAmount: input.totalAmount,
    vendorCommissionRate: settings.vendorCommissionRate,
    riderCommissionRate: settings.riderCommissionRate,
    serviceFeeRate: settings.serviceFeeRate,
    taxRate: settings.taxRate
  });

  return platformSettingsDelegate.orderSettlement.upsert({
    where: { orderId: input.orderId },
    update: breakdown,
    create: {
      orderId: input.orderId,
      ...breakdown
    }
  });
}
