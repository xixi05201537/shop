import type { Order } from "@prisma/client";

type PaypalName = {
  given_name?: string;
  surname?: string;
  full_name?: string;
};

type PaypalAddress = {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_2?: string;
  admin_area_1?: string;
  postal_code?: string;
  country_code?: string;
};

type PaypalOrderDetails = {
  payerEmail?: string;
  payerName?: string;
  payerId?: string;
  shippingName?: string;
  shippingAddress?: string;
};

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function paypalName(value: unknown) {
  const name = recordValue(value) as PaypalName | undefined;
  if (!name) return undefined;
  return [name.full_name, [name.given_name, name.surname].filter(Boolean).join(" ")]
    .map((item) => item?.trim())
    .find(Boolean);
}

function paypalAddress(value: unknown) {
  const address = recordValue(value) as PaypalAddress | undefined;
  if (!address) return undefined;
  return [
    address.address_line_1,
    address.address_line_2,
    address.admin_area_2,
    address.admin_area_1,
    address.postal_code,
    address.country_code,
  ]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ") || undefined;
}

export function paypalDetailsFromCapture(capture: Record<string, unknown>): PaypalOrderDetails {
  const paymentSource = recordValue(capture.payment_source);
  const paypalSource = recordValue(paymentSource?.paypal);
  const payer = recordValue(capture.payer);
  const purchaseUnits = Array.isArray(capture.purchase_units) ? capture.purchase_units : [];
  const shipping = recordValue(recordValue(purchaseUnits[0])?.shipping);

  return {
    payerEmail: stringValue(paypalSource?.email_address) || stringValue(payer?.email_address),
    payerName: paypalName(paypalSource?.name) || paypalName(payer?.name),
    payerId: stringValue(paypalSource?.account_id) || stringValue(payer?.payer_id),
    shippingName: paypalName(recordValue(shipping?.name)),
    shippingAddress: paypalAddress(shipping?.address),
  };
}

function sameText(a?: string | null, b?: string | null) {
  return (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
}

export function orderEmailRecipients(order: Order) {
  const to = order.buyerEmail || order.paypalBuyerEmail || "";
  const cc = order.buyerEmail && order.paypalBuyerEmail && !sameText(order.buyerEmail, order.paypalBuyerEmail)
    ? order.paypalBuyerEmail
    : undefined;
  return { to, cc };
}

export function displayOrderEmail(order: Pick<Order, "buyerEmail" | "paypalBuyerEmail">) {
  if (order.buyerEmail && order.paypalBuyerEmail && !sameText(order.buyerEmail, order.paypalBuyerEmail)) {
    return `${order.buyerEmail}（PayPal：${order.paypalBuyerEmail}）`;
  }
  return order.buyerEmail || order.paypalBuyerEmail || "-";
}

export function displayOrderNickname(order: Pick<Order, "buyerNickname" | "paypalBuyerNickname">) {
  if (order.buyerNickname && order.paypalBuyerNickname && !sameText(order.buyerNickname, order.paypalBuyerNickname)) {
    return `${order.buyerNickname}（PayPal：${order.paypalBuyerNickname}）`;
  }
  return order.buyerNickname || order.paypalBuyerNickname || "-";
}
