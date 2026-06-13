import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminApi } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Shop Admin";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Payment request items");
  worksheet.columns = [
    { header: "Image", key: "image", width: 86 },
    { header: "Price", key: "price", width: 14 },
    { header: "Quantity", key: "quantity", width: 14 },
    { header: "Description", key: "description", width: 42 },
  ];
  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).font = { bold: true, color: { argb: "FF352331" } };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.addRow({
    image: "/uploads/example.jpg",
    price: 12,
    quantity: 3,
    description: "Reserved item description",
  });
  worksheet.eachRow((row) => {
    row.alignment = { vertical: "middle", wrapText: true };
  });
  for (let rowNumber = 2; rowNumber <= 51; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.height = 320;
    row.alignment = { vertical: "middle", wrapText: true };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payment-request-template-${Date.now()}.xlsx"`,
    },
  });
}
