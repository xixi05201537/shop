import Link from "next/link";
import { orderStatusLabel } from "@/lib/admin-labels";
import { listRecentAuditLogs } from "@/lib/audit-log";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, formatUsd, normalizeDisplayTimeZone } from "@/lib/format";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const emailIssueWhere = {
    OR: [
      { buyerEmailStatus: "failed" },
      { adminEmailStatus: "failed" },
      { shipmentEmailStatus: "failed" },
    ],
  };
  const [
    orders,
    paidOrders,
    pendingOrders,
    awaitingShipment,
    emailIssues,
    webhookIssues,
    revenue,
    articles,
    product,
    recentPaidOrders,
    auditLogs,
    config,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.count({ where: { status: "created" } }),
    prisma.order.count({ where: { status: "paid", trackingNumber: null } }),
    prisma.order.count({ where: emailIssueWhere }),
    prisma.webhookEvent.count({ where: { processed: false } }),
    prisma.order.aggregate({ where: { status: "paid" }, _sum: { totalAmount: true } }),
    prisma.article.count(),
    prisma.product.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.order.findMany({ where: { status: "paid" }, orderBy: { paidAt: "desc" }, take: 5 }),
    listRecentAuditLogs(5),
    getConfigMap(),
  ]);
  const paidRate = orders ? Math.round((paidOrders / orders) * 100) : 0;
  const paypalEnv = config.paypalEnv === "live" ? "Live" : "Sandbox";
  const floatingEnabled = config.floatingEnabled === "true";
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">概览</h1>
          <p>在这里查看店铺订单、收入和文章数据。</p>
        </div>
        <Link className="secondary-button" href="/">
          查看店铺
        </Link>
      </header>
      <section className="stat-grid">
        <Link className="stat-card stat-link" href="/admin/orders">
          <span>订单总数</span>
          <strong>{orders}</strong>
        </Link>
        <Link className="stat-card stat-link" href="/admin/orders?status=paid">
          <span>已支付订单</span>
          <strong>{paidOrders}</strong>
        </Link>
        <div className="stat-card">
          <span>收入</span>
          <strong>{formatUsd(revenue._sum.totalAmount || 0)}</strong>
        </div>
        <Link className="stat-card stat-link" href="/admin/articles">
          <span>文章数量</span>
          <strong>{articles}</strong>
        </Link>
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-main-stack">
          <div className="admin-card dashboard-panel">
            <div className="section-title-row">
              <div>
                <h2>最近支付成功</h2>
                <p>最新完成付款的订单，适合马上确认和发货。</p>
              </div>
              <Link className="secondary-button" href="/admin/orders?status=paid">
                查看全部
              </Link>
            </div>
            {recentPaidOrders.length ? (
              <div className="dashboard-order-list">
                {recentPaidOrders.map((order) => (
                  <Link className="dashboard-order-row" href={`/admin/orders/${order.id}`} key={order.id}>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{displayOrderNickname(order)} · {displayOrderEmail(order)}</span>
                    </div>
                    <div>
                      <strong>{formatUsd(order.totalAmount)}</strong>
                      <span className={`status-badge status-${order.status}`}>{orderStatusLabel(order.status)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">暂无支付成功订单。</div>
            )}
          </div>
          <div className="admin-card dashboard-panel">
            <div className="section-title-row">
              <div>
                <h2>最近操作</h2>
                <p>配置、发货、重发邮件、备注和图片操作会记录在这里。</p>
              </div>
              <Link className="secondary-button" href="/admin/audit-logs">
                查看全部
              </Link>
            </div>
            {auditLogs.length ? (
              <div className="audit-log-list">
                {auditLogs.map((log: { id: string; summary: string; action: string; createdAt: Date }) => (
                  <div className="audit-log-row" key={log.id}>
                    <strong>{log.summary}</strong>
                    <span>{formatDateTimeWithOffset(log.createdAt, displayTimeZone)} · {log.action}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">暂无操作记录。</div>
            )}
          </div>
        </div>
        <div className="dashboard-side-stack">
          <div className="admin-card dashboard-panel">
            <div className="section-title-row">
              <div>
                <h2>待处理</h2>
                <p>需要你留意的后台状态。</p>
              </div>
            </div>
            <div className="dashboard-check-list">
              <Link href="/admin/orders?status=created">
                <span>待付款订单</span>
                <strong>{pendingOrders}</strong>
              </Link>
              <Link href="/admin/orders?fulfillment=pending">
                <span>待发货订单</span>
                <strong>{awaitingShipment}</strong>
              </Link>
              <Link href="/admin/orders?status=paid">
                <span>付款率</span>
                <strong>{paidRate}%</strong>
              </Link>
              <Link href="/admin/orders?emailIssue=1">
                <span>邮件发送异常</span>
                <strong>{emailIssues}</strong>
              </Link>
              <Link href="/admin/settings">
                <span>Webhook 异常</span>
                <strong>{webhookIssues}</strong>
              </Link>
              <Link href="/admin/product">
                <span>商品状态</span>
                <strong>{product?.isActive ? "已启用" : "未启用"}</strong>
              </Link>
              <Link href="/admin/settings">
                <span>PayPal 环境</span>
                <strong>{paypalEnv}</strong>
              </Link>
            </div>
          </div>
          <div className="admin-card dashboard-panel">
            <div className="section-title-row">
              <div>
                <h2>快捷操作</h2>
                <p>常用维护入口。</p>
              </div>
            </div>
            <div className="dashboard-quick-actions">
              <Link className="secondary-button" href="/admin/product">编辑商品</Link>
              <Link className="secondary-button" href="/admin/email">邮件设置</Link>
              <Link className="secondary-button" href="/admin/floating-widget">
                {floatingEnabled ? "调整浮窗" : "启用浮窗"}
              </Link>
              <Link className="secondary-button" href="/admin/upload">上传图片</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
