import nodemailer from "nodemailer";
import { getConfigMap } from "@/lib/config";
import {
  defaultAdminEmailHtml,
  defaultAdminEmailSubject,
  defaultBuyerEmailHtml,
  defaultBuyerEmailSubject,
  defaultShipmentEmailHtml,
  defaultShipmentEmailSubject,
} from "@/lib/email-defaults";
import { orderEmailRecipients } from "@/lib/paypal-order-details";
import type { Order } from "@prisma/client";

function renderTemplate(template: string, order: Order) {
  const values: Record<string, string> = {
    orderId: order.orderNumber,
    email: order.buyerEmail || order.paypalBuyerEmail || "",
    nickname: order.buyerNickname || order.paypalBuyerNickname || "friend",
    productName: order.productNameSnapshot,
    amount: order.unitAmount.toFixed(2),
    quantity: String(order.quantity),
    totalAmount: order.totalAmount.toFixed(2),
    currency: order.currency,
    paidAt: order.paidAt?.toISOString() || "",
    trackingNumber: order.trackingNumber || "",
  };

  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
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
    }),
  };
}

export async function sendBuyerEmail(order: Order) {
  const { config, mailer } = await transporter();
  const recipients = orderEmailRecipients(order);
  if (!recipients.to) return "skipped";
  if (config.buyerEmailEnabled !== "true") return "disabled";
  await mailer.sendMail({
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: recipients.to,
    cc: recipients.cc,
    subject: renderTemplate(config.buyerEmailSubject || defaultBuyerEmailSubject, order),
    html: renderTemplate(config.buyerEmailHtml || defaultBuyerEmailHtml, order),
  });
  return "sent";
}

export async function sendAdminEmail(order: Order) {
  const { config, mailer } = await transporter();
  if (config.adminEmailEnabled !== "true") return "disabled";
  await mailer.sendMail({
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: config.adminNotifyEmail,
    subject: renderTemplate(config.adminEmailSubject || defaultAdminEmailSubject, order),
    html: renderTemplate(config.adminEmailHtml || defaultAdminEmailHtml, order),
  });
  return "sent";
}

export async function sendShipmentEmail(order: Order) {
  const { config, mailer } = await transporter();
  const recipients = orderEmailRecipients(order);
  if (!recipients.to) return "skipped";
  if (config.shipmentEmailEnabled === "false") return "disabled";
  await mailer.sendMail({
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: recipients.to,
    cc: recipients.cc,
    subject: renderTemplate(config.shipmentEmailSubject || defaultShipmentEmailSubject, order),
    html: renderTemplate(config.shipmentEmailHtml || defaultShipmentEmailHtml, order),
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
    await mailer.sendMail({
      from,
      to,
      subject: `[Test] ${renderTemplate(config.adminEmailSubject || defaultAdminEmailSubject, order)}`,
      html: renderTemplate(config.adminEmailHtml || defaultAdminEmailHtml, order),
    });
    return "sent";
  }

  if (target === "shipment") {
    await mailer.sendMail({
      from,
      to,
      subject: `[Test] ${renderTemplate(config.shipmentEmailSubject || defaultShipmentEmailSubject, order)}`,
      html: renderTemplate(config.shipmentEmailHtml || defaultShipmentEmailHtml, order),
    });
    return "sent";
  }

  await mailer.sendMail({
    from,
    to,
    subject: `[Test] ${renderTemplate(config.buyerEmailSubject || defaultBuyerEmailSubject, order)}`,
    html: renderTemplate(config.buyerEmailHtml || defaultBuyerEmailHtml, order),
  });
  return "sent";
}
