import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaypalOrder } from "@/lib/paypal";
import { orderNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  amount: z.number().positive(),
  quantity: z.number().int().min(1),
  email: z.string().email().optional().or(z.literal("")),
  nickname: z.string().max(80).optional().nullable(),
});

export async function POST(request: Request) {
  let orderIdToFail: string | null = null;

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { isActive: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    if (parsed.data.quantity > product.maxQuantity) {
      return NextResponse.json({ error: `Quantity cannot exceed ${product.maxQuantity}.` }, { status: 400 });
    }

    const unitAmount = Number(parsed.data.amount.toFixed(2));
    const totalAmount = Number((unitAmount * parsed.data.quantity).toFixed(2));
    const number = orderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        productNameSnapshot: product.name,
        productImageSnapshot: product.imageUrl || product.uploadedImagePath,
        buyerEmail: parsed.data.email || null,
        buyerNickname: parsed.data.nickname?.trim() || null,
        unitAmount,
        quantity: parsed.data.quantity,
        totalAmount,
        currency: "USD",
        status: "created",
      },
    });
    orderIdToFail = order.id;

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
