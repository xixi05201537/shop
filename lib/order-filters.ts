import type { Prisma } from "@prisma/client";

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

export function orderWhereFromQuery(query: OrderFilterQuery): Prisma.OrderWhereInput {
  const minAmount = numberValue(query.minAmount);
  const maxAmount = numberValue(query.maxAmount);
  const dateFrom = dateValue(query.dateFrom);
  const dateTo = dateValue(query.dateTo, true);
  const search = query.search || query.email || "";

  return {
    status: query.status || undefined,
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
        ]
      : undefined,
  };
}

export function queryStringFromObject(query: OrderFilterQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
