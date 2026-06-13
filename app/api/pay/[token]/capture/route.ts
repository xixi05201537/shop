import { NextResponse } from "next/server";
import { sendPaymentRequestPaidEmailForId } from "@/lib/email";
import { capturePaypalOrder } from "@/lib/paypal";
import { revalidatePaymentRequest } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as { paypalOrderId?: string };

  try {
    const paymentRequest = await prisma.paymentRequest.findUnique({ where: { token } });
    if (!paymentRequest) return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    if (paymentRequest.status === "paid") return NextResponse.json({ status: "paid" });
    if (!["confirmed", "deferred", "paying"].includes(paymentRequest.status)) {
      return NextResponse.json({ error: "This payment request is not payable." }, { status: 409 });
    }
    if (!body.paypalOrderId || paymentRequest.paypalOrderId !== body.paypalOrderId) {
      return NextResponse.json({ error: "PayPal order did not match this payment request." }, { status: 400 });
    }

    const capture = await capturePaypalOrder(body.paypalOrderId);
    const purchaseUnits = capture.purchase_units as Array<Record<string, unknown>> | undefined;
    const payments = purchaseUnits?.[0]?.payments as Record<string, unknown> | undefined;
    const captures = payments?.captures as Array<Record<string, unknown>> | undefined;
    const captureId = captures?.[0]?.id as string | undefined;
    const amount = captures?.[0]?.amount as { value?: string; currency_code?: string } | undefined;

    if (amount?.currency_code !== paymentRequest.currency || Math.abs(Number(amount.value) - paymentRequest.totalAmount) > 0.001) {
      return NextResponse.json({ error: "PayPal amount did not match this payment request." }, { status: 400 });
    }

    const paid = await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: "paid",
        paidAt: paymentRequest.paidAt || new Date(),
        paypalCaptureId: captureId || null,
        paypalRawSummary: JSON.stringify(capture).slice(0, 8000),
      },
    });
    revalidatePaymentRequest(paymentRequest.token);
    await sendPaymentRequestPaidEmailForId(paymentRequest.id, await requestBaseUrl());

    return NextResponse.json({ status: paid.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal confirmation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
