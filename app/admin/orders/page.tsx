import Link from "next/link";
import { FileSpreadsheet, RotateCcw, Search } from "lucide-react";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { orderStatusLabel } from "@/lib/admin-labels";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, formatUsd, normalizeDisplayTimeZone } from "@/lib/format";
import { orderWhereFromQuery, queryStringWithoutPage, type OrderFilterQuery } from "@/lib/order-filters";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

export default async function OrdersAdmin({
  searchParams,
}: {
  searchParams: Promise<OrderFilterQuery>;
}) {
  const query = await searchParams;
  const where = orderWhereFromQuery(query);
  const exportQuery = queryStringWithoutPage(query);
  const pageQuery = queryStringWithoutPage(query);
  const requestedPage = Math.max(1, Number(query.page) || 1);
  const [totalOrders, config] = await Promise.all([prisma.order.count({ where }), getConfigMap()]);
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);
  const pageStart = totalOrders ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = Math.min(safePage * PAGE_SIZE, totalOrders);
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(pageQuery);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">订单</h1>
          <p>筛选、查看和导出订单记录，每页最多显示 10 条。</p>
        </div>
      </header>
      <section className="admin-card">
        <div className="admin-toolbar">
          <form className="admin-filter-grid order-filter-grid" action="/admin/orders">
            <input name="search" placeholder="搜索邮箱、昵称、订单号、PayPal ID" defaultValue={query.search || query.email || ""} />
            <select name="status" defaultValue={query.status || ""}>
              <option value="">全部状态</option>
              <option value="created">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">失败</option>
              <option value="cancelled">已取消</option>
            </select>
            <input name="dateFrom" type="date" defaultValue={query.dateFrom || ""} />
            <input name="dateTo" type="date" defaultValue={query.dateTo || ""} />
            <div className="order-filter-actions">
              <button className="admin-button order-action-button" type="submit">
                <Search aria-hidden="true" size={16} />
                <span>筛选</span>
              </button>
              <Link className="secondary-button order-action-button order-action-reset" href="/admin/orders">
                <RotateCcw aria-hidden="true" size={16} />
                <span>重置</span>
              </Link>
              <Link
                className="secondary-button order-action-button order-action-export"
                href={`/api/admin/orders/export${exportQuery ? `?${exportQuery}` : ""}`}
              >
                <FileSpreadsheet aria-hidden="true" size={16} />
                <span>导出</span>
              </Link>
            </div>
          </form>
        </div>
        <table className="admin-table orders-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>昵称</th>
              <th>邮箱</th>
              <th>备注</th>
              <th>总金额</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span className="copy-inline">
                    <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                    <CopyLinkButton compact label="复制" value={order.orderNumber} />
                  </span>
                </td>
                <td>{displayOrderNickname(order)}</td>
                <td>
                  <span className="copy-inline">
                    {displayOrderEmail(order)}
                    {displayOrderEmail(order) !== "-" ? <CopyLinkButton compact label="复制" value={displayOrderEmail(order)} /> : null}
                  </span>
                </td>
                <td>
                  <span className="order-note-cell" title={order.internalNote || ""}>
                    {order.internalNote || "-"}
                  </span>
                </td>
                <td>{formatUsd(order.totalAmount)}</td>
                <td>
                  <span className={`status-badge status-${order.status}`}>{orderStatusLabel(order.status)}</span>
                </td>
                <td>{formatDateTimeWithOffset(order.createdAt, displayTimeZone)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="admin-pagination">
          <span>
            {totalOrders ? `${pageStart}-${pageEnd} / ${totalOrders} 条` : "暂无订单"}
          </span>
          <div>
            {safePage > 1 ? (
              <Link className="secondary-button" href={pageHref(safePage - 1)}>
                上一页
              </Link>
            ) : (
              <span className="secondary-button is-disabled">上一页</span>
            )}
            <strong>
              第 {safePage} / {totalPages} 页
            </strong>
            {safePage < totalPages ? (
              <Link className="secondary-button" href={pageHref(safePage + 1)}>
                下一页
              </Link>
            ) : (
              <span className="secondary-button is-disabled">下一页</span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
