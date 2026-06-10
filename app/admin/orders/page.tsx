import Link from "next/link";
import { FileSpreadsheet, RotateCcw, Search } from "lucide-react";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { orderStatusLabel } from "@/lib/admin-labels";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, formatUsd, normalizeDisplayTimeZone } from "@/lib/format";
import { orderWhereFromQuery, queryStringWithoutPage, type OrderFilterQuery } from "@/lib/order-filters";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";
import { BatchShipDialog } from "./BatchShipDialog";
import { OrderNoteDialog, PayerNoteDialog } from "./OrderNoteDialog";
import { PageSizeSelect } from "./PageSizeSelect";

export const dynamic = "force-dynamic";
const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

function pageSizeFromQuery(value?: string) {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : 10;
}

export default async function OrdersAdmin({
  searchParams,
}: {
  searchParams: Promise<OrderFilterQuery>;
}) {
  const query = await searchParams;
  const search = query.search || query.email || "";
  const searchPayerNotes = search
    ? await prisma.payerNote.findMany({
        where: { note: { contains: search } },
        select: { payerId: true },
      })
    : [];
  const where = orderWhereFromQuery(query, searchPayerNotes.map((payerNote) => payerNote.payerId));
  const exportQuery = queryStringWithoutPage(query);
  const pageQuery = queryStringWithoutPage(query);
  const pageSize = pageSizeFromQuery(query.pageSize);
  const requestedPage = Math.max(1, Number(query.page) || 1);
  const [totalOrders, config] = await Promise.all([prisma.order.count({ where }), getConfigMap()]);
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const pageStart = totalOrders ? (safePage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(safePage * pageSize, totalOrders);
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });
  const payerIds = Array.from(new Set(orders.map((order) => order.paypalPayerId).filter((payerId): payerId is string => Boolean(payerId))));
  const payerNotes = payerIds.length
    ? await prisma.payerNote.findMany({ where: { payerId: { in: payerIds } } })
    : [];
  const payerNoteById = new Map(payerNotes.map((payerNote) => [payerNote.payerId, payerNote.note]));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(pageQuery);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const activeFilterLabel =
    query.fulfillment === "pending"
      ? "待发货订单"
      : query.fulfillment === "shipped"
        ? "已发货订单"
        : query.emailIssue === "1"
          ? "邮件发送异常"
          : query.status
            ? orderStatusLabel(query.status)
            : "";

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">订单</h1>
          <p>筛选、查看和导出订单记录。</p>
        </div>
      </header>
      <section className="admin-card">
        <div className="admin-toolbar">
          <form className="admin-filter-grid order-filter-grid" action="/admin/orders">
            <input name="search" placeholder="搜索邮箱、昵称、订单号、PayPal ID、备注、付款人备注" defaultValue={query.search || query.email || ""} />
            <select name="status" defaultValue={query.status || ""}>
              <option value="">全部状态</option>
              <option value="created">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">失败</option>
              <option value="cancelled">已取消</option>
            </select>
            <select name="fulfillment" defaultValue={query.fulfillment || ""}>
              <option value="">全部发货</option>
              <option value="pending">待发货</option>
              <option value="shipped">已发货</option>
            </select>
            <input type="hidden" name="emailIssue" value={query.emailIssue || ""} />
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
          {activeFilterLabel ? (
            <div className="active-order-filter">
              <span>当前筛选：{activeFilterLabel}</span>
              <strong>{totalOrders} 条</strong>
              <Link href="/admin/orders">清除筛选</Link>
            </div>
          ) : null}
        </div>
        <BatchShipDialog returnTo={`/admin/orders${pageQuery ? `?${pageQuery}` : ""}`} />
        <table className="admin-table orders-table">
          <thead>
            <tr>
              <th>
                <input className="orders-select-all" type="checkbox" aria-label="选择当前页全部已支付订单" />
              </th>
              <th>订单号</th>
              <th>昵称</th>
              <th>邮箱</th>
              <th>备注</th>
              <th>付款人备注</th>
              <th>总金额</th>
              <th>状态</th>
              <th>发货状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const payerNote = order.paypalPayerId ? payerNoteById.get(order.paypalPayerId) || "" : "";
              const isShipped = Boolean(order.trackingNumber || order.shippedAt);
              const fulfillmentLabel = isShipped ? "已发货" : order.status === "paid" ? "待发货" : "-";

              return (
                <tr key={order.id}>
                  <td>
                    <input
                      className="order-select-checkbox"
                      type="checkbox"
                      value={order.id}
                      data-order-number={order.orderNumber}
                      data-payer-id={order.paypalPayerId || ""}
                      data-shipped={order.trackingNumber || order.shippedAt ? "true" : ""}
                      data-tracking-number={order.trackingNumber || ""}
                      disabled={order.status !== "paid"}
                      aria-label={`选择订单 ${order.orderNumber}`}
                    />
                  </td>
                  <td>
                    <span className="copy-inline">
                      <Link className="orders-table-ellipsis" href={`/admin/orders/${order.id}`} title={order.orderNumber}>{order.orderNumber}</Link>
                      <CopyLinkButton compact label="复制" value={order.orderNumber} />
                    </span>
                  </td>
                  <td>
                    <span className="orders-table-ellipsis" title={displayOrderNickname(order)}>
                      {displayOrderNickname(order)}
                    </span>
                  </td>
                  <td>
                    <span className="copy-inline">
                      <span className="orders-table-ellipsis" title={displayOrderEmail(order)}>
                        {displayOrderEmail(order)}
                      </span>
                      {displayOrderEmail(order) !== "-" ? <CopyLinkButton compact label="复制" value={displayOrderEmail(order)} /> : null}
                    </span>
                  </td>
                  <td>
                    <div className={order.internalNote ? "quick-note has-note" : "quick-note"}>
                      <OrderNoteDialog
                        orderId={order.id}
                        note={order.internalNote}
                        returnTo={`/admin/orders${pageQuery ? `?${pageQuery}` : ""}`}
                        triggerClassName="quick-note-trigger"
                        triggerChildren={
                          <>
                            <span className="order-note-cell" title={order.internalNote || ""}>
                              {order.internalNote || "添加备注"}
                            </span>
                            {order.internalNote ? <span className="note-dot">有备注</span> : null}
                          </>
                        }
                      />
                    </div>
                  </td>
                  <td>
                    {order.paypalPayerId ? (
                      <div className={payerNote ? "quick-note has-note" : "quick-note"}>
                        <PayerNoteDialog
                          payerId={order.paypalPayerId}
                          note={payerNote}
                          returnTo={`/admin/orders${pageQuery ? `?${pageQuery}` : ""}`}
                          triggerClassName="quick-note-trigger"
                          triggerChildren={
                            <>
                              <span className="order-note-cell" title={payerNote || `Payer ID：${order.paypalPayerId}`}>
                                {payerNote || "添加付款人备注"}
                              </span>
                              {payerNote ? <span className="note-dot">有备注</span> : null}
                            </>
                          }
                        />
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span className="orders-table-ellipsis" title={formatUsd(order.totalAmount)}>
                      {formatUsd(order.totalAmount)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>{orderStatusLabel(order.status)}</span>
                  </td>
                  <td>
                    {order.status === "paid" || isShipped ? (
                      <span
                        className={isShipped ? "fulfillment-badge is-shipped" : "fulfillment-badge is-pending"}
                        title={order.trackingNumber ? `运单号：${order.trackingNumber}` : fulfillmentLabel}
                      >
                        {fulfillmentLabel}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span className="orders-table-ellipsis" title={formatDateTimeWithOffset(order.createdAt, displayTimeZone)}>
                      {formatDateTimeWithOffset(order.createdAt, displayTimeZone)}
                    </span>
                  </td>
                </tr>
              );
            })}
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
          <PageSizeSelect pageSize={pageSize} queryString={pageQuery} />
        </div>
      </section>
    </>
  );
}
