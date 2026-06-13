import type { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";

export type OrderFilterQuery = {
  status?: string;
  search?: string;
  email?: string;
  nickname?: string;
  paypalOrderId?: string;
  minAmount?: string;
  maxAmount?: string;
  dateFrom?: string;
  dateTo?: string;
  fulfillment?: string;
  emailIssue?: string;
  page?: string;
  pageSize?: string;
};

function numberValue(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateValue(value?: string, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

const orderStatuses = ["created", "paying", "paid", "cancelled", "refunded", "failed"] as const;

function orderStatusValue(value?: string): OrderStatus | undefined {
  if (!value) return undefined;
  return orderStatuses.includes(value as OrderStatus) ? (value as OrderStatus) : undefined;
}

export function orderWhereFromQuery(query: OrderFilterQuery, payerNotePayerIds: string[] = []): Prisma.OrderWhereInput {
  const minAmount = numberValue(query.minAmount);
  const maxAmount = numberValue(query.maxAmount);
  const dateFrom = dateValue(query.dateFrom);
  const dateTo = dateValue(query.dateTo, true);
  const search = query.search || query.email || "";
  const filters: Prisma.OrderWhereInput[] = [];
  if (query.fulfillment === "pending") {
    filters.push({ status: "paid", trackingNumber: null, shippedAt: null });
  }
  if (query.fulfillment === "shipped") {
    filters.push({
      OR: [
        { trackingNumber: { not: null } },
        { shippedAt: { not: null } },
      ],
    });
  }
  if (query.emailIssue === "1") {
    filters.push({
      OR: [
        { buyerEmailStatus: "failed" },
        { adminEmailStatus: "failed" },
        { shipmentEmailStatus: "failed" },
      ],
    });
  }

  return {
    status: orderStatusValue(query.status),
    paypalOrderId: query.paypalOrderId ? { contains: query.paypalOrderId } : undefined,
    buyerNickname: query.nickname ? { contains: query.nickname } : undefined,
    totalAmount:
      minAmount !== undefined || maxAmount !== undefined
        ? {
            gte: minAmount,
            lte: maxAmount,
          }
        : undefined,
    createdAt:
      dateFrom || dateTo
        ? {
            gte: dateFrom,
            lte: dateTo,
          }
        : undefined,
    OR: search
      ? [
          { buyerEmail: { contains: search } },
          { buyerNickname: { contains: search } },
          { paypalBuyerEmail: { contains: search } },
          { paypalBuyerNickname: { contains: search } },
          { orderNumber: { contains: search } },
          { paypalOrderId: { contains: search } },
          { paypalCaptureId: { contains: search } },
          { paypalPayerId: { contains: search } },
          { internalNote: { contains: search } },
          ...(payerNotePayerIds.length ? [{ paypalPayerId: { in: payerNotePayerIds } }] : []),
        ]
      : undefined,
    AND: filters.length ? filters : undefined,
  };
}

export function queryStringFromObject(query: OrderFilterQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export function queryStringWithoutPage(query: OrderFilterQuery) {
  const rest = Object.fromEntries(Object.entries(query).filter(([key]) => key !== "page"));
  return queryStringFromObject(rest);
}
