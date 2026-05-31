import { prisma } from "@/lib/prisma";
import { sendAdminEmail, sendBuyerEmail } from "@/lib/email";

export async function markOrderPaid(orderId: string, paypalCaptureId?: string, raw?: unknown) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new Error("Order not found.");

  let order = existing;
  if (existing.status !== "paid") {
    order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "paid",
        paypalCaptureId,
        paypalRawSummary: raw ? JSON.stringify(raw).slice(0, 8000) : existing.paypalRawSummary,
        paidAt: new Date(),
      },
    });
  }

  let buyerEmailStatus = order.buyerEmailStatus;
  let adminEmailStatus = order.adminEmailStatus;

  if (buyerEmailStatus !== "sent") {
    try {
      buyerEmailStatus = await sendBuyerEmail(order);
    } catch {
      buyerEmailStatus = "failed";
    }
  }

  if (adminEmailStatus !== "sent") {
    try {
      adminEmailStatus = await sendAdminEmail(order);
    } catch {
      adminEmailStatus = "failed";
    }
  }

  return prisma.order.update({
    where: { id: order.id },
    data: { buyerEmailStatus, adminEmailStatus },
  });
}
