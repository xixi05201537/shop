import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { appUrl, safeReturnTo } from "@/lib/redirect";
import { selectionSubmissionNumber } from "@/lib/selection";
import { normalizeSelectionSubmissionStatus, selectionSubmissionStatusLabel } from "@/lib/selection-status";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const status = normalizeSelectionSubmissionStatus(String(formData.get("status") || ""));
  const returnTo = String(formData.get("returnTo") || "");

  const submission = await prisma.selectionSubmission.update({
    where: { id },
    data: { status },
    include: { page: { select: { id: true, slug: true } } },
  });

  await writeAuditLog({
    action: "save",
    targetType: "selection-submission",
    targetId: submission.id,
    summary: `更新选品提交状态：${selectionSubmissionNumber(submission.id)} -> ${selectionSubmissionStatusLabel(status)}`,
  });

  revalidatePath(`/admin/selection-pages/${submission.page.id}/submissions`);
  revalidatePath(`/admin/selection-pages/${submission.page.id}/submissions/${submission.id}`);
  revalidatePath(`/select/${submission.page.slug}/submission/${submission.id}`);

  const fallback = `/admin/selection-pages/${submission.page.id}/submissions/${submission.id}`;
  return NextResponse.redirect(appUrl(safeReturnTo(returnTo, fallback), request), { status: 303 });
}
