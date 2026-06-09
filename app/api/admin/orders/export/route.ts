import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminApi } from "@/lib/auth";
import { emailStatusLabel, orderStatusLabel } from "@/lib/admin-labels";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { orderWhereFromQuery } from "@/lib/order-filters";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const params = new URL(request.url).searchParams;
  const [orders, config] = await Promise.all([
    prisma.order.findMany({
      where: orderWhereFromQuery(Object.fromEntries(params.entries())),
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    getConfigMap(),
  ]);
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Shop Admin";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("订单");

  worksheet.columns = [
    { header: "订单号", key: "orderNumber", width: 22 },
    { header: "状态", key: "status", width: 12 },
    { header: "买家邮箱", key: "buyerEmail", width: 28 },
    { header: "买家昵称", key: "buyerNickname", width: 18 },
    { header: "备注", key: "internalNote", width: 32 },
    { header: "PayPal 买家邮箱", key: "paypalBuyerEmail", width: 28 },
    { header: "PayPal 买家昵称", key: "paypalBuyerNickname", width: 18 },
    { header: "PayPal Payer ID", key: "paypalPayerId", width: 22 },
    { header: "PayPal 收货姓名", key: "paypalShippingName", width: 20 },
    { header: "PayPal 收货地址", key: "paypalShippingAddress", width: 42 },
    { header: "商品", key: "productName", width: 26 },
    { header: "单价", key: "unitAmount", width: 12 },
    { header: "数量", key: "quantity", width: 10 },
    { header: "总金额", key: "totalAmount", width: 12 },
    { header: "币种", key: "currency", width: 10 },
    { header: "PayPal 订单 ID", key: "paypalOrderId", width: 24 },
    { header: "PayPal 捕获 ID", key: "paypalCaptureId", width: 24 },
    { header: "买家邮件状态", key: "buyerEmailStatus", width: 16 },
    { header: "管理员邮件状态", key: "adminEmailStatus", width: 18 },
    { header: "运单号", key: "trackingNumber", width: 22 },
    { header: "发货时间", key: "shippedAt", width: 26 },
    { header: "发货邮件状态", key: "shipmentEmailStatus", width: 18 },
    { header: "创建时间", key: "createdAt", width: 26 },
    { header: "支付时间", key: "paidAt", width: 26 },
  ];

  worksheet.addRows(
    orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: orderStatusLabel(order.status),
      buyerEmail: displayOrderEmail(order),
      buyerNickname: displayOrderNickname(order),
      internalNote: order.internalNote || "",
      paypalBuyerEmail: order.paypalBuyerEmail || "",
      paypalBuyerNickname: order.paypalBuyerNickname || "",
      paypalPayerId: order.paypalPayerId || "",
      paypalShippingName: order.paypalShippingName || "",
      paypalShippingAddress: order.paypalShippingAddress || "",
      productName: order.productNameSnapshot,
      unitAmount: order.unitAmount,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paypalOrderId: order.paypalOrderId || "",
      paypalCaptureId: order.paypalCaptureId || "",
      buyerEmailStatus: emailStatusLabel(order.buyerEmailStatus),
      adminEmailStatus: emailStatusLabel(order.adminEmailStatus),
      trackingNumber: order.trackingNumber || "",
      shippedAt: formatDateTimeWithOffset(order.shippedAt, displayTimeZone),
      shipmentEmailStatus: emailStatusLabel(order.shipmentEmailStatus),
      createdAt: formatDateTimeWithOffset(order.createdAt, displayTimeZone),
      paidAt: formatDateTimeWithOffset(order.paidAt, displayTimeZone),
    })),
  );

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.xlsx"`,
    },
  });
}
