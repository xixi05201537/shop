import nodemailer from "nodemailer";
import { getConfigMap } from "@/lib/config";
import type { Order } from "@prisma/client";

function renderTemplate(template: string, order: Order) {
  const values: Record<string, string> = {
    orderId: order.orderNumber,
    email: order.buyerEmail,
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
