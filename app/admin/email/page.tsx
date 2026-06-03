import { getConfigMap, maskSecret } from "@/lib/config";
import { RichTemplateEditor } from "@/components/RichTemplateEditor";

export const dynamic = "force-dynamic";

export default async function EmailAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">邮件</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/email" method="post">
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
            <input name="smtpPassword" type="password" placeholder={maskSecret(config.smtpPassword)} />
          </label>
          <label>
            发件邮箱
            <input name="smtpFromEmail" defaultValue={config.smtpFromEmail || ""} />
          </label>
          <label>
            发件人名称
            <input name="smtpFromName" defaultValue={config.smtpFromName || "Pink Pay Shop"} />
          </label>
          <label>
            客服邮箱
            <input name="supportEmail" defaultValue={config.supportEmail || ""} />
          </label>
          <label>
            管理员通知邮箱
            <input name="adminNotifyEmail" defaultValue={config.adminNotifyEmail || ""} />
          </label>
          <label>
            上传目录
            <input name="uploadDir" defaultValue={config.uploadDir || "./public/uploads"} />
          </label>
        </div>
        <label>
          买家邮件标题
          <input name="buyerEmailSubject" defaultValue={config.buyerEmailSubject || ""} />
        </label>
        <label>
          买家富文本邮件模板
          <RichTemplateEditor name="buyerEmailHtml" defaultValue={config.buyerEmailHtml || ""} />
        </label>
        <div className="rich-preview" dangerouslySetInnerHTML={{ __html: config.buyerEmailHtml || "" }} />
        <label>
          管理员邮件标题
          <input name="adminEmailSubject" defaultValue={config.adminEmailSubject || ""} />
        </label>
        <label>
          管理员富文本邮件模板
          <RichTemplateEditor name="adminEmailHtml" defaultValue={config.adminEmailHtml || ""} />
        </label>
        <div className="admin-actions">
          <label>
            <span>
              <input name="buyerEmailEnabled" type="checkbox" defaultChecked={config.buyerEmailEnabled === "true"} /> 启用买家邮件
            </span>
          </label>
          <label>
            <span>
              <input name="adminEmailEnabled" type="checkbox" defaultChecked={config.adminEmailEnabled === "true"} /> 启用管理员邮件
            </span>
          </label>
        </div>
        <button className="admin-button" type="submit">
          保存邮件设置
        </button>
      </form>
    </>
  );
}
