import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { sendShipmentEmail } from "@/lib/email";
import { emailErrorMessage } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const trackingNumber = String(formData.get("trackingNumber") || "").trim();

  if (!id) return NextResponse.redirect(appUrl("/admin/orders", request), { status: 303 });
  if (!trackingNumber) {
    return NextResponse.redirect(appUrl(`/admin/orders/${id}?shipError=tracking`, request), { status: 303 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      trackingNumber,
      shippedAt: new Date(),
      shipmentEmailStatus: "pending",
      shipmentEmailError: null,
    },
  });

  try {
    const shipmentEmailStatus = await sendShipmentEmail(order);
    await prisma.order.update({
      where: { id },
      data: { shipmentEmailStatus, shipmentEmailError: null },
    });
  } catch (error) {
    await prisma.order.update({
      where: { id },
      data: { shipmentEmailStatus: "failed", shipmentEmailError: emailErrorMessage(error) },
    });
  }

  return NextResponse.redirect(appUrl(`/admin/orders/${id}?shipped=1`, request), { status: 303 });
}
