import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) || fallback).trim();
}

function optionalTextValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value ? value : null;
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function optionalPrice(formData: FormData) {
  const raw = textValue(formData, "price");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Number(value.toFixed(2)) : null;
}

export function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `selection-${Date.now()}`;
}

export function selectionSubmissionNumber(id: string) {
  return `SEL-${id.slice(-8).toUpperCase()}`;
}

export async function saveSelectionPageForm(formData: FormData) {
  const id = textValue(formData, "id");
  const title = textValue(formData, "title", "未命名选品单");
  const slug = normalizeSlug(textValue(formData, "slug", title));
  const data = {
    title,
    slug,
    description: optionalTextValue(formData, "description"),
    submitLabel: textValue(formData, "submitLabel", "Submit") || "Submit",
    isPublished: formData.get("isPublished") === "on",
    showPrices: formData.get("showPrices") === "on",
    allowQuantity: formData.get("allowQuantity") === "on",
    requireName: formData.get("requireName") === "on",
    requireEmail: formData.get("requireEmail") === "on",
    requireContact: formData.get("requireContact") === "on",
  };

  const page = id
    ? await prisma.selectionPage.update({ where: { id }, data })
    : await prisma.selectionPage.create({ data });

  revalidatePath(`/select/${page.slug}`);
  revalidatePath("/admin/selection-pages");
  return page;
}

export async function saveSelectionItemForm(formData: FormData) {
  const id = textValue(formData, "id");
  const pageId = textValue(formData, "pageId");
  const data = {
    pageId,
    title: textValue(formData, "title", "未命名选品"),
    imageUrl: textValue(formData, "imageUrl"),
    description: optionalTextValue(formData, "description"),
    price: optionalPrice(formData),
    currency: textValue(formData, "currency", "USD") || "USD",
    sortOrder: Math.floor(numberValue(formData, "sortOrder", 0)),
    minQuantity: Math.max(1, Math.floor(numberValue(formData, "minQuantity", 1))),
    maxQuantity: Math.max(1, Math.floor(numberValue(formData, "maxQuantity", 99))),
    isActive: formData.get("isActive") === "on",
  };

  const item = id
    ? await prisma.selectionItem.update({ where: { id }, data })
    : await prisma.selectionItem.create({ data });
  const page = await prisma.selectionPage.findUnique({ where: { id: pageId }, select: { slug: true } });

  if (page) revalidatePath(`/select/${page.slug}`);
  revalidatePath(`/admin/selection-pages/${pageId}`);
  return item;
}

export async function deleteSelectionItem(id: string) {
  const item = await prisma.selectionItem.findUnique({
    where: { id },
    select: { pageId: true, page: { select: { slug: true } } },
  });
  if (!item) return null;

  await prisma.selectionItem.delete({ where: { id } });
  revalidatePath(`/select/${item.page.slug}`);
  revalidatePath(`/admin/selection-pages/${item.pageId}`);
  return item;
}

export async function deleteSelectionPage(id: string) {
  const page = await prisma.selectionPage.findUnique({ where: { id }, select: { slug: true } });
  if (!page) return null;
  await prisma.selectionPage.delete({ where: { id } });
  revalidatePath(`/select/${page.slug}`);
  revalidatePath("/admin/selection-pages");
  return page;
}
