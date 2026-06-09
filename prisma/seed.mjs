import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultBuyerEmailSubject = "Thank you for your purchase";
const defaultBuyerEmailHtml = [
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background-color:#ffffff;color:#352331;font-family:Avenir Next,Nunito,Trebuchet MS,Segoe UI,Arial,sans-serif;">',
  '<tbody><tr><td align="center" style="padding:18px 0px;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;background-color:#fffdf5;border:1px solid #f3d5df;border-radius:22px;box-shadow:0 18px 48px rgba(152,36,79,0.12);">',
  '<tbody>',
  '<tr><td style="padding:24px 20px 20px;background-color:#ffe7f0;border-bottom:1px solid #f3d5df;border-radius:22px 22px 0px 0px;">',
  '<p style="margin:0px 0px 12px;color:#98244f;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Tiny booking treat</p>',
  '<h1 style="margin:0px 0px 10px;color:#352331;font-size:30px;line-height:1.16;font-weight:900;letter-spacing:0px;">Thank you, {{nickname}}</h1>',
  '<p style="margin:0;color:#776471;font-size:15px;line-height:1.65;">Your Misaki shop order is confirmed. We saved the details below for you.</p>',
  '</td></tr>',
  '<tr><td style="padding:18px 12px 8px;">',
  '<div style="background-color:#ffffff;border:1px solid #f3d5df;border-radius:20px;padding:18px;">',
  '<p style="margin:0px 0px 8px;color:#98244f;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Order complete</p>',
  '<p style="margin:0;color:#352331;font-size:17px;line-height:1.55;font-weight:800;word-break:break-word;">Order <span style="color:#98244f;">{{orderId}}</span> is complete.</p>',
  '<p style="margin:8px 0px 0px;color:#776471;font-size:14px;line-height:1.55;word-break:break-word;">{{productName}}</p>',
  '</div>',
  '</td></tr>',
  '<tr><td style="padding:4px 12px 8px;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0px 8px;">',
  '<tbody>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#ffffff;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Product</p>',
  '<p style="margin:0;color:#352331;font-size:14px;font-weight:800;line-height:1.5;word-break:break-word;">{{productName}}</p>',
  '</td></tr>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#ffffff;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Quantity</p>',
  '<p style="margin:0;color:#352331;font-size:15px;font-weight:900;line-height:1.4;">{{quantity}}</p>',
  '</td></tr>',
  '<tr><td style="padding:18px 18px;border-radius:20px;background-color:#98244f;">',
  '<p style="margin:0px 0px 4px;color:#ffffff;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Total</p>',
  '<p style="margin:0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.25;word-break:break-word;">{{currency}} {{totalAmount}}</p>',
  '</td></tr>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#fff7fa;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Paid at</p>',
  '<p style="margin:0;color:#352331;font-size:13px;font-weight:800;line-height:1.45;word-break:break-all;">{{paidAt}}</p>',
  '</td></tr>',
  '</tbody></table>',
  '</td></tr>',
  '<tr><td style="padding:8px 12px 18px;">',
  '<div style="background-color:#f3fff9;border:1px solid #c7f1e4;border-radius:20px;padding:18px;">',
  '<p style="margin:0px 0px 8px;color:#352331;font-size:16px;line-height:1.45;font-weight:900;">Need help with your order?</p>',
  '<p style="margin:0;color:#776471;font-size:14px;line-height:1.65;">If you have any questions, please contact <a href="mailto:diy@misaki.im" style="color:#cf2f6c;text-decoration:none;font-weight:900;">diy@misaki.im</a>.</p>',
  '</div>',
  '<p style="margin:14px 0px 0px;color:#776471;font-size:12px;line-height:1.5;text-align:center;"><a href="https://diy.misaki.im" target="_blank" rel="noopener noreferrer" style="color:#98244f;text-decoration:none;font-weight:900;">Misaki Shop</a> · Secure PayPal checkout</p>',
  '</td></tr>',
  '</tbody>',
  '</table>',
  '</td></tr></tbody></table>',
].join("");
const defaultAdminEmailSubject = "New order: {{orderId}}";
const defaultAdminEmailHtml = [
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background-color:#ffffff;color:#352331;font-family:Avenir Next,Nunito,Trebuchet MS,Segoe UI,Arial,sans-serif;">',
  '<tbody><tr><td align="center" style="padding:18px 0px;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;background-color:#fffdf5;border:1px solid #f3d5df;border-radius:22px;box-shadow:0 18px 48px rgba(152,36,79,0.12);">',
  '<tbody>',
  '<tr><td style="padding:24px 20px 20px;background-color:#ffe7f0;border-bottom:1px solid #f3d5df;border-radius:22px 22px 0px 0px;">',
  '<p style="margin:0px 0px 12px;color:#98244f;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">New order</p>',
  '<h1 style="margin:0px 0px 10px;color:#352331;font-size:30px;line-height:1.16;font-weight:900;letter-spacing:0px;">Order {{orderId}}</h1>',
  '<p style="margin:0;color:#776471;font-size:15px;line-height:1.65;">A new Misaki Shop payment has been completed.</p>',
  '</td></tr>',
  '<tr><td style="padding:18px 12px 8px;">',
  '<div style="background-color:#ffffff;border:1px solid #f3d5df;border-radius:20px;padding:18px;">',
  '<p style="margin:0px 0px 8px;color:#98244f;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Buyer</p>',
  '<p style="margin:0;color:#352331;font-size:17px;line-height:1.55;font-weight:800;word-break:break-word;">{{email}}</p>',
  '<p style="margin:8px 0px 0px;color:#776471;font-size:14px;line-height:1.55;word-break:break-word;">Nickname: {{nickname}}</p>',
  '</div>',
  '</td></tr>',
  '<tr><td style="padding:4px 12px 8px;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0px 8px;">',
  '<tbody>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#ffffff;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Product</p>',
  '<p style="margin:0;color:#352331;font-size:14px;font-weight:800;line-height:1.5;word-break:break-word;">{{productName}}</p>',
  '</td></tr>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#ffffff;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Quantity</p>',
  '<p style="margin:0;color:#352331;font-size:15px;font-weight:900;line-height:1.4;">{{quantity}}</p>',
  '</td></tr>',
  '<tr><td style="padding:18px 18px;border-radius:20px;background-color:#98244f;">',
  '<p style="margin:0px 0px 4px;color:#ffffff;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Total</p>',
  '<p style="margin:0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.25;word-break:break-word;">{{currency}} {{totalAmount}}</p>',
  '</td></tr>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#fff7fa;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Paid at</p>',
  '<p style="margin:0;color:#352331;font-size:13px;font-weight:800;line-height:1.45;word-break:break-all;">{{paidAt}}</p>',
  '</td></tr>',
  '</tbody></table>',
  '</td></tr>',
  '<tr><td style="padding:8px 12px 18px;">',
  '<div style="background-color:#f3fff9;border:1px solid #c7f1e4;border-radius:20px;padding:18px;">',
  '<p style="margin:0px 0px 8px;color:#352331;font-size:16px;line-height:1.45;font-weight:900;">Next step</p>',
  '<p style="margin:0;color:#776471;font-size:14px;line-height:1.65;">Review the order in the admin panel and prepare fulfillment if needed.</p>',
  '</div>',
  '<p style="margin:14px 0px 0px;color:#776471;font-size:12px;line-height:1.5;text-align:center;"><a href="https://diy.misaki.im" target="_blank" rel="noopener noreferrer" style="color:#98244f;text-decoration:none;font-weight:900;">Misaki Shop</a> · Seller notification</p>',
  '</td></tr>',
  '</tbody>',
  '</table>',
  '</td></tr></tbody></table>',
].join("");
const defaultShipmentEmailSubject = "Your Misaki shop order has shipped: {{orderId}}";
const defaultShipmentEmailHtml = [
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background-color:#ffffff;color:#352331;font-family:Avenir Next,Nunito,Trebuchet MS,Segoe UI,Arial,sans-serif;">',
  '<tbody><tr><td align="center" style="padding:18px 0px;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;background-color:#fffdf5;border:1px solid #f3d5df;border-radius:22px;box-shadow:0 18px 48px rgba(152,36,79,0.12);">',
  '<tbody>',
  '<tr><td style="padding:24px 20px 20px;background-color:#ffe7f0;border-bottom:1px solid #f3d5df;border-radius:22px 22px 0px 0px;">',
  '<p style="margin:0px 0px 12px;color:#98244f;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Shipment update</p>',
  '<h1 style="margin:0px 0px 10px;color:#352331;font-size:30px;line-height:1.16;font-weight:900;letter-spacing:0px;">Your order shipped</h1>',
  '<p style="margin:0;color:#776471;font-size:15px;line-height:1.65;">Hi {{nickname}}, your Misaki Shop order is on the way.</p>',
  '</td></tr>',
  '<tr><td style="padding:18px 12px 8px;">',
  '<div style="background-color:#ffffff;border:1px solid #f3d5df;border-radius:20px;padding:18px;">',
  '<p style="margin:0px 0px 8px;color:#98244f;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Tracking number</p>',
  '<p style="margin:0;color:#352331;font-size:22px;line-height:1.35;font-weight:900;word-break:break-all;"><a href="https://t.17track.net/en#nums={{trackingNumber}}" target="_blank" rel="noopener noreferrer" style="color:#98244f;text-decoration:none;font-weight:900;">{{trackingNumber}}</a></p>',
  '<p style="margin:8px 0px 0px;color:#98244f;font-size:13px;line-height:1.55;font-weight:800;word-break:break-word;">Click the tracking number to view delivery details.</p>',
  '<p style="margin:8px 0px 0px;color:#776471;font-size:14px;line-height:1.55;word-break:break-word;">Order {{orderId}}</p>',
  '</div>',
  '</td></tr>',
  '<tr><td style="padding:4px 12px 8px;">',
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0px 8px;">',
  '<tbody>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#ffffff;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Product</p>',
  '<p style="margin:0;color:#352331;font-size:14px;font-weight:800;line-height:1.5;word-break:break-word;">{{productName}}</p>',
  '</td></tr>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#ffffff;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Quantity</p>',
  '<p style="margin:0;color:#352331;font-size:15px;font-weight:900;line-height:1.4;">{{quantity}}</p>',
  '</td></tr>',
  '<tr><td style="padding:18px 18px;border-radius:20px;background-color:#98244f;">',
  '<p style="margin:0px 0px 4px;color:#ffffff;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Total</p>',
  '<p style="margin:0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.25;word-break:break-word;">{{currency}} {{totalAmount}}</p>',
  '</td></tr>',
  '<tr><td style="padding:14px 18px;border-radius:16px;background-color:#fff7fa;">',
  '<p style="margin:0px 0px 4px;color:#776471;font-size:12px;font-weight:900;line-height:1.3;text-transform:uppercase;">Paid at</p>',
  '<p style="margin:0;color:#352331;font-size:13px;font-weight:800;line-height:1.45;word-break:break-all;">{{paidAt}}</p>',
  '</td></tr>',
  '</tbody></table>',
  '</td></tr>',
  '<tr><td style="padding:8px 12px 18px;">',
  '<div style="background-color:#f3fff9;border:1px solid #c7f1e4;border-radius:20px;padding:18px;">',
  '<p style="margin:0px 0px 8px;color:#352331;font-size:16px;line-height:1.45;font-weight:900;">Thank you for supporting Misaki Shop</p>',
  '<p style="margin:0;color:#776471;font-size:14px;line-height:1.65;">If you have any questions, please contact <a href="mailto:diy@misaki.im" style="color:#cf2f6c;text-decoration:none;font-weight:900;">diy@misaki.im</a>.</p>',
  '</div>',
  '<p style="margin:14px 0px 0px;color:#776471;font-size:12px;line-height:1.5;text-align:center;"><a href="https://diy.misaki.im" target="_blank" rel="noopener noreferrer" style="color:#98244f;text-decoration:none;font-weight:900;">Misaki Shop</a> · Shipment notification</p>',
  '</td></tr>',
  '</tbody>',
  '</table>',
  '</td></tr></tbody></table>',
].join("");

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
  paypalSandboxClientId: "",
  paypalSandboxClientSecret: "",
  paypalLiveClientId: "",
  paypalLiveClientSecret: "",
  paypalEnv: "sandbox",
  paypalWebhookId: "",
  paypalSandboxWebhookId: "",
  paypalLiveWebhookId: "",
  checkoutCustomAmountEnabled: "true",
  checkoutEmailEnabled: "true",
  checkoutNicknameEnabled: "true",
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
