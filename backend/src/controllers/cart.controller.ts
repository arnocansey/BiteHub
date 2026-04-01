import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";

export const cartController = {
  async getCart(req: Request, res: Response) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    const cart = await prisma.cart.findFirst({
      where: { customerProfileId: profile?.id },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true
      },
      orderBy: { updatedAt: "desc" }
    });

    res.json(cart);
  },

  async addItem(req: Request, res: Response) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    if (!profile) {
      throw new ApiError(404, "Customer profile not found");
    }

    let cart = await prisma.cart.findFirst({
      where: {
        customerProfileId: profile.id,
        restaurantId: req.body.restaurantId
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          customerProfileId: profile.id,
          restaurantId: req.body.restaurantId
        }
      });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: req.body.menuItemId }
    });

    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: menuItem.id,
        quantity: req.body.quantity,
        unitPrice: menuItem.price
      }
    });

    res.status(201).json(item);
  },

  async updateItem(req: Request, res: Response) {
    const cartItemId = String(req.params.cartItemId);
    const item = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: req.body.quantity }
    });

    res.json(item);
  },

  async removeItem(req: Request, res: Response) {
    const cartItemId = String(req.params.cartItemId);
    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    res.status(204).send();
  }
};
