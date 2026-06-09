import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { sendAdminEmail, sendBuyerEmail } from "@/lib/email";
import { emailErrorMessage } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const target = String(formData.get("target") || "");
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.redirect(appUrl("/admin/orders", request), { status: 303 });

  if (target === "buyer") {
    try {
      const buyerEmailStatus = await sendBuyerEmail(order);
      await prisma.order.update({
        where: { id },
        data: { buyerEmailStatus, buyerEmailError: null },
      });
    } catch (error) {
      await prisma.order.update({
        where: { id },
        data: { buyerEmailStatus: "failed", buyerEmailError: emailErrorMessage(error) },
      });
    }
  }

  if (target === "admin") {
    try {
      const adminEmailStatus = await sendAdminEmail(order);
      await prisma.order.update({
        where: { id },
        data: { adminEmailStatus, adminEmailError: null },
      });
    } catch (error) {
      await prisma.order.update({
        where: { id },
        data: { adminEmailStatus: "failed", adminEmailError: emailErrorMessage(error) },
      });
    }
  }
  if (target === "buyer" || target === "admin") {
    await writeAuditLog({
      action: "resend_email",
      targetType: "order",
      targetId: id,
      summary: `重发${target === "buyer" ? "买家" : "管理员"}邮件：${order.orderNumber}`,
      metadata: { target },
    });
  }

  return NextResponse.redirect(appUrl(`/admin/orders/${id}?resent=${target}`, request), { status: 303 });
}
