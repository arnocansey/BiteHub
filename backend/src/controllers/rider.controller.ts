import type { Request, Response } from "express";
import { DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "../generated/prisma/client";
import { PayoutRequestStatus, PayoutRequestTarget } from "../generated/prisma/enums";
import { prisma } from "../config/prisma";
import { emitOrderUpdate } from "../realtime/socket";
import { createDeliveryEvent, upsertEtaPrediction } from "../services/order-trust.service";
import { getRiderPayoutSnapshot } from "../services/payout-request.service";

const payoutRequestDelegate = prisma as typeof prisma & {
  payoutRequest: any;
};

export const riderController = {
  async profile(req: Request, res: Response) {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.sub },
      include: { user: true }
    });
    res.json(rider);
  },

  async payoutRequests(req: Request, res: Response) {
    const snapshot = await getRiderPayoutSnapshot(req.user!.sub);
    res.json(snapshot);
  },

  async createPayoutRequest(req: Request, res: Response) {
    const snapshot = await getRiderPayoutSnapshot(req.user!.sub);

    if (snapshot.approvalStatus !== "APPROVED") {
      return res.status(400).json({ message: "Rider account must be approved before requesting a payout." });
    }

    if (snapshot.requests.some((item) => item.status === PayoutRequestStatus.PENDING)) {
      return res.status(409).json({ message: "There is already a pending payout request awaiting admin review." });
    }

    if (snapshot.availableAmount < snapshot.minimumPayoutAmount) {
      return res.status(400).json({
        message: `Minimum payout request is GHS ${snapshot.minimumPayoutAmount.toLocaleString()}.`
      });
    }

    const request = await payoutRequestDelegate.payoutRequest.create({
      data: {
        targetType: PayoutRequestTarget.RIDER,
        requesterUserId: req.user!.sub,
        riderProfileId: snapshot.profileId,
        requestedAmount: snapshot.availableAmount,
        note: req.body.note ?? null
      }
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Rider payout request",
          body: `${snapshot.payeeName} requested a payout of GHS ${snapshot.availableAmount.toLocaleString()}.`,
          payload: {
            type: "PAYOUT_REQUEST",
            targetType: PayoutRequestTarget.RIDER,
            requestId: request.id
          }
        }))
      });
    }

    res.status(201).json(request);
  },

  async jobs(req: Request, res: Response) {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.sub }
    });
    const jobs = await prisma.delivery.findMany({
      where: { OR: [{ riderProfileId: rider?.id }, { riderProfileId: null }] },
      include: {
        order: {
          include: {
            restaurant: true,
            deliveryAddress: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    });
    res.json(jobs);
  },

  async updateAvailability(req: Request, res: Response) {
    const nextIsOnline = Boolean(req.body.isOnline);
    const rider = await prisma.riderProfile.update({
      where: { userId: req.user!.sub },
      data: {
        isOnline: nextIsOnline,
        currentLatitude: nextIsOnline ? undefined : null,
        currentLongitude: nextIsOnline ? undefined : null
      }
    });

    res.json(rider);
  },

  async updateLocation(req: Request, res: Response) {
    const existingRider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.sub },
      select: { id: true, isOnline: true }
    });

    if (!existingRider) {
      return res.status(404).json({ message: "Rider profile not found." });
    }

    if (!existingRider.isOnline) {
      return res.status(409).json({ message: "Go online before sharing live location." });
    }

    const rider = await prisma.riderProfile.update({
      where: { id: existingRider.id },
      data: {
        currentLatitude: req.body.latitude,
        currentLongitude: req.body.longitude
      }
    });

    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        riderProfileId: rider.id,
        status: {
          in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT]
        }
      },
      select: { orderId: true, id: true }
    });

    activeDeliveries.forEach((delivery) => {
      emitOrderUpdate(delivery.orderId, {
        orderId: delivery.orderId,
        deliveryId: delivery.id,
        riderLocation: {
          latitude: rider.currentLatitude,
          longitude: rider.currentLongitude
        }
      });
    });

    res.json({
      ok: true,
      latitude: rider.currentLatitude,
      longitude: rider.currentLongitude
    });
  },

  async acceptJob(req: Request, res: Response) {
    const deliveryId = String(req.params.deliveryId);
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        riderProfileId: rider?.id,
        status: DeliveryStatus.ASSIGNED
      }
    });

    await Promise.all([
      createDeliveryEvent({
        orderId: delivery.orderId,
        deliveryStatus: delivery.status,
        actorRole: UserRole.RIDER,
        actorId: req.user!.sub,
        description: "Rider accepted the delivery request."
      }),
      upsertEtaPrediction(delivery.orderId)
    ]);

    emitOrderUpdate(delivery.orderId, {
      orderId: delivery.orderId,
      deliveryStatus: delivery.status
    });

    res.json(delivery);
  },

  async declineJob(_req: Request, res: Response) {
    res.json({ declined: true });
  },

  async updateJobStatus(req: Request, res: Response) {
    const deliveryId = String(req.params.deliveryId);
    const nextStatus = req.body.status as DeliveryStatus;

    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: nextStatus,
        pickedUpAt:
          nextStatus === DeliveryStatus.PICKED_UP ? new Date() : undefined,
        deliveredAt:
          nextStatus === DeliveryStatus.DELIVERED ? new Date() : undefined
      },
      include: {
        order: {
          include: {
            payment: true,
            settlement: true
          }
        }
      }
    });

    if (nextStatus === DeliveryStatus.DELIVERED) {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
          payment: delivery.order?.payment?.method === PaymentMethod.CASH
            ? {
                update: {
                  status: PaymentStatus.PAID,
                  paidAt: new Date()
                }
              }
            : undefined
        }
      });
    }

    await Promise.all([
      createDeliveryEvent({
        orderId: delivery.orderId,
        deliveryStatus: delivery.status,
        actorRole: UserRole.RIDER,
        actorId: req.user!.sub,
        description: "Rider updated the delivery status."
      }),
      upsertEtaPrediction(delivery.orderId, delivery.status === DeliveryStatus.DELIVERED
        ? { etaMinutes: 0, confidencePercent: 100, delayReason: null }
        : {})
    ]);

    emitOrderUpdate(delivery.orderId, {
      orderId: delivery.orderId,
      deliveryStatus: delivery.status
    });

    res.json(delivery);
  },

  async addProof(req: Request, res: Response) {
    const deliveryId = String(req.params.deliveryId);
    const proof = await prisma.deliveryProof.create({
      data: {
        deliveryId,
        proofType: req.body.proofType,
        imageUrl: req.body.imageUrl,
        note: req.body.note,
        otpCode: req.body.otpCode,
        capturedById: req.user!.sub
      }
    });

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { orderId: true }
    });

    if (delivery) {
      await createDeliveryEvent({
        orderId: delivery.orderId,
        deliveryStatus: DeliveryStatus.DELIVERED,
        actorRole: UserRole.RIDER,
        actorId: req.user!.sub,
        description: `Delivery proof captured via ${proof.proofType.toLowerCase()}.`
      });
    }

    res.status(201).json(proof);
  },

  async earnings(req: Request, res: Response) {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    const deliveries = await prisma.delivery.findMany({
      where: {
        riderProfileId: rider?.id,
        status: DeliveryStatus.DELIVERED
      },
      include: {
        order: {
          include: {
            settlement: true
          }
        }
      }
    });

    res.json({
      completedDeliveries: deliveries.length,
      estimatedEarnings: Number(
        deliveries
          .reduce((sum, delivery) => sum + Number(delivery.order?.settlement?.riderPayoutAmount ?? 0), 0)
          .toFixed(2)
      )
    });
  },

  async incentives(req: Request, res: Response) {
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: req.user!.sub }
    });

    const [incentives, heatmap, qualityScores] = await Promise.all([
      prisma.riderIncentive.findMany({
        where: {
          riderProfileId: rider?.id,
          isActive: true
        },
        orderBy: { startsAt: "asc" },
        take: 8
      }),
      prisma.marketHeatmap.findMany({
        orderBy: [{ demandLevel: "desc" }, { updatedAt: "desc" }],
        take: 6
      }),
      prisma.qualityScore.findMany({
        where: { riderProfileId: rider?.id },
        orderBy: { measuredAt: "desc" },
        take: 6
      })
    ]);

    res.json({ incentives, heatmap, qualityScores });
  }
};
