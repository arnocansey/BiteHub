import { DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus } from "../src/generated/prisma/client";
import { prisma } from "../src/config/prisma";
import { ensureOrderSettlement } from "../src/services/settlement.service";

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      payment: true,
      delivery: true,
      settlement: true
    }
  });

  let settlementsEnsured = 0;
  let ordersDelivered = 0;
  let cashPaymentsMarkedPaid = 0;

  for (const order of orders) {
    await ensureOrderSettlement({
      orderId: order.id,
      subtotalAmount: order.subtotalAmount,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount
    });
    settlementsEnsured += 1;

    const deliveredViaDelivery =
      order.delivery?.status === DeliveryStatus.DELIVERED ||
      Boolean(order.delivery?.deliveredAt);

    if (deliveredViaDelivery && order.status !== OrderStatus.DELIVERED) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: order.deliveredAt ?? order.delivery?.deliveredAt ?? new Date()
        }
      });
      ordersDelivered += 1;
    }

    if (
      order.payment &&
      order.payment.method === PaymentMethod.CASH &&
      deliveredViaDelivery &&
      order.payment.status !== PaymentStatus.PAID
    ) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: order.payment.paidAt ?? order.delivery?.deliveredAt ?? order.deliveredAt ?? new Date()
        }
      });
      cashPaymentsMarkedPaid += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ordersScanned: orders.length,
        settlementsEnsured,
        ordersDelivered,
        cashPaymentsMarkedPaid
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
