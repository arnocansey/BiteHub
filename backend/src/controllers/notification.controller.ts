import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const notificationController = {
  async list(req: Request, res: Response) {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" }
    });

    res.json(notifications);
  },

  async markRead(req: Request, res: Response) {
    const notificationId = String(req.params.notificationId);
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: req.user!.sub }
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json(updatedNotification);
  },

  async markAllRead(req: Request, res: Response) {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.sub, isRead: false },
      data: { isRead: true }
    });

    res.json({ updated: result.count });
  },

  async clearRead(req: Request, res: Response) {
    const result = await prisma.notification.deleteMany({
      where: { userId: req.user!.sub, isRead: true }
    });

    res.json({ deleted: result.count });
  },

  async broadcast(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      where: req.body.role ? { role: req.body.role } : undefined,
      select: { id: true }
    });

    if (!users.length) {
      return res.status(404).json({ message: "No users matched the broadcast target" });
    }

    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title: req.body.title,
        body: req.body.body
      }))
    });

    res.status(201).json({ delivered: users.length });
  }
};
