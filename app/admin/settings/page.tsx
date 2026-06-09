import { SubmitButton } from "@/components/SubmitButton";
import { getConfigMap, maskSecret } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, normalizeDisplayTimeZone } from "@/lib/format";
import { HealthCheckPanel } from "../HealthCheckPanel";
import { TimeZoneSetting } from "./TimeZoneSetting";

export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const config = await getConfigMap();
  const sandboxClientId = config.paypalSandboxClientId || config.paypalClientId || process.env.PAYPAL_CLIENT_ID || "";
  const sandboxSecret = config.paypalSandboxClientSecret || config.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET || "";
  const sandboxWebhookId = config.paypalSandboxWebhookId || config.paypalWebhookId || process.env.PAYPAL_WEBHOOK_ID || "";
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">设置</h1>
          <p>在这里维护 PayPal 支付接入信息。</p>
        </div>
      </header>
      <HealthCheckPanel />
      <form className="admin-card admin-form" action="/api/admin/settings" method="post">
        <section className="settings-group">
          <div className="settings-group-title">
            <span>商品页</span>
            <strong>Checkout</strong>
          </div>
          <div className="settings-checkout-grid">
            <label className="checkbox-row">
              <span>
                <input
                  name="checkoutCustomAmountEnabled"
                  type="checkbox"
                  defaultChecked={(config.checkoutCustomAmountEnabled || "true") === "true"}
                />{" "}
                允许用户自定义金额
              </span>
            </label>
            <label className="checkbox-row">
              <span>
                <input
                  name="checkoutEmailEnabled"
                  type="checkbox"
                  defaultChecked={(config.checkoutEmailEnabled || "true") === "true"}
                />{" "}
                显示邮箱输入框
              </span>
            </label>
            <label className="checkbox-row">
              <span>
                <input
                  name="checkoutNicknameEnabled"
                  type="checkbox"
                  defaultChecked={(config.checkoutNicknameEnabled || "true") === "true"}
                />{" "}
                显示昵称输入框
              </span>
            </label>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-group-title">
            <span>测试</span>
            <strong>Sandbox</strong>
          </div>
          <div className="settings-paypal-grid">
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
            <label>
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
          <div className="settings-paypal-grid">
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
            <label>
              PayPal Webhook ID
              <input name="paypalLiveWebhookId" defaultValue={config.paypalLiveWebhookId || ""} />
            </label>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-group-title">
            <span>显示</span>
            <strong>时间</strong>
          </div>
          <TimeZoneSetting defaultValue={displayTimeZone} />
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
        <div className="settings-sticky-actions">
          <p className="admin-help">Client Secret 留空时会保留对应环境当前已保存的值。</p>
          <SubmitButton loadingText="保存中...">保存设置</SubmitButton>
        </div>
      </form>
    </>
  );
}
