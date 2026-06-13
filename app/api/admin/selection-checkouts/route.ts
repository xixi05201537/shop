import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { sendSelectionCheckoutEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";
import type { EmailStatus } from "@prisma/client";
import {
  createSelectionCheckout,
  normalizeEmailRecipients,
  SelectionCheckoutError,
  selectionCheckoutNumber,
} from "@/lib/selection-checkout";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const submissionIds = formData.getAll("submissionIds").map((value) => String(value));
  const manualTotalRaw = String(formData.get("manualTotalAmount") || "").trim();
  const manualTotalAmount = manualTotalRaw ? Number(manualTotalRaw) : null;
  const emailRecipient = normalizeEmailRecipients(String(formData.get("emailRecipient") || "")).join(", ");
  const sendEmail = formData.get("sendEmail") === "on";

  try {
    const checkout = await createSelectionCheckout(submissionIds, {
      manualTotalAmount,
      emailRecipient,
    });
    let emailStatus: EmailStatus = "skipped";
    let emailError: string | null = null;
    if (sendEmail) {
      const checkoutForEmail = await prisma.selectionCheckout.findUnique({
        where: { id: checkout.id },
        include: {
          submissions: {
            include: {
              submission: {
                include: {
                  page: { select: { title: true, slug: true } },
                  items: true,
                },
              },
            },
          },
        },
      });
      if (checkoutForEmail) {
        try {
          emailStatus = await sendSelectionCheckoutEmail(checkoutForEmail, appUrl("/", request).origin, emailRecipient);
          await prisma.selectionCheckout.update({
            where: { id: checkout.id },
            data: { emailStatus, emailError: null, emailedAt: emailStatus === "sent" ? new Date() : null },
          });
        } catch (error) {
          emailStatus = "failed";
          emailError = error instanceof Error ? error.message.slice(0, 2000) : "发送邮件失败";
          await prisma.selectionCheckout.update({
            where: { id: checkout.id },
            data: { emailStatus, emailError },
          });
        }
      }
    } else {
      await prisma.selectionCheckout.update({
        where: { id: checkout.id },
        data: { emailStatus: "skipped", emailError: null },
      });
    }
    await writeAuditLog({
      action: "create",
      targetType: "selection-checkout",
      targetId: checkout.id,
      summary: `生成合并付款链接：${selectionCheckoutNumber(checkout.token)}`,
      metadata: {
        submissionIds,
        totalAmount: checkout.totalAmount,
        totalQuantity: checkout.totalQuantity,
        emailRecipient,
        sendEmail,
        emailStatus,
        emailError,
      },
    });

    return NextResponse.redirect(appUrl(`/admin/selection-pages?tab=submissions&checkoutToken=${checkout.token}&emailStatus=${emailStatus}`, request), {
      status: 303,
    });
  } catch (error) {
    const message = error instanceof SelectionCheckoutError || error instanceof Error ? error.message : "生成付款链接失败。";
    return NextResponse.redirect(
      appUrl(`/admin/selection-pages?tab=submissions&checkoutError=${encodeURIComponent(message)}`, request),
      { status: 303 },
    );
  }
}
