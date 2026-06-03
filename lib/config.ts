import { prisma } from "@/lib/prisma";

export type PublicConfig = {
  paypalClientId: string;
  paypalEnv: string;
  supportEmail: string;
  floatingEnabled: boolean;
  floatingUrl: string;
  floatingOpenMode: string;
  floatingSize: string;
  floatingPosition: string;
  floatingLabel: string;
  floatingImageUrl: string;
};

export async function getConfigMap() {
  const rows = await prisma.siteConfig.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function setConfigValues(values: Record<string, string>, secretKeys: string[] = []) {
  await Promise.all(
    Object.entries(values).map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value, secret: secretKeys.includes(key) },
        create: { key, value, secret: secretKeys.includes(key) },
      }),
    ),
  );
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const config = await getConfigMap();
  return {
    paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
    paypalEnv: process.env.PAYPAL_ENV || "sandbox",
    supportEmail: config.supportEmail || "support@example.com",
    floatingEnabled: (config.floatingEnabled || "false") === "true",
    floatingUrl: config.floatingUrl || "/article/about",
    floatingOpenMode: config.floatingOpenMode || "current",
    floatingSize: config.floatingSize || "medium",
    floatingPosition: config.floatingPosition || "right-bottom",
    floatingLabel: config.floatingLabel || "i",
    floatingImageUrl: config.floatingImageUrl || "",
  };
}

export function maskSecret(value?: string) {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
