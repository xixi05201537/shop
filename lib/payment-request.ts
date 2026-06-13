import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { normalizeCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const paymentRequestStatuses = ["pending", "confirmed", "deferred", "paying", "paid"] as const;

export type PaymentRequestStatus = (typeof paymentRequestStatuses)[number];

export class PaymentRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PaymentRequestError";
    this.code = code;
  }
}

export function paymentRequestNumber(token: string) {
  const cleanToken = token.replace(/[^a-z0-9]/gi, "");
  return `PAY-${cleanToken.slice(0, 8).toUpperCase()}`;
}

export function normalizePaymentRequestStatus(status: string | null | undefined): PaymentRequestStatus {
  return paymentRequestStatuses.includes(status as PaymentRequestStatus)
    ? (status as PaymentRequestStatus)
    : "pending";
}

export function paymentRequestStatusLabel(status: string | null | undefined) {
  const normalized = normalizePaymentRequestStatus(status);
  if (normalized === "confirmed") return "确认付款";
  if (normalized === "deferred") return "稍后付款";
  if (normalized === "paying") return "付款中";
  if (normalized === "paid") return "已付款";
  return "待确认";
}

export function normalizeEmailRecipients(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\n;]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function requestToken() {
  return randomBytes(18).toString("base64url").replace(/_/g, "A").replace(/-/g, "B");
}

async function uniquePaymentRequestToken() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const token = requestToken();
    const existing = await prisma.paymentRequest.findUnique({ where: { token }, select: { id: true } });
    if (!existing) return token;
  }
  throw new PaymentRequestError("token", "生成付款单链接失败，请稍后重试。");
}

export function parsePaymentRequestImages(formData: FormData) {
  const urls = formData.getAll("imageUrl").map((value) => String(value).trim());
  const captions = formData.getAll("imageCaption").map((value) => String(value).trim());
  const prices = formData.getAll("imagePrice").map((value) => String(value).trim());

  return urls
    .map((imageUrl, index) => ({
      imageUrl,
      caption: captions[index] || null,
      price: Number(prices[index] || 0),
      sortOrder: index,
    }))
    .filter((image) => image.imageUrl)
    .map((image) => {
      if (!Number.isFinite(image.price) || image.price < 0) {
        throw new PaymentRequestError("image-price", "每张图片的价格必须是大于或等于 0 的数字。");
      }
      return { ...image, price: Number(image.price.toFixed(2)) };
    });
}

export function parsePaymentRequestForm(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const currency = normalizeCurrency(String(formData.get("currency") || "USD"));
  const status = normalizePaymentRequestStatus(String(formData.get("status") || "pending"));
  const adminNote = String(formData.get("adminNote") || "").trim() || null;
  const images = parsePaymentRequestImages(formData);
  const totalAmount = Number(images.reduce((sum, image) => sum + image.price, 0).toFixed(2));

  if (!title) throw new PaymentRequestError("title", "请填写付款单标题。");
  if (!images.length) throw new PaymentRequestError("images", "请至少添加一张图片。");
  if (totalAmount <= 0) {
    throw new PaymentRequestError("amount", "付款单总金额必须大于 0，请填写每张图片的价格。");
  }

  return {
    title,
    description,
    totalAmount: Number(totalAmount.toFixed(2)),
    currency,
    status,
    adminNote,
    images,
  };
}

export async function createPaymentRequest(formData: FormData) {
  const data = parsePaymentRequestForm(formData);
  const token = await uniquePaymentRequestToken();
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      token,
      title: data.title,
      description: data.description,
      totalAmount: data.totalAmount,
      currency: data.currency,
      status: data.status,
      adminNote: data.adminNote,
      images: { create: data.images },
    },
  });
  revalidatePaymentRequest(paymentRequest.token);
  return paymentRequest;
}

export async function updatePaymentRequest(id: string, formData: FormData) {
  if (!id) throw new PaymentRequestError("id", "付款单不存在。");
  const existing = await prisma.paymentRequest.findUnique({ where: { id }, select: { token: true, status: true } });
  if (!existing) throw new PaymentRequestError("missing", "付款单不存在。");
  if (normalizePaymentRequestStatus(existing.status) === "paid") {
    throw new PaymentRequestError("paid", "已付款的付款单不能再编辑。");
  }

  const data = parsePaymentRequestForm(formData);
  const paymentRequest = await prisma.$transaction(async (tx) => {
    await tx.paymentRequestImage.deleteMany({ where: { paymentRequestId: id } });
    return tx.paymentRequest.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        totalAmount: data.totalAmount,
        currency: data.currency,
        status: data.status,
        adminNote: data.adminNote,
        images: { create: data.images },
      },
    });
  });
  revalidatePaymentRequest(paymentRequest.token);
  return paymentRequest;
}

export function revalidatePaymentRequest(token?: string | null) {
  revalidatePath("/admin/payment-requests");
  if (token) revalidatePath(`/pay/${token}`);
}
