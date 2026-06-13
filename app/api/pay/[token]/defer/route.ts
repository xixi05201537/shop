import { NextResponse } from "next/server";
import { normalizePaymentRequestStatus, revalidatePaymentRequest } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const paymentRequest = await prisma.paymentRequest.findUnique({ where: { token } });
  if (!paymentRequest) return NextResponse.json({ error: "Payment request not found." }, { status: 404 });

  const status = normalizePaymentRequestStatus(paymentRequest.status);
  if (status === "paid") return NextResponse.json({ status: "paid" });
  if (!["confirmed", "deferred", "paying"].includes(status)) {
    return NextResponse.json({ error: "Please confirm this payment request first." }, { status: 409 });
  }

  if (status !== "deferred") {
    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: { status: "deferred" },
    });
    revalidatePaymentRequest(paymentRequest.token);
  }

  return NextResponse.json({ status: "deferred" });
}
