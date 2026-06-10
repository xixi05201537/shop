import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { embedImageInRow, imageForWorkbook, selectionItemColumns, styleSelectionItemWorksheet } from "@/lib/selection-excel";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const pageId = new URL(request.url).searchParams.get("pageId") || "";
  const page = await prisma.selectionPage.findUnique({
    where: { id: pageId },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] } },
  });
  if (!page) return NextResponse.json({ error: "Selection page not found." }, { status: 404 });

  const baseUrl = await requestBaseUrl();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Shop Admin";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Selection items");
  worksheet.columns = selectionItemColumns;

  for (const item of page.items) {
    const row = worksheet.addRow({
      image: "",
      title: item.title,
      description: item.description || "",
      price: item.price ?? "",
      currency: item.currency,
      sortOrder: item.sortOrder,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      isActive: item.isActive ? "TRUE" : "FALSE",
      imageUrl: item.imageUrl,
    });
    const image = await imageForWorkbook(item.imageUrl, baseUrl);
    if (image) embedImageInRow(workbook, worksheet, image, row.number);
  }

  styleSelectionItemWorksheet(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  const safeSlug = page.slug.replace(/[^a-z0-9-]+/gi, "-") || "selection";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="selection-items-${safeSlug}-${Date.now()}.xlsx"`,
    },
  });
}
