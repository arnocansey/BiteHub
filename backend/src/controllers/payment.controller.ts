import crypto from "crypto";
import type { Request, Response } from "express";
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "../generated/prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { emitOrderUpdate } from "../realtime/socket";
import { createOrderEvent } from "../services/order-trust.service";
import { ensureOrderSettlement } from "../services/settlement.service";

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    paid_at?: string | null;
    amount?: number;
    channel?: string;
    metadata?: {
      orderId?: string;
    };
  };
};

const PAYSTACK_API_BASE = "https://api.paystack.co";

async function callPaystack<T>(path: string, init: RequestInit) {
  if (!env.paystackSecretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || !payload) {
    throw new Error((payload as { message?: string } | null)?.message ?? "Paystack request failed.");
  }

  return payload;
}

async function syncPaymentState(reference: string, payload?: PaystackVerifyResponse["data"]) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ providerRef: reference }, { id: reference }]
    },
    include: {
      order: true
    }
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  const verificationData =
    payload ??
    (
      await callPaystack<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET"
      })
    ).data;

  if (!verificationData) {
    throw new Error("Unable to verify payment status.");
  }

  const providerStatus = String(verificationData.status ?? "").toLowerCase();
  const nextStatus =
    providerStatus === "success"
      ? PaymentStatus.PAID
      : providerStatus === "failed"
        ? PaymentStatus.FAILED
        : PaymentStatus.PENDING;

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      provider: "paystack",
      providerRef: verificationData.reference || payment.providerRef,
      status: nextStatus,
      paidAt: nextStatus === PaymentStatus.PAID ? new Date(verificationData.paid_at ?? Date.now()) : null,
      rawPayload: verificationData
    },
    include: {
      order: {
        include: {
          items: true,
          payment: true,
          delivery: true,
          restaurant: true,
          deliveryAddress: true
        }
      }
    }
  });

  await ensureOrderSettlement({
    orderId: updatedPayment.orderId,
    subtotalAmount: updatedPayment.order.subtotalAmount,
    deliveryFee: updatedPayment.order.deliveryFee,
    totalAmount: updatedPayment.order.totalAmount
  });

  if (nextStatus === PaymentStatus.PAID && updatedPayment.order.status === OrderStatus.CANCELLED) {
    await createOrderEvent({
      orderId: updatedPayment.orderId,
      title: "Payment received after cancellation",
      description: "This order was paid after it had already been cancelled. Manual review may be required.",
      actorRole: UserRole.ADMIN,
      metadata: { paymentId: updatedPayment.id, providerRef: updatedPayment.providerRef }
    });
  } else if (nextStatus === PaymentStatus.PAID) {
    await createOrderEvent({
      orderId: updatedPayment.orderId,
      title: "Payment confirmed",
      description: "Paystack confirmed this transaction successfully.",
      actorRole: UserRole.CUSTOMER,
      actorId: updatedPayment.order.customerId,
      metadata: { paymentId: updatedPayment.id, providerRef: updatedPayment.providerRef }
    });
  } else if (nextStatus === PaymentStatus.FAILED) {
    await createOrderEvent({
      orderId: updatedPayment.orderId,
      title: "Payment failed",
      description: "The payment provider returned a failed status for this transaction.",
      actorRole: UserRole.CUSTOMER,
      actorId: updatedPayment.order.customerId,
      metadata: { paymentId: updatedPayment.id, providerRef: updatedPayment.providerRef }
    });
  }

  emitOrderUpdate(updatedPayment.orderId, {
    orderId: updatedPayment.orderId,
    status: updatedPayment.order.status,
    paymentStatus: updatedPayment.status
  });

  return updatedPayment;
}

export const paymentController = {
  async initialize(req: Request, res: Response) {
    const order = await prisma.order.findUnique({
      where: { id: req.body.orderId },
      include: { payment: true }
    });

    if (!order || order.customerId !== req.user!.sub) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    if (!order.payment) {
      res.status(404).json({ message: "Payment record not found for this order." });
      return;
    }

    if (order.payment.status === PaymentStatus.PAID) {
      res.json({
        payment: order.payment,
        authorizationUrl: null,
        alreadyPaid: true
      });
      return;
    }

    const reference = order.payment.providerRef || `bitehub_${order.id}_${Date.now()}`;
    const paymentMethod = (req.body.paymentMethod as PaymentMethod | undefined) ?? order.payment.method;
    const channels =
      paymentMethod === PaymentMethod.MOBILE_MONEY
        ? ["mobile_money"]
        : paymentMethod === PaymentMethod.CARD
          ? ["card", "bank_transfer"]
          : undefined;
    const callbackUrl =
      env.clientAppUrl.startsWith("http://") || env.clientAppUrl.startsWith("https://")
        ? env.clientAppUrl
        : undefined;

    const payload = await callPaystack<PaystackInitializeResponse>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: req.body.email,
        amount: Math.round(Number(req.body.amount) * 100),
        reference,
        callback_url: callbackUrl,
        channels,
        metadata: {
          orderId: order.id,
          customerId: req.user!.sub,
          paymentMethod
        }
      })
    });

    const updatedPayment = await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        provider: "paystack",
        providerRef: payload.data?.reference ?? reference,
        amount: req.body.amount,
        method: paymentMethod,
        status: PaymentStatus.PENDING,
        rawPayload: payload
      }
    });

    await createOrderEvent({
      orderId: order.id,
      title: "Payment link generated",
      description:
        paymentMethod === PaymentMethod.MOBILE_MONEY
          ? "A secure mobile money payment page was created for this order."
          : "A secure card payment page was created for this order.",
      actorRole: UserRole.CUSTOMER,
      actorId: req.user!.sub,
      metadata: { paymentId: updatedPayment.id, providerRef: updatedPayment.providerRef }
    });

    res.json({
      payment: updatedPayment,
      authorizationUrl: payload.data?.authorization_url ?? null,
      accessCode: payload.data?.access_code ?? null
    });
  },

  async verify(req: Request, res: Response) {
    const reference = String(req.body.reference);
    const ownedPayment = await prisma.payment.findFirst({
      where: {
        providerRef: reference,
        order: {
          customerId: req.user!.sub
        }
      }
    });

    if (!ownedPayment) {
      res.status(404).json({ message: "Payment not found." });
      return;
    }

    const updatedPayment = await syncPaymentState(reference);
    res.json({
      payment: updatedPayment,
      order: updatedPayment.order
    });
  },

  async handleWebhook(req: Request, res: Response) {
    const signature = req.get("x-paystack-signature");
    const rawBody = String((req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body ?? {}));
    const expectedSignature = crypto
      .createHmac("sha512", env.paystackWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (env.paystackWebhookSecret && signature !== expectedSignature) {
      res.status(401).json({ message: "Invalid Paystack webhook signature." });
      return;
    }

    const event = req.body?.event;
    const data = req.body?.data;

    if (event === "charge.success" && data?.reference) {
      await syncPaymentState(String(data.reference), data);
    }

    if (event === "charge.failed" && data?.reference) {
      await syncPaymentState(String(data.reference), data);
    }

    res.json({ received: true });
  }
};
