import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const reviewController = {
  async create(req: Request, res: Response) {
    const review = await prisma.review.create({
      data: {
        userId: req.user!.sub,
        restaurantId: req.body.restaurantId,
        rating: req.body.rating,
        comment: req.body.comment
      }
    });

    res.status(201).json(review);
  },

  async listByRestaurant(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(reviews);
  }
};
