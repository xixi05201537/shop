import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminCookieName, createAdminToken, verifyAdminToken } from "@/lib/session";
import { isSecureRequest } from "@/lib/request-url";

export async function createSession(adminId: string) {
  const token = await createAdminToken(adminId);
  const jar = await cookies();
  const secure = await isSecureRequest();
  jar.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(adminCookieName);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(adminCookieName)?.value;
  return verifyAdminToken(token);
}

export async function requireAdminApi() {
  if (await getAdminSession()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
