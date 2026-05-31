import { NextResponse } from "next/server";
import { saveEmailForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  await saveEmailForm(await request.formData());
  return NextResponse.redirect(appUrl("/admin/email?saved=1", request), { status: 303 });
}
