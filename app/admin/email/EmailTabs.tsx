"use client";

import { useState, useRef, useCallback } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { CopyVariableButton } from "@/components/CopyVariableButton";
import { RichTemplateEditor } from "@/components/RichTemplateEditor";
import { SubmitButton } from "@/components/SubmitButton";
import {
  defaultAdminEmailHtml,
  defaultAdminEmailSubject,
  defaultBuyerEmailHtml,
  defaultBuyerEmailSubject,
  defaultShipmentEmailHtml,
  defaultShipmentEmailSubject,
  templateVariables,
} from "@/lib/email-defaults";

type EmailConfig = Record<string, string>;

const tabs = [
  { id: "smtp", label: "SMTP 配置" },
  { id: "buyer", label: "买家邮件配置" },
  { id: "seller", label: "卖家邮件配置" },
  { id: "shipment", label: "发货邮件配置" },
] as const;
type EmailTabId = (typeof tabs)[number]["id"];

export function EmailTabs({
  config,
  maskedPassword,
  initialTab,
}: {
  config: EmailConfig;
  maskedPassword: string;
  initialTab?: string;
}) {
  const initialActive = tabs.some((tab) => tab.id === initialTab) ? (initialTab as EmailTabId) : "smtp";
  const [active, setActive] = useState<EmailTabId>(initialActive);
  const buyerSubject = config.buyerEmailSubject || defaultBuyerEmailSubject;
  const buyerHtml = config.buyerEmailHtml || defaultBuyerEmailHtml;
  const adminSubject = config.adminEmailSubject || defaultAdminEmailSubject;
  const adminHtml = config.adminEmailHtml || defaultAdminEmailHtml;
  const shipmentSubject = config.shipmentEmailSubject || defaultShipmentEmailSubject;
  const shipmentHtml = config.shipmentEmailHtml || defaultShipmentEmailHtml;
  const [buyerPreview, setBuyerPreview] = useState(buyerHtml);
  const [adminPreview, setAdminPreview] = useState(adminHtml);
  const [shipmentPreview, setShipmentPreview] = useState(shipmentHtml);

  return (
    <section className="admin-card tab-card">
      <div className="admin-tabs" role="tablist" aria-label="邮件配置">
        {tabs.map((tab) => (
          <button
            className={active === tab.id ? "is-active" : ""}
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "smtp" ? (
        <form className="admin-form" action="/api/admin/email" method="post">
          <div className="admin-grid">
            <label>
              SMTP 主机
              <input name="smtpHost" defaultValue={config.smtpHost || ""} />
            </label>
            <label>
              SMTP 端口
              <input name="smtpPort" defaultValue={config.smtpPort || "587"} />
            </label>
            <label>
              SMTP 用户名
              <input name="smtpUser" defaultValue={config.smtpUser || ""} />
            </label>
            <label>
              SMTP 密码
              <input name="smtpPassword" type="password" placeholder={maskedPassword} />
            </label>
            <label>
              发件邮箱
              <input name="smtpFromEmail" defaultValue={config.smtpFromEmail || ""} />
            </label>
            <label>
              发件人名称
              <input name="smtpFromName" defaultValue={config.smtpFromName || "Misaki Shop"} />
            </label>
            <label>
              客服邮箱
              <input name="supportEmail" defaultValue={config.supportEmail || ""} />
            </label>
            <label>
              管理员通知邮箱
              <input name="adminNotifyEmail" defaultValue={config.adminNotifyEmail || ""} />
            </label>
          </div>
          <div className="admin-save-bar">
            <SubmitButton loadingText="保存中...">
              保存 SMTP 配置
            </SubmitButton>
          </div>
        </form>
      ) : null}

      {active === "buyer" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="buyer" />
            <label className="checkbox-row">
              <span>
                <input name="buyerEmailEnabled" type="checkbox" defaultChecked={config.buyerEmailEnabled === "true"} /> 启用买家邮件
              </span>
            </label>
            <label>
              买家邮件标题
              <input name="buyerEmailSubject" defaultValue={buyerSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                买家富文本邮件模板
                <RichTemplateEditor
                  name="buyerEmailHtml"
                  defaultValue={buyerHtml}
                  onChange={setBuyerPreview}
                  presets={[{ label: "使用精致模板", value: defaultBuyerEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="买家邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: buyerPreview }} />
              </section>
            </div>
            <TemplateVariableHelp />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">
                保存买家邮件
              </SubmitButton>
            </div>
          </form>
          <TestEmailForm target="buyer" />
        </>
      ) : null}

      {active === "seller" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="seller" />
            <label className="checkbox-row">
              <span>
                <input name="adminEmailEnabled" type="checkbox" defaultChecked={config.adminEmailEnabled === "true"} /> 启用卖家邮件
              </span>
            </label>
            <label>
              卖家邮件标题
              <input name="adminEmailSubject" defaultValue={adminSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                卖家富文本邮件模板
                <RichTemplateEditor
                  name="adminEmailHtml"
                  defaultValue={adminHtml}
                  onChange={setAdminPreview}
                  presets={[{ label: "使用精致模板", value: defaultAdminEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="卖家邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: adminPreview }} />
              </section>
            </div>
            <TemplateVariableHelp />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">
                保存卖家邮件
              </SubmitButton>
            </div>
          </form>
          <TestEmailForm target="seller" />
        </>
      ) : null}

      {active === "shipment" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="shipment" />
            <label className="checkbox-row">
              <span>
                <input name="shipmentEmailEnabled" type="checkbox" defaultChecked={config.shipmentEmailEnabled !== "false"} /> 启用发货邮件
              </span>
            </label>
            <label>
              发货邮件标题
              <input name="shipmentEmailSubject" defaultValue={shipmentSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                发货富文本邮件模板
                <RichTemplateEditor
                  name="shipmentEmailHtml"
                  defaultValue={shipmentHtml}
                  onChange={setShipmentPreview}
                  presets={[{ label: "使用精致模板", value: defaultShipmentEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="发货邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: shipmentPreview }} />
              </section>
            </div>
            <TemplateVariableHelp />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">
                保存发货邮件
              </SubmitButton>
            </div>
          </form>
          <TestEmailForm target="shipment" />
        </>
      ) : null}
    </section>
  );
}

function TestEmailForm({
  target,
}: {
  target: "buyer" | "seller" | "shipment";
}) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    try {
      const response = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const result = await response.json().catch(() => ({ success: false, error: "请求失败" }));
      if (response.ok && result.success) {
        showToast(result.messageId ? `SMTP 已接受：${result.messageId}` : "SMTP 已接受测试邮件", "success");
        form.reset();
      } else {
        showToast(result.error || "发送失败", "error");
      }
    } catch {
      showToast("网络错误，请重试", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="test-email-panel">
      <div>
        <strong>发送测试邮件</strong>
        <span>使用已保存的 SMTP 和当前模板发送。</span>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="target" value={target} />
        <input name="testEmail" placeholder="输入测试邮箱" type="email" required />
        <button className="secondary-button" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              发送中...
            </>
          ) : (
            "发送测试"
          )}
        </button>
      </form>
      {toast ? (
        <p className={`test-email-feedback is-${toast.type}`} role="status" aria-live="polite">
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.message}</span>
        </p>
      ) : null}
    </section>
  );
}

function TemplateVariableHelp() {
  return (
    <div className="template-variable-help">
      <span>可用变量</span>
      <div>
        {templateVariables.map((variable) => (
          <CopyVariableButton key={variable} value={variable} />
        ))}
      </div>
    </div>
  );
}
