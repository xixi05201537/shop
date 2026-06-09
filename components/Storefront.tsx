"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle, Gift, Heart, Mail, Minus, Plus, Receipt, ShieldCheck, Sparkles } from "lucide-react";
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
  const [amountInput, setAmountInput] = useState(formatAmountInput(product.defaultAmount));
  const [quantity, setQuantity] = useState(product.defaultQuantity);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => {
    const parsed = Number(amountInput);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 0;
  }, [amountInput]);
  const checkoutRef = useRef({ amount, quantity, email, nickname });
  const paypalBoxRef = useRef<HTMLDivElement | null>(null);
  const mobileCheckoutBarRef = useRef<HTMLDivElement | null>(null);
  const paypalRenderedRef = useRef(false);
  const paypalButtonsRef = useRef<PaypalButtonsInstance | null>(null);
  const total = useMemo(() => Number((amount * quantity).toFixed(2)), [amount, quantity]);

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
    const viewport = window.visualViewport;
    const bar = mobileCheckoutBarRef.current;
    if (!viewport || !bar) return;

    const syncVisualViewport = () => {
      const hiddenBottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      bar.style.setProperty("--mobile-checkout-visual-bottom", `${hiddenBottom}px`);
    };

    syncVisualViewport();
    viewport.addEventListener("resize", syncVisualViewport);
    viewport.addEventListener("scroll", syncVisualViewport);
    window.addEventListener("orientationchange", syncVisualViewport);

    return () => {
      viewport.removeEventListener("resize", syncVisualViewport);
      viewport.removeEventListener("scroll", syncVisualViewport);
      window.removeEventListener("orientationchange", syncVisualViewport);
    };
  }, []);

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
        style: {
          layout: "vertical",
          shape: "pill",
          height: 48,
          tagline: false,
        },
        onClick: async (_data: unknown, actions?: { reject?: () => Promise<void> | void; resolve?: () => Promise<void> | void }) => {
          setMessage("");
          if (checkoutRef.current.amount <= 0) {
            setMessage("Please enter an amount greater than 0.");
            return actions?.reject ? actions.reject() : Promise.reject(new Error("Please enter an amount greater than 0."));
          }
          return actions?.resolve ? actions.resolve() : Promise.resolve();
        },
        createOrder: async () => {
          const current = {
            ...checkoutRef.current,
            email: config.checkoutEmailEnabled ? checkoutRef.current.email : "",
            nickname: config.checkoutNicknameEnabled ? checkoutRef.current.nickname : "",
          };
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
          <div className="art-orbit art-orbit-mint" />
          <div className="art-orbit art-orbit-lemon" />
          <div className="image-frame">
            <Image src={imageSrc} alt={product.name} fill sizes="(max-width: 900px) 100vw, 48vw" priority />
          </div>
          <div className="art-caption">
            <Gift size={18} />
            <span>Live booking card</span>
          </div>
          <div className="sticker sticker-one">
            <CheckCircle size={17} /> Reserve your spot
          </div>
          <div className="sticker sticker-two">
            <Sparkles size={18} /> USD
          </div>
        </div>

        <section className="details-section">
          <div className="section-title">
            <span>Live Stream Details</span>
            <h2 className="display">About Misaki&apos;s live stream deposit</h2>
          </div>
          <article className="prose">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{product.longDescriptionMarkdown}</ReactMarkdown>
          </article>
        </section>

        <div className="checkout-panel">
          <div className="eyebrow">
            <Heart size={16} fill="currentColor" /> Tiny booking treat
          </div>
          <h1 className="display">{product.name}</h1>
          <p className="short-copy">{product.shortDescription}</p>

          <div className="trust-row" aria-label="Checkout benefits">
            <span>
              <ShieldCheck size={16} /> Secure PayPal
            </span>
            <span>
              <Sparkles size={16} /> Sweet and simple
            </span>
          </div>

          <div className="option-block">
            <div className="label-row">
              <span className="label">Choose amount</span>
              <span className="field-hint">USD</span>
            </div>
            <div className="amount-grid">
              {product.enabledAmounts.map((item) => (
                <button
                  className={Math.abs(item - amount) < 0.001 ? "amount-chip active" : "amount-chip"}
                  key={item}
                  type="button"
                  onClick={() => setAmountInput(formatAmountInput(item))}
                >
                  {Math.abs(item - amount) < 0.001 ? <CheckCircle size={15} /> : null}
                  {formatUsd(item)}
                </button>
              ))}
            </div>
            {config.checkoutCustomAmountEnabled ? (
              <label className="custom-amount-field">
                <span>Custom amount</span>
                <input
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  onBlur={() => {
                    if (amount > 0) setAmountInput(formatAmountInput(amount));
                  }}
                  placeholder="Enter amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                />
              </label>
            ) : null}
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

          {config.checkoutEmailEnabled || config.checkoutNicknameEnabled ? (
            <div className="buyer-grid">
              {config.checkoutEmailEnabled ? (
                <label>
                  <span>Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                </label>
              ) : null}
              {config.checkoutNicknameEnabled ? (
                <label>
                  <span>Nickname</span>
                  <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Your name" />
                </label>
              ) : null}
            </div>
          ) : null}

          <div className="total-card">
            <div>
              <span>Total</span>
              <small>Ready for checkout</small>
            </div>
            <strong>
              <Receipt size={24} />
              {formatUsd(total)}
            </strong>
          </div>

          <div className="paypal-box" ref={paypalBoxRef}>
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

      <div className="mobile-checkout-bar" ref={mobileCheckoutBarRef} aria-label="Checkout summary">
        <div>
          <span>Total</span>
          <strong>{formatUsd(total)}</strong>
        </div>
        <button
          type="button"
          onClick={() => paypalBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          Checkout
        </button>
      </div>
    </main>
  );
}

function formatAmountInput(value: number) {
  return Number(value.toFixed(2)).toString();
}
