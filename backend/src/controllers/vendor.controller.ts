import type { Request, Response } from "express";
import { OperatingMode, OrderStatus, UserRole } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { emitOrderUpdate } from "../realtime/socket";
import { createOrderEvent, createStatusEvent, upsertEtaPrediction } from "../services/order-trust.service";

function slugifyRestaurantName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const vendorController = {
  async dashboard(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: {
        restaurants: {
          include: {
            orders: {
              include: {
                payment: true,
                settlement: true
              }
            }
          }
        },
        user: true
      }
    } as any);
    res.json(vendor);
  },

  async settings(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true, user: true }
    });

    res.json(vendor);
  },

  async restaurantsMe(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });

    res.json(vendor?.restaurants ?? []);
  },

  async createRestaurant(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { user: true }
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found." });
    }

    const baseSlug = slugifyRestaurantName(req.body.name) || `restaurant-${Date.now().toString().slice(-6)}`;
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        vendorProfileId: vendor.id,
        categoryId: req.body.categoryId ?? undefined,
        name: req.body.name,
        slug,
        description: req.body.description ?? undefined,
        address: req.body.address,
        latitude: req.body.latitude ?? 5.6037,
        longitude: req.body.longitude ?? -0.187,
        deliveryFee: req.body.deliveryFee ?? 12,
        minimumOrderAmount: req.body.minimumOrderAmount ?? 25,
        estimatedDeliveryMins: req.body.estimatedDeliveryMins ?? 25,
        storyHeadline: req.body.storyHeadline ?? `Fresh favorites from ${req.body.name}`,
        storyBody:
          req.body.storyBody ??
          `${req.body.name} is now live on BiteHub with carefully prepared meals, dependable delivery, and a kitchen story customers can come back to.`,
        priceBand: req.body.priceBand ?? "Mid-range",
        operatingMode: OperatingMode.LIVE,
        openingHours: [
          { label: "Mon - Fri", open: "8:00 AM", close: "10:00 PM", isClosed: false },
          { label: "Saturday", open: "9:00 AM", close: "11:00 PM", isClosed: false },
          { label: "Sunday", open: "11:00 AM", close: "8:00 PM", isClosed: false }
        ]
      }
    });

    res.status(201).json(restaurant);
  },

  async updateRestaurant(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });

    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    if (!restaurantIds.includes(restaurantId)) {
      return res.status(403).json({ message: "You can only edit your own restaurants." });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof req.body.name === "string") updateData.name = req.body.name;
    if (typeof req.body.address === "string") updateData.address = req.body.address;
    if (typeof req.body.description === "string" || req.body.description === null) updateData.description = req.body.description ?? null;
    if (typeof req.body.categoryId === "string") updateData.categoryId = req.body.categoryId;
    if (typeof req.body.latitude === "number") updateData.latitude = req.body.latitude;
    if (typeof req.body.longitude === "number") updateData.longitude = req.body.longitude;
    if (typeof req.body.deliveryFee === "number") updateData.deliveryFee = req.body.deliveryFee;
    if (typeof req.body.minimumOrderAmount === "number") updateData.minimumOrderAmount = req.body.minimumOrderAmount;
    if (typeof req.body.estimatedDeliveryMins === "number") updateData.estimatedDeliveryMins = req.body.estimatedDeliveryMins;
    if (typeof req.body.storyHeadline === "string" || req.body.storyHeadline === null) updateData.storyHeadline = req.body.storyHeadline ?? null;
    if (typeof req.body.storyBody === "string" || req.body.storyBody === null) updateData.storyBody = req.body.storyBody ?? null;
    if (typeof req.body.priceBand === "string" || req.body.priceBand === null) updateData.priceBand = req.body.priceBand ?? null;

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData
    });

    res.json(restaurant);
  },

  async orders(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    const orders = await prisma.order.findMany({
      where: { restaurant: { vendorProfileId: vendor?.id } },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true } } } },
        customer: true,
        restaurant: true,
        delivery: true,
        payment: true,
        settlement: true,
        deliveryAddress: true
      },
      orderBy: { placedAt: "desc" }
    } as any);

    res.json(orders);
  },

  async menuItems(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });

    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: { in: restaurantIds } },
      include: {
        restaurant: { select: { id: true, name: true, categoryId: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { orderItems: true } }
      },
      orderBy: [{ restaurantId: "asc" }, { createdAt: "desc" }]
    });

    res.json(menuItems);
  },

  async createMenuItem(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });

    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    if (!restaurantIds.includes(String(req.body.restaurantId))) {
      return res.status(403).json({ message: "You can only add items to your own restaurants." });
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId: req.body.restaurantId,
        categoryId: req.body.categoryId ?? undefined,
        name: req.body.name,
        description: req.body.description ?? undefined,
        price: req.body.price,
        imageUrl: req.body.imageUrl ?? undefined,
        status: req.body.status,
        preparationMins: req.body.preparationMins,
        isSignature: req.body.isSignature ?? false,
        isFeatured: req.body.isFeatured ?? false,
        badgeText: req.body.badgeText ?? undefined,
        spiceLevel: req.body.spiceLevel ?? undefined,
        calories: req.body.calories ?? undefined
      },
      include: {
        restaurant: { select: { id: true, name: true, categoryId: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { orderItems: true } }
      }
    });
    res.status(201).json(item);
  },

  async updateMenuItem(req: Request, res: Response) {
    const menuItemId = String(req.params.menuItemId);
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });
    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { restaurantId: true }
    });

    if (!existingItem || !restaurantIds.includes(existingItem.restaurantId)) {
      return res.status(403).json({ message: "You can only edit items from your own restaurants." });
    }

    const item = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: req.body,
      include: {
        restaurant: { select: { id: true, name: true, categoryId: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { orderItems: true } }
      }
    });

    res.json(item);
  },

  async deleteMenuItem(req: Request, res: Response) {
    const menuItemId = String(req.params.menuItemId);
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });
    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { restaurantId: true }
    });

    if (!existingItem || !restaurantIds.includes(existingItem.restaurantId)) {
      return res.status(403).json({ message: "You can only delete items from your own restaurants." });
    }

    await prisma.menuItem.delete({
      where: { id: menuItemId }
    });

    res.status(204).send();
  },

  async updateOrderStatus(req: Request, res: Response) {
    const orderId = String(req.params.orderId);
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: req.body.status as OrderStatus }
    });

    await Promise.all([
      createStatusEvent({
        orderId: order.id,
        status: order.status,
        actorRole: UserRole.VENDOR,
        actorId: req.user!.sub,
        description: "Restaurant updated the preparation status."
      }),
      upsertEtaPrediction(order.id)
    ]);

    emitOrderUpdate(order.id, {
      orderId: order.id,
      status: order.status
    });

    res.json(order);
  },

  async updateOperatingState(req: Request, res: Response) {
    const restaurantId = String(req.body.restaurantId);
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        operatingMode: req.body.operatingMode as OperatingMode,
        busyUntil: req.body.busyUntil ? new Date(req.body.busyUntil) : null,
        pauseReason: req.body.pauseReason ?? null
      }
    });

    const activeOrder = await prisma.order.findFirst({
      where: {
        restaurantId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP
          ]
        }
      },
      orderBy: { placedAt: "desc" },
      select: { id: true }
    });

    if (activeOrder) {
      await createOrderEvent({
        orderId: activeOrder.id,
        title: "Restaurant operating state updated",
        description: `${restaurant.name} is now ${restaurant.operatingMode}.`,
        actorRole: UserRole.VENDOR,
        actorId: req.user!.sub,
        metadata: {
          restaurantId: restaurant.id,
          operatingMode: restaurant.operatingMode,
          busyUntil: restaurant.busyUntil,
          pauseReason: restaurant.pauseReason
        }
      });
    }

    res.json(restaurant);
  },

  async updateSettings(req: Request, res: Response) {
    const restaurantId = String(req.body.restaurantId);
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true, user: true }
    });

    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    if (!vendor || !restaurantIds.includes(restaurantId)) {
      return res.status(403).json({ message: "You can only update settings for your own restaurants." });
    }

    const nextOperatingMode =
      typeof req.body.isOpen === "boolean"
        ? req.body.isOpen
          ? OperatingMode.LIVE
          : OperatingMode.PAUSED
        : undefined;

    await Promise.all([
      prisma.vendorProfile.update({
        where: { id: vendor.id },
        data: {
          autoAcceptOrders: req.body.autoAcceptOrders,
          notifyOnNewOrders: req.body.notifyOnNewOrders,
          notifyOnPromotions: req.body.notifyOnPromotions,
          payoutAccount: req.body.payoutAccount,
          payoutBankName: req.body.payoutBankName,
          payoutAccountNumber: req.body.payoutAccountNumber,
          payoutAccountName: req.body.payoutAccountName,
          payoutVerified: req.body.payoutVerified
        } as any
      }),
      prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          operatingMode: nextOperatingMode,
          pauseReason:
            typeof req.body.isOpen === "boolean"
              ? req.body.isOpen
                ? null
                : "Closed from vendor settings"
              : undefined,
          openingHours: req.body.openingHours
        } as any
      })
    ]);

    const refreshedVendor = await prisma.vendorProfile.findUnique({
      where: { id: vendor.id },
      include: { restaurants: true, user: true }
    });

    res.json(refreshedVendor);
  },

  async forecasts(req: Request, res: Response) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { restaurants: true }
    });

    const restaurantIds = vendor?.restaurants.map((restaurant) => restaurant.id) ?? [];
    const forecasts = await prisma.forecastSnapshot.findMany({
      where: { restaurantId: { in: restaurantIds } },
      include: { restaurant: true },
      orderBy: [{ forecastDate: "asc" }, { createdAt: "desc" }],
      take: 12
    });

    const qualityScores = await prisma.qualityScore.findMany({
      where: {
        OR: [
          { vendorProfileId: vendor?.id ?? undefined },
          { restaurantId: { in: restaurantIds } }
        ]
      },
      include: { restaurant: true },
      orderBy: { measuredAt: "desc" },
      take: 8
    });

    res.json({ forecasts, qualityScores });
  }
};
