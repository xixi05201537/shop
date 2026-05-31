import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { formatUsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import "../../shop.css";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const config = await getPublicConfig();
  if (!order) notFound();

  return (
    <main className="shop-page">
      <section className="container success-card">
        <CheckCircle2 size={54} />
        <h1 className="display">Payment complete</h1>
        <p>Thank you for your purchase. A receipt email will be sent if email delivery is configured.</p>
        <dl>
          <div>
            <dt>Order</dt>
            <dd>{order.orderNumber}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{order.buyerEmail}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatUsd(order.totalAmount)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{order.status}</dd>
          </div>
        </dl>
        <div className="success-actions">
          <Link className="primary-button" href="/">
            Return to shop
          </Link>
          <a className="support-link" href={`mailto:${config.supportEmail}`}>
            <Mail size={17} /> Contact support
          </a>
        </div>
      </section>
    </main>
  );
}
