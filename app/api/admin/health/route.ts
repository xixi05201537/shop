import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { checkSmtpHealth } from "@/lib/email";
import { checkPaypalHealth } from "@/lib/paypal";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Health check failed.";
}

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const [paypal, smtp] = await Promise.allSettled([checkPaypalHealth(), checkSmtpHealth()]);

  return NextResponse.json({
    paypal:
      paypal.status === "fulfilled"
        ? {
            ok: true,
            env: paypal.value.env,
            webhookConfigured: paypal.value.webhookConfigured,
          }
        : {
            ok: false,
            error: errorMessage(paypal.reason),
          },
    smtp:
      smtp.status === "fulfilled"
        ? {
            ok: true,
            host: smtp.value.host,
            from: smtp.value.from,
          }
        : {
            ok: false,
            error: errorMessage(smtp.reason),
          },
  });
}
