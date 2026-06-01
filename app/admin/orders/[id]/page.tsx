import { notFound } from "next/navigation";
import { formatUsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Order</h1>
      </header>
      <section className="admin-card">
        <dl className="stat-grid">
          <div className="stat-card">
            <span>Order</span>
            <strong>{order.orderNumber}</strong>
          </div>
          <div className="stat-card">
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>
          <div className="stat-card">
            <span>Total</span>
            <strong>{formatUsd(order.totalAmount)}</strong>
          </div>
          <div className="stat-card">
            <span>Quantity</span>
            <strong>{order.quantity}</strong>
          </div>
        </dl>
        <table className="admin-table">
          <tbody>
            <tr>
              <th>PayPal order ID</th>
              <td>{order.paypalOrderId || "-"}</td>
            </tr>
            <tr>
              <th>PayPal capture ID</th>
              <td>{order.paypalCaptureId || "-"}</td>
            </tr>
            <tr>
              <th>Buyer email</th>
              <td>{order.buyerEmail || "-"}</td>
            </tr>
            <tr>
              <th>Buyer nickname</th>
              <td>{order.buyerNickname || "-"}</td>
            </tr>
            <tr>
              <th>Product</th>
              <td>{order.productNameSnapshot}</td>
            </tr>
            <tr>
              <th>Email status</th>
              <td>
                Buyer: {order.buyerEmailStatus}, Admin: {order.adminEmailStatus}
              </td>
            </tr>
            <tr>
              <th>Paid at</th>
              <td>{order.paidAt?.toLocaleString() || "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}
