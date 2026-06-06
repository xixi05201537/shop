import { SubmitButton } from "@/components/SubmitButton";
import { getConfigMap, maskSecret } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const config = await getConfigMap();
  const sandboxClientId = config.paypalSandboxClientId || config.paypalClientId || "";
  const sandboxSecret = config.paypalSandboxClientSecret || config.paypalClientSecret || "";
  const sandboxWebhookId = config.paypalSandboxWebhookId || config.paypalWebhookId || "";

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">设置</h1>
          <p>在这里维护 PayPal 支付接入信息。</p>
        </div>
      </header>
      <form className="admin-card admin-form" action="/api/admin/settings" method="post">
        <section className="settings-group">
          <div className="settings-group-title">
            <span>测试</span>
            <strong>Sandbox</strong>
          </div>
          <div className="admin-grid">
            <label>
              PayPal Client ID
              <input name="paypalSandboxClientId" defaultValue={sandboxClientId} />
            </label>
            <label>
              PayPal Client Secret
              <input
                name="paypalSandboxClientSecret"
                type="password"
                autoComplete="new-password"
                placeholder={sandboxSecret ? `已保存：${maskSecret(sandboxSecret)}` : "输入测试 Client Secret"}
              />
            </label>
            <label className="admin-grid-full">
              PayPal Webhook ID
              <input name="paypalSandboxWebhookId" defaultValue={sandboxWebhookId} />
            </label>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-group-title">
            <span>正式</span>
            <strong>Live</strong>
          </div>
          <div className="admin-grid">
            <label>
              PayPal Client ID
              <input name="paypalLiveClientId" defaultValue={config.paypalLiveClientId || ""} />
            </label>
            <label>
              PayPal Client Secret
              <input
                name="paypalLiveClientSecret"
                type="password"
                autoComplete="new-password"
                placeholder={
                  config.paypalLiveClientSecret
                    ? `已保存：${maskSecret(config.paypalLiveClientSecret)}`
                    : "输入正式 Client Secret"
                }
              />
            </label>
            <label className="admin-grid-full">
              PayPal Webhook ID
              <input name="paypalLiveWebhookId" defaultValue={config.paypalLiveWebhookId || ""} />
            </label>
          </div>
        </section>

        <section className="settings-group">
          <div className="admin-grid">
          <label>
            当前 PayPal 环境
            <select name="paypalEnv" defaultValue={config.paypalEnv || "sandbox"}>
              <option value="sandbox">测试 Sandbox</option>
              <option value="live">正式 Live</option>
            </select>
          </label>
          </div>
        </section>
        <p className="admin-help">Client Secret 留空时会保留对应环境当前已保存的值。</p>
        <SubmitButton loadingText="保存中...">保存设置</SubmitButton>
      </form>
    </>
  );
}
