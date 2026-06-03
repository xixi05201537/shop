import nodemailer from "nodemailer";
import { getConfigMap } from "@/lib/config";
import type { Order } from "@prisma/client";

function renderTemplate(template: string, order: Order) {
  const values: Record<string, string> = {
    orderId: order.orderNumber,
    email: order.buyerEmail || "",
    nickname: order.buyerNickname || "friend",
    productName: order.productNameSnapshot,
    amount: order.unitAmount.toFixed(2),
    quantity: String(order.quantity),
    totalAmount: order.totalAmount.toFixed(2),
    currency: order.currency,
    paidAt: order.paidAt?.toISOString() || "",
  };

  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function shipmentEmailHtml(order: Order) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #3b2431;">
      <p>Hi ${order.buyerNickname || "friend"},</p>
      <p>Your order <strong>${order.orderNumber}</strong> for <strong>${order.productNameSnapshot}</strong> has been shipped.</p>
      <p>Tracking number: <strong>${order.trackingNumber || ""}</strong></p>
      <p>Thank you for supporting Misaki shop.</p>
    </div>
  `;
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
  if (!order.buyerEmail) return "skipped";
  if (config.buyerEmailEnabled !== "true") return "disabled";
  await mailer.sendMail({
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: order.buyerEmail,
    subject: renderTemplate(config.buyerEmailSubject || "Thank you", order),
    html: renderTemplate(config.buyerEmailHtml || "<p>Thank you for your purchase.</p>", order),
  });
  return "sent";
}

export async function sendAdminEmail(order: Order) {
  const { config, mailer } = await transporter();
  if (config.adminEmailEnabled !== "true") return "disabled";
  await mailer.sendMail({
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: config.adminNotifyEmail,
    subject: renderTemplate(config.adminEmailSubject || "New order", order),
    html: renderTemplate(config.adminEmailHtml || "<p>New order received.</p>", order),
  });
  return "sent";
}

export async function sendShipmentEmail(order: Order) {
  const { config, mailer } = await transporter();
  if (!order.buyerEmail) return "skipped";
  await mailer.sendMail({
    from: `"${config.smtpFromName || "Pink Pay Shop"}" <${config.smtpFromEmail}>`,
    to: order.buyerEmail,
    subject: `Your Misaki shop order has shipped: ${order.orderNumber}`,
    html: shipmentEmailHtml(order),
  });
  return "sent";
}
