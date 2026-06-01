import { SignJWT, jwtVerify } from "jose";

export const adminCookieName = "pink_admin_session";

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
}

export async function createAdminToken(adminId: string) {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyAdminToken(token?: string) {
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret());
    return verified.payload as { adminId: string };
  } catch {
    return null;
  }
}
