import { NextResponse } from "next/server";
import { saveProductForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  await saveProductForm(await request.formData());
  return NextResponse.redirect(appUrl("/admin/product?saved=1", request), { status: 303 });
}
