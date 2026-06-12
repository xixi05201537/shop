import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { selectionSubmissionNumber } from "@/lib/selection";
import { isSelectionSubmissionEditable, selectionSubmissionPublicStatus } from "@/lib/selection-status";

type UpdateBody = {
  items?: Array<{ id?: string; quantity?: number }>;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; submissionId: string }> }) {
  const { slug, submissionId } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateBody;
  const submission = await prisma.selectionSubmission.findFirst({
    where: {
      id: submissionId,
      page: { slug, isPublished: true },
    },
    include: {
      page: {
        include: {
          items: { where: { isActive: true } },
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "This selection could not be found." }, { status: 404 });
  }
  if (!isSelectionSubmissionEditable(submission.status)) {
    return NextResponse.json(
      { error: selectionSubmissionPublicStatus(submission.status).publicMessage },
      { status: 409 },
    );
  }

  const requested = new Map<string, number>();
  for (const item of body.items || []) {
    if (!item.id) continue;
    const quantity = Number(item.quantity || 1);
    requested.set(item.id, Number.isFinite(quantity) ? quantity : 1);
  }

  const selected = submission.page.items
    .filter((item) => requested.has(item.id))
    .map((item) => {
      const rawQuantity = submission.page.allowQuantity ? requested.get(item.id) || 1 : 1;
      const quantity = Math.max(item.minQuantity, Math.min(item.maxQuantity, Math.floor(rawQuantity)));
      const lineTotal = item.price === null ? null : Number((item.price * quantity).toFixed(2));
      return { item, quantity, lineTotal };
    });

  if (!selected.length) {
    return NextResponse.json({ error: "Please keep at least one item in your selection." }, { status: 400 });
  }

  const totalQuantity = selected.reduce((sum, entry) => sum + entry.quantity, 0);
  const pricedSelections = selected.filter((entry) => entry.lineTotal !== null);
  const totalAmount = pricedSelections.length
    ? Number(pricedSelections.reduce((sum, entry) => sum + (entry.lineTotal || 0), 0).toFixed(2))
    : null;

  await prisma.$transaction([
    prisma.selectionSubmissionItem.deleteMany({ where: { submissionId: submission.id } }),
    prisma.selectionSubmission.update({
      where: { id: submission.id },
      data: {
        totalQuantity,
        totalAmount,
        items: {
          create: selected.map(({ item, quantity, lineTotal }) => ({
            itemId: item.id,
            titleSnapshot: item.title,
            imageSnapshot: item.imageUrl,
            descriptionSnapshot: item.description,
            priceSnapshot: item.price,
            currencySnapshot: item.currency,
            quantity,
            lineTotal,
          })),
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    reference: selectionSubmissionNumber(submission.id),
    totalQuantity,
    totalAmount,
  });
}
