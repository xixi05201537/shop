import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminApi } from "@/lib/auth";
import { imagesByRow, saveImportedSelectionImage } from "@/lib/selection-excel";

export const dynamic = "force-dynamic";

type ImportedPaymentImage = {
  imageUrl: string;
  price: string;
  quantity: string;
  caption: string;
};

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ ok: false, error: "请选择 Excel 文件。" }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const loadWorkbook = workbook.xlsx.load as (buffer: unknown) => Promise<ExcelJS.Workbook>;
  try {
    await loadWorkbook.call(workbook.xlsx, Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ ok: false, error: "Excel 解析失败，请使用模板重新填写。" }, { status: 400 });
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return NextResponse.json({ ok: false, error: "Excel 中没有工作表。" }, { status: 400 });
  }

  const embeddedImages = imagesByRow(workbook, worksheet);
  const images: ImportedPaymentImage[] = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const embeddedImage = embeddedImages.get(rowNumber);
    const imageUrl = embeddedImage ? await saveImportedSelectionImage(embeddedImage) : cellText(row.getCell(1)).trim();
    const price = numberCell(row.getCell(2), 0);
    const quantity = Math.max(1, Math.floor(numberCell(row.getCell(3), 1)));
    const caption = cellText(row.getCell(4)).trim();
    const hasAnyValue = imageUrl || price > 0 || caption;
    if (!hasAnyValue) continue;
    if (!imageUrl) continue;

    images.push({
      imageUrl,
      price: price ? String(price) : "",
      quantity: String(quantity),
      caption,
    });
  }

  return NextResponse.json({ ok: true, images });
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return String(value.result ?? "");
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || "").join("");
    }
    return String(cell.text || "");
  }
  return String(value);
}

function numberCell(cell: ExcelJS.Cell, fallback: number) {
  const value = Number(cellText(cell).trim());
  return Number.isFinite(value) && value >= 0 ? Number(value.toFixed(2)) : fallback;
}
