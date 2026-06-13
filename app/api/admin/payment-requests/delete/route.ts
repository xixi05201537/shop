import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentRequestError, paymentRequestNumber, revalidatePaymentRequest } from "@/lib/payment-request";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");

  try {
    const paymentRequest = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!paymentRequest) throw new PaymentRequestError("missing", "付款单不存在。");
    if (paymentRequest.status === "paid") throw new PaymentRequestError("paid", "已付款的付款单不能删除。");

    await prisma.paymentRequest.delete({ where: { id } });
    revalidatePaymentRequest(paymentRequest.token);
    await writeAuditLog({
      action: "delete",
      targetType: "payment-request",
      targetId: id,
      summary: `删除付款单：${paymentRequestNumber(paymentRequest.token)}`,
    });
    return NextResponse.redirect(appUrl("/admin/payment-requests?deleted=1", request), { status: 303 });
  } catch (error) {
    const message = error instanceof PaymentRequestError || error instanceof Error ? error.message : "删除付款单失败。";
    return NextResponse.redirect(appUrl(`/admin/payment-requests?error=${encodeURIComponent(message)}`, request), { status: 303 });
  }
}
