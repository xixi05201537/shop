import { NextResponse } from "next/server";
import { createPaypalOrder } from "@/lib/paypal";
import { paymentRequestNumber, revalidatePaymentRequest } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const paymentRequest = await prisma.paymentRequest.findUnique({ where: { token } });
    if (!paymentRequest) return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    if (!["confirmed", "deferred", "paying"].includes(paymentRequest.status)) {
      return NextResponse.json({ error: "This payment request is not payable yet." }, { status: 409 });
    }
    if (paymentRequest.totalAmount <= 0) return NextResponse.json({ error: "Payment amount is invalid." }, { status: 400 });

    const paypalOrder = await createPaypalOrder(paymentRequest.totalAmount, paymentRequestNumber(paymentRequest.token), paymentRequest.currency);
    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: "paying",
        paypalOrderId: paypalOrder.id,
        paypalRawSummary: JSON.stringify(paypalOrder).slice(0, 8000),
      },
    });
    revalidatePaymentRequest(paymentRequest.token);

    return NextResponse.json({ paypalOrderId: paypalOrder.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create PayPal order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
