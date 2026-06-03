import Link from "next/link";
import { orderStatusLabel } from "@/lib/admin-labels";
import { formatUsd } from "@/lib/format";
import { orderWhereFromQuery, queryStringFromObject, type OrderFilterQuery } from "@/lib/order-filters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersAdmin({
  searchParams,
}: {
  searchParams: Promise<OrderFilterQuery>;
}) {
  const query = await searchParams;
  const exportQuery = queryStringFromObject(query);
  const orders = await prisma.order.findMany({
    where: orderWhereFromQuery(query),
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <header className="admin-header">
        <h1 className="display">订单</h1>
      </header>
      <section className="admin-card">
        <div className="admin-toolbar">
          <form className="admin-filter-grid" action="/admin/orders">
            <input name="search" placeholder="搜索邮箱、昵称、订单号、PayPal ID" defaultValue={query.search || query.email || ""} />
            <select name="status" defaultValue={query.status || ""}>
              <option value="">全部状态</option>
              <option value="created">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">失败</option>
              <option value="cancelled">已取消</option>
            </select>
            <input name="nickname" placeholder="买家昵称" defaultValue={query.nickname || ""} />
            <input name="paypalOrderId" placeholder="PayPal 订单 ID" defaultValue={query.paypalOrderId || ""} />
            <input name="minAmount" placeholder="最小金额" defaultValue={query.minAmount || ""} inputMode="decimal" />
            <input name="maxAmount" placeholder="最大金额" defaultValue={query.maxAmount || ""} inputMode="decimal" />
            <input name="dateFrom" type="date" defaultValue={query.dateFrom || ""} />
            <input name="dateTo" type="date" defaultValue={query.dateTo || ""} />
            <button className="secondary-button" type="submit">
              筛选
            </button>
            <Link className="secondary-button" href="/admin/orders">
              重置
            </Link>
            <Link className="secondary-button" href={`/api/admin/orders/export${exportQuery ? `?${exportQuery}` : ""}`}>
              导出 CSV
            </Link>
          </form>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>昵称</th>
              <th>邮箱</th>
              <th>PayPal</th>
              <th>总金额</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>{order.buyerNickname || "-"}</td>
                <td>{order.buyerEmail || "-"}</td>
                <td>{order.paypalOrderId || "-"}</td>
                <td>{formatUsd(order.totalAmount)}</td>
                <td>{orderStatusLabel(order.status)}</td>
                <td>{order.createdAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
