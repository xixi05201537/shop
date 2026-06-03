import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { emailStatusLabel, orderStatusLabel } from "@/lib/admin-labels";
import { orderWhereFromQuery } from "@/lib/order-filters";
import { prisma } from "@/lib/prisma";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const params = new URL(request.url).searchParams;
  const orders = await prisma.order.findMany({
    where: orderWhereFromQuery(Object.fromEntries(params.entries())),
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const rows = [
    [
      "订单号",
      "状态",
      "买家邮箱",
      "买家昵称",
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
      order.buyerEmail || "",
      order.buyerNickname || "",
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
      order.shippedAt?.toISOString() || "",
      emailStatusLabel(order.shipmentEmailStatus),
      order.createdAt.toISOString(),
      order.paidAt?.toISOString() || "",
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
