import { NextResponse } from "next/server";
import { z } from "zod";
import { capturePaypalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/order-service";

const schema = z.object({
  paypalOrderId: z.string().min(3),
  localOrderId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid PayPal order." }, { status: 400 });

    const order = parsed.data.localOrderId
      ? await prisma.order.findUnique({ where: { id: parsed.data.localOrderId } })
      : await prisma.order.findUnique({ where: { paypalOrderId: parsed.data.paypalOrderId } });
    if (!order) return NextResponse.json({ error: "Local order not found." }, { status: 404 });
    if (order.paypalOrderId !== parsed.data.paypalOrderId) {
      return NextResponse.json({ error: "PayPal order did not match local order." }, { status: 400 });
    }

    const capture = await capturePaypalOrder(parsed.data.paypalOrderId);
    const purchaseUnits = capture.purchase_units as Array<Record<string, unknown>> | undefined;
    const payments = purchaseUnits?.[0]?.payments as Record<string, unknown> | undefined;
    const captures = payments?.captures as Array<Record<string, unknown>> | undefined;
    const captureId = captures?.[0]?.id as string | undefined;
    const amount = captures?.[0]?.amount as { value?: string; currency_code?: string } | undefined;

    if (amount?.currency_code !== order.currency || Math.abs(Number(amount.value) - order.totalAmount) > 0.001) {
      return NextResponse.json({ error: "PayPal amount did not match local order." }, { status: 400 });
    }

    const paid = await markOrderPaid(order.id, captureId, capture);
    return NextResponse.json({ orderId: paid.id, status: paid.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal confirmation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
