import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";
import { appUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const email = String(formData.get("testEmail") || "").trim();
  const target = String(formData.get("target") || "buyer");
  const redirectTarget = target === "seller" || target === "shipment" || target === "selection" ? target : "buyer";
  const wantsJson = request.headers.get("Accept")?.includes("application/json");

  if (!email) {
    if (wantsJson) {
      return NextResponse.json({ success: false, error: "请输入测试邮箱" }, { status: 400 });
    }
    return NextResponse.redirect(appUrl(`/admin/email?test=${redirectTarget}&testError=email`, request), { status: 303 });
  }

  try {
    const info = await sendTestEmail(redirectTarget, email);
    if (wantsJson) {
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      });
    }
    return NextResponse.redirect(appUrl(`/admin/email?test=${redirectTarget}&testSent=1`, request), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : "Unable to send test email.";
    if (wantsJson) {
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
    const params = new URLSearchParams({ test: redirectTarget, testError: message });
    return NextResponse.redirect(appUrl(`/admin/email?${params.toString()}`, request), { status: 303 });
  }
}
