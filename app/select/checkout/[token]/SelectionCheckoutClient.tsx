"use client";

import { ChevronDown } from "lucide-react";
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

export function SelectionCheckoutClient({
  token,
  paypalClientId,
  currency,
  payable,
}: {
  token: string;
  paypalClientId: string;
  currency: string;
  payable: boolean;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
      const container = document.querySelector("#selection-checkout-paypal-buttons");
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
            const response = await fetch(`/api/select/checkout/${token}/create-order`, { method: "POST" });
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
          const response = await fetch(`/api/select/checkout/${token}/capture`, {
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
      void buttonsRef.current.render("#selection-checkout-paypal-buttons").catch((error: Error) => {
        renderedRef.current = false;
        setMessage(error.message || "Unable to render PayPal buttons.");
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [payable, paypalClientId, token]);

  if (!payable) return null;

  return (
    <div className="selection-checkout-paypal" id="payment">
      {paypalClientId ? <div id="selection-checkout-paypal-buttons" /> : <div className="selection-status-note is-locked">PayPal checkout is not configured.</div>}
      {loading ? <div className="selection-status-note">Preparing your PayPal checkout...</div> : null}
      {message ? <div className="selection-status-note is-locked">{message}</div> : null}
      <button
        className="selection-scroll-pay-button"
        type="button"
        onClick={() => document.querySelector("#payment")?.scrollIntoView({ behavior: "smooth", block: "center" })}
      >
        <ChevronDown size={18} />
        Pay now
      </button>
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
