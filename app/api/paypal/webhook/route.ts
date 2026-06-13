import { NextResponse } from "next/server";
import { sendPaymentRequestPaidEmailForId } from "@/lib/email";
import { markOrderPaid } from "@/lib/order-service";
import { verifyPaypalWebhook } from "@/lib/paypal";
import { revalidatePaymentRequest } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

function pickResourceId(payload: Record<string, unknown>) {
  const resource = payload.resource as Record<string, unknown> | undefined;
  return (
    (resource?.supplementary_data as { related_ids?: { order_id?: string } } | undefined)?.related_ids?.order_id ||
    (resource?.id as string | undefined) ||
    null
  );
}

function pickCaptureId(payload: Record<string, unknown>) {
  const resource = payload.resource as Record<string, unknown> | undefined;
  return (resource?.id as string | undefined) || undefined;
}

function pickCaptureAmount(payload: Record<string, unknown>) {
  const resource = payload.resource as Record<string, unknown> | undefined;
  return resource?.amount as { value?: string; currency_code?: string } | undefined;
}

function logWebhook(stage: string, details: Record<string, unknown>) {
  console.info(`[paypal-webhook] ${stage}`, details);
}

export async function POST(request: Request) {
  const body = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    console.error("[paypal-webhook] invalid-json", { bodyLength: body.length, body });
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  const eventId = payload.id as string | undefined;
  const eventType = payload.event_type as string | undefined;
  if (!eventId || !eventType) {
    console.error("[paypal-webhook] missing-event-fields", { eventId, eventType, body });
    return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  }

  const resourceId = pickResourceId(payload);
  logWebhook("received", {
    eventId,
    eventType,
    resourceId,
    transmissionId: request.headers.get("paypal-transmission-id"),
    bodyLength: body.length,
    body,
  });

  const valid = await verifyPaypalWebhook(request.headers, body).catch(() => false);
  if (!valid) {
    console.error("[paypal-webhook] signature-failed", {
      eventId,
      eventType,
      resourceId,
      transmissionId: request.headers.get("paypal-transmission-id"),
    });
    return NextResponse.json({ error: "Webhook signature failed." }, { status: 400 });
  }

  const existing = await prisma.webhookEvent.findUnique({ where: { paypalEventId: eventId } });
  if (existing?.processed) {
    logWebhook("duplicate", { eventId, eventType, resourceId });
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.webhookEvent.upsert({
    where: { paypalEventId: eventId },
    update: { payload: body, resourceId },
    create: { paypalEventId: eventId, eventType, resourceId, payload: body },
  });

  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const order = resourceId ? await prisma.order.findFirst({ where: { paypalOrderId: resourceId } }) : null;
    const amount = pickCaptureAmount(payload);
    if (order && amount?.currency_code === order.currency && Number(amount.value) === order.totalAmount) {
      await markOrderPaid(order.id, pickCaptureId(payload), payload);
      logWebhook("marked-paid", {
        eventId,
        eventType,
        resourceId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        captureId: pickCaptureId(payload),
        amount: amount.value,
        currency: amount.currency_code,
      });
    } else {
      console.error("[paypal-webhook] capture-not-applied", {
        eventId,
        eventType,
        resourceId,
        orderId: order?.id,
        expectedAmount: order?.totalAmount,
        expectedCurrency: order?.currency,
        receivedAmount: amount?.value,
        receivedCurrency: amount?.currency_code,
      });
    }

    const paymentRequest = !order && resourceId ? await prisma.paymentRequest.findFirst({ where: { paypalOrderId: resourceId } }) : null;
    if (
      paymentRequest &&
      amount?.currency_code === paymentRequest.currency &&
      Math.abs(Number(amount.value) - paymentRequest.totalAmount) <= 0.001
    ) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequest.id },
        data: {
          status: "paid",
          paidAt: paymentRequest.paidAt || new Date(),
          paypalCaptureId: pickCaptureId(payload) || paymentRequest.paypalCaptureId,
          paypalRawSummary: body.slice(0, 8000),
        },
      });
      revalidatePaymentRequest(paymentRequest.token);
      await sendPaymentRequestPaidEmailForId(paymentRequest.id, appUrl("/", request).origin);
      logWebhook("marked-payment-request-paid", {
        eventId,
        eventType,
        resourceId,
        paymentRequestId: paymentRequest.id,
        captureId: pickCaptureId(payload),
        amount: amount.value,
        currency: amount.currency_code,
      });
    } else if (!order && paymentRequest) {
      console.error("[paypal-webhook] payment-request-capture-not-applied", {
        eventId,
        eventType,
        resourceId,
        paymentRequestId: paymentRequest.id,
        expectedAmount: paymentRequest.totalAmount,
        expectedCurrency: paymentRequest.currency,
        receivedAmount: amount?.value,
        receivedCurrency: amount?.currency_code,
      });
    }
  } else {
    logWebhook("ignored-event-type", { eventId, eventType, resourceId });
  }

  await prisma.webhookEvent.update({ where: { paypalEventId: eventId }, data: { processed: true } });
  logWebhook("processed", { eventId, eventType, resourceId });
  return NextResponse.json({ ok: true });
}
