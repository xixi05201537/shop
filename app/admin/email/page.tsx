import { getConfigMap, maskSecret } from "@/lib/config";
import { RichTemplateEditor } from "@/components/RichTemplateEditor";

export const dynamic = "force-dynamic";

export default async function EmailAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Email</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/email" method="post">
        <div className="admin-grid">
          <label>
            SMTP host
            <input name="smtpHost" defaultValue={config.smtpHost || ""} />
          </label>
          <label>
            SMTP port
            <input name="smtpPort" defaultValue={config.smtpPort || "587"} />
          </label>
          <label>
            SMTP user
            <input name="smtpUser" defaultValue={config.smtpUser || ""} />
          </label>
          <label>
            SMTP password
            <input name="smtpPassword" type="password" placeholder={maskSecret(config.smtpPassword)} />
          </label>
          <label>
            From email
            <input name="smtpFromEmail" defaultValue={config.smtpFromEmail || ""} />
          </label>
          <label>
            From name
            <input name="smtpFromName" defaultValue={config.smtpFromName || "Pink Pay Shop"} />
          </label>
          <label>
            Support email
            <input name="supportEmail" defaultValue={config.supportEmail || ""} />
          </label>
          <label>
            Admin notify email
            <input name="adminNotifyEmail" defaultValue={config.adminNotifyEmail || ""} />
          </label>
        </div>
        <label>
          Buyer subject
          <input name="buyerEmailSubject" defaultValue={config.buyerEmailSubject || ""} />
        </label>
        <label>
          Buyer rich HTML template
          <RichTemplateEditor name="buyerEmailHtml" defaultValue={config.buyerEmailHtml || ""} />
        </label>
        <div className="rich-preview" dangerouslySetInnerHTML={{ __html: config.buyerEmailHtml || "" }} />
        <label>
          Admin subject
          <input name="adminEmailSubject" defaultValue={config.adminEmailSubject || ""} />
        </label>
        <label>
          Admin rich HTML template
          <RichTemplateEditor name="adminEmailHtml" defaultValue={config.adminEmailHtml || ""} />
        </label>
        <div className="admin-actions">
          <label>
            <span>
              <input name="buyerEmailEnabled" type="checkbox" defaultChecked={config.buyerEmailEnabled === "true"} /> Buyer email
            </span>
          </label>
          <label>
            <span>
              <input name="adminEmailEnabled" type="checkbox" defaultChecked={config.adminEmailEnabled === "true"} /> Admin email
            </span>
          </label>
        </div>
        <button className="admin-button" type="submit">
          Save email
        </button>
      </form>
    </>
  );
}
