import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultBuyerEmailSubject = "Thank you for your purchase";
const defaultBuyerEmailHtml =
  "<h2>Thank you, {{nickname}}</h2><p>Your order <strong>{{orderId}}</strong> for <strong>{{productName}}</strong> is complete.</p><p>Total: {{currency}} {{totalAmount}}</p><p>If you have any questions, please contact us.</p>";
const defaultAdminEmailSubject = "New order: {{orderId}}";
const defaultAdminEmailHtml =
  "<h2>New order received</h2><p>{{email}} bought <strong>{{productName}}</strong> x {{quantity}}.</p><p>Total: {{currency}} {{totalAmount}}</p><p>Buyer nickname: {{nickname}}</p>";
const defaultShipmentEmailSubject = "Your Misaki shop order has shipped: {{orderId}}";
const defaultShipmentEmailHtml =
  "<h2>Your order has shipped</h2><p>Hi {{nickname}},</p><p>Your order <strong>{{orderId}}</strong> for <strong>{{productName}}</strong> has been shipped.</p><p>Tracking number: <strong>{{trackingNumber}}</strong></p><p>Thank you for supporting Misaki shop.</p>";

const defaultConfigs = {
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  smtpFromEmail: "",
  smtpFromName: "Misaki Shop",
  supportEmail: "diy@misaki.im",
  adminNotifyEmail: "diy@misaki.im",
  uploadDir: "./public/uploads",
  buyerEmailEnabled: "true",
  adminEmailEnabled: "true",
  buyerEmailSubject: defaultBuyerEmailSubject,
  buyerEmailHtml: defaultBuyerEmailHtml,
  adminEmailSubject: defaultAdminEmailSubject,
  adminEmailHtml: defaultAdminEmailHtml,
  shipmentEmailEnabled: "true",
  shipmentEmailSubject: defaultShipmentEmailSubject,
  shipmentEmailHtml: defaultShipmentEmailHtml,
  floatingEnabled: "true",
  floatingUrl: "/article/about",
  floatingOpenMode: "current",
  floatingSize: "medium",
  floatingPosition: "right-bottom",
  floatingLabel: "i",
  floatingImageUrl: "",
};

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  await prisma.product.upsert({
    where: { id: "single-product" },
    update: {},
    create: {
      id: "single-product",
      name: "Live Stream Depoist",
      imageUrl: "/sample-product.svg",
      imageSource: "url",
      shortDescription:
        "Reserve your live stream spot with a sweet little deposit.",
      longDescriptionMarkdown:
        "## What you get\n\nA simple deposit to reserve Misaki's live stream session and confirm your booking through PayPal.\n\n- Reserve your live stream spot\n- Pay securely with PayPal or card\n- Use this payment as your session deposit\n- We will confirm the stream details after payment",
      enabledAmounts: JSON.stringify([0.1, 1, 10, 30, 50]),
      defaultAmount: 1,
      defaultQuantity: 1,
      maxQuantity: 99,
    },
  });

  await prisma.article.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      title: "About this tiny shop",
      content:
        "# About this tiny shop\n\nThis page is managed from the admin panel and rendered from Markdown.\n\nUse the floating button to guide visitors to notes, terms, or a help article.",
      published: true,
    },
  });

  for (const [key, value] of Object.entries(defaultConfigs)) {
    await prisma.siteConfig.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value,
        secret: key.toLowerCase().includes("secret") || key.toLowerCase().includes("password"),
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
