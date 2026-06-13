import { revalidatePath } from "next/cache";
import { getConfigValues, setConfigValues } from "@/lib/config";
import { normalizeDisplayTimeZone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { sanitizeEmailHtml } from "@/lib/sanitize";

function isSafeUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

function isSafeImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveProductForm(formData: FormData) {
  const imageUrl = String(formData.get("imageUrl") || "") || null;
  const enabledAmounts = String(formData.get("enabledAmounts") || "0.1,1,10,30,50")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

  const defaultAmount = Number(formData.get("defaultAmount") || 1);
  const defaultQuantity = Number(formData.get("defaultQuantity") || 1);
  const maxQuantity = Number(formData.get("maxQuantity") || 99);

  if (!Number.isFinite(defaultAmount) || defaultAmount <= 0) {
    throw new Error("Default amount must be a positive number.");
  }
  if (!Number.isFinite(defaultQuantity) || defaultQuantity < 1) {
    throw new Error("Default quantity must be at least 1.");
  }
  if (!Number.isFinite(maxQuantity) || maxQuantity < 1) {
    throw new Error("Max quantity must be at least 1.");
  }

  await prisma.product.upsert({
    where: { id: "single-product" },
    update: {
      name: String(formData.get("name") || ""),
      imageUrl,
      imageSource: "url",
      uploadedImagePath: null,
      shortDescription: String(formData.get("shortDescription") || ""),
      longDescriptionMarkdown: String(formData.get("longDescriptionMarkdown") || ""),
      enabledAmounts: JSON.stringify(enabledAmounts),
      defaultAmount,
      defaultQuantity,
      maxQuantity,
      isActive: formData.get("isActive") === "on",
    },
    create: {
      id: "single-product",
      name: String(formData.get("name") || "Product"),
      imageUrl,
      imageSource: "url",
      uploadedImagePath: null,
      shortDescription: String(formData.get("shortDescription") || ""),
      longDescriptionMarkdown: String(formData.get("longDescriptionMarkdown") || ""),
      enabledAmounts: JSON.stringify(enabledAmounts),
      defaultAmount,
      defaultQuantity,
      maxQuantity,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/");
}

export async function saveEmailForm(formData: FormData) {
  const existing = await prisma.siteConfig.findMany({
    where: { key: { in: ["smtpPassword"] } },
  });
  const currentPassword = existing.find((item) => item.key === "smtpPassword")?.value || "";
  const nextPassword = String(formData.get("smtpPassword") || "");
  const values: Record<string, string> = {};

  if (formData.has("smtpHost")) values.smtpHost = String(formData.get("smtpHost") || "");
  if (formData.has("smtpPort")) {
    const port = Number(formData.get("smtpPort"));
    values.smtpPort = Number.isFinite(port) && port >= 1 && port <= 65535 ? String(port) : "587";
  }
  if (formData.has("smtpUser")) values.smtpUser = String(formData.get("smtpUser") || "");
  if (formData.has("smtpPassword")) values.smtpPassword = nextPassword || currentPassword;
  if (formData.has("smtpFromEmail")) values.smtpFromEmail = String(formData.get("smtpFromEmail") || "");
  if (formData.has("smtpFromName")) values.smtpFromName = String(formData.get("smtpFromName") || "");
  if (formData.has("supportEmail")) values.supportEmail = String(formData.get("supportEmail") || "");
  if (formData.has("adminNotifyEmail")) values.adminNotifyEmail = String(formData.get("adminNotifyEmail") || "");
  if (formData.has("buyerEmailSubject") || formData.has("buyerEmailHtml")) {
    values.buyerEmailEnabled = formData.get("buyerEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("adminEmailSubject") || formData.has("adminEmailHtml")) {
    values.adminEmailEnabled = formData.get("adminEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("shipmentEmailSubject") || formData.has("shipmentEmailHtml")) {
    values.shipmentEmailEnabled = formData.get("shipmentEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("selectionEmailSubject") || formData.has("selectionEmailHtml")) {
    values.selectionEmailEnabled = formData.get("selectionEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("selectionCheckoutEmailSubject") || formData.has("selectionCheckoutEmailHtml")) {
    values.selectionCheckoutEmailEnabled = formData.get("selectionCheckoutEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("paymentRequestEmailSubject") || formData.has("paymentRequestEmailHtml")) {
    values.paymentRequestEmailEnabled = formData.get("paymentRequestEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("paymentRequestPaidEmailSubject") || formData.has("paymentRequestPaidEmailHtml")) {
    values.paymentRequestPaidEmailEnabled = formData.get("paymentRequestPaidEmailEnabled") === "on" ? "true" : "false";
  }
  if (formData.has("buyerEmailSubject")) values.buyerEmailSubject = String(formData.get("buyerEmailSubject") || "");
  if (formData.has("buyerEmailHtml")) values.buyerEmailHtml = sanitizeEmailHtml(String(formData.get("buyerEmailHtml") || ""));
  if (formData.has("adminEmailSubject")) values.adminEmailSubject = String(formData.get("adminEmailSubject") || "");
  if (formData.has("adminEmailHtml")) values.adminEmailHtml = sanitizeEmailHtml(String(formData.get("adminEmailHtml") || ""));
  if (formData.has("shipmentEmailSubject")) values.shipmentEmailSubject = String(formData.get("shipmentEmailSubject") || "");
  if (formData.has("shipmentEmailHtml")) {
    values.shipmentEmailHtml = sanitizeEmailHtml(String(formData.get("shipmentEmailHtml") || ""));
  }
  if (formData.has("selectionEmailSubject")) values.selectionEmailSubject = String(formData.get("selectionEmailSubject") || "");
  if (formData.has("selectionEmailHtml")) {
    values.selectionEmailHtml = sanitizeEmailHtml(String(formData.get("selectionEmailHtml") || ""));
  }
  if (formData.has("selectionCheckoutEmailSubject")) values.selectionCheckoutEmailSubject = String(formData.get("selectionCheckoutEmailSubject") || "");
  if (formData.has("selectionCheckoutEmailHtml")) {
    values.selectionCheckoutEmailHtml = sanitizeEmailHtml(String(formData.get("selectionCheckoutEmailHtml") || ""));
  }
  if (formData.has("paymentRequestEmailSubject")) values.paymentRequestEmailSubject = String(formData.get("paymentRequestEmailSubject") || "");
  if (formData.has("paymentRequestEmailHtml")) {
    values.paymentRequestEmailHtml = sanitizeEmailHtml(String(formData.get("paymentRequestEmailHtml") || ""));
  }
  if (formData.has("paymentRequestPaidEmailSubject")) values.paymentRequestPaidEmailSubject = String(formData.get("paymentRequestPaidEmailSubject") || "");
  if (formData.has("paymentRequestPaidEmailHtml")) {
    values.paymentRequestPaidEmailHtml = sanitizeEmailHtml(String(formData.get("paymentRequestPaidEmailHtml") || ""));
  }

  await setConfigValues(values, ["smtpPassword"]);
}

export async function saveFloatingForm(formData: FormData) {
  const floatingUrl = String(formData.get("floatingUrl") || "/article/about");
  const floatingImageUrl = String(formData.get("floatingImageUrl") || "");

  if (!isSafeUrl(floatingUrl)) {
    throw new Error("Floating link URL is not allowed.");
  }
  if (!isSafeImageUrl(floatingImageUrl)) {
    throw new Error("Floating image URL is not allowed.");
  }

  await setConfigValues({
    floatingEnabled: formData.get("floatingEnabled") === "on" ? "true" : "false",
    floatingUrl,
    floatingOpenMode: String(formData.get("floatingOpenMode") || "current"),
    floatingSize: String(formData.get("floatingSize") || "medium"),
    floatingPosition: String(formData.get("floatingPosition") || "right-bottom"),
    floatingLabel: String(formData.get("floatingLabel") || "i"),
    floatingImageUrl,
  });
  revalidatePath("/");
}

export async function saveSettingsForm(formData: FormData) {
  const existing = await getConfigValues([
    "paypalClientSecret",
    "paypalSandboxClientSecret",
    "paypalLiveClientSecret",
  ]);
  const nextSandboxSecret = String(formData.get("paypalSandboxClientSecret") || "");
  const nextLiveSecret = String(formData.get("paypalLiveClientSecret") || "");

  const paypalEnv = String(formData.get("paypalEnv") || "sandbox");
  if (paypalEnv !== "sandbox" && paypalEnv !== "live") {
    throw new Error("PayPal environment must be 'sandbox' or 'live'.");
  }

  await setConfigValues(
    {
      paypalSandboxClientId: String(formData.get("paypalSandboxClientId") || ""),
      paypalSandboxClientSecret: nextSandboxSecret || existing.paypalSandboxClientSecret || existing.paypalClientSecret,
      paypalLiveClientId: String(formData.get("paypalLiveClientId") || ""),
      paypalLiveClientSecret: nextLiveSecret || existing.paypalLiveClientSecret,
      paypalEnv,
      paypalSandboxWebhookId: String(formData.get("paypalSandboxWebhookId") || ""),
      paypalLiveWebhookId: String(formData.get("paypalLiveWebhookId") || ""),
      checkoutCustomAmountEnabled: formData.get("checkoutCustomAmountEnabled") === "on" ? "true" : "false",
      checkoutEmailEnabled: formData.get("checkoutEmailEnabled") === "on" ? "true" : "false",
      checkoutNicknameEnabled: formData.get("checkoutNicknameEnabled") === "on" ? "true" : "false",
      displayTimeZone: normalizeDisplayTimeZone(String(formData.get("displayTimeZone") || "")),
    },
    ["paypalSandboxClientSecret", "paypalLiveClientSecret"],
  );
  revalidatePath("/");
}

export async function saveArticleForm(formData: FormData) {
  const id = String(formData.get("id") || "");
  const slug = String(formData.get("slug") || "").trim();
  const data = {
    slug,
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    published: formData.get("published") === "on",
  };

  if (!slug) {
    throw new Error("Slug is required.");
  }

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    throw new Error("An article with this slug already exists.");
  }

  if (id) {
    await prisma.article.update({ where: { id }, data });
  } else {
    await prisma.article.create({ data });
  }
  revalidatePath(`/article/${data.slug}`);
}
