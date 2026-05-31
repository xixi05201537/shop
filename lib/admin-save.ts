import { revalidatePath } from "next/cache";
import { setConfigValues } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { sanitizeEmailHtml } from "@/lib/sanitize";

export async function saveProductForm(formData: FormData) {
  const enabledAmounts = String(formData.get("enabledAmounts") || "0.1,1,10,30,50")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

  await prisma.product.upsert({
    where: { id: "single-product" },
    update: {
      name: String(formData.get("name") || ""),
      imageUrl: String(formData.get("imageUrl") || "") || null,
      imageSource: String(formData.get("imageSource") || "url"),
      uploadedImagePath: String(formData.get("uploadedImagePath") || "") || null,
      shortDescription: String(formData.get("shortDescription") || ""),
      longDescriptionMarkdown: String(formData.get("longDescriptionMarkdown") || ""),
      enabledAmounts: JSON.stringify(enabledAmounts),
      defaultAmount: Number(formData.get("defaultAmount") || 1),
      defaultQuantity: Number(formData.get("defaultQuantity") || 1),
      maxQuantity: Number(formData.get("maxQuantity") || 99),
      isActive: formData.get("isActive") === "on",
    },
    create: {
      id: "single-product",
      name: String(formData.get("name") || "Product"),
      imageUrl: String(formData.get("imageUrl") || "") || null,
      imageSource: String(formData.get("imageSource") || "url"),
      uploadedImagePath: String(formData.get("uploadedImagePath") || "") || null,
      shortDescription: String(formData.get("shortDescription") || ""),
      longDescriptionMarkdown: String(formData.get("longDescriptionMarkdown") || ""),
      enabledAmounts: JSON.stringify(enabledAmounts),
      defaultAmount: Number(formData.get("defaultAmount") || 1),
      defaultQuantity: Number(formData.get("defaultQuantity") || 1),
      maxQuantity: Number(formData.get("maxQuantity") || 99),
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/");
}

export async function savePaypalForm(formData: FormData) {
  const existing = await prisma.siteConfig.findMany({
    where: { key: { in: ["paypalClientSecret"] } },
  });
  const currentSecret = existing.find((item) => item.key === "paypalClientSecret")?.value || "";
  const nextSecret = String(formData.get("paypalClientSecret") || "");

  await setConfigValues(
    {
      paypalClientId: String(formData.get("paypalClientId") || ""),
      paypalClientSecret: nextSecret || currentSecret,
      paypalEnv: String(formData.get("paypalEnv") || "sandbox"),
      paypalWebhookId: String(formData.get("paypalWebhookId") || ""),
    },
    ["paypalClientSecret"],
  );
}

export async function saveEmailForm(formData: FormData) {
  const existing = await prisma.siteConfig.findMany({
    where: { key: { in: ["smtpPassword"] } },
  });
  const currentPassword = existing.find((item) => item.key === "smtpPassword")?.value || "";
  const nextPassword = String(formData.get("smtpPassword") || "");

  await setConfigValues(
    {
      smtpHost: String(formData.get("smtpHost") || ""),
      smtpPort: String(formData.get("smtpPort") || "587"),
      smtpUser: String(formData.get("smtpUser") || ""),
      smtpPassword: nextPassword || currentPassword,
      smtpFromEmail: String(formData.get("smtpFromEmail") || ""),
      smtpFromName: String(formData.get("smtpFromName") || ""),
      supportEmail: String(formData.get("supportEmail") || ""),
      adminNotifyEmail: String(formData.get("adminNotifyEmail") || ""),
      buyerEmailEnabled: formData.get("buyerEmailEnabled") === "on" ? "true" : "false",
      adminEmailEnabled: formData.get("adminEmailEnabled") === "on" ? "true" : "false",
      buyerEmailSubject: String(formData.get("buyerEmailSubject") || ""),
      buyerEmailHtml: sanitizeEmailHtml(String(formData.get("buyerEmailHtml") || "")),
      adminEmailSubject: String(formData.get("adminEmailSubject") || ""),
      adminEmailHtml: sanitizeEmailHtml(String(formData.get("adminEmailHtml") || "")),
    },
    ["smtpPassword"],
  );
}

export async function saveFloatingForm(formData: FormData) {
  await setConfigValues({
    floatingEnabled: formData.get("floatingEnabled") === "on" ? "true" : "false",
    floatingUrl: String(formData.get("floatingUrl") || "/article/about"),
    floatingOpenMode: String(formData.get("floatingOpenMode") || "current"),
    floatingSize: String(formData.get("floatingSize") || "medium"),
    floatingPosition: String(formData.get("floatingPosition") || "right-bottom"),
    floatingLabel: String(formData.get("floatingLabel") || "i"),
  });
  revalidatePath("/");
}

export async function saveArticleForm(formData: FormData) {
  const id = String(formData.get("id") || "");
  const data = {
    slug: String(formData.get("slug") || "").trim(),
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    published: formData.get("published") === "on",
  };

  if (id) {
    await prisma.article.update({ where: { id }, data });
  } else {
    await prisma.article.create({ data });
  }
  revalidatePath(`/article/${data.slug}`);
}
