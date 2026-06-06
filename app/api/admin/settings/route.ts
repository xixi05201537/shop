import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { saveSettingsForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  await saveSettingsForm(await request.formData());
  return NextResponse.redirect(appUrl("/admin/settings?saved=1", request), { status: 303 });
}
