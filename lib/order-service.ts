import { prisma } from "@/lib/prisma";
import { sendAdminEmail, sendBuyerEmail } from "@/lib/email";
import { paypalDetailsFromCapture } from "@/lib/paypal-order-details";

export async function markOrderPaid(orderId: string, paypalCaptureId?: string, raw?: unknown) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new Error("Order not found.");

  const rawRecord = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : null;
  const paypalDetails = rawRecord ? paypalDetailsFromCapture(rawRecord) : {};
  let order = existing;
  const updateData = {
    ...(existing.status !== "paid"
      ? {
          status: "paid",
          paypalCaptureId,
          paypalRawSummary: raw ? JSON.stringify(raw).slice(0, 8000) : existing.paypalRawSummary,
          paidAt: new Date(),
        }
      : {}),
    ...(paypalDetails.payerEmail ? { paypalBuyerEmail: paypalDetails.payerEmail } : {}),
    ...(paypalDetails.payerName ? { paypalBuyerNickname: paypalDetails.payerName } : {}),
    ...(paypalDetails.payerId ? { paypalPayerId: paypalDetails.payerId } : {}),
    ...(paypalDetails.shippingName ? { paypalShippingName: paypalDetails.shippingName } : {}),
    ...(paypalDetails.shippingAddress ? { paypalShippingAddress: paypalDetails.shippingAddress } : {}),
  };

  if (Object.keys(updateData).length > 0) {
    order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
