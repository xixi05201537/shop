import { SubmitButton } from "@/components/SubmitButton";
import { getConfigMap } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function FloatingAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">浮窗</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/floating-widget" method="post">
        <label>
          <span>
            <input name="floatingEnabled" type="checkbox" defaultChecked={config.floatingEnabled === "true"} /> 启用浮窗
          </span>
        </label>
        <div className="admin-grid">
          <label>
            URL
            <input name="floatingUrl" defaultValue={config.floatingUrl || "/article/about"} />
          </label>
          <label>
            文字
            <input name="floatingLabel" defaultValue={config.floatingLabel || "i"} />
          </label>
          <label>
            图片 URL
            <input name="floatingImageUrl" placeholder="例如：/uploads/widget.png 或 https://..." defaultValue={config.floatingImageUrl || ""} />
          </label>
          <label>
            打开方式
            <select name="floatingOpenMode" defaultValue={config.floatingOpenMode || "current"}>
              <option value="current">当前窗口</option>
              <option value="new">新窗口</option>
            </select>
          </label>
          <label>
            尺寸
            <select name="floatingSize" defaultValue={config.floatingSize || "medium"}>
              <option value="small">小</option>
              <option value="medium">中</option>
            </select>
          </label>
          <label>
            位置
            <select name="floatingPosition" defaultValue={config.floatingPosition || "right-bottom"}>
              <option value="right-bottom">右下角</option>
              <option value="left-bottom">左下角</option>
              <option value="right-middle">右侧居中</option>
              <option value="left-middle">左侧居中</option>
            </select>
          </label>
        </div>
        <SubmitButton loadingText="保存中...">
          保存浮窗
        </SubmitButton>
      </form>
    </>
  );
}
