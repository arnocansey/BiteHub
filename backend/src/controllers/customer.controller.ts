import type { Request, Response } from "express";
import { OrderStatus } from "../generated/prisma/client";
import { GroupOrderStatus, ScheduledOrderStatus } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";

function createInviteCode() {
  return `BH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const customerController = {
  async profile(req: Request, res: Response) {
    const customer = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: {
        customerProfile: {
          include: {
            loyaltyWallet: true,
            subscriptions: {
              orderBy: { createdAt: "desc" }
            },
            mealPlans: {
              orderBy: { createdAt: "desc" }
            },
            scheduledOrders: {
              include: { restaurant: true },
              orderBy: { nextRunAt: "asc" }
            }
          }
        }
      }
    });
    res.json(customer);
  },

  async orders(req: Request, res: Response) {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user!.sub },
      include: { items: true, restaurant: true, delivery: true, payment: true },
      orderBy: { placedAt: "desc" }
    });
    res.json(orders);
  },

  async favorites(req: Request, res: Response) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.sub },
      include: { restaurant: true }
    });
    res.json(favorites);
  },

  async addresses(req: Request, res: Response) {
    const addresses = await prisma.address.findMany({
      where: { customerId: req.user!.sub },
      orderBy: { id: "desc" }
    });
    res.json(addresses);
  },

  async createAddress(req: Request, res: Response) {
    const address = await prisma.address.create({
      data: {
        customerId: req.user!.sub,
        label: req.body.label,
        fullAddress: req.body.fullAddress,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        instructions: req.body.instructions ?? undefined
      }
    });

    await prisma.customerProfile.updateMany({
      where: { userId: req.user!.sub, defaultAddress: null },
      data: { defaultAddress: req.body.fullAddress }
    });

    res.status(201).json(address);
  },

  async retentionOverview(req: Request, res: Response) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.sub },
      include: {
        loyaltyWallet: true,
        groupOrders: {
          include: { restaurant: true, members: true },
          orderBy: { createdAt: "desc" },
          take: 5
        },
        scheduledOrders: {
          include: { restaurant: true, address: true },
          orderBy: { nextRunAt: "asc" },
          take: 5
        },
        mealPlans: {
          orderBy: { createdAt: "desc" },
          take: 3
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      }
    });

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    const recentOrders = await prisma.order.findMany({
      where: { customerId: req.user!.sub, status: OrderStatus.DELIVERED },
      include: { restaurant: true, items: { include: { menuItem: true } } },
      orderBy: { placedAt: "desc" },
      take: 8
    });

    const reorderSuggestions = Array.from(
      new Map(
        recentOrders.map((order) => [
          order.restaurantId,
          {
            orderId: order.id,
            restaurantId: order.restaurantId,
            restaurantName: order.restaurant.name,
            placedAt: order.placedAt,
            totalAmount: order.totalAmount,
            topItems: order.items.slice(0, 3).map((item) => item.menuItem.name)
          }
        ])
      ).values()
    ).slice(0, 4);

    const loyaltyWallet =
      profile.loyaltyWallet ??
      (await prisma.loyaltyWallet.create({
        data: {
          customerProfileId: profile.id,
          pointsBalance: recentOrders.length * 15,
          lifetimePoints: recentOrders.length * 15,
          tier: recentOrders.length > 8 ? "PLUS" : "CORE"
        }
      }));

    res.json({
      loyaltyWallet,
      groupOrders: profile.groupOrders,
      scheduledOrders: profile.scheduledOrders,
      mealPlans: profile.mealPlans,
      subscriptions: profile.subscriptions,
      reorderSuggestions
    });
  },

  async createGroupOrder(req: Request, res: Response) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { user: true }
    });

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    const groupOrder = await prisma.groupOrder.create({
      data: {
        ownerProfileId: profile.id,
        restaurantId: req.body.restaurantId,
        title: req.body.title,
        inviteCode: createInviteCode(),
        status: GroupOrderStatus.OPEN,
        scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : null,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        members: {
          create: {
            customerProfileId: profile.id,
            displayName: `${profile.user.firstName} ${profile.user.lastName}`
          }
        }
      },
      include: { restaurant: true, members: true }
    });

    res.status(201).json(groupOrder);
  },

  async createScheduledOrder(req: Request, res: Response) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    const scheduledOrder = await prisma.scheduledOrder.create({
      data: {
        customerProfileId: profile.id,
        restaurantId: req.body.restaurantId,
        addressId: req.body.addressId,
        title: req.body.title,
        cadenceLabel: req.body.cadenceLabel,
        nextRunAt: new Date(req.body.nextRunAt),
        status: ScheduledOrderStatus.ACTIVE,
        itemSummary: req.body.itemSummary
      },
      include: { restaurant: true, address: true }
    });

    res.status(201).json(scheduledOrder);
  },

  async createMealPlan(req: Request, res: Response) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        customerProfileId: profile.id,
        title: req.body.title,
        goal: req.body.goal,
        weeklyBudget: req.body.weeklyBudget,
        mealsPerWeek: req.body.mealsPerWeek,
        cuisineFocus: req.body.cuisineFocus
      }
    });

    res.status(201).json(mealPlan);
  }
};
