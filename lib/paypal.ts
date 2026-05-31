import { getConfigMap } from "@/lib/config";

function paypalBase(env: string) {
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function getPaypalSettings() {
  const config = await getConfigMap();
  return {
    clientId: config.paypalClientId || process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: config.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET || "",
    env: config.paypalEnv || process.env.PAYPAL_ENV || "sandbox",
    webhookId: config.paypalWebhookId || process.env.PAYPAL_WEBHOOK_ID || "",
  };
}

async function accessToken() {
  const settings = await getPaypalSettings();
  if (!settings.clientId || !settings.clientSecret) {
    throw new Error("PayPal is not configured.");
  }

  const response = await fetch(`${paypalBase(settings.env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with PayPal.");
  }

  const data = (await response.json()) as { access_token: string };
  return { token: data.access_token, settings };
}

export async function createPaypalOrder(totalAmount: number, orderNumber: string) {
  const { token, settings } = await accessToken();
  const response = await fetch(`${paypalBase(settings.env)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderNumber,
          amount: {
            currency_code: "USD",
            value: totalAmount.toFixed(2),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to create PayPal order.");
  }

  return (await response.json()) as { id: string; status: string };
}

export async function capturePaypalOrder(paypalOrderId: string) {
  const { token, settings } = await accessToken();
  const response = await fetch(`${paypalBase(settings.env)}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to capture PayPal order.");
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function verifyPaypalWebhook(headers: Headers, body: string) {
  const { token, settings } = await accessToken();
  if (!settings.webhookId) return false;

  const response = await fetch(`${paypalBase(settings.env)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: settings.webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!response.ok) return false;
  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
