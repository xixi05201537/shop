import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const order = await prisma.order.findUnique({ where: { id } });
  if (order) await markOrderPaid(order.id, order.paypalCaptureId || undefined, { manualResend: true });
  return NextResponse.redirect(appUrl(`/admin/orders/${id}`, request), { status: 303 });
}
