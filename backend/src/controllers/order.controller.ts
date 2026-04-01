import type { Request, Response } from "express";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SupportTicketSource,
  SupportTicketStatus,
  UserRole
} from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { emitOrderUpdate } from "../realtime/socket";
import {
  createOrderEvent,
  createStatusEvent,
  upsertEtaPrediction
} from "../services/order-trust.service";
import { ensureOrderSettlement } from "../services/settlement.service";

export const orderController = {
  async checkout(req: Request, res: Response) {
    const restaurant = (await prisma.restaurant.findUnique({
      where: { id: req.body.restaurantId },
      include: { vendorProfile: true }
    })) as any;
    const initialStatus = restaurant?.vendorProfile?.autoAcceptOrders ? OrderStatus.ACCEPTED : OrderStatus.PENDING;

    const order = await prisma.order.create({
      data: {
        customerId: req.user!.sub,
        restaurantId: req.body.restaurantId,
        deliveryAddressId: req.body.deliveryAddressId,
        promoCodeId: req.body.promoCodeId,
        status: initialStatus,
        subtotalAmount: req.body.subtotalAmount,
        deliveryFee: req.body.deliveryFee,
        discountAmount: req.body.discountAmount ?? 0,
        totalAmount: req.body.totalAmount,
        paymentMethod: req.body.paymentMethod ?? PaymentMethod.CASH,
        customerNotes: req.body.customerNotes,
        items: { create: req.body.items },
        payment: {
          create: {
            amount: req.body.totalAmount,
            method: req.body.paymentMethod ?? PaymentMethod.CASH,
            provider:
              req.body.paymentMethod === PaymentMethod.CASH
                ? "cash"
                : "paystack",
            status: PaymentStatus.PENDING
          }
        },
        delivery: { create: {} }
      },
      include: { items: true, payment: true, delivery: true }
    });

    await ensureOrderSettlement({
      orderId: order.id,
      subtotalAmount: order.subtotalAmount,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount
    });

    await Promise.all([
      createStatusEvent({
        orderId: order.id,
        status: order.status,
        actorRole: UserRole.CUSTOMER,
        actorId: req.user!.sub,
        description: restaurant?.vendorProfile?.autoAcceptOrders
          ? "Customer submitted a new order and vendor auto-accept is enabled."
          : "Customer submitted a new order."
      }),
      createOrderEvent({
        orderId: order.id,
        title: "Payment initialized",
        description: `Payment method selected: ${order.paymentMethod}.`,
        actorRole: UserRole.CUSTOMER,
        actorId: req.user!.sub
      }),
      ...(restaurant?.vendorProfile?.autoAcceptOrders
        ? [
            createOrderEvent({
              orderId: order.id,
              title: "Vendor auto-accepted order",
              description: "This restaurant is configured to skip manual approval.",
              actorRole: UserRole.VENDOR
            })
          ]
        : []),
      upsertEtaPrediction(order.id),
      prisma.notification.createMany({
        data: [
          ...(restaurant?.vendorProfile?.userId
            ? [
                {
                  userId: restaurant.vendorProfile.userId,
                  title: "New customer order",
                  body: `${restaurant.name} just received a new order${restaurant?.vendorProfile?.autoAcceptOrders ? " and it was auto-accepted." : "."}`,
                  payload: { orderId: order.id, restaurantId: restaurant.id, type: "NEW_ORDER" }
                }
              ]
            : []),
          ...(
            await prisma.user.findMany({
              where: { role: UserRole.ADMIN, isActive: true },
              select: { id: true }
            })
          ).map((admin) => ({
            userId: admin.id,
            title: "New order placed",
            body: `${restaurant?.name ?? "A restaurant"} has a new customer order awaiting operational review.`,
            payload: { orderId: order.id, restaurantId: restaurant?.id, type: "NEW_ORDER" }
          }))
        ]
      })
    ]);

    emitOrderUpdate(order.id, {
      orderId: order.id,
      status: order.status
    });

    res.status(201).json(order);
  },

  async getOrder(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        delivery: true,
        restaurant: true,
        deliveryAddress: true
      }
    });
    res.json(order);
  },

  async trackOrder(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const tracking = await prisma.delivery.findFirst({
      where: { orderId },
      include: {
        order: {
          include: {
            restaurant: true,
            deliveryAddress: true
          }
        },
        riderProfile: {
          select: {
            id: true,
            currentLatitude: true,
            currentLongitude: true,
            vehicleType: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        proofs: true
      }
    });
    res.json(tracking);
  },

  async timeline(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const events = await prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" }
    });

    res.json(events);
  },

  async eta(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    let eta = await prisma.etaPrediction.findFirst({
      where: { orderId },
      orderBy: { predictedAt: "desc" }
    });

    if (!eta) {
      eta = await upsertEtaPrediction(orderId);
    }

    res.json(eta);
  },

  async createSupportTicket(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true }
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        orderId,
        restaurantId: order?.restaurantId,
        requesterId: req.user!.sub,
        source: (req.body.source as SupportTicketSource | undefined) ?? SupportTicketSource.CUSTOMER,
        status: SupportTicketStatus.OPEN,
        severity: req.body.severity,
        subject: req.body.subject,
        message: req.body.message
      }
    });

    await createOrderEvent({
      orderId,
      title: "Support request opened",
      description: req.body.subject,
      actorRole: req.user!.role,
      actorId: req.user!.sub,
      metadata: { supportTicketId: ticket.id, severity: ticket.severity }
    });

    res.status(201).json(ticket);
  },

  async cancelOrder(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED }
    });

    await Promise.all([
      createStatusEvent({
        orderId: order.id,
        status: order.status,
        actorRole: UserRole.CUSTOMER,
        actorId: req.user!.sub,
        description: "Customer cancelled this order."
      }),
      upsertEtaPrediction(order.id, {
        etaMinutes: 0,
        confidencePercent: 100,
        delayReason: "Order cancelled."
      })
    ]);

    emitOrderUpdate(order.id, {
      orderId: order.id,
      status: order.status
    });

    res.json(order);
  }
};
