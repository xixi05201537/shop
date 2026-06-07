"use client";

import { useState } from "react";
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

export function EmailTabs({ config, maskedPassword }: { config: EmailConfig; maskedPassword: string }) {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("smtp");
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
          <SubmitButton loadingText="保存中...">
            保存 SMTP 配置
          </SubmitButton>
        </form>
      ) : null}

      {active === "buyer" ? (
        <form className="admin-form" action="/api/admin/email" method="post">
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
              <RichTemplateEditor name="buyerEmailHtml" defaultValue={buyerHtml} onChange={setBuyerPreview} />
            </label>
            <section className="email-preview-panel" aria-label="买家邮件预览">
              <span>预览</span>
              <div className="rich-preview" dangerouslySetInnerHTML={{ __html: buyerPreview }} />
            </section>
          </div>
          <TemplateVariableHelp />
          <SubmitButton loadingText="保存中...">
            保存买家邮件
          </SubmitButton>
        </form>
      ) : null}

      {active === "seller" ? (
        <form className="admin-form" action="/api/admin/email" method="post">
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
              <RichTemplateEditor name="adminEmailHtml" defaultValue={adminHtml} onChange={setAdminPreview} />
            </label>
            <section className="email-preview-panel" aria-label="卖家邮件预览">
              <span>预览</span>
              <div className="rich-preview" dangerouslySetInnerHTML={{ __html: adminPreview }} />
            </section>
          </div>
          <TemplateVariableHelp />
          <SubmitButton loadingText="保存中...">
            保存卖家邮件
          </SubmitButton>
        </form>
      ) : null}

      {active === "shipment" ? (
        <form className="admin-form" action="/api/admin/email" method="post">
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
              <RichTemplateEditor name="shipmentEmailHtml" defaultValue={shipmentHtml} onChange={setShipmentPreview} />
            </label>
            <section className="email-preview-panel" aria-label="发货邮件预览">
              <span>预览</span>
              <div className="rich-preview" dangerouslySetInnerHTML={{ __html: shipmentPreview }} />
            </section>
          </div>
          <TemplateVariableHelp highlightTracking />
          <SubmitButton loadingText="保存中...">
            保存发货邮件
          </SubmitButton>
        </form>
      ) : null}
    </section>
  );
}

function TemplateVariableHelp({ highlightTracking = false }: { highlightTracking?: boolean }) {
  return (
    <div className="template-variable-help">
      <span>可用变量</span>
      <div>
        {templateVariables.map((variable) => (
          <CopyVariableButton
            important={highlightTracking && variable === "{{trackingNumber}}"}
            key={variable}
            value={variable}
          />
        ))}
      </div>
    </div>
  );
}
