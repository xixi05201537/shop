"use client";

import { useEffect, useRef } from "react";

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

export type PayPalButtonOptions = Record<string, unknown>;

export function usePayPalButtons({
  clientId,
  currency,
  containerId,
  options,
  enabled = true,
}: {
  clientId: string;
  currency: string;
  containerId: string;
  options: PayPalButtonOptions;
  enabled?: boolean;
}) {
  const buttonsRef = useRef<PaypalButtonsInstance | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !clientId) return;

    let script: HTMLScriptElement | null = null;
    let retryTimer: number | null = null;
    let mounted = true;

    function loadSdk() {
      const existing = document.querySelector(`script[data-paypal-sdk="${clientId}"]`);
      if (existing) {
        tryRender();
        return;
      }

      const params = new URLSearchParams({
        "client-id": clientId,
        currency,
        components: "buttons",
        intent: "capture",
        commit: "true",
      });

      script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
      script.dataset.paypalSdk = clientId;
      script.async = true;
      script.onload = () => {
        tryRender();
      };
      script.onerror = () => {
        if (!mounted) return;
        scheduleRetry();
      };
      document.body.appendChild(script);
    }

    function tryRender() {
      if (!mounted || renderedRef.current) return;
      const container = document.getElementById(containerId);
      if (!container || !window.paypal) {
        scheduleRetry();
        return;
      }

      renderedRef.current = true;
      buttonsRef.current = window.paypal.Buttons(options);
      buttonsRef.current
        .render(`#${containerId}`)
        .then(() => {
          if (retryTimer !== null) {
            window.clearTimeout(retryTimer);
            retryTimer = null;
          }
        })
        .catch(() => {
          renderedRef.current = false;
          scheduleRetry();
        });
    }

    function scheduleRetry() {
      if (retryTimer !== null) return;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        tryRender();
      }, 500);
    }

    loadSdk();

    return () => {
      mounted = false;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      buttonsRef.current?.close?.();
      buttonsRef.current = null;
      renderedRef.current = false;
    };
  }, [enabled, clientId, currency, containerId, options]);
}
