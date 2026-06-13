import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userAgent?: unknown;
    paypalRedirectMode?: unknown;
    path?: unknown;
  };
  const clientUserAgent = truncate(typeof body.userAgent === "string" ? body.userAgent : "");
  const headerUserAgent = truncate(request.headers.get("user-agent") || "");
  const path = truncate(typeof body.path === "string" ? body.path : "", 300);
  const paypalRedirectMode = typeof body.paypalRedirectMode === "boolean" ? body.paypalRedirectMode : null;

  console.info("[checkout-user-agent]", {
    path,
    paypalRedirectMode,
    detectedTikTok: isTikTokUserAgent(clientUserAgent || headerUserAgent),
    clientUserAgent,
    headerUserAgent,
  });

  return NextResponse.json({ ok: true });
}

function isTikTokUserAgent(userAgent: string) {
  const normalized = userAgent.toLowerCase();
  return (
    normalized.includes("tiktok") ||
    normalized.includes("musical_ly") ||
    normalized.includes("bytedance") ||
    normalized.includes("trill")
  );
}

function truncate(value: string, maxLength = 1000) {
  return value.slice(0, maxLength);
}
