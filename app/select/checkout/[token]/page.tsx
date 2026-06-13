import Link from "next/link";
import { CheckCircle2, Mail, ReceiptText } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { formatCurrency, formatDateTimeWithOffset } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { normalizeSelectionCheckoutStatus, selectionCheckoutNumber } from "@/lib/selection-checkout";
import { selectionSubmissionNumber } from "@/lib/selection";
import "../../../shop.css";
import { SelectionCheckoutClient } from "./SelectionCheckoutClient";

export const dynamic = "force-dynamic";

export default async function PublicSelectionCheckoutPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [checkout, config] = await Promise.all([
    prisma.selectionCheckout.findUnique({
      where: { token },
      include: {
        submissions: {
          include: {
            submission: {
              include: {
                page: { select: { title: true, slug: true } },
                items: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    }),
    getPublicConfig(),
  ]);
  if (!checkout) notFound();

  const payable = checkout.status === "pending";
  const hasDiscount = checkout.subtotalAmount > checkout.totalAmount;
  const publicStatus = publicCheckoutStatusLabel(checkout.status);

  return (
    <main className="shop-page selection-checkout-page">
      <section className="container selection-submission-public selection-checkout-public">
        <header className="selection-submission-public-head selection-checkout-head">
          <div>
            <span className="eyebrow">Selection checkout</span>
            <h1 className="display">Confirm and pay</h1>
            <p>Review your selected items and price before paying with PayPal.</p>
          </div>
          <span className={`selection-public-status is-${normalizeSelectionCheckoutStatus(checkout.status)}`}>{publicStatus}</span>
        </header>

        <section className="selection-public-summary">
          <div>
            <span>Checkout</span>
            <strong>{selectionCheckoutNumber(checkout.token)}</strong>
          </div>
          <div>
            <span>Total quantity</span>
            <strong>{checkout.totalQuantity}</strong>
          </div>
          <div>
            <span>{hasDiscount ? "Discount price" : "Total"}</span>
            <strong>
              {hasDiscount ? <small className="selection-checkout-original-price">{formatCurrency(checkout.subtotalAmount, checkout.currency)}</small> : null}
              {formatCurrency(checkout.totalAmount, checkout.currency)}
            </strong>
          </div>
          <div>
            <span>{checkout.paidAt ? "Paid at" : "Created at"}</span>
            <strong>{formatDateTimeWithOffset(checkout.paidAt || checkout.createdAt, config.displayTimeZone)}</strong>
          </div>
        </section>

        {payable ? (
          <div className="selection-status-note">
            Please confirm the items and prices below. If everything looks correct, complete payment directly with PayPal.
          </div>
        ) : (
          <div className="selection-status-note is-locked">
            This checkout is {checkout.status === "paid" ? "already paid" : "not available for payment"}.
          </div>
        )}

        <section className="selection-checkout-groups">
          {checkout.submissions.map(({ submission }, submissionIndex) => {
            const pageTitle = publicText(submission.page.title, `Selection ${submissionIndex + 1}`);

            return (
            <article className="selection-checkout-group" key={submission.id}>
              <div className="selection-checkout-group-head">
                <div>
                  <span>{pageTitle}</span>
                  <strong>{selectionSubmissionNumber(submission.id)}</strong>
                </div>
                <Link href={`/select/${submission.page.slug}/submission/${submission.id}`}>View original selection</Link>
              </div>
              <div className="selection-public-items">
                {submission.items.map((item, itemIndex) => {
                  const itemTitle = publicText(item.titleSnapshot, `Item ${itemIndex + 1}`);
                  const itemDescription = item.descriptionSnapshot ? publicText(item.descriptionSnapshot, "") : "";

                  return (
                    <article className="selection-public-item selection-checkout-item" key={item.id}>
                    <img src={item.imageSnapshot} alt={itemTitle} />
                    <div className="selection-public-item-copy">
                      <strong>{itemTitle}</strong>
                      {itemDescription ? <p>{itemDescription}</p> : null}
                      <div className="selection-public-item-tags">
                        <span>Qty {item.quantity}</span>
                        <span>{item.priceSnapshot === null ? "Price included" : `${formatCurrency(item.priceSnapshot, item.currencySnapshot)} each`}</span>
                        <span>{item.lineTotal === null ? "Subtotal included" : `Subtotal ${formatCurrency(item.lineTotal, item.currencySnapshot)}`}</span>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>
            </article>
            );
          })}
        </section>

        <section className="selection-checkout-payment-card">
          <div className="total-card">
            <div>
              <span>Total</span>
              <small>
                {hasDiscount
                  ? `Original ${formatCurrency(checkout.subtotalAmount, checkout.currency)}`
                  : payable
                    ? "Ready for PayPal checkout"
                    : publicStatus}
              </small>
            </div>
            <strong>
              <ReceiptText size={24} />
              {formatCurrency(checkout.totalAmount, checkout.currency)}
            </strong>
          </div>
          <SelectionCheckoutClient token={checkout.token} paypalClientId={config.paypalClientId} currency={checkout.currency} payable={payable} />
          {checkout.status === "paid" ? (
            <div className="selection-checkout-paid">
              <CheckCircle2 size={28} />
              <span>Payment complete. Thank you.</span>
            </div>
          ) : null}
          <a className="support-link" href={`mailto:${config.supportEmail}`}>
            <Mail size={17} /> {config.supportEmail}
          </a>
        </section>
      </section>
    </main>
  );
}

function publicCheckoutStatusLabel(status: string | null | undefined) {
  const normalized = normalizeSelectionCheckoutStatus(status);
  if (normalized === "paid") return "Paid";
  if (normalized === "cancelled") return "Cancelled";
  return "Pending payment";
}

function publicText(value: string | null | undefined, fallback: string) {
  const text = (value || "").trim();
  return text || fallback;
}
