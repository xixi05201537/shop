import { getConfigMap, maskSecret } from "@/lib/config";
import { EmailTabs } from "./EmailTabs";

export const dynamic = "force-dynamic";

export default async function EmailAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">邮件</h1>
          <p>配置 SMTP、买家通知、卖家通知和发货邮件模板。</p>
        </div>
      </header>
      <EmailTabs config={config} maskedPassword={maskSecret(config.smtpPassword)} />
    </>
  );
}
