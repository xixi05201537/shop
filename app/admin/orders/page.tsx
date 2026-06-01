import Link from "next/link";
import { formatUsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; email?: string }>;
}) {
  const query = await searchParams;
  const orders = await prisma.order.findMany({
    where: {
      status: query.status || undefined,
      buyerEmail: query.email ? { contains: query.email } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Orders</h1>
      </header>
      <section className="admin-card">
        <form className="admin-actions" action="/admin/orders">
          <input name="email" placeholder="Search email" defaultValue={query.email || ""} />
          <select name="status" defaultValue={query.status || ""}>
            <option value="">All statuses</option>
            <option value="created">Created</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="secondary-button" type="submit">
            Filter
          </button>
        </form>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Email</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>{order.buyerEmail || "-"}</td>
                <td>{formatUsd(order.totalAmount)}</td>
                <td>{order.status}</td>
                <td>{order.createdAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
