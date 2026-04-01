import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const promoController = {
  async validate(req: Request, res: Response) {
    const promo = await prisma.promoCode.findFirst({
      where: {
        code: req.body.code,
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() }
      }
    });

    if (!promo) {
      return res.status(404).json({ valid: false, message: "Promo code not found" });
    }

    const orderAmount = req.body.orderAmount;
    const minOrderAmount = Number(promo.minOrderAmount ?? 0);

    if (orderAmount < minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: "Order amount below promo threshold"
      });
    }

    res.json({ valid: true, promo });
  }
};

