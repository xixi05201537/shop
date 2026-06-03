"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Mail, Minus, Plus, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { formatUsd } from "@/lib/format";
import type { PublicConfig } from "@/lib/config";

type ProductView = {
  id: string;
  name: string;
  imageUrl: string | null;
  uploadedImagePath: string | null;
  imageSource: string;
  shortDescription: string;
  longDescriptionMarkdown: string;
  enabledAmounts: number[];
  defaultAmount: number;
  defaultQuantity: number;
  maxQuantity: number;
};

type PaypalButtonsInstance = {
  close?: () => void;
  render: (selector: string) => Promise<void>;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => PaypalButtonsInstance;
    };
  }
}

export function Storefront({ product, config }: { product: ProductView; config: PublicConfig }) {
  const [amount, setAmount] = useState(product.defaultAmount);
  const [quantity, setQuantity] = useState(product.defaultQuantity);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const checkoutRef = useRef({ amount, quantity, email, nickname });
  const paypalRenderedRef = useRef(false);
  const paypalButtonsRef = useRef<PaypalButtonsInstance | null>(null);
  const total = useMemo(() => amount * quantity, [amount, quantity]);

  const imageSrc =
    product.imageSource === "upload" && product.uploadedImagePath
      ? product.uploadedImagePath
      : product.imageUrl || "/window.svg";

  useEffect(() => {
    setEmail(localStorage.getItem("pinkBuyerEmail") || "");
    setNickname(localStorage.getItem("pinkBuyerNickname") || "");
  }, []);

  useEffect(() => {
    checkoutRef.current = { amount, quantity, email, nickname };
  }, [amount, quantity, email, nickname]);

  useEffect(() => {
    if (!config.paypalClientId) return;
    const existing = document.querySelector("script[data-paypal-sdk]");
    if (existing) return;
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${config.paypalClientId}&currency=USD&components=buttons&intent=capture&commit=true`;
    script.dataset.paypalSdk = "true";
    script.async = true;
    document.body.appendChild(script);
  }, [config.paypalClientId]);

  useEffect(() => {
    if (!config.paypalClientId) return;
    const interval = window.setInterval(() => {
      const container = document.querySelector("#paypal-buttons");
      if (!window.paypal || !container || paypalRenderedRef.current) return;
      window.clearInterval(interval);
      paypalRenderedRef.current = true;
      paypalButtonsRef.current = window.paypal.Buttons({
        onClick: async (_data: unknown, actions?: { reject?: () => Promise<void> | void; resolve?: () => Promise<void> | void }) => {
          setMessage("");
          return actions?.resolve ? actions.resolve() : Promise.resolve();
        },
        createOrder: async () => {
          const current = checkoutRef.current;
          setLoading(true);
          try {
            const response = await fetch("/api/checkout/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(current),
            });
            const data = await readJsonResponse(response);
            if (!response.ok) throw new Error(data.error || "Unable to create PayPal order.");
            localStorage.setItem("pinkBuyerEmail", current.email);
            localStorage.setItem("pinkBuyerNickname", current.nickname);
            sessionStorage.setItem("pinkLocalOrderId", data.localOrderId);
            return data.paypalOrderId;
          } catch (error) {
            const text = error instanceof Error ? error.message : "Unable to create PayPal order.";
            setMessage(text);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        onApprove: async (data: { orderID: string }) => {
          setLoading(true);
          const response = await fetch("/api/checkout/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paypalOrderId: data.orderID,
              localOrderId: sessionStorage.getItem("pinkLocalOrderId"),
            }),
          });
          const result = await readJsonResponse(response);
          setLoading(false);
          if (!response.ok) {
            setMessage(result.error || "Payment captured by PayPal, but local confirmation failed.");
            return;
          }
          window.location.href = `/success/${result.orderId}`;
        },
        onCancel: () => setMessage("Payment was cancelled. Your order is still waiting here."),
        onError: (error: unknown) => {
          const readable = formatPaypalError(error);
          setMessage(readable);
        },
      });
      void paypalButtonsRef.current
        .render("#paypal-buttons")
        .catch((error: Error) => {
          paypalRenderedRef.current = false;
          setMessage(error.message || "Unable to render PayPal buttons.");
        });
    }, 250);

    return () => window.clearInterval(interval);
  }, [config.paypalClientId]);

  async function readJsonResponse(response: Response) {
    const text = await response.text();
    if (!text) {
      return { error: response.ok ? "" : "The server returned an empty response. Please try again." };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { error: text.slice(0, 220) || "The server returned an unreadable response." };
    }
  }

  function formatPaypalError(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === "object" && error) {
      const value = error as { error_message?: string; message?: string };
      if (value.error_message?.includes("last name uses unsupported characters")) {
        return "PayPal card checkout rejected the last name. Please use English letters or pinyin in the PayPal cardholder name fields.";
      }
      return value.error_message || value.message || "PayPal reported an error. Please check the card form.";
    }
    return "PayPal reported an error. Please check the card form.";
  }

  return (
    <main className="shop-page">
      <section className="container hero-grid">
        <div className="product-art">
          <div className="image-frame">
            <Image src={imageSrc} alt={product.name} fill sizes="(max-width: 900px) 100vw, 48vw" priority />
          </div>
          <div className="sticker sticker-one">Pay with a smile</div>
          <div className="sticker sticker-two">
            <Sparkles size={18} /> USD
          </div>
        </div>

        <div className="checkout-panel">
          <div className="eyebrow">
            <Heart size={16} fill="currentColor" /> Single sweet product
          </div>
          <h1 className="display">{product.name}</h1>
          <p className="short-copy">{product.shortDescription}</p>

          <div className="option-block">
            <span className="label">Choose amount</span>
            <div className="amount-grid">
              {product.enabledAmounts.map((item) => (
                <button
                  className={item === amount ? "amount-chip active" : "amount-chip"}
                  key={item}
                  type="button"
                  onClick={() => setAmount(item)}
                >
                  {formatUsd(item)}
                </button>
              ))}
            </div>
          </div>

          <div className="quantity-row">
            <span className="label">Quantity</span>
            <div className="stepper">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease">
                <Minus size={17} />
              </button>
              <input
                value={quantity}
                onChange={(event) => {
                  const next = Math.max(1, Math.min(product.maxQuantity, Number(event.target.value) || 1));
                  setQuantity(next);
                }}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.maxQuantity, quantity + 1))}
                aria-label="Increase"
              >
                <Plus size={17} />
              </button>
            </div>
          </div>

          <div className="buyer-grid">
            <label>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoComplete="email"
              />
            </label>
            <label>
              Nickname
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Your name" />
            </label>
          </div>

          <div className="total-row">
            <span>Total</span>
            <strong>{formatUsd(total)}</strong>
          </div>

          <div className="paypal-box">
            {config.paypalClientId ? (
              <div id="paypal-buttons" />
            ) : (
              <div className="notice">PayPal checkout is not configured.</div>
            )}
          </div>

          {loading ? <div className="notice">Preparing your PayPal checkout...</div> : null}
          {message ? <div className="notice">{message}</div> : null}

          <a className="support-link" href={`mailto:${config.supportEmail}`}>
            <Mail size={17} /> {config.supportEmail}
          </a>
        </div>
      </section>

      <section className="container details-section">
        <div className="section-title">
          <span>Live Stream Details</span>
          <h2 className="display">About Misaki&apos;s live stream deposit</h2>
        </div>
        <article className="prose">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{product.longDescriptionMarkdown}</ReactMarkdown>
        </article>
      </section>

      {config.floatingEnabled ? (
        <Link
          className={`floating-widget float-${config.floatingSize === "small" ? "small" : "medium"} float-${config.floatingPosition}`}
          href={config.floatingUrl}
          target={config.floatingOpenMode === "new" ? "_blank" : undefined}
          aria-label="Floating link"
        >
          {config.floatingImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.floatingImageUrl} alt="" />
          ) : (
            config.floatingLabel
          )}
        </Link>
      ) : null}
    </main>
  );
}
