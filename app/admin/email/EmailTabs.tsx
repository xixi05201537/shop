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
  defaultPaymentRequestEmailHtml,
  defaultPaymentRequestPaidEmailHtml,
  defaultPaymentRequestPaidEmailSubject,
  defaultPaymentRequestEmailSubject,
  defaultSelectionEmailHtml,
  defaultSelectionEmailSubject,
  defaultSelectionCheckoutEmailHtml,
  defaultSelectionCheckoutEmailSubject,
  defaultShipmentEmailHtml,
  defaultShipmentEmailSubject,
  paymentRequestTemplateVariables,
  paymentRequestPaidTemplateVariables,
  selectionCheckoutTemplateVariables,
  selectionTemplateVariables,
  templateVariables,
} from "@/lib/email-defaults";

type EmailConfig = Record<string, string>;

const tabs = [
  { id: "smtp", label: "SMTP 配置" },
  { id: "buyer", label: "买家邮件配置" },
  { id: "seller", label: "卖家邮件配置" },
  { id: "shipment", label: "发货邮件配置" },
  { id: "selection", label: "选品邮件配置" },
  { id: "selection-checkout", label: "选品付款邮件" },
  { id: "payment-request", label: "付款单邮件" },
  { id: "payment-request-paid", label: "付款成功邮件" },
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
  const selectionSubject = config.selectionEmailSubject || defaultSelectionEmailSubject;
  const selectionHtml = config.selectionEmailHtml || defaultSelectionEmailHtml;
  const selectionCheckoutSubject = config.selectionCheckoutEmailSubject || defaultSelectionCheckoutEmailSubject;
  const selectionCheckoutHtml = config.selectionCheckoutEmailHtml || defaultSelectionCheckoutEmailHtml;
  const paymentRequestSubject = config.paymentRequestEmailSubject || defaultPaymentRequestEmailSubject;
  const paymentRequestHtml = config.paymentRequestEmailHtml || defaultPaymentRequestEmailHtml;
  const paymentRequestPaidSubject = config.paymentRequestPaidEmailSubject || defaultPaymentRequestPaidEmailSubject;
  const paymentRequestPaidHtml = config.paymentRequestPaidEmailHtml || defaultPaymentRequestPaidEmailHtml;
  const [buyerPreview, setBuyerPreview] = useState(buyerHtml);
  const [adminPreview, setAdminPreview] = useState(adminHtml);
  const [shipmentPreview, setShipmentPreview] = useState(shipmentHtml);
  const [selectionPreview, setSelectionPreview] = useState(selectionHtml);
  const [selectionCheckoutPreview, setSelectionCheckoutPreview] = useState(selectionCheckoutHtml);
  const [paymentRequestPreview, setPaymentRequestPreview] = useState(paymentRequestHtml);
  const [paymentRequestPaidPreview, setPaymentRequestPaidPreview] = useState(paymentRequestPaidHtml);

  function handleTabClick(tabId: EmailTabId) {
    setActive(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    url.searchParams.delete("test");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <section className="admin-card tab-card">
      <div className="admin-tabs" role="tablist" aria-label="邮件配置">
        {tabs.map((tab) => (
          <button
            aria-selected={active === tab.id}
            className={active === tab.id ? "is-active" : ""}
            key={tab.id}
            role="tab"
            type="button"
            onClick={() => handleTabClick(tab.id)}
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
            <TemplateVariableHelp variables={templateVariables} />
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
            <TemplateVariableHelp variables={templateVariables} />
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
            <TemplateVariableHelp variables={templateVariables} />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">
                保存发货邮件
              </SubmitButton>
            </div>
          </form>
          <TestEmailForm target="shipment" />
        </>
      ) : null}

      {active === "selection" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="selection" />
            <label className="checkbox-row">
              <span>
                <input name="selectionEmailEnabled" type="checkbox" defaultChecked={config.selectionEmailEnabled !== "false"} /> 启用选品确认邮件
              </span>
            </label>
            <label>
              选品邮件标题
              <input name="selectionEmailSubject" defaultValue={selectionSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                选品富文本邮件模板
                <RichTemplateEditor
                  name="selectionEmailHtml"
                  defaultValue={selectionHtml}
                  onChange={setSelectionPreview}
                  presets={[{ label: "使用精致模板", value: defaultSelectionEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="选品邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: selectionPreview }} />
              </section>
            </div>
            <TemplateVariableHelp variables={selectionTemplateVariables} />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">
                保存选品邮件
              </SubmitButton>
            </div>
          </form>
          <TestEmailForm target="selection" />
        </>
      ) : null}

      {active === "selection-checkout" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="selection-checkout" />
            <label className="checkbox-row">
              <span>
                <input
                  name="selectionCheckoutEmailEnabled"
                  type="checkbox"
                  defaultChecked={config.selectionCheckoutEmailEnabled !== "false"}
                />{" "}
                启用选品付款确认邮件
              </span>
            </label>
            <label>
              选品付款邮件标题
              <input name="selectionCheckoutEmailSubject" defaultValue={selectionCheckoutSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                选品付款富文本邮件模板
                <RichTemplateEditor
                  name="selectionCheckoutEmailHtml"
                  defaultValue={selectionCheckoutHtml}
                  onChange={setSelectionCheckoutPreview}
                  presets={[{ label: "使用精致模板", value: defaultSelectionCheckoutEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="选品付款邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: selectionCheckoutPreview }} />
              </section>
            </div>
            <TemplateVariableHelp variables={selectionCheckoutTemplateVariables} />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">保存选品付款邮件</SubmitButton>
            </div>
          </form>
          <TestEmailForm target="selection-checkout" />
        </>
      ) : null}

      {active === "payment-request" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="payment-request" />
            <label className="checkbox-row">
              <span>
                <input
                  name="paymentRequestEmailEnabled"
                  type="checkbox"
                  defaultChecked={config.paymentRequestEmailEnabled !== "false"}
                />{" "}
                启用付款单邮件
              </span>
            </label>
            <label>
              付款单邮件标题
              <input name="paymentRequestEmailSubject" defaultValue={paymentRequestSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                付款单富文本邮件模板
                <RichTemplateEditor
                  name="paymentRequestEmailHtml"
                  defaultValue={paymentRequestHtml}
                  onChange={setPaymentRequestPreview}
                  presets={[{ label: "使用精致模板", value: defaultPaymentRequestEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="付款单邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: paymentRequestPreview }} />
              </section>
            </div>
            <TemplateVariableHelp variables={paymentRequestTemplateVariables} />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">保存付款单邮件</SubmitButton>
            </div>
          </form>
          <TestEmailForm target="payment-request" />
        </>
      ) : null}

      {active === "payment-request-paid" ? (
        <>
          <form className="admin-form" action="/api/admin/email" method="post">
            <input type="hidden" name="tab" value="payment-request-paid" />
            <label className="checkbox-row">
              <span>
                <input
                  name="paymentRequestPaidEmailEnabled"
                  type="checkbox"
                  defaultChecked={config.paymentRequestPaidEmailEnabled !== "false"}
                />{" "}
                启用付款成功邮件
              </span>
            </label>
            <label>
              付款成功邮件标题
              <input name="paymentRequestPaidEmailSubject" defaultValue={paymentRequestPaidSubject} />
            </label>
            <div className="email-template-layout">
              <label>
                付款成功富文本邮件模板
                <RichTemplateEditor
                  name="paymentRequestPaidEmailHtml"
                  defaultValue={paymentRequestPaidHtml}
                  onChange={setPaymentRequestPaidPreview}
                  presets={[{ label: "使用精致模板", value: defaultPaymentRequestPaidEmailHtml }]}
                />
              </label>
              <section className="email-preview-panel" aria-label="付款成功邮件预览">
                <span>预览</span>
                <div className="rich-preview" dangerouslySetInnerHTML={{ __html: paymentRequestPaidPreview }} />
              </section>
            </div>
            <TemplateVariableHelp variables={paymentRequestPaidTemplateVariables} />
            <div className="admin-save-bar">
              <SubmitButton loadingText="保存中...">保存付款成功邮件</SubmitButton>
            </div>
          </form>
          <TestEmailForm target="payment-request-paid" />
        </>
      ) : null}
    </section>
  );
}

function TestEmailForm({
  target,
}: {
  target: "buyer" | "seller" | "shipment" | "selection" | "selection-checkout" | "payment-request" | "payment-request-paid";
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

function TemplateVariableHelp({ variables }: { variables: string[] }) {
  return (
    <div className="template-variable-help">
      <span>可用变量</span>
      <div>
        {variables.map((variable) => (
          <CopyVariableButton key={variable} value={variable} />
        ))}
      </div>
    </div>
  );
}
