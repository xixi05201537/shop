"use client";

import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

type HealthResult = {
  paypal?: { ok: boolean; env?: string; webhookConfigured?: boolean; error?: string };
  smtp?: { ok: boolean; host?: string; from?: string; error?: string };
};

export function HealthCheckPanel() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runCheck() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/health", { method: "POST" });
      setResult(await response.json());
    } catch (error) {
      setResult({ paypal: { ok: false, error: "检查失败" }, smtp: { ok: false, error: error instanceof Error ? error.message : "检查失败" } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-card health-panel">
      <div className="section-title-row">
        <div>
          <h2>健康检查</h2>
          <p>手动检查 PayPal 凭据、Webhook 配置和 SMTP 连接。</p>
        </div>
        <button className="secondary-button health-check-button" type="button" onClick={runCheck} disabled={loading}>
          <Activity aria-hidden="true" size={16} />
          {loading ? "检查中..." : "开始检查"}
        </button>
      </div>
      {result ? (
        <div className="health-result-grid">
          <HealthItem title="PayPal" ok={Boolean(result.paypal?.ok)} detail={paypalDetail(result)} />
          <HealthItem title="SMTP" ok={Boolean(result.smtp?.ok)} detail={smtpDetail(result)} />
        </div>
      ) : null}
    </section>
  );
}

function HealthItem({ title, ok, detail }: { title: string; ok: boolean; detail: string }) {
  return (
    <div className={ok ? "health-item is-ok" : "health-item is-error"}>
      {ok ? <CheckCircle2 aria-hidden="true" size={18} /> : <XCircle aria-hidden="true" size={18} />}
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function paypalDetail(result: HealthResult) {
  if (!result.paypal?.ok) return result.paypal?.error || "PayPal 检查失败";
  return `${result.paypal.env === "live" ? "Live" : "Sandbox"}，Webhook ${result.paypal.webhookConfigured ? "已配置" : "未配置"}`;
}

function smtpDetail(result: HealthResult) {
  if (!result.smtp?.ok) return result.smtp?.error || "SMTP 检查失败";
  return `${result.smtp.host || "-"}，发件人 ${result.smtp.from || "-"}`;
}
