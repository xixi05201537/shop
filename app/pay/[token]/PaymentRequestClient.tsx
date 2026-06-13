"use client";

import { CheckCircle2, ChevronDown, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

export function PaymentRequestClient({
  token,
  paypalClientId,
  currency,
  payable,
  confirmable,
}: {
  token: string;
  paypalClientId: string;
  currency: string;
  payable: boolean;
  confirmable: boolean;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"confirm" | "defer" | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const renderedRef = useRef(false);
  const buttonsRef = useRef<PaypalButtonsInstance | null>(null);

  useEffect(() => {
    if (!paypalClientId || !payable) return;
    const existing = document.querySelector("script[data-paypal-sdk]");
    if (existing) return;
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency}&components=buttons&intent=capture&commit=true`;
    script.dataset.paypalSdk = "true";
    script.async = true;
    document.body.appendChild(script);
  }, [currency, payable, paypalClientId]);

  useEffect(() => {
    if (!paypalClientId || !payable) return;
    const interval = window.setInterval(() => {
      const container = document.querySelector("#payment-request-paypal-buttons");
      if (!window.paypal || !container || renderedRef.current) return;
      window.clearInterval(interval);
      renderedRef.current = true;
      buttonsRef.current = window.paypal.Buttons({
        style: {
          layout: "vertical",
          shape: "pill",
          height: 48,
          tagline: false,
        },
        createOrder: async () => {
          setLoading(true);
          setMessage("");
          try {
            const response = await fetch(`/api/pay/${token}/create-order`, { method: "POST" });
            const data = await readJsonResponse(response);
            if (!response.ok) throw new Error(data.error || "Unable to create PayPal order.");
            return data.paypalOrderId;
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to create PayPal order.");
            throw error;
          } finally {
            setLoading(false);
          }
        },
        onApprove: async (data: { orderID: string }) => {
          setLoading(true);
          setMessage("");
          const response = await fetch(`/api/pay/${token}/capture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const result = await readJsonResponse(response);
          setLoading(false);
          if (!response.ok) {
            setMessage(result.error || "Payment captured by PayPal, but local confirmation failed.");
            return;
          }
          window.location.reload();
        },
        onCancel: () => setMessage("Payment was cancelled. You can continue from this page."),
        onError: (error: unknown) => {
          setMessage(formatPaypalError(error));
        },
      });
      void buttonsRef.current.render("#payment-request-paypal-buttons").catch((error: Error) => {
        renderedRef.current = false;
        setMessage(error.message || "Unable to render PayPal buttons.");
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [payable, paypalClientId, token]);

  useEffect(() => {
    if (!payable) return;
    const target = document.querySelector("#payment-request-paypal-buttons");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaymentVisible(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [payable]);

  async function updateStatus(action: "confirm" | "defer") {
    setActionLoading(action);
    setMessage("");
    try {
      const response = await fetch(`/api/pay/${token}/${action === "confirm" ? "confirm" : "defer"}`, { method: "POST" });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "Unable to update this payment request.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update this payment request.");
    } finally {
      setActionLoading(null);
    }
  }

  if (confirmable) {
    return (
      <div className="payment-request-confirm-panel">
        <button className="primary-button payment-request-confirm-button" type="button" disabled={Boolean(actionLoading)} onClick={() => void updateStatus("confirm")}>
          {actionLoading === "confirm" ? <span className="button-spinner" aria-hidden="true" /> : <CheckCircle2 size={20} />}
          Confirm price and images
        </button>
        {message ? <div className="selection-status-note is-locked">{message}</div> : null}
      </div>
    );
  }

  if (!payable) return null;

  return (
    <div className="selection-checkout-paypal" id="payment">
      <button className="payment-request-pay-later-button" type="button" disabled={Boolean(actionLoading)} onClick={() => void updateStatus("defer")}>
        {actionLoading === "defer" ? <span className="button-spinner" aria-hidden="true" /> : <Clock3 size={17} />}
        Pay later
      </button>
      {paypalClientId ? <div id="payment-request-paypal-buttons" /> : <div className="selection-status-note is-locked">PayPal checkout is not configured.</div>}
      {loading ? <div className="selection-status-note">Preparing your PayPal checkout...</div> : null}
      {message ? <div className="selection-status-note is-locked">{message}</div> : null}
      {!paymentVisible ? (
        <button
          className="selection-scroll-pay-button"
          type="button"
          onClick={() => document.querySelector("#payment")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          <ChevronDown size={18} />
          Pay now
        </button>
      ) : null}
    </div>
  );
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return { error: response.ok ? "" : "The server returned an empty response. Please try again." };
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
    return value.error_message || value.message || "PayPal reported an error. Please check the card form.";
  }
  return "PayPal reported an error. Please check the card form.";
}
