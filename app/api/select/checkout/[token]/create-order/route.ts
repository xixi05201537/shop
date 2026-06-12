import { NextResponse } from "next/server";
import { createPaypalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { selectionCheckoutNumber } from "@/lib/selection-checkout";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const checkout = await prisma.selectionCheckout.findUnique({ where: { token } });
    if (!checkout) return NextResponse.json({ error: "Checkout link not found." }, { status: 404 });
    if (checkout.status !== "pending") return NextResponse.json({ error: "This checkout is no longer payable." }, { status: 409 });
    if (checkout.totalAmount <= 0) return NextResponse.json({ error: "Checkout amount is invalid." }, { status: 400 });

    const paypalOrder = await createPaypalOrder(checkout.totalAmount, selectionCheckoutNumber(checkout.token), checkout.currency);
    await prisma.selectionCheckout.update({
      where: { id: checkout.id },
      data: { paypalOrderId: paypalOrder.id, paypalRawSummary: JSON.stringify(paypalOrder).slice(0, 8000) },
    });

    return NextResponse.json({ paypalOrderId: paypalOrder.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create PayPal order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
