import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getConfigMap } from "@/lib/config";
import {
  defaultAdminEmailHtml,
  defaultAdminEmailSubject,
  defaultBuyerEmailHtml,
  defaultBuyerEmailSubject,
  defaultPaymentRequestEmailHtml,
  defaultPaymentRequestPaidEmailHtml,
  defaultPaymentRequestPaidEmailSubject,
  defaultPaymentRequestEmailSubject,
  defaultSelectionEmailHtml,
  defaultSelectionEmailSubject,
  defaultSelectionCheckoutEmailHtml,
  defaultSelectionCheckoutEmailSubject,
  defaultShipmentEmailHtml,
  defaultShipmentEmailSubject,
} from "@/lib/email-defaults";
import { DEFAULT_DISPLAY_TIME_ZONE, formatCurrency, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { orderEmailRecipients } from "@/lib/paypal-order-details";
import { paymentRequestNumber } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";
import { selectionSubmissionNumber } from "@/lib/selection";
import { selectionCheckoutNumber } from "@/lib/selection-checkout";
import type {
  Order,
  PaymentRequest,
  PaymentRequestImage,
  PaymentRequestStatus,
  SelectionCheckout,
  SelectionPage,
  SelectionSubmission,
  SelectionSubmissionItem,
} from "@prisma/client";

type SelectionSubmissionForEmail = SelectionSubmission & {
  page: Pick<SelectionPage, "title" | "slug">;
  items: SelectionSubmissionItem[];
};

type SelectionCheckoutForEmail = SelectionCheckout & {
  submissions: Array<{
    submission: SelectionSubmission & {
      page: Pick<SelectionPage, "title" | "slug">;
      items: SelectionSubmissionItem[];
    };
  }>;
};

type PaymentRequestForEmail = PaymentRequest & {
  images: PaymentRequestImage[];
};

function renderTemplate(template: string, order: Order, supportEmail: string, timeZone?: string | null) {
  const displayTimeZone = normalizeDisplayTimeZone(timeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const values: Record<string, string> = {
    orderId: order.orderNumber,
    email: order.buyerEmail || order.paypalBuyerEmail || "",
    nickname: order.buyerNickname || order.paypalBuyerNickname || "friend",
    productName: order.productNameSnapshot,
    amount: order.unitAmount.toFixed(2),
    quantity: String(order.quantity),
    totalAmount: order.totalAmount.toFixed(2),
    currency: order.currency,
    paidAt: formatDateTimeWithOffset(order.paidAt, displayTimeZone),
    trackingNumber: order.trackingNumber || "",
    supportEmail,
  };

  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function renderTextFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(h1|h2|h3|p|div|tr|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSelectionItems(submission: SelectionSubmissionForEmail) {
  return submission.items
    .map((item) => {
      const label = item.titleSnapshot.trim() || "Untitled item";
      const price = item.lineTotal === null ? "" : ` · ${formatCurrency(item.lineTotal, item.currencySnapshot)}`;
      return `<div style="margin:0 0 8px;"><strong>${escapeHtml(label)}</strong> × ${item.quantity}${escapeHtml(price)}</div>`;
    })
    .join("");
}

function renderSelectionCheckoutItems(checkout: SelectionCheckoutForEmail) {
  return checkout.submissions
    .map(({ submission }) => {
      const title = `<div style="margin:12px 0 6px;color:#98244f;font-weight:900;">${escapeHtml(submission.page.title)} · ${escapeHtml(selectionSubmissionNumber(submission.id))}</div>`;
      const items = submission.items
        .map((item) => {
          const label = item.titleSnapshot.trim() || "Untitled item";
          const price = item.lineTotal === null ? " · Price pending" : ` · ${formatCurrency(item.lineTotal, item.currencySnapshot)}`;
          return `<div style="margin:0 0 8px;"><strong>${escapeHtml(label)}</strong> × ${item.quantity}${escapeHtml(price)}</div>`;
        })
        .join("");
      return `${title}${items}`;
    })
    .join("");
}

function renderPaymentRequestImages(paymentRequest: PaymentRequestForEmail, baseUrl: string) {
  if (!paymentRequest.images.length) return "No images attached";
  return paymentRequest.images
    .map((image) => {
      const imageUrl = new URL(image.imageUrl, baseUrl).toString();
      const caption = image.caption?.trim() || paymentRequest.title;
      const price = formatCurrency(image.price, paymentRequest.currency);
      const lineTotal = formatCurrency(image.price * image.quantity, paymentRequest.currency);
      return [
        '<div style="margin:0 0 12px;">',
        `<a href="${escapeHtml(imageUrl)}" style="display:block;color:#cf2f6c;text-decoration:none;font-weight:900;">`,
        `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(caption)}" style="display:block;width:100%;max-width:520px;border:1px solid #f3d5df;border-radius:16px;background-color:#ffffff;" />`,
        "</a>",
        `<div style="margin:6px 0 0;color:#776471;font-size:13px;font-weight:800;">${escapeHtml(caption)} · ${escapeHtml(price)} × ${image.quantity} · <span style="color:#98244f;font-weight:900;">${escapeHtml(lineTotal)}</span></div>`,
        "</div>",
      ].join("");
    })
    .join("");
}

function renderSelectionTemplate(
  template: string,
  submission: SelectionSubmissionForEmail,
  selectionLink: string,
  supportEmail: string,
  timeZone?: string | null,
  escapeValues = true,
) {
  const displayTimeZone = normalizeDisplayTimeZone(timeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const firstCurrency = submission.items.find((item) => item.currencySnapshot)?.currencySnapshot || "USD";
  const totalAmount = submission.totalAmount === null ? "Not priced" : formatCurrency(submission.totalAmount, firstCurrency);
  const values: Record<string, string> = {
    selectionReference: selectionSubmissionNumber(submission.id),
    selectionLink,
    selectionPageTitle: submission.page.title,
    customerName: submission.customerName || "friend",
    customerEmail: submission.customerEmail || "",
    customerContact: supportEmail,
    supportEmail,
    totalQuantity: String(submission.totalQuantity),
    totalAmount,
    currency: firstCurrency,
    items: renderSelectionItems(submission),
    note: submission.note || "",
    submittedAt: formatDateTimeWithOffset(submission.createdAt, displayTimeZone),
  };

  return Object.entries(values).reduce((content, [key, value]) => {
    const rendered = key === "items" || !escapeValues ? value : escapeHtml(value);
    return content.replaceAll(`{{${key}}}`, rendered);
  }, template);
}

function renderSelectionCheckoutTemplate(
  template: string,
  checkout: SelectionCheckoutForEmail,
  checkoutLink: string,
  supportEmail: string,
  timeZone?: string | null,
  escapeValues = true,
) {
  const displayTimeZone = normalizeDisplayTimeZone(timeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const hasDiscount = checkout.subtotalAmount > checkout.totalAmount;
  const firstSubmission = checkout.submissions[0]?.submission;
  const values: Record<string, string> = {
    checkoutReference: selectionCheckoutNumber(checkout.token),
    checkoutLink,
    customerName: checkout.customerName || firstSubmission?.customerName || "friend",
    customerEmail: checkout.customerEmail || firstSubmission?.customerEmail || "",
    customerContact: checkout.customerContact || firstSubmission?.customerContact || "",
    supportEmail,
    totalQuantity: String(checkout.totalQuantity),
    subtotalAmount: formatCurrency(checkout.subtotalAmount, checkout.currency),
    totalAmount: formatCurrency(checkout.totalAmount, checkout.currency),
    priceLabel: hasDiscount ? "Discount price" : "Total",
    currency: checkout.currency,
    items: renderSelectionCheckoutItems(checkout),
    createdAt: formatDateTimeWithOffset(checkout.createdAt, displayTimeZone),
  };

  return Object.entries(values).reduce((content, [key, value]) => {
    const rendered = key === "items" || !escapeValues ? value : escapeHtml(value);
    return content.replaceAll(`{{${key}}}`, rendered);
  }, template);
}

function renderPaymentRequestTemplate(
  template: string,
  paymentRequest: PaymentRequestForEmail,
  paymentLink: string,
  baseUrl: string,
  supportEmail: string,
  timeZone?: string | null,
  escapeValues = true,
) {
  const displayTimeZone = normalizeDisplayTimeZone(timeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const values: Record<string, string> = {
    paymentReference: paymentRequestNumber(paymentRequest.token),
    paymentLink,
    title: paymentRequest.title,
    description: paymentRequest.description || "",
    supportEmail,
    totalAmount: formatCurrency(paymentRequest.totalAmount, paymentRequest.currency),
    currency: paymentRequest.currency,
    images: renderPaymentRequestImages(paymentRequest, baseUrl),
    createdAt: formatDateTimeWithOffset(paymentRequest.createdAt, displayTimeZone),
    paidAt: formatDateTimeWithOffset(paymentRequest.paidAt, displayTimeZone),
    paypalCaptureId: paymentRequest.paypalCaptureId || "",
  };

  return Object.entries(values).reduce((content, [key, value]) => {
    const rendered = key === "images" || !escapeValues ? value : escapeHtml(value);
    return content.replaceAll(`{{${key}}}`, rendered);
  }, template);
}

function recipientText(value: string | nodemailer.SendMailOptions["to"]) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function addressText(value: string | { address?: string }) {
  return (typeof value === "string" ? value : value.address || "").trim().toLowerCase();
}

function assertAccepted(info: SMTPTransport.SentMessageInfo, to: string | nodemailer.SendMailOptions["to"]) {
  const expected = recipientText(to);
  const accepted = info.accepted.map(addressText).filter(Boolean);
  const rejected = info.rejected.map(addressText).filter(Boolean);
  const missing = expected.filter((address) => !accepted.includes(address));

  if (missing.length) {
    throw new Error(
      `SMTP did not accept recipient: ${missing.join(", ")}${
        rejected.length ? `. Rejected: ${rejected.join(", ")}` : ""
      }`,
    );
  }

  console.info("Email accepted by SMTP", {
    to: expected,
    messageId: info.messageId,
    response: info.response,
  });
}

async function sendHtmlMail(
  mailer: nodemailer.Transporter<SMTPTransport.SentMessageInfo>,
  options: nodemailer.SendMailOptions & { html: string; to: string | nodemailer.SendMailOptions["to"] },
) {
  const info = await mailer.sendMail({
    ...options,
    text: options.text || renderTextFromHtml(options.html),
  });
  assertAccepted(info, options.to);
  return info;
}

async function transporter() {
  const config = await getConfigMap();
  if (!config.smtpHost || !config.smtpFromEmail) {
    throw new Error("SMTP is not configured.");
  }

  return {
    config,
    mailer: nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort || 587),
      secure: Number(config.smtpPort) === 465,
      auth: config.smtpUser
        ? {
            user: config.smtpUser,
            pass: config.smtpPassword,
          }
        : undefined,
    }) as nodemailer.Transporter<SMTPTransport.SentMessageInfo>,
  };
}

export async function sendBuyerEmail(order: Order) {
  const { config, mailer } = await transporter();
  const recipients = orderEmailRecipients(order);
  if (!recipients.to) return "skipped";
  if (config.buyerEmailEnabled !== "true") return "disabled";
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: recipients.to,
    cc: recipients.cc,
    subject: renderTemplate(config.buyerEmailSubject || defaultBuyerEmailSubject, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone),
    html: renderTemplate(config.buyerEmailHtml || defaultBuyerEmailHtml, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone),
  });
  return "sent";
}

export async function sendAdminEmail(order: Order) {
  const { config, mailer } = await transporter();
  if (config.adminEmailEnabled !== "true") return "disabled";
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: config.adminNotifyEmail,
    subject: renderTemplate(config.adminEmailSubject || defaultAdminEmailSubject, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone),
    html: renderTemplate(config.adminEmailHtml || defaultAdminEmailHtml, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone),
  });
  return "sent";
}

export async function sendShipmentEmail(order: Order) {
  const { config, mailer } = await transporter();
  const recipients = orderEmailRecipients(order);
  if (!recipients.to) return "skipped";
  if (config.shipmentEmailEnabled === "false") return "disabled";
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: recipients.to,
    cc: recipients.cc,
    subject: renderTemplate(config.shipmentEmailSubject || defaultShipmentEmailSubject, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone),
    html: renderTemplate(config.shipmentEmailHtml || defaultShipmentEmailHtml, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone),
  });
  return "sent";
}

export async function sendSelectionEmail(submission: SelectionSubmissionForEmail, baseUrl: string) {
  const { config, mailer } = await transporter();
  if (!submission.customerEmail) return "skipped";
  if (config.selectionEmailEnabled === "false") return "disabled";
  const selectionLink = new URL(`/select/${submission.page.slug}/submission/${submission.id}`, baseUrl).toString();
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: submission.customerEmail,
    subject: renderSelectionTemplate(
      config.selectionEmailSubject || defaultSelectionEmailSubject,
      submission,
      selectionLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    ),
    html: renderSelectionTemplate(
      config.selectionEmailHtml || defaultSelectionEmailHtml,
      submission,
      selectionLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    ),
  });
  return "sent";
}

export async function sendSelectionCheckoutEmail(checkout: SelectionCheckoutForEmail, baseUrl: string, recipients?: string) {
  const { config, mailer } = await transporter();
  const to = recipients || checkout.emailRecipient || checkout.customerEmail || "";
  if (!to.trim()) return "skipped";
  if (config.selectionCheckoutEmailEnabled === "false") return "disabled";
  const checkoutLink = new URL(`/select/checkout/${checkout.token}`, baseUrl).toString();
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to,
    subject: renderSelectionCheckoutTemplate(
      config.selectionCheckoutEmailSubject || defaultSelectionCheckoutEmailSubject,
      checkout,
      checkoutLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    ),
    html: renderSelectionCheckoutTemplate(
      config.selectionCheckoutEmailHtml || defaultSelectionCheckoutEmailHtml,
      checkout,
      checkoutLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    ),
  });
  return "sent";
}

export async function sendPaymentRequestEmail(paymentRequest: PaymentRequestForEmail, baseUrl: string, recipients?: string) {
  const { config, mailer } = await transporter();
  const to = recipients || paymentRequest.emailRecipient || "";
  if (!to.trim()) return "skipped";
  if (config.paymentRequestEmailEnabled === "false") return "disabled";
  const paymentLink = new URL(`/pay/${paymentRequest.token}`, baseUrl).toString();
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to,
    subject: renderPaymentRequestTemplate(
      config.paymentRequestEmailSubject || defaultPaymentRequestEmailSubject,
      paymentRequest,
      paymentLink,
      baseUrl,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    ),
    html: renderPaymentRequestTemplate(
      config.paymentRequestEmailHtml || defaultPaymentRequestEmailHtml,
      paymentRequest,
      paymentLink,
      baseUrl,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    ),
  });
  return "sent";
}

export async function sendPaymentRequestPaidEmail(paymentRequest: PaymentRequestForEmail, baseUrl: string) {
  const { config, mailer } = await transporter();
  const to = paymentRequest.emailRecipient || "";
  if (!to.trim()) return "skipped";
  if (config.paymentRequestPaidEmailEnabled === "false") return "disabled";
  const paymentLink = new URL(`/pay/${paymentRequest.token}`, baseUrl).toString();
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to,
    subject: renderPaymentRequestTemplate(
      config.paymentRequestPaidEmailSubject || defaultPaymentRequestPaidEmailSubject,
      paymentRequest,
      paymentLink,
      baseUrl,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    ),
    html: renderPaymentRequestTemplate(
      config.paymentRequestPaidEmailHtml || defaultPaymentRequestPaidEmailHtml,
      paymentRequest,
      paymentLink,
      baseUrl,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    ),
  });
  return "sent";
}

export async function sendPaymentRequestPaidEmailForId(paymentRequestId: string, baseUrl: string) {
  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!paymentRequest || paymentRequest.paidEmailStatus === "sent") return paymentRequest?.paidEmailStatus || "skipped";

  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: { paidEmailStatus: "sending", paidEmailError: null },
  });

  try {
    const paidEmailStatus = await sendPaymentRequestPaidEmail(paymentRequest, baseUrl);
    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        paidEmailStatus,
        paidEmailError: null,
        paidEmailedAt: paidEmailStatus === "sent" ? new Date() : null,
      },
    });
    return paidEmailStatus;
  } catch (error) {
    const paidEmailError = error instanceof Error ? error.message.slice(0, 2000) : "Unable to send payment confirmation email.";
    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        paidEmailStatus: "failed",
        paidEmailError,
      },
    });
    return "failed";
  }
}

function testOrder(): Order {
  const now = new Date();
  return {
    id: "test-order",
    orderNumber: "PP-TEST-000001",
    paypalOrderId: "PAYPAL-TEST-ORDER",
    paypalCaptureId: "PAYPAL-TEST-CAPTURE",
    productNameSnapshot: "Misaki Live Stream Deposit",
    productImageSnapshot: null,
    buyerEmail: "buyer@example.com",
    buyerNickname: "Misaki",
    paypalBuyerEmail: "paypal-buyer@example.com",
    paypalBuyerNickname: "PayPal Buyer",
    paypalPayerId: "PAYER-TEST",
    paypalShippingName: "Misaki",
    paypalShippingAddress: "Tokyo, Japan",
    unitAmount: 1,
    quantity: 2,
    totalAmount: 2,
    currency: "USD",
    status: "paid",
    paypalRawSummary: null,
    buyerEmailStatus: "pending",
    buyerEmailError: null,
    adminEmailStatus: "pending",
    adminEmailError: null,
    trackingNumber: "TRACK-TEST-123",
    shippedAt: now,
    shipmentEmailStatus: "pending",
    shipmentEmailError: null,
    internalNote: null,
    createdAt: now,
    updatedAt: now,
    paidAt: now,
  };
}

function testSelectionSubmission(): SelectionSubmissionForEmail {
  const now = new Date();
  return {
    id: "test-selection",
    pageId: "test-selection-page",
    page: {
      title: "Summer Picks",
      slug: "summer-picks",
    },
    customerName: "Misaki",
    customerEmail: "buyer@example.com",
    customerContact: "@misaki",
    note: "Please keep the card if available.",
    status: "pending",
    totalQuantity: 3,
    totalAmount: 18,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: "test-selection-item-1",
        submissionId: "test-selection",
        itemId: "test-item-1",
        titleSnapshot: "Sticker",
        imageSnapshot: "/uploads/sticker.jpg",
        descriptionSnapshot: "Glossy sticker",
        priceSnapshot: 4,
        currencySnapshot: "USD",
        quantity: 2,
        lineTotal: 8,
      },
      {
        id: "test-selection-item-2",
        submissionId: "test-selection",
        itemId: "test-item-2",
        titleSnapshot: "Card",
        imageSnapshot: "/uploads/card.jpg",
        descriptionSnapshot: null,
        priceSnapshot: 10,
        currencySnapshot: "USD",
        quantity: 1,
        lineTotal: 10,
      },
    ],
  };
}

function testSelectionCheckout(): SelectionCheckoutForEmail {
  const submission = testSelectionSubmission();
  const now = new Date();
  return {
    id: "test-checkout",
    token: "testcheckouttoken",
    status: "pending",
    customerName: submission.customerName,
    customerEmail: submission.customerEmail,
    customerContact: submission.customerContact,
    totalQuantity: submission.totalQuantity,
    subtotalAmount: 18,
    totalAmount: 15,
    currency: "USD",
    emailRecipient: submission.customerEmail,
    emailStatus: "pending",
    emailError: null,
    emailedAt: null,
    paypalOrderId: null,
    paypalCaptureId: null,
    paypalRawSummary: null,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
    submissions: [{ submission }],
  };
}

function testPaymentRequest(): PaymentRequestForEmail {
  const now = new Date();
  return {
    id: "test-payment-request",
    token: "testpaymenttoken",
    title: "Reserved goods payment",
    description: "A tiny set of reserved products prepared for your confirmation.",
    totalAmount: 28,
    currency: "USD",
    status: "confirmed",
    adminNote: "Please check the images before paying.",
    emailRecipient: "buyer@example.com",
    emailStatus: "pending",
    emailError: null,
    emailedAt: null,
    paidEmailStatus: "pending",
    paidEmailError: null,
    paidEmailedAt: null,
    paypalOrderId: null,
    paypalCaptureId: null,
    paypalRawSummary: null,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
    images: [
      {
        id: "test-payment-image-1",
        paymentRequestId: "test-payment-request",
        imageUrl: "/sample-product.svg",
        caption: "Reserved item",
        price: 28,
        quantity: 1,
        sortOrder: 0,
      },
    ],
  };
}

export async function sendTestEmail(target: string, to: string) {
  const { config, mailer } = await transporter();
  const order = testOrder();
  const from = `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`;

  if (target === "seller") {
    const subject = `[Test] ${renderTemplate(config.adminEmailSubject || defaultAdminEmailSubject, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone)}`;
    const html = renderTemplate(config.adminEmailHtml || defaultAdminEmailHtml, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone);
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  if (target === "shipment") {
    const subject = `[Test] ${renderTemplate(config.shipmentEmailSubject || defaultShipmentEmailSubject, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone)}`;
    const html = renderTemplate(config.shipmentEmailHtml || defaultShipmentEmailHtml, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone);
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  if (target === "selection") {
    const submission = testSelectionSubmission();
    const selectionLink = "https://example.com/select/summer-picks/submission/test-selection";
    const subject = `[Test] ${renderSelectionTemplate(
      config.selectionEmailSubject || defaultSelectionEmailSubject,
      submission,
      selectionLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    )}`;
    const html = renderSelectionTemplate(
      config.selectionEmailHtml || defaultSelectionEmailHtml,
      submission,
      selectionLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    );
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  if (target === "selection-checkout") {
    const checkout = testSelectionCheckout();
    const checkoutLink = "https://example.com/select/checkout/testcheckouttoken";
    const subject = `[Test] ${renderSelectionCheckoutTemplate(
      config.selectionCheckoutEmailSubject || defaultSelectionCheckoutEmailSubject,
      checkout,
      checkoutLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    )}`;
    const html = renderSelectionCheckoutTemplate(
      config.selectionCheckoutEmailHtml || defaultSelectionCheckoutEmailHtml,
      checkout,
      checkoutLink,
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    );
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  if (target === "payment-request") {
    const paymentRequest = testPaymentRequest();
    const paymentLink = "https://example.com/pay/testpaymenttoken";
    const subject = `[Test] ${renderPaymentRequestTemplate(
      config.paymentRequestEmailSubject || defaultPaymentRequestEmailSubject,
      paymentRequest,
      paymentLink,
      "https://example.com",
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    )}`;
    const html = renderPaymentRequestTemplate(
      config.paymentRequestEmailHtml || defaultPaymentRequestEmailHtml,
      paymentRequest,
      paymentLink,
      "https://example.com",
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    );
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  if (target === "payment-request-paid") {
    const paymentRequest = {
      ...testPaymentRequest(),
      status: "paid" as PaymentRequestStatus,
      paidAt: new Date(),
      paypalCaptureId: "PAYPAL-TEST-CAPTURE",
    };
    const paymentLink = "https://example.com/pay/testpaymenttoken";
    const subject = `[Test] ${renderPaymentRequestTemplate(
      config.paymentRequestPaidEmailSubject || defaultPaymentRequestPaidEmailSubject,
      paymentRequest,
      paymentLink,
      "https://example.com",
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
      false,
    )}`;
    const html = renderPaymentRequestTemplate(
      config.paymentRequestPaidEmailHtml || defaultPaymentRequestPaidEmailHtml,
      paymentRequest,
      paymentLink,
      "https://example.com",
      config.supportEmail || config.smtpFromEmail,
      config.displayTimeZone,
    );
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  const subject = `[Test] ${renderTemplate(config.buyerEmailSubject || defaultBuyerEmailSubject, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone)}`;
  const html = renderTemplate(config.buyerEmailHtml || defaultBuyerEmailHtml, order, config.supportEmail || config.smtpFromEmail, config.displayTimeZone);
  const info = await sendHtmlMail(mailer, {
    from,
    to,
    subject,
    html,
  });
  return info;
}

export async function checkSmtpHealth() {
  const { config, mailer } = await transporter();
  await mailer.verify();
  return {
    ok: true,
    host: config.smtpHost,
    from: config.smtpFromEmail,
  };
}
