import { prisma } from "@/lib/prisma";
import { sendAdminEmail, sendBuyerEmail } from "@/lib/email";
import { orderEmailRecipients, paypalDetailsFromCapture } from "@/lib/paypal-order-details";
import type { Order } from "@prisma/client";

const claimedEmailStatuses = ["sent", "sending"] as const;

async function sendClaimedBuyerEmail(order: Order) {
  const recipients = orderEmailRecipients(order);
  if (!recipients.to) {
    await prisma.order.updateMany({
      where: { id: order.id, buyerEmailStatus: { notIn: [...claimedEmailStatuses] } },
      data: { buyerEmailStatus: "skipped", buyerEmailError: null },
    });
    return;
  }

  const claim = await prisma.order.updateMany({
    where: { id: order.id, buyerEmailStatus: { notIn: [...claimedEmailStatuses] } },
    data: { buyerEmailStatus: "sending", buyerEmailError: null },
  });
  if (claim.count === 0) return;

  const latestOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (!latestOrder) throw new Error("Order not found.");

  try {
    const buyerEmailStatus = await sendBuyerEmail(latestOrder);
    await prisma.order.update({
      where: { id: order.id },
      data: { buyerEmailStatus, buyerEmailError: null },
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { buyerEmailStatus: "failed", buyerEmailError: emailErrorMessage(error) },
    });
  }
}

async function sendClaimedAdminEmail(order: Order) {
  const claim = await prisma.order.updateMany({
    where: { id: order.id, adminEmailStatus: { notIn: [...claimedEmailStatuses] } },
    data: { adminEmailStatus: "sending", adminEmailError: null },
  });
  if (claim.count === 0) return;

  const latestOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (!latestOrder) throw new Error("Order not found.");

  try {
    const adminEmailStatus = await sendAdminEmail(latestOrder);
    await prisma.order.update({
      where: { id: order.id },
      data: { adminEmailStatus, adminEmailError: null },
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { adminEmailStatus: "failed", adminEmailError: emailErrorMessage(error) },
    });
  }
}

export async function markOrderPaid(orderId: string, paypalCaptureId?: string, raw?: unknown) {
  const rawRecord = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
  const paypalDetails = rawRecord ? paypalDetailsFromCapture(rawRecord) : {};

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error("Order not found.");

    const updateData: Record<string, unknown> = {
      ...(existing.status !== "paid"
        ? {
            status: "paid",
            paypalCaptureId,
            paypalRawSummary: raw ? JSON.stringify(raw).slice(0, 8000) : existing.paypalRawSummary,
            paidAt: existing.paidAt || new Date(),
          }
        : {}),
      ...(paypalDetails.payerEmail ? { paypalBuyerEmail: paypalDetails.payerEmail } : {}),
      ...(paypalDetails.payerName ? { paypalBuyerNickname: paypalDetails.payerName } : {}),
      ...(paypalDetails.payerId ? { paypalPayerId: paypalDetails.payerId } : {}),
      ...(paypalDetails.shippingName ? { paypalShippingName: paypalDetails.shippingName } : {}),
      ...(paypalDetails.shippingAddress ? { paypalShippingAddress: paypalDetails.shippingAddress } : {}),
    };

    if (Object.keys(updateData).length > 0) {
      return tx.order.update({ where: { id: orderId }, data: updateData });
    }
    return existing;
  });

  await sendClaimedBuyerEmail(order);
  await sendClaimedAdminEmail(order);

  const paidOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (!paidOrder) throw new Error("Order not found.");
  return paidOrder;
}

export function emailErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 2000) : "Unknown email delivery error.";
}
