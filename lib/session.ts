import { SignJWT, jwtVerify } from "jose";

export const adminCookieName = process.env.ADMIN_COOKIE_NAME || "pink_admin_session";

function secret() {
  const value = process.env.JWT_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(value);
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
