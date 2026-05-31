import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const formData = await request.formData();
  await prisma.article.delete({ where: { id: String(formData.get("id")) } });
  return NextResponse.redirect(appUrl("/admin/articles?deleted=1", request), { status: 303 });
}
