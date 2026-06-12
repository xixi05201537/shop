import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { normalizeCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { selectionSubmissionNumber } from "@/lib/selection";
import { normalizeSelectionSubmissionStatus } from "@/lib/selection-status";

export const selectionCheckoutStatuses = ["pending", "paid", "canceled"] as const;

export type SelectionCheckoutStatus = (typeof selectionCheckoutStatuses)[number];

export function selectionCheckoutNumber(token: string) {
  const cleanToken = token.replace(/[^a-z0-9]/gi, "");
  return `CHK-${cleanToken.slice(0, 8).toUpperCase()}`;
}

export function normalizeSelectionCheckoutStatus(status: string | null | undefined): SelectionCheckoutStatus {
  return selectionCheckoutStatuses.includes(status as SelectionCheckoutStatus)
    ? (status as SelectionCheckoutStatus)
    : "pending";
}

export function selectionCheckoutStatusLabel(status: string | null | undefined) {
  const normalized = normalizeSelectionCheckoutStatus(status);
  if (normalized === "paid") return "已付款";
  if (normalized === "canceled") return "已取消";
  return "待付款";
}

export class SelectionCheckoutError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SelectionCheckoutError";
    this.code = code;
  }
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function contactValue(values: Array<string | null>) {
  const unique = uniqueValues(values.filter((value): value is string => Boolean(value)));
  return unique.length === 1 ? unique[0] : null;
}

export function normalizeEmailRecipients(value: string) {
  return uniqueValues(
    value
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function checkoutToken() {
  return randomBytes(18).toString("base64url").replace(/_/g, "A").replace(/-/g, "B");
}

async function uniqueCheckoutToken() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const token = checkoutToken();
    const existing = await prisma.selectionCheckout.findUnique({ where: { token }, select: { id: true } });
    if (!existing) return token;
  }
  throw new SelectionCheckoutError("token", "生成付款链接失败，请稍后再试。");
}

export async function createSelectionCheckout(
  submissionIds: string[],
  options: {
    manualTotalAmount?: number | null;
    emailRecipient?: string | null;
  } = {},
) {
  const ids = uniqueValues(submissionIds);
  if (!ids.length) {
    throw new SelectionCheckoutError("empty", "请先勾选至少一条客户提交。");
  }

  const submissions = await prisma.selectionSubmission.findMany({
    where: { id: { in: ids } },
    include: {
      page: { select: { id: true, slug: true, title: true } },
      items: true,
      checkouts: { select: { checkout: { select: { id: true, token: true, status: true } } } },
    },
  });

  if (submissions.length !== ids.length) {
    throw new SelectionCheckoutError("missing", "部分提交记录不存在，请刷新列表后重试。");
  }

  const notConfirmed = submissions.filter((submission) => normalizeSelectionSubmissionStatus(submission.status) !== "confirmed");
  if (notConfirmed.length) {
    throw new SelectionCheckoutError(
      "status",
      `只能为已确认提交生成付款链接：${notConfirmed.map((submission) => selectionSubmissionNumber(submission.id)).join("、")}`,
    );
  }

  const alreadyLinked = submissions.filter((submission) =>
    submission.checkouts.some(({ checkout }) => normalizeSelectionCheckoutStatus(checkout.status) === "pending"),
  );
  if (alreadyLinked.length) {
    throw new SelectionCheckoutError(
      "linked",
      `这些提交已有待付款链接：${alreadyLinked.map((submission) => selectionSubmissionNumber(submission.id)).join("、")}`,
    );
  }

  const currencies = uniqueValues(
    submissions.flatMap((submission) => submission.items.map((item) => normalizeCurrency(item.currencySnapshot))),
  );
  if (currencies.length > 1) {
    throw new SelectionCheckoutError("currency", "勾选的提交包含多个币种，暂时不能合并付款。");
  }

  const totalQuantity = submissions.reduce((sum, submission) => sum + submission.totalQuantity, 0);
  const subtotalAmount = Number(
    submissions
      .flatMap((submission) => submission.items)
      .reduce((sum, item) => sum + (item.lineTotal || 0), 0)
      .toFixed(2),
  );
  const manualTotalAmount =
    typeof options.manualTotalAmount === "number" && Number.isFinite(options.manualTotalAmount)
      ? Number(options.manualTotalAmount.toFixed(2))
      : null;
  const hasUnpricedItems = submissions.some((submission) => submission.items.some((item) => item.priceSnapshot === null || item.lineTotal === null));
  if (hasUnpricedItems && (manualTotalAmount === null || manualTotalAmount <= 0)) {
    throw new SelectionCheckoutError("amount", "包含未设置价格的选品时，请手动填写合并总价。");
  }
  const totalAmount = manualTotalAmount !== null ? manualTotalAmount : subtotalAmount;
  if (totalAmount <= 0) {
    throw new SelectionCheckoutError("amount", "合并金额必须大于 0。");
  }
  const emailRecipients = normalizeEmailRecipients(options.emailRecipient || "");

  const token = await uniqueCheckoutToken();
  const checkout = await prisma.$transaction(async (tx) => {
    const created = await tx.selectionCheckout.create({
      data: {
        token,
        status: "pending",
        customerName: contactValue(submissions.map((submission) => submission.customerName)),
        customerEmail: contactValue(submissions.map((submission) => submission.customerEmail)),
        customerContact: contactValue(submissions.map((submission) => submission.customerContact)),
        totalQuantity,
        subtotalAmount,
        totalAmount,
        currency: currencies[0] || "USD",
        emailRecipient: emailRecipients.join(", ") || contactValue(submissions.map((submission) => submission.customerEmail)),
        emailStatus: "pending",
        submissions: {
          create: submissions.map((submission) => ({ submissionId: submission.id })),
        },
      },
    });

    return created;
  });

  for (const submission of submissions) {
    revalidatePath(`/admin/selection-pages/${submission.page.id}/submissions`);
    revalidatePath(`/admin/selection-pages/${submission.page.id}/submissions/${submission.id}`);
    revalidatePath(`/select/${submission.page.slug}/submission/${submission.id}`);
  }
  revalidatePath("/admin/selection-pages/submissions");
  revalidatePath("/admin/selection-pages");
  revalidatePath(`/select/checkout/${checkout.token}`);

  return checkout;
}
