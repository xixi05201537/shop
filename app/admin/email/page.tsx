import { getConfigMap, maskSecret } from "@/lib/config";
import { EmailTabs } from "./EmailTabs";

export const dynamic = "force-dynamic";

const secretEmailKeys = new Set([
  "smtpPassword",
  "paypalSandboxClientSecret",
  "paypalLiveClientSecret",
  "paypalClientSecret",
]);

export default async function EmailAdmin({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; test?: string }>;
}) {
  const query = await searchParams;
  const fullConfig = await getConfigMap();
  const initialTab = query.tab || query.test;

  const clientConfig = Object.fromEntries(
    Object.entries(fullConfig).filter(([key]) => !secretEmailKeys.has(key))
  );

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">邮件</h1>
          <p>配置 SMTP、买家通知、卖家通知、发货邮件、选品提交和选品付款模板。</p>
        </div>
      </header>
      <EmailTabs
        config={clientConfig}
        initialTab={initialTab}
        maskedPassword={maskSecret(fullConfig.smtpPassword)}
      />
    </>
  );
}
