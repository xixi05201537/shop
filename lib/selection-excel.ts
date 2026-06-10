import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { randomBytes } from "node:crypto";
import ExcelJS from "exceljs";
import { normalizeCurrency } from "@/lib/format";
import { getUploadDir } from "@/lib/uploads";

type SelectionItemExcelRow = {
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sortOrder: number;
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
  imageUrl: string;
};

type ExcelImage = {
  buffer: Buffer;
  extension: "jpeg" | "png" | "gif";
};

export const selectionItemColumns = [
  { header: "Image", key: "image", width: 18 },
  { header: "Title", key: "title", width: 24 },
  { header: "Description", key: "description", width: 36 },
  { header: "Price", key: "price", width: 12 },
  { header: "Currency", key: "currency", width: 12 },
  { header: "Sort Order", key: "sortOrder", width: 12 },
  { header: "Min Quantity", key: "minQuantity", width: 14 },
  { header: "Max Quantity", key: "maxQuantity", width: 14 },
  { header: "Active", key: "isActive", width: 10 },
  { header: "Image URL", key: "imageUrl", width: 42 },
];

export function styleSelectionItemWorksheet(worksheet: ExcelJS.Worksheet) {
  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).font = { bold: true, color: { argb: "FF352331" } };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.eachRow((row) => {
    row.alignment = { vertical: "middle", wrapText: true };
  });
}

export async function imageForWorkbook(imageUrl: string, baseUrl: string): Promise<ExcelImage | null> {
  const url = imageUrl.trim();
  if (!url) return null;

  try {
    if (url.startsWith("/uploads/")) {
      const buffer = await readFile(join(getUploadDir(), basename(url)));
      const extension = imageExtensionFromBuffer(buffer) || extensionFromPath(url);
      return extension ? { buffer, extension } : null;
    }

    if (url.startsWith("/")) {
      const response = await fetch(new URL(url, baseUrl));
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      const extension = imageExtensionFromBuffer(buffer) || extensionFromPath(url);
      return extension ? { buffer, extension } : null;
    }

    if (/^https?:\/\//i.test(url)) {
      const response = await fetch(url);
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      const extension = imageExtensionFromBuffer(buffer) || extensionFromPath(url);
      return extension ? { buffer, extension } : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function embedImageInRow(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, image: ExcelImage, rowNumber: number) {
  const imageId = workbook.addImage({
    base64: image.buffer.toString("base64"),
    extension: image.extension,
  });
  worksheet.addImage(imageId, {
    tl: { col: 0.16, row: rowNumber - 0.86 },
    ext: { width: 96, height: 96 },
    editAs: "oneCell",
  });
  worksheet.getRow(rowNumber).height = 78;
}

export function rowToSelectionItem(row: ExcelJS.Row): SelectionItemExcelRow | null {
  const title = cellText(row.getCell(2)).trim();
  const imageUrl = cellText(row.getCell(10)).trim();
  const hasAnyValue = [2, 3, 4, 5, 6, 7, 8, 9, 10].some((index) => cellText(row.getCell(index)).trim());
  if (!title && !imageUrl && !hasAnyValue) return null;

  return {
    title: title || "Untitled item",
    description: optionalCellText(row.getCell(3)),
    price: optionalCellNumber(row.getCell(4)),
    currency: normalizeCurrency(cellText(row.getCell(5))),
    sortOrder: integerCell(row.getCell(6), 0),
    minQuantity: Math.max(1, integerCell(row.getCell(7), 1)),
    maxQuantity: Math.max(1, integerCell(row.getCell(8), 99)),
    isActive: booleanCell(row.getCell(9), true),
    imageUrl,
  };
}

export function isSelectionItemWorksheet(worksheet: ExcelJS.Worksheet) {
  const headers = worksheet.getRow(1).values;
  const normalized = Array.isArray(headers)
    ? headers.map((value) => String(value || "").trim().toLowerCase())
    : [];
  return (
    normalized[1] === "image" &&
    normalized[2] === "title" &&
    normalized[4] === "price" &&
    normalized[5] === "currency" &&
    normalized[10] === "image url"
  );
}

export function imagesByRow(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet) {
  const byRow = new Map<number, ExcelImage>();
  for (const imageRef of worksheet.getImages()) {
    const rowNumber = Math.floor(imageRef.range.tl.row) + 1;
    const workbookImage = workbook.getImage(Number(imageRef.imageId));
    const buffer = bufferFromWorkbookImage(workbookImage);
    const extension = normalizeExcelExtension(workbookImage?.extension);
    if (buffer && extension && !byRow.has(rowNumber)) {
      byRow.set(rowNumber, { buffer, extension });
    }
  }
  return byRow;
}

export async function saveImportedSelectionImage(image: ExcelImage) {
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });
  const fileExtension = image.extension === "jpeg" ? "jpg" : image.extension;
  const filename = `selection-import-${Date.now()}-${randomBytes(4).toString("hex")}.${fileExtension}`;
  await writeFile(join(uploadDir, filename), image.buffer);
  return `/uploads/${filename}`;
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

function optionalCellText(cell: ExcelJS.Cell) {
  const value = cellText(cell).trim();
  return value ? value : null;
}

function optionalCellNumber(cell: ExcelJS.Cell) {
  const text = cellText(cell).trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? Number(value.toFixed(2)) : null;
}

function integerCell(cell: ExcelJS.Cell, fallback: number) {
  const value = Number(cellText(cell));
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function booleanCell(cell: ExcelJS.Cell, fallback: boolean) {
  const text = cellText(cell).trim().toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "yes", "y", "active", "show"].includes(text);
}

function bufferFromWorkbookImage(image: ExcelJS.Image | undefined) {
  if (!image) return null;
  if (image.buffer) return Buffer.from(image.buffer);
  if (image.base64) return Buffer.from(image.base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
  return null;
}

function normalizeExcelExtension(extension: string | undefined): ExcelImage["extension"] | null {
  if (extension === "jpeg" || extension === "png" || extension === "gif") return extension;
  return null;
}

function extensionFromPath(path: string): ExcelImage["extension"] | null {
  const cleanPath = path.split("?")[0].toLowerCase();
  if (cleanPath.endsWith(".jpg") || cleanPath.endsWith(".jpeg")) return "jpeg";
  if (cleanPath.endsWith(".png")) return "png";
  if (cleanPath.endsWith(".gif")) return "gif";
  return null;
}

function imageExtensionFromBuffer(buffer: Buffer): ExcelImage["extension"] | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (buffer.length > 6 && buffer.slice(0, 3).toString("ascii") === "GIF") return "gif";
  return null;
}
