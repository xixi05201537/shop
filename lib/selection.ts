import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { normalizeCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const SLUG_MAX_LENGTH = 80;

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
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
  const legacyGeneratedSlug = slug.match(/^p-([a-f0-9]{6})$/);
  return legacyGeneratedSlug?.[1] || slug || randomSelectionSlug();
}

function randomSelectionSlug() {
  return randomBytes(3).toString("hex");
}

async function uniqueSelectionSlug(slug: string, currentId?: string) {
  let candidate = slug;
  for (let suffix = 2; ; suffix += 1) {
    const existing = await prisma.selectionPage.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === currentId) return candidate;

    const suffixText = `-${suffix}`;
    const base = slug.slice(0, SLUG_MAX_LENGTH - suffixText.length).replace(/-+$/g, "") || randomSelectionSlug();
    candidate = `${base}${suffixText}`;
  }
}

export function selectionSubmissionNumber(id: string) {
  return `SEL-${id.slice(-8).toUpperCase()}`;
}

export async function saveSelectionPageForm(formData: FormData) {
  const id = textValue(formData, "id");
  const title = textValue(formData, "title", "未命名选品单");
  const previousPage = id
    ? await prisma.selectionPage.findUnique({ where: { id }, select: { slug: true } })
    : null;
  const slugInput = textValue(formData, "slug");
  const slug = await uniqueSelectionSlug(
    normalizeSlug(slugInput || previousPage?.slug || title),
    id || undefined,
  );
  const data = {
    title,
    slug,
    description: optionalTextValue(formData, "description"),
    submitLabel: textValue(formData, "submitLabel", "Submit") || "Submit",
    isPublished: formData.get("isPublished") === "on",
    showPrices: formData.get("showPrices") === "on",
    allowQuantity: formData.get("allowQuantity") === "on",
    showName: formData.get("showName") === "on",
    showEmail: formData.get("showEmail") === "on",
    showContact: formData.get("showContact") === "on",
    requireName: formData.get("showName") === "on" && formData.get("requireName") === "on",
    requireEmail: formData.get("showEmail") === "on" && formData.get("requireEmail") === "on",
    requireContact: formData.get("showContact") === "on" && formData.get("requireContact") === "on",
  };

  const page = id
    ? await prisma.selectionPage.update({ where: { id }, data })
    : await prisma.selectionPage.create({ data });

  if (previousPage && previousPage.slug !== page.slug) {
    revalidatePath(`/select/${previousPage.slug}`);
  }
  revalidatePath(`/select/${page.slug}`);
  revalidatePath("/admin/selection-pages");
  revalidatePath(`/admin/selection-pages/${page.id}`);
  revalidatePath(`/admin/selection-pages/${page.id}/items`);
  return page;
}

export async function saveSelectionItemForm(formData: FormData) {
  const id = textValue(formData, "id");
  const pageId = textValue(formData, "pageId");
  let minQuantity = Math.max(1, Math.floor(numberValue(formData, "minQuantity", 1)));
  let maxQuantity = Math.max(1, Math.floor(numberValue(formData, "maxQuantity", 99)));
  if (minQuantity > maxQuantity) {
    [minQuantity, maxQuantity] = [maxQuantity, minQuantity];
  }

  const data = {
    pageId,
    title: textValue(formData, "title"),
    imageUrl: textValue(formData, "imageUrl"),
    description: optionalTextValue(formData, "description"),
    price: optionalPrice(formData),
    currency: normalizeCurrency(textValue(formData, "currency", "USD")),
    sortOrder: Math.floor(numberValue(formData, "sortOrder", 0)),
    minQuantity,
    maxQuantity,
    isActive: formData.get("isActive") === "on",
  };

  const item = id
    ? await prisma.selectionItem.update({ where: { id }, data })
    : await prisma.selectionItem.create({ data });
  const page = await prisma.selectionPage.findUnique({ where: { id: pageId }, select: { slug: true } });

  if (page) revalidatePath(`/select/${page.slug}`);
  revalidatePath(`/admin/selection-pages/${pageId}`);
  revalidatePath(`/admin/selection-pages/${pageId}/items`);
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
  revalidatePath(`/admin/selection-pages/${item.pageId}/items`);
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
