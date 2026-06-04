import { getConfigMap, maskSecret } from "@/lib/config";
import { EmailTabs } from "./EmailTabs";

export const dynamic = "force-dynamic";

export default async function EmailAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">邮件</h1>
      </header>
      <EmailTabs config={config} maskedPassword={maskSecret(config.smtpPassword)} />
    </>
  );
}
