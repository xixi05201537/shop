import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { emailStatusLabel, orderStatusLabel } from "@/lib/admin-labels";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { orderWhereFromQuery } from "@/lib/order-filters";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

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

  const rows = [
    [
      "订单号",
      "状态",
      "买家邮箱",
      "买家昵称",
      "PayPal 买家邮箱",
      "PayPal 买家昵称",
      "PayPal Payer ID",
      "PayPal 收货姓名",
      "PayPal 收货地址",
      "商品",
      "单价",
      "数量",
      "总金额",
      "币种",
      "PayPal 订单 ID",
      "PayPal 捕获 ID",
      "买家邮件状态",
      "管理员邮件状态",
      "运单号",
      "发货时间",
      "发货邮件状态",
      "创建时间",
      "支付时间",
    ],
    ...orders.map((order) => [
      order.orderNumber,
      orderStatusLabel(order.status),
      displayOrderEmail(order),
      displayOrderNickname(order),
      order.paypalBuyerEmail || "",
      order.paypalBuyerNickname || "",
      order.paypalPayerId || "",
      order.paypalShippingName || "",
      order.paypalShippingAddress || "",
      order.productNameSnapshot,
      order.unitAmount.toFixed(2),
      order.quantity,
      order.totalAmount.toFixed(2),
      order.currency,
      order.paypalOrderId || "",
      order.paypalCaptureId || "",
      emailStatusLabel(order.buyerEmailStatus),
      emailStatusLabel(order.adminEmailStatus),
      order.trackingNumber || "",
      formatDateTimeWithOffset(order.shippedAt, displayTimeZone),
      emailStatusLabel(order.shipmentEmailStatus),
      formatDateTimeWithOffset(order.createdAt, displayTimeZone),
      formatDateTimeWithOffset(order.paidAt, displayTimeZone),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
