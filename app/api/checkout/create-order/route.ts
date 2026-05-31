import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaypalOrder } from "@/lib/paypal";
import { formatUsd, orderNumber, parseAmounts } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/order-service";

const schema = z.object({
  amount: z.number().positive(),
  quantity: z.number().int().min(1),
  email: z.string().email(),
  nickname: z.string().max(80).optional().nullable(),
  demoPaid: z.boolean().optional(),
});

export async function POST(request: Request) {
  let orderIdToFail: string | null = null;

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { isActive: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const amounts = parseAmounts(product.enabledAmounts);
    const amountAllowed = amounts.some((item) => Math.abs(item - parsed.data.amount) < 0.001);
    if (!amountAllowed) return NextResponse.json({ error: "Amount is not available." }, { status: 400 });
    if (parsed.data.quantity > product.maxQuantity) {
      return NextResponse.json({ error: `Quantity cannot exceed ${product.maxQuantity}.` }, { status: 400 });
    }

    const totalAmount = Number((parsed.data.amount * parsed.data.quantity).toFixed(2));
    const number = orderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        productNameSnapshot: product.name,
        productImageSnapshot: product.uploadedImagePath || product.imageUrl,
        buyerEmail: parsed.data.email,
        buyerNickname: parsed.data.nickname?.trim() || null,
        unitAmount: parsed.data.amount,
        quantity: parsed.data.quantity,
        totalAmount,
        currency: "USD",
        status: parsed.data.demoPaid ? "paid" : "created",
        paidAt: parsed.data.demoPaid ? new Date() : null,
      },
    });
    orderIdToFail = order.id;

    if (parsed.data.demoPaid) {
      await markOrderPaid(order.id, "demo-capture", { demo: true, total: formatUsd(totalAmount) });
      return NextResponse.json({ localOrderId: order.id });
    }

    const paypalOrder = await createPaypalOrder(totalAmount, number);
    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id, paypalRawSummary: JSON.stringify(paypalOrder).slice(0, 8000) },
    });
    return NextResponse.json({ localOrderId: order.id, paypalOrderId: paypalOrder.id });
  } catch (error) {
    if (orderIdToFail) {
      await prisma.order.update({ where: { id: orderIdToFail }, data: { status: "failed" } }).catch(() => null);
    }
    return NextResponse.json({ error: checkoutErrorMessage(error) }, { status: 500 });
  }
}

function checkoutErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "PayPal checkout failed.";
  if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("fetch failed")) {
    return "PayPal is taking too long to respond. Please try again in a moment.";
  }
  return message;
}
