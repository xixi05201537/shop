import { getConfigMap } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function FloatingAdmin() {
  const config = await getConfigMap();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Floating Widget</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/floating-widget" method="post">
        <label>
          <span>
            <input name="floatingEnabled" type="checkbox" defaultChecked={config.floatingEnabled === "true"} /> Enabled
          </span>
        </label>
        <div className="admin-grid">
          <label>
            URL
            <input name="floatingUrl" defaultValue={config.floatingUrl || "/article/about"} />
          </label>
          <label>
            Label
            <input name="floatingLabel" defaultValue={config.floatingLabel || "i"} />
          </label>
          <label>
            Open mode
            <select name="floatingOpenMode" defaultValue={config.floatingOpenMode || "current"}>
              <option value="current">Current window</option>
              <option value="new">New window</option>
            </select>
          </label>
          <label>
            Size
            <select name="floatingSize" defaultValue={config.floatingSize || "medium"}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
            </select>
          </label>
          <label>
            Position
            <select name="floatingPosition" defaultValue={config.floatingPosition || "right-bottom"}>
              <option value="right-bottom">Right bottom</option>
              <option value="left-bottom">Left bottom</option>
              <option value="right-middle">Right middle</option>
              <option value="left-middle">Left middle</option>
            </select>
          </label>
        </div>
        <button className="admin-button" type="submit">
          Save floating widget
        </button>
      </form>
    </>
  );
}
