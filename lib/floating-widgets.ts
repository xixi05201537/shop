import { revalidatePath } from "next/cache";
import type { FloatingWidget } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FloatingWidgetView = {
  id: string;
  url: string;
  displayType: string;
  label: string;
  imageUrl: string;
  openMode: string;
  size: string;
  width: number;
  height: number;
  shape: string;
  position: string;
  enabled: boolean;
  sortOrder: number;
};

const openModes = new Set(["current", "new"]);
const sizes = new Set(["small", "medium", "large"]);
const shapes = new Set(["rounded", "circle", "square", "pill", "bookmark"]);
const positions = new Set(["right-bottom", "left-bottom", "right-middle", "left-middle"]);

export function isSafeFloatingUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

export function isSafeFloatingImageUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function listFloatingWidgets(): Promise<FloatingWidgetView[]> {
  const widgets = await prisma.floatingWidget.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  if (widgets.length) return widgets.map(floatingWidgetView);

  const config = await prisma.siteConfig.findMany({
    where: {
      key: {
        in: [
          "floatingEnabled",
          "floatingUrl",
          "floatingOpenMode",
          "floatingSize",
          "floatingPosition",
          "floatingLabel",
          "floatingImageUrl",
        ],
      },
    },
  });
  const map = Object.fromEntries(config.map((row) => [row.key, row.value]));
  return [
    {
      id: "legacy-floating-widget",
      url: map.floatingUrl || "/article/about",
      displayType: "image",
      label: map.floatingLabel || "i",
      imageUrl: map.floatingImageUrl || "",
      openMode: normalizeOpenMode(map.floatingOpenMode),
      size: normalizeSize(map.floatingSize),
      width: sizeToDimension(map.floatingSize),
      height: sizeToDimension(map.floatingSize),
      shape: "rounded",
      position: normalizePosition(map.floatingPosition),
      enabled: (map.floatingEnabled || "false") === "true",
      sortOrder: 0,
    },
  ];
}

export async function listEnabledFloatingWidgets() {
  const widgets = await listFloatingWidgets();
  return widgets.filter((widget) => widget.enabled);
}

export async function saveFloatingWidgetsForm(formData: FormData) {
  const rawRows = String(formData.get("floatingWidgets") || "[]");
  const parsed = parseFloatingWidgetRows(rawRows);

  await prisma.$transaction(async (tx) => {
    await tx.floatingWidget.deleteMany();
    if (!parsed.length) return;
    await tx.floatingWidget.createMany({
      data: parsed.map((widget, index) => ({
        url: widget.url,
        displayType: "image",
        label: widget.label,
        imageUrl: widget.imageUrl || null,
        openMode: widget.openMode,
        size: widget.size,
        width: widget.width,
        height: widget.height,
        shape: widget.shape,
        position: widget.position,
        enabled: widget.enabled,
        sortOrder: index,
      })),
    });
  });

  revalidatePath("/");
}

function parseFloatingWidgetRows(rawRows: string) {
  let rows: unknown;
  try {
    rows = JSON.parse(rawRows);
  } catch {
    throw new Error("Floating widget rows are invalid.");
  }
  if (!Array.isArray(rows)) throw new Error("Floating widget rows are invalid.");

  return rows
    .map((row, index) => normalizeFloatingWidgetInput(row, index))
    .filter((row): row is FloatingWidgetView => Boolean(row));
}

function normalizeFloatingWidgetInput(row: unknown, index: number): FloatingWidgetView | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const url = stringValue(value.url).trim();
  if (!url) return null;
  if (!isSafeFloatingUrl(url)) throw new Error(`Floating link URL is not allowed in row ${index + 1}.`);

  const imageUrl = stringValue(value.imageUrl).trim();
  if (!isSafeFloatingImageUrl(imageUrl)) {
    throw new Error(`Floating image URL is not allowed in row ${index + 1}.`);
  }

  return {
    id: stringValue(value.id) || `new-${index}`,
    url,
    displayType: "image",
    label: (stringValue(value.label).trim() || "i").slice(0, 120),
    imageUrl,
    openMode: normalizeOpenMode(stringValue(value.openMode)),
    size: normalizeSize(stringValue(value.size)),
    width: normalizeDimension(value.width, 64),
    height: normalizeDimension(value.height, 64),
    shape: normalizeShape(stringValue(value.shape)),
    position: normalizePosition(stringValue(value.position)),
    enabled: Boolean(value.enabled),
    sortOrder: index,
  };
}

function floatingWidgetView(widget: FloatingWidget): FloatingWidgetView {
  return {
    id: widget.id,
    url: widget.url,
    displayType: "image",
    label: widget.label || "i",
    imageUrl: widget.imageUrl || "",
    openMode: normalizeOpenMode(widget.openMode),
    size: normalizeSize(widget.size),
    width: normalizeDimension(widget.width, sizeToDimension(widget.size)),
    height: normalizeDimension(widget.height, sizeToDimension(widget.size)),
    shape: normalizeShape(widget.shape),
    position: normalizePosition(widget.position),
    enabled: widget.enabled,
    sortOrder: widget.sortOrder,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeOpenMode(value?: string) {
  return value && openModes.has(value) ? value : "current";
}

function normalizeSize(value?: string) {
  return value && sizes.has(value) ? value : "medium";
}

function normalizeDimension(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(24, Math.min(240, Math.round(parsed)));
}

function normalizeShape(value?: string) {
  return value && shapes.has(value) ? value : "rounded";
}

function normalizePosition(value?: string) {
  return value && positions.has(value) ? value : "right-bottom";
}

function sizeToDimension(value?: string) {
  const size = normalizeSize(value);
  if (size === "small") return 38;
  if (size === "large") return 88;
  return 64;
}
