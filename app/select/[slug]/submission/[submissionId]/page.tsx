import { notFound } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { formatDateTimeWithOffset } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { selectionSubmissionNumber } from "@/lib/selection";
import "../../../../shop.css";
import { SubmissionDetailClient } from "./SubmissionDetailClient";

export const dynamic = "force-dynamic";

export default async function PublicSelectionSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string; submissionId: string }>;
}) {
  const { slug, submissionId } = await params;
  const [submission, config] = await Promise.all([
    prisma.selectionSubmission.findFirst({
      where: {
        id: submissionId,
        page: { slug },
      },
      include: {
        page: {
          include: {
            items: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            },
          },
        },
        items: true,
      },
    }),
    getPublicConfig(),
  ]);
  if (!submission || !submission.page.isPublished) notFound();

  const activeItemIds = new Set(submission.page.items.map((item) => item.id));
  const initialSelected = submission.items.reduce<Record<string, number>>((selected, item) => {
    if (item.itemId && activeItemIds.has(item.itemId)) {
      selected[item.itemId] = item.quantity;
    }
    return selected;
  }, {});

  return (
    <SubmissionDetailClient
      detail={{
        id: submission.id,
        reference: selectionSubmissionNumber(submission.id),
        slug: submission.page.slug,
        pageTitle: submission.page.title,
        submittedAt: formatDateTimeWithOffset(submission.createdAt, config.displayTimeZone),
        customerName: submission.customerName,
        customerEmail: submission.customerEmail,
        customerContact: submission.customerContact,
        note: submission.note,
        showPrices: submission.page.showPrices,
        allowQuantity: submission.page.allowQuantity,
        initialSelected,
        unavailableItems: submission.items
          .filter((item) => !item.itemId || !activeItemIds.has(item.itemId))
          .map((item) => ({
            id: item.id,
            title: item.titleSnapshot,
            image: item.imageSnapshot,
            description: item.descriptionSnapshot,
            price: item.priceSnapshot,
            currency: item.currencySnapshot,
            quantity: item.quantity,
          })),
        items: submission.page.items.map((item) => ({
          id: item.id,
          title: item.title,
          imageUrl: item.imageUrl,
          description: item.description,
          price: item.price,
          currency: item.currency,
          minQuantity: item.minQuantity,
          maxQuantity: item.maxQuantity,
        })),
      }}
    />
  );
}
