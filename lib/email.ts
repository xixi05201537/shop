import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getConfigMap } from "@/lib/config";
import {
  defaultAdminEmailHtml,
  defaultAdminEmailSubject,
  defaultBuyerEmailHtml,
  defaultBuyerEmailSubject,
  defaultShipmentEmailHtml,
  defaultShipmentEmailSubject,
} from "@/lib/email-defaults";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { orderEmailRecipients } from "@/lib/paypal-order-details";
import type { Order } from "@prisma/client";

function renderTemplate(template: string, order: Order, timeZone?: string | null) {
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
    subject: renderTemplate(config.buyerEmailSubject || defaultBuyerEmailSubject, order, config.displayTimeZone),
    html: renderTemplate(config.buyerEmailHtml || defaultBuyerEmailHtml, order, config.displayTimeZone),
  });
  return "sent";
}

export async function sendAdminEmail(order: Order) {
  const { config, mailer } = await transporter();
  if (config.adminEmailEnabled !== "true") return "disabled";
  await sendHtmlMail(mailer, {
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: config.adminNotifyEmail,
    subject: renderTemplate(config.adminEmailSubject || defaultAdminEmailSubject, order, config.displayTimeZone),
    html: renderTemplate(config.adminEmailHtml || defaultAdminEmailHtml, order, config.displayTimeZone),
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
    subject: renderTemplate(config.shipmentEmailSubject || defaultShipmentEmailSubject, order, config.displayTimeZone),
    html: renderTemplate(config.shipmentEmailHtml || defaultShipmentEmailHtml, order, config.displayTimeZone),
  });
  return "sent";
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

export async function sendTestEmail(target: string, to: string) {
  const { config, mailer } = await transporter();
  const order = testOrder();
  const from = `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`;

  if (target === "seller") {
    const subject = `[Test] ${renderTemplate(config.adminEmailSubject || defaultAdminEmailSubject, order, config.displayTimeZone)}`;
    const html = renderTemplate(config.adminEmailHtml || defaultAdminEmailHtml, order, config.displayTimeZone);
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  if (target === "shipment") {
    const subject = `[Test] ${renderTemplate(config.shipmentEmailSubject || defaultShipmentEmailSubject, order, config.displayTimeZone)}`;
    const html = renderTemplate(config.shipmentEmailHtml || defaultShipmentEmailHtml, order, config.displayTimeZone);
    const info = await sendHtmlMail(mailer, {
      from,
      to,
      subject,
      html,
    });
    return info;
  }

  const subject = `[Test] ${renderTemplate(config.buyerEmailSubject || defaultBuyerEmailSubject, order, config.displayTimeZone)}`;
  const html = renderTemplate(config.buyerEmailHtml || defaultBuyerEmailHtml, order, config.displayTimeZone);
  const info = await sendHtmlMail(mailer, {
    from,
    to,
    subject,
    html,
  });
  return info;
}
