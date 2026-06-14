import { NextResponse, type NextRequest } from "next/server";
import { adminCookieName, verifyAdminToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminLogin = path === "/admin/login" || path.startsWith("/admin/login/");
  const isAdminPage = path.startsWith("/admin") && !isAdminLogin;
  const isAdminApi = path.startsWith("/api/admin") && path !== "/api/admin/login";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get(adminCookieName)?.value;
    if (!(await verifyAdminToken(token))) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
