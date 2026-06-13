import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { appUrl } from "@/lib/redirect";

const loginAttempts = new Map<string, { count: number; until: number }>();

function getKey(request: Request, email: string) {
  // Prefer client IP if available behind trusted proxy; fallback to email so
  // unproxied deployments still rate-limit per account.
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : undefined;
  return ip || email || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return false;
  if (now > record.until) {
    loginAttempts.delete(key);
    return false;
  }
  return true;
}

function recordFailure(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  const count = record && now <= record.until ? record.count + 1 : 1;
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s... capped at 5 minutes.
  const delay = Math.min(1000 * 2 ** (count - 1), 5 * 60 * 1000);
  loginAttempts.set(key, { count, until: now + delay });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const key = getKey(request, email);
  if (isRateLimited(key)) {
    return NextResponse.redirect(appUrl("/admin/login?error=rate", request), { status: 303 });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  // Always perform a bcrypt comparison to avoid timing attacks.
  const dummyHash = "$2a$12$abcdefghijklmnopqrstuuxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const passwordValid = admin ? await bcrypt.compare(password, admin.passwordHash) : await bcrypt.compare(password, dummyHash);

  if (!admin || !passwordValid) {
    recordFailure(key);
    return NextResponse.redirect(appUrl("/admin/login?error=1", request), { status: 303 });
  }

  await createSession(admin.id);
  return NextResponse.redirect(appUrl("/admin", request), { status: 303 });
}
