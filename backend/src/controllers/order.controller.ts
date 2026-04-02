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

function getEffectiveMenuItemPrice(item: any) {
  const now = new Date();
  const specialStartsAt = item.specialStartsAt ? new Date(item.specialStartsAt) : null;
  const specialEndsAt = item.specialEndsAt ? new Date(item.specialEndsAt) : null;
  const hasActiveSpecial =
    typeof item.specialPrice !== "undefined" &&
    item.specialPrice !== null &&
    (!specialStartsAt || specialStartsAt <= now) &&
    (!specialEndsAt || specialEndsAt >= now);

  return Number(hasActiveSpecial ? item.specialPrice : item.price ?? 0);
}

export const orderController = {
  async checkout(req: Request, res: Response) {
    const restaurant = (await prisma.restaurant.findUnique({
      where: { id: req.body.restaurantId },
      include: { vendorProfile: true }
    })) as any;

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const requestedItems = req.body.items as Array<{
      menuItemId: string;
      quantity: number;
      selectedOptionIds?: string[];
      note?: string;
    }>;

    if (!requestedItems?.length) {
      return res.status(400).json({ message: "Add at least one menu item to your order." });
    }

    const menuItemIds = requestedItems.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurant.id
      },
      include: {
        modifierGroups: {
          include: {
            options: {
              where: { isAvailable: true },
              orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
            }
          },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
        }
      }
    } as any);

    const menuItemMap = new Map(menuItems.map((item: any) => [item.id, item]));
    let orderItems;
    try {
      orderItems = requestedItems.map((requestedItem) => {
        const menuItem = menuItemMap.get(requestedItem.menuItemId);

        if (!menuItem) {
          throw new Error("One or more menu items are no longer available from this restaurant.");
        }

        const selectedOptionIds = Array.from(new Set(requestedItem.selectedOptionIds ?? []));
        const selectedOptions = menuItem.modifierGroups.flatMap((group: any) =>
          group.options.filter((option: any) => selectedOptionIds.includes(option.id)).map((option: any) => ({
            ...option,
            groupId: group.id,
            groupName: group.name
          }))
        );

        menuItem.modifierGroups.forEach((group: any) => {
          const chosenInGroup = selectedOptions.filter((option: any) => option.groupId === group.id);
          const count = chosenInGroup.length;
          const minRequired = group.isRequired ? Math.max(group.minSelect ?? 1, 1) : group.minSelect ?? 0;
          const maxAllowed = group.selectionType === "SINGLE" ? 1 : group.maxSelect ?? Number.POSITIVE_INFINITY;

          if (count < minRequired) {
            throw new Error(`Select ${group.name} before adding this item.`);
          }

          if (count > maxAllowed) {
            throw new Error(`You selected too many options for ${group.name}.`);
          }
        });

        const unitPrice =
          getEffectiveMenuItemPrice(menuItem) +
          selectedOptions.reduce((sum: number, option: any) => sum + Number(option.priceDelta ?? 0), 0);
        const quantity = Number(requestedItem.quantity ?? 1);

        return {
          menuItemId: menuItem.id,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          itemNameSnapshot: menuItem.name,
          customerNote: requestedItem.note?.trim() || null,
          customizationSummary: {
            groups: menuItem.modifierGroups.map((group: any) => ({
              id: group.id,
              name: group.name,
              selectionType: group.selectionType,
              selectedOptions: selectedOptions
                .filter((option: any) => option.groupId === group.id)
                .map((option: any) => ({
                  id: option.id,
                  name: option.name,
                  priceDelta: Number(option.priceDelta ?? 0)
                }))
            }))
          }
        };
      });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid menu customization." });
    }

    const subtotalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = Number(restaurant.deliveryFee ?? 0);
    const discountAmount = 0;
    const totalAmount = subtotalAmount + deliveryFee - discountAmount;
    const initialStatus = restaurant?.vendorProfile?.autoAcceptOrders ? OrderStatus.ACCEPTED : OrderStatus.PENDING;

    const order = await prisma.order.create({
      data: {
        customerId: req.user!.sub,
        restaurantId: req.body.restaurantId,
        deliveryAddressId: req.body.deliveryAddressId,
        promoCodeId: req.body.promoCodeId,
        status: initialStatus,
        subtotalAmount,
        deliveryFee,
        discountAmount,
        totalAmount,
        paymentMethod: req.body.paymentMethod ?? PaymentMethod.CASH,
        customerNotes: req.body.customerNotes,
        items: { create: orderItems },
        payment: {
          create: {
            amount: totalAmount,
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
