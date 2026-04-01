import { DeliveryStatus, OperatingMode, OrderStatus, UserRole } from "../generated/prisma/client";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";

const statusTitles: Partial<Record<OrderStatus, string>> = {
  PENDING: "Order placed",
  ACCEPTED: "Restaurant accepted your order",
  REJECTED: "Restaurant could not accept the order",
  PREPARING: "Kitchen is preparing your order",
  READY_FOR_PICKUP: "Order is ready for pickup",
  PICKED_UP: "Rider picked up your order",
  IN_TRANSIT: "Order is on the way",
  DELIVERED: "Order delivered",
  CANCELLED: "Order cancelled"
};

const deliveryTitles: Partial<Record<DeliveryStatus, string>> = {
  PENDING: "Awaiting rider assignment",
  ASSIGNED: "Rider assigned",
  PICKED_UP: "Rider picked up the order",
  IN_TRANSIT: "Rider is en route",
  DELIVERED: "Delivery completed",
  FAILED: "Delivery issue reported"
};

export async function createOrderEvent(input: {
  orderId: string;
  title: string;
  description?: string;
  status?: OrderStatus;
  actorRole?: UserRole;
  actorId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.orderEvent.create({
    data: {
      orderId: input.orderId,
      title: input.title,
      description: input.description,
      status: input.status,
      actorRole: input.actorRole,
      actorId: input.actorId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

export async function createStatusEvent(input: {
  orderId: string;
  status: OrderStatus;
  actorRole?: UserRole;
  actorId?: string;
  description?: string;
}) {
  return createOrderEvent({
    orderId: input.orderId,
    status: input.status,
    title: statusTitles[input.status] ?? "Order update",
    description: input.description,
    actorRole: input.actorRole,
    actorId: input.actorId
  });
}

export async function createDeliveryEvent(input: {
  orderId: string;
  deliveryStatus: DeliveryStatus;
  actorRole?: UserRole;
  actorId?: string;
  description?: string;
}) {
  return createOrderEvent({
    orderId: input.orderId,
    title: deliveryTitles[input.deliveryStatus] ?? "Delivery update",
    description: input.description,
    actorRole: input.actorRole,
    actorId: input.actorId,
    metadata: { deliveryStatus: input.deliveryStatus }
  });
}

export async function upsertEtaPrediction(orderId: string, overrides: Partial<{
  etaMinutes: number;
  confidencePercent: number;
  delayReason: string | null;
  prepOffsetMinutes: number;
  trafficOffsetMins: number;
  riderOffsetMins: number;
}> = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      delivery: { include: { riderProfile: true } }
    }
  });

  if (!order) {
    return null;
  }

  const basePrep = order.restaurant.estimatedDeliveryMins;
  const prepOffset =
    order.status === OrderStatus.PREPARING
      ? 8
      : order.status === OrderStatus.READY_FOR_PICKUP
        ? 2
        : order.status === OrderStatus.ACCEPTED
          ? 5
          : 0;
  const riderOffset = order.delivery?.riderProfileId ? 0 : 6;
  const trafficOffset = order.status === OrderStatus.IN_TRANSIT ? 5 : 2;

  const delayReason =
    order.restaurant.operatingMode === OperatingMode.BUSY
      ? "Restaurant is operating in busy mode."
      : riderOffset > 0
        ? "Finding the best rider for this order."
        : order.status === OrderStatus.PREPARING
          ? "Kitchen preparation is still in progress."
          : null;

  return prisma.etaPrediction.create({
    data: {
      orderId,
      etaMinutes: overrides.etaMinutes ?? Math.max(5, basePrep + prepOffset + riderOffset + trafficOffset),
      confidencePercent: overrides.confidencePercent ?? (delayReason ? 72 : 89),
      delayReason: overrides.delayReason === undefined ? delayReason : overrides.delayReason,
      prepOffsetMinutes: overrides.prepOffsetMinutes ?? prepOffset,
      riderOffsetMins: overrides.riderOffsetMins ?? riderOffset,
      trafficOffsetMins: overrides.trafficOffsetMins ?? trafficOffset
    }
  });
}
