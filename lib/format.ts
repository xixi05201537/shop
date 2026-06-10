export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (value === null || typeof value === "undefined") return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: 2,
  }).format(value);
}

export function normalizeCurrency(value?: string | null) {
  const candidate = String(value || "USD").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(candidate)) return "USD";
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: candidate });
    return candidate;
  } catch {
    return "USD";
  }
}

export const DEFAULT_DISPLAY_TIME_ZONE = "UTC";

export const DISPLAY_TIME_ZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "Asia/Shanghai", label: "上海 / 北京" },
  { value: "America/Los_Angeles", label: "太平洋时间 PDT/PST / 洛杉矶" },
  { value: "America/New_York", label: "纽约" },
  { value: "Europe/London", label: "伦敦" },
  { value: "Europe/Paris", label: "巴黎" },
  { value: "Asia/Tokyo", label: "东京" },
  { value: "Australia/Sydney", label: "悉尼" },
];

export function normalizeDisplayTimeZone(value?: string | null) {
  const candidate = value?.trim() || DEFAULT_DISPLAY_TIME_ZONE;
  return isValidTimeZone(candidate) ? candidate : DEFAULT_DISPLAY_TIME_ZONE;
}

export function formatDateTime(value?: Date | string | null, timeZone?: string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeDisplayTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function formatTimeZoneOffset(value: Date | string, timeZone?: string | null) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeDisplayTimeZone(timeZone),
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return offset || "";
}

export function formatDateTimeWithOffset(value?: Date | string | null, timeZone?: string | null) {
  const formatted = formatDateTime(value, timeZone);
  if (!formatted || !value) return formatted;
  const offset = formatTimeZoneOffset(value, timeZone);
  return offset ? `${formatted} ${offset}` : formatted;
}

export function orderNumber() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PP-${stamp}-${random}`;
}

export function parseAmounts(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number).filter((item) => Number.isFinite(item)) : [];
  } catch {
    return [0.1, 1, 10, 30, 50];
  }
}

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
