import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAdminApi } from "@/lib/auth";
import { sendPaymentRequestEmail } from "@/lib/email";
import { normalizeEmailRecipients, paymentRequestNumber, revalidatePaymentRequest } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";
import type { EmailStatus } from "@prisma/client";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const emailRecipient = normalizeEmailRecipients(String(formData.get("emailRecipient") || "")).join(", ");
  const adminNote = String(formData.get("adminNote") || "").trim() || null;

  if (!id || !emailRecipient) {
    return NextResponse.redirect(appUrl("/admin/payment-requests?error=请输入收件邮箱。", request), { status: 303 });
  }

  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!paymentRequest) {
    return NextResponse.redirect(appUrl("/admin/payment-requests?error=付款单不存在。", request), { status: 303 });
  }
  if (paymentRequest.status === "paid") {
    return NextResponse.redirect(appUrl("/admin/payment-requests?error=已付款的付款单不能重复发送付款邀请。", request), { status: 303 });
  }

  let emailStatus: EmailStatus = "skipped";
  let emailError: string | null = null;
  try {
    emailStatus = await sendPaymentRequestEmail(
      {
        ...paymentRequest,
        emailRecipient,
        adminNote,
      },
      appUrl("/", request).origin,
      emailRecipient,
    );
    await prisma.paymentRequest.update({
      where: { id },
      data: {
        emailRecipient,
        adminNote,
        emailStatus,
        emailError: null,
        emailedAt: emailStatus === "sent" ? new Date() : null,
      },
    });
  } catch (error) {
    emailStatus = "failed";
    emailError = error instanceof Error ? error.message.slice(0, 2000) : "发送邮件失败";
    await prisma.paymentRequest.update({
      where: { id },
      data: {
        emailRecipient,
        adminNote,
        emailStatus,
        emailError,
      },
    });
  }

  revalidatePaymentRequest(paymentRequest.token);
  await writeAuditLog({
    action: "send",
    targetType: "payment-request",
    targetId: id,
    summary: `发送付款单：${paymentRequestNumber(paymentRequest.token)}`,
    metadata: {
      emailRecipient,
      emailStatus,
      emailError,
      totalAmount: paymentRequest.totalAmount,
      currency: paymentRequest.currency,
    },
  });

  const params = new URLSearchParams({ sent: paymentRequest.token, emailStatus });
  if (emailError) params.set("emailError", emailError);
  return NextResponse.redirect(appUrl(`/admin/payment-requests?${params.toString()}`, request), { status: 303 });
}
