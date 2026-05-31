import { NextResponse } from "next/server";
import { parseAmounts } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const product = await prisma.product.findFirst({ where: { isActive: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ ...product, enabledAmounts: parseAmounts(product.enabledAmounts) });
}
