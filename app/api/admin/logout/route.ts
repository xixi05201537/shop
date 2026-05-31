import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(appUrl("/admin/login", request), { status: 303 });
}
