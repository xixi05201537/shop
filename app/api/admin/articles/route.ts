import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { saveArticleForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  await saveArticleForm(await request.formData());
  return NextResponse.redirect(appUrl("/admin/articles?saved=1", request), { status: 303 });
}
