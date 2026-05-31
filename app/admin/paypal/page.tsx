import { getConfigMap, maskSecret } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function PaypalAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">PayPal</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/paypal" method="post">
        <div className="admin-grid">
          <label>
            Client ID
            <input name="paypalClientId" defaultValue={config.paypalClientId || ""} />
          </label>
          <label>
            Client Secret
            <input name="paypalClientSecret" type="password" placeholder={maskSecret(config.paypalClientSecret)} />
          </label>
          <label>
            Environment
            <select name="paypalEnv" defaultValue={config.paypalEnv || "sandbox"}>
              <option value="sandbox">Sandbox</option>
              <option value="live">Live</option>
            </select>
          </label>
          <label>
            Webhook ID
            <input name="paypalWebhookId" defaultValue={config.paypalWebhookId || ""} />
          </label>
        </div>
        <button className="admin-button" type="submit">
          Save PayPal
        </button>
      </form>
    </>
  );
}
