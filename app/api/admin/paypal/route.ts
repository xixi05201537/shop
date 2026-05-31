import { NextResponse } from "next/server";
import { savePaypalForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  await savePaypalForm(await request.formData());
  return NextResponse.redirect(appUrl("/admin/paypal?saved=1", request), { status: 303 });
}
