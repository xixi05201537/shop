import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/redirect";
import { imagesByRow, isSelectionItemWorksheet, rowToSelectionItem, saveImportedSelectionImage } from "@/lib/selection-excel";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const pageId = String(formData.get("pageId") || "");
  const file = formData.get("file");
  const page = await prisma.selectionPage.findUnique({ where: { id: pageId }, select: { id: true, slug: true } });
  if (!page) return NextResponse.redirect(appUrl("/admin/selection-pages?imported=0", request), { status: 303 });
  if (!(file instanceof File) || !file.size) {
    return NextResponse.redirect(appUrl(`/admin/selection-pages/${pageId}/items?imported=0&error=file`, request), { status: 303 });
  }

  const workbook = new ExcelJS.Workbook();
  const loadWorkbook = workbook.xlsx.load as (buffer: unknown) => Promise<ExcelJS.Workbook>;
  await loadWorkbook.call(workbook.xlsx, Buffer.from(await file.arrayBuffer()));
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return NextResponse.redirect(appUrl(`/admin/selection-pages/${pageId}/items?imported=0&error=sheet`, request), { status: 303 });
  }
  if (!isSelectionItemWorksheet(worksheet)) {
    return NextResponse.redirect(appUrl(`/admin/selection-pages/${pageId}/items?imported=0&error=template`, request), { status: 303 });
  }

  const embeddedImages = imagesByRow(workbook, worksheet);
  let imported = 0;
  let skipped = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const data = rowToSelectionItem(row);
    if (!data) continue;

    const embeddedImage = embeddedImages.get(rowNumber);
    const imageUrl = embeddedImage ? await saveImportedSelectionImage(embeddedImage) : data.imageUrl;
    if (!imageUrl) {
      skipped += 1;
      continue;
    }

    await prisma.selectionItem.create({
      data: {
        pageId,
        title: data.title,
        imageUrl,
        description: data.description,
        price: data.price,
        currency: data.currency,
        sortOrder: data.sortOrder,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        isActive: data.isActive,
      },
    });
    imported += 1;
  }

  revalidatePath(`/select/${page.slug}`);
  revalidatePath(`/admin/selection-pages/${pageId}/items`);
  await writeAuditLog({
    action: "import",
    targetType: "selection-item",
    targetId: pageId,
    summary: `Imported ${imported} selection items`,
    metadata: { imported, skipped, filename: file.name },
  });

  return NextResponse.redirect(appUrl(`/admin/selection-pages/${pageId}/items?imported=${imported}&skipped=${skipped}`, request), {
    status: 303,
  });
}
