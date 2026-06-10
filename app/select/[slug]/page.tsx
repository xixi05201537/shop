import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import "../../shop.css";
import { SelectionClient } from "./SelectionClient";

export const dynamic = "force-dynamic";

export default async function PublicSelectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.selectionPage.findUnique({
    where: { slug },
    include: {
      items: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!page || !page.isPublished) notFound();

  return (
    <SelectionClient
      page={{
        title: page.title,
        slug: page.slug,
        description: page.description,
        submitLabel: page.submitLabel,
        showPrices: page.showPrices,
        allowQuantity: page.allowQuantity,
        requireName: page.requireName,
        requireEmail: page.requireEmail,
        requireContact: page.requireContact,
        items: page.items.map((item) => ({
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
