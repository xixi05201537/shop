import { NextResponse } from "next/server";
import { saveArticleForm } from "@/lib/admin-save";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  await saveArticleForm(await request.formData());
  return NextResponse.redirect(appUrl("/admin/articles?saved=1", request), { status: 303 });
}
