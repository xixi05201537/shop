import { CheckCircle2, Mail, ReceiptText } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { formatCurrency, formatDateTimeWithOffset } from "@/lib/format";
import { normalizePaymentRequestStatus, paymentRequestNumber } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";
import "../../shop.css";
import { PaymentRequestClient } from "./PaymentRequestClient";
import { PaymentRequestGallery } from "./PaymentRequestGallery";

export const dynamic = "force-dynamic";

export default async function PublicPaymentRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [paymentRequest, config] = await Promise.all([
    prisma.paymentRequest.findUnique({
      where: { token },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    getPublicConfig(),
  ]);
  if (!paymentRequest) notFound();

  const status = normalizePaymentRequestStatus(paymentRequest.status);
  const confirmable = status === "pending";
  const payable = status === "confirmed" || status === "deferred" || status === "paying";
  const publicStatus = publicPaymentStatusLabel(status);

  return (
    <main className="shop-page selection-checkout-page payment-request-public-page">
      <section className="container selection-submission-public selection-checkout-public payment-request-public">
        <header className="selection-submission-public-head selection-checkout-head payment-request-public-head">
          <div>
            <span className="eyebrow">Payment request</span>
            <h1 className="display">{publicText(paymentRequest.title, "Confirm and pay")}</h1>
            <p>{publicText(paymentRequest.description, "Please review the details and total before paying with PayPal.")}</p>
          </div>
          <span className={`selection-public-status is-${status}`}>{publicStatus}</span>
        </header>

        <section className="selection-public-summary">
          <div>
            <span>Payment</span>
            <strong>{paymentRequestNumber(paymentRequest.token)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatCurrency(paymentRequest.totalAmount, paymentRequest.currency)}</strong>
          </div>
          <div>
            <span>{paymentRequest.paidAt ? "Paid at" : "Created at"}</span>
            <strong>{formatDateTimeWithOffset(paymentRequest.paidAt || paymentRequest.createdAt, config.displayTimeZone)}</strong>
          </div>
        </section>

        {confirmable ? (
          <div className="selection-status-note">
            Please review the price and images below. Confirm when everything looks correct, then the PayPal payment button will appear.
          </div>
        ) : payable ? (
          <div className="selection-status-note">
            Please confirm the price and images below. If everything looks correct, complete payment directly with PayPal.
          </div>
        ) : status === "paid" ? (
          <div className="selection-status-note is-paid">This payment has already been completed. Thank you.</div>
        ) : (
          <div className="selection-status-note is-locked">This payment request is waiting for confirmation from the shop.</div>
        )}

        <PaymentRequestGallery
          images={paymentRequest.images.map((image, index) => ({
            id: image.id,
            imageUrl: image.imageUrl,
            caption: image.caption,
            captionText: publicText(image.caption, ""),
            label: publicText(image.caption, `Payment image ${index + 1}`),
            price: formatCurrency(image.price, paymentRequest.currency),
            quantity: image.quantity,
            lineTotal: formatCurrency(image.price * image.quantity, paymentRequest.currency),
          }))}
        />

        <section className="selection-checkout-payment-card">
          <div className="total-card">
            <div>
              <span>Total</span>
              <small>{confirmable ? "Waiting for your confirmation" : payable ? "Ready for PayPal checkout" : publicStatus}</small>
            </div>
            <strong>
              <ReceiptText size={24} />
              {formatCurrency(paymentRequest.totalAmount, paymentRequest.currency)}
            </strong>
          </div>
          <PaymentRequestClient
            token={paymentRequest.token}
            paypalClientId={config.paypalClientId}
            currency={paymentRequest.currency}
            payable={payable}
            confirmable={confirmable}
          />
          {status === "paid" ? (
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

function publicPaymentStatusLabel(status: string | null | undefined) {
  const normalized = normalizePaymentRequestStatus(status);
  if (normalized === "confirmed") return "Ready to pay";
  if (normalized === "deferred") return "Pay later";
  if (normalized === "paying") return "Payment in progress";
  if (normalized === "paid") return "Paid";
  return "Pending confirmation";
}

function publicText(value: string | null | undefined, fallback: string) {
  const text = (value || "").trim();
  return text || fallback;
}
