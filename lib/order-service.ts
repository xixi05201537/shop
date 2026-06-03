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
  let buyerEmailError: string | null = order.buyerEmailError;
  let adminEmailError: string | null = order.adminEmailError;

  if (buyerEmailStatus !== "sent") {
    try {
      buyerEmailStatus = await sendBuyerEmail(order);
      buyerEmailError = null;
    } catch (error) {
      buyerEmailStatus = "failed";
      buyerEmailError = emailErrorMessage(error);
    }
  }

  if (adminEmailStatus !== "sent") {
    try {
      adminEmailStatus = await sendAdminEmail(order);
      adminEmailError = null;
    } catch (error) {
      adminEmailStatus = "failed";
      adminEmailError = emailErrorMessage(error);
    }
  }

  return prisma.order.update({
    where: { id: order.id },
    data: { buyerEmailStatus, buyerEmailError, adminEmailStatus, adminEmailError },
  });
}

export function emailErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 2000) : "Unknown email delivery error.";
}
