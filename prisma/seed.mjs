import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultConfigs = {
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  smtpFromEmail: "",
  smtpFromName: "Pink Pay Shop",
  supportEmail: "support@example.com",
  adminNotifyEmail: "owner@example.com",
  uploadDir: "./public/uploads",
  buyerEmailEnabled: "true",
  adminEmailEnabled: "true",
  buyerEmailSubject: "Thank you for your purchase",
  buyerEmailHtml:
    "<h2>Thank you, {{nickname}}</h2><p>Your order <strong>{{orderId}}</strong> for {{productName}} is complete.</p><p>Total: {{currency}} {{totalAmount}}</p>",
  adminEmailSubject: "New order: {{orderId}}",
  adminEmailHtml:
    "<h2>New order received</h2><p>{{email}} bought {{productName}} x {{quantity}} for {{currency}} {{totalAmount}}.</p>",
  floatingEnabled: "true",
  floatingUrl: "/article/about",
  floatingOpenMode: "current",
  floatingSize: "medium",
  floatingPosition: "right-bottom",
  floatingLabel: "i",
};

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.siteConfig.deleteMany({
    where: {
      key: {
        in: ["paypalClientId", "paypalClientSecret", "paypalEnv", "paypalWebhookId"],
      },
    },
  });

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
      name: "Pink Cloud Digital Gift",
      imageUrl: "/sample-product.svg",
      imageSource: "url",
      shortDescription:
        "A tiny sweet checkout page for a single delightful digital product.",
      longDescriptionMarkdown:
        "## What you get\n\nA cheerful single-product checkout experience powered by PayPal.\n\n- Pick a support amount\n- Leave your email\n- Pay with PayPal or card\n- Receive a warm thank-you email",
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
