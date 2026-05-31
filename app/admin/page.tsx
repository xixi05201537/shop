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
          <h1 className="display">Overview</h1>
          <p>Everything cozy and commercial in one small cockpit.</p>
        </div>
        <Link className="secondary-button" href="/">
          View shop
        </Link>
      </header>
      <section className="stat-grid">
        <div className="stat-card">
          <span>Total orders</span>
          <strong>{orders}</strong>
        </div>
        <div className="stat-card">
          <span>Paid orders</span>
          <strong>{paidOrders}</strong>
        </div>
        <div className="stat-card">
          <span>Revenue</span>
          <strong>{formatUsd(revenue._sum.totalAmount || 0)}</strong>
        </div>
        <div className="stat-card">
          <span>Articles</span>
          <strong>{articles}</strong>
        </div>
      </section>
    </>
  );
}
