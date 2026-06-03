import Link from "next/link";
import { formatUsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [orders, paidOrders, revenue, articles] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.aggregate({ where: { status: "paid" }, _sum: { totalAmount: true } }),
    prisma.article.count(),
  ]);

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
        <div className="stat-card">
          <span>订单总数</span>
          <strong>{orders}</strong>
        </div>
        <div className="stat-card">
          <span>已支付订单</span>
          <strong>{paidOrders}</strong>
        </div>
        <div className="stat-card">
          <span>收入</span>
          <strong>{formatUsd(revenue._sum.totalAmount || 0)}</strong>
        </div>
        <div className="stat-card">
          <span>文章数量</span>
          <strong>{articles}</strong>
        </div>
      </section>
    </>
  );
}
