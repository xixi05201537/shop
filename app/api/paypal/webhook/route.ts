import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/order-service";
import { verifyPaypalWebhook } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

function pickResourceId(payload: Record<string, unknown>) {
  const resource = payload.resource as Record<string, unknown> | undefined;
  return (resource?.supplementary_data as { related_ids?: { order_id?: string } } | undefined)?.related_ids?.order_id
    || (resource?.id as string | undefined)
    || null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const payload = JSON.parse(body) as Record<string, unknown>;
  const eventId = payload.id as string | undefined;
  const eventType = payload.event_type as string | undefined;
  if (!eventId || !eventType) return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });

  const valid = await verifyPaypalWebhook(request.headers, body);
  if (!valid) return NextResponse.json({ error: "Webhook signature failed." }, { status: 400 });

  const existing = await prisma.webhookEvent.findUnique({ where: { paypalEventId: eventId } });
  if (existing?.processed) return NextResponse.json({ ok: true, duplicate: true });

  const resourceId = pickResourceId(payload);
  await prisma.webhookEvent.upsert({
    where: { paypalEventId: eventId },
    update: { payload: body, resourceId },
    create: { paypalEventId: eventId, eventType, resourceId, payload: body },
  });

  if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
    const order = resourceId ? await prisma.order.findFirst({ where: { paypalOrderId: resourceId } }) : null;
    if (order) await markOrderPaid(order.id, resourceId || undefined, payload);
  }

  await prisma.webhookEvent.update({ where: { paypalEventId: eventId }, data: { processed: true } });
  return NextResponse.json({ ok: true });
}
