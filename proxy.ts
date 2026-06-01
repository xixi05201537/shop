import { NextResponse, type NextRequest } from "next/server";
import { adminCookieName, verifyAdminToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminPage = path.startsWith("/admin") && path !== "/admin/login";
  const isAdminApi = path.startsWith("/api/admin") && path !== "/api/admin/login";

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get(adminCookieName)?.value;
    if (!(await verifyAdminToken(token))) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
