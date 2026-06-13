import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { sendShipmentEmail } from "@/lib/email";
import { emailErrorMessage } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { appUrl, safeReturnTo } from "@/lib/redirect";
import type { EmailStatus } from "@prisma/client";

const MAX_BATCH_SHIP = 100;

function redirectWithQuery(returnTo: string, query: string, request: Request) {
  const safe = safeReturnTo(returnTo, "/admin/orders");
  const separator = safe.includes("?") ? "&" : "?";
  return NextResponse.redirect(appUrl(`${safe}${separator}${query}`, request), { status: 303 });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const orderIds = formData.getAll("orderIds").map((value) => String(value)).filter(Boolean).slice(0, MAX_BATCH_SHIP);
  const trackingNumber = String(formData.get("trackingNumber") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/admin/orders");
  const confirmReship = String(formData.get("confirmReship") || "") === "true";

  if (!orderIds.length) return redirectWithQuery(returnTo, "shipError=empty", request);
  if (!trackingNumber) return redirectWithQuery(returnTo, "shipError=tracking", request);

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, status: "paid" },
    orderBy: { createdAt: "asc" },
  });

  if (!orders.length) return redirectWithQuery(returnTo, "shipError=paid", request);
  const alreadyShipped = orders.filter((order) => order.trackingNumber || order.shippedAt);
  if (alreadyShipped.length && !confirmReship) {
    return redirectWithQuery(returnTo, "shipError=reship", request);
  }

  const shippedAt = new Date();
  await prisma.order.updateMany({
    where: { id: { in: orders.map((order) => order.id) } },
    data: {
      trackingNumber,
      shippedAt,
      shipmentEmailStatus: "pending",
      shipmentEmailError: null,
    },
  });

  const groups = new Map<string, typeof orders>();
  for (const order of orders) {
    const key = order.paypalPayerId || `order:${order.id}`;
    groups.set(key, [...(groups.get(key) || []), order]);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const groupOrders of groups.values()) {
    const representative = groupOrders.find((order) => order.buyerEmail || order.paypalBuyerEmail) || groupOrders[0];
    const representativeWithTracking = { ...representative, trackingNumber, shippedAt, shipmentEmailStatus: "pending" as EmailStatus, shipmentEmailError: null };
    try {
      const shipmentEmailStatus = await sendShipmentEmail(representativeWithTracking);
      await prisma.order.update({
        where: { id: representative.id },
        data: { shipmentEmailStatus, shipmentEmailError: null },
      });
      if (shipmentEmailStatus === "sent") sentCount += 1;
    } catch (error) {
      failedCount += 1;
      await prisma.order.update({
        where: { id: representative.id },
        data: { shipmentEmailStatus: "failed", shipmentEmailError: emailErrorMessage(error) },
      });
    }

    const skippedIds = groupOrders.filter((order) => order.id !== representative.id).map((order) => order.id);
    if (skippedIds.length) {
      await prisma.order.updateMany({
        where: { id: { in: skippedIds } },
        data: { shipmentEmailStatus: "skipped", shipmentEmailError: null },
      });
    }
  }

  await writeAuditLog({
    action: "batch_ship",
    targetType: "order",
    targetId: orders.map((order) => order.id).join(","),
    summary: `批量发货：${orders.length} 个订单，${groups.size} 个付款人`,
    metadata: { trackingNumber, orderCount: orders.length, payerCount: groups.size, sentCount, failedCount },
  });

  return redirectWithQuery(returnTo, "batchShipped=1", request);
}
