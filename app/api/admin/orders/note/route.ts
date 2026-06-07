import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const internalNote = String(formData.get("internalNote") || "").trim();
  if (!id) return NextResponse.redirect(appUrl("/admin/orders", request), { status: 303 });

  await prisma.order.update({
    where: { id },
    data: { internalNote: internalNote || null },
  });

  return NextResponse.redirect(appUrl(`/admin/orders/${id}?note=1`, request), { status: 303 });
}
