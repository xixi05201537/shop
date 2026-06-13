import { headers } from "next/headers";

export async function requestBaseUrl() {
  const configured = process.env.APP_URL?.trim();
  if (configured?.startsWith("http")) return configured;

  // Only trust forwarded headers when explicitly enabled via trusted proxy config.
  if (process.env.APP_URL_TRUST_PROXY === "true") {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") || "http";
    if (host) return `${proto.split(",")[0]}://${host}`;
  }

  return "http://localhost:4000";
}

export async function isSecureRequest() {
  const configured = process.env.APP_URL?.trim();
  if (configured?.startsWith("https://")) return true;

  if (process.env.APP_URL_TRUST_PROXY === "true") {
    const headerStore = await headers();
    return headerStore.get("x-forwarded-proto")?.split(",")[0] === "https";
  }

  return false;
}
