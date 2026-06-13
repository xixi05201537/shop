import { NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/paypal";
import { markOrderPaid } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paypalOrderId = url.searchParams.get("token") || "";
  const localOrderId = url.searchParams.get("localOrderId") || "";

  if (!paypalOrderId || !localOrderId) {
    return NextResponse.redirect(new URL("/?payment=return-error", url.origin));
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: localOrderId } });
    if (!order || order.paypalOrderId !== paypalOrderId) {
      return NextResponse.redirect(new URL("/?payment=return-error", url.origin));
    }

    if (order.status !== "paid") {
      const capture = await capturePaypalOrder(paypalOrderId);
      const purchaseUnits = capture.purchase_units as Array<Record<string, unknown>> | undefined;
      const payments = purchaseUnits?.[0]?.payments as Record<string, unknown> | undefined;
      const captures = payments?.captures as Array<Record<string, unknown>> | undefined;
      const captureId = captures?.[0]?.id as string | undefined;
      const amount = captures?.[0]?.amount as { value?: string; currency_code?: string } | undefined;

      if (amount?.currency_code !== order.currency || Math.abs(Number(amount.value) - order.totalAmount) > 0.001) {
        return NextResponse.redirect(new URL("/?payment=amount-error", url.origin));
      }

      await markOrderPaid(order.id, captureId, capture);
    }

    return NextResponse.redirect(new URL(`/success/${order.id}`, url.origin));
  } catch {
    return NextResponse.redirect(new URL("/?payment=capture-error", url.origin));
  }
}
