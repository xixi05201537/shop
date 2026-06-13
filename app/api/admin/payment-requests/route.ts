import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAdminApi } from "@/lib/auth";
import { createPaymentRequest, PaymentRequestError, paymentRequestNumber, updatePaymentRequest } from "@/lib/payment-request";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");

  try {
    const paymentRequest = id ? await updatePaymentRequest(id, formData) : await createPaymentRequest(formData);
    await writeAuditLog({
      action: id ? "update" : "create",
      targetType: "payment-request",
      targetId: paymentRequest.id,
      summary: `${id ? "更新" : "创建"}付款单：${paymentRequestNumber(paymentRequest.token)}`,
      metadata: {
        title: paymentRequest.title,
        totalAmount: paymentRequest.totalAmount,
        currency: paymentRequest.currency,
        status: paymentRequest.status,
      },
    });
    return NextResponse.redirect(appUrl(`/admin/payment-requests?saved=${paymentRequest.token}`, request), { status: 303 });
  } catch (error) {
    const message = error instanceof PaymentRequestError || error instanceof Error ? error.message : "保存付款单失败。";
    return NextResponse.redirect(appUrl(`/admin/payment-requests?error=${encodeURIComponent(message)}`, request), { status: 303 });
  }
}
