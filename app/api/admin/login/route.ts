import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.redirect(appUrl("/admin/login?error=1", request), { status: 303 });
  }

  await createSession(admin.id);
  return NextResponse.redirect(appUrl("/admin", request), { status: 303 });
}
