import { NextResponse } from "next/server";
import { destroySession, requireAdminApi } from "@/lib/auth";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  await destroySession();
  return NextResponse.redirect(appUrl("/admin/login", request), { status: 303 });
}
