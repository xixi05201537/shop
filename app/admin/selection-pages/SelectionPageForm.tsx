import { SubmitButton } from "@/components/SubmitButton";

type SelectionPageFormData = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  submitLabel?: string;
  isPublished?: boolean;
  showPrices?: boolean;
  allowQuantity?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  showContact?: boolean;
  requireName?: boolean;
  requireEmail?: boolean;
  requireContact?: boolean;
};

export function SelectionPageForm({ page }: { page?: SelectionPageFormData }) {
  const isNew = !page?.id;

  return (
    <form className="admin-card admin-form selection-page-form" action="/api/admin/selection-pages" method="post">
      {page?.id ? <input type="hidden" name="id" value={page.id} /> : null}
      <div className="admin-grid">
        <label>
          标题
          <input name="title" defaultValue={page?.title || ""} placeholder="例如：夏季新品选择" required />
        </label>
        <label>
          链接标识
          <input
            name="slug"
            defaultValue={page?.slug || ""}
            placeholder="summer-picks"
            pattern="[A-Za-z0-9-]*"
            title="只支持英文字母、数字和短横线；不填会自动生成。"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </label>
      </div>
      <label>
        页面介绍
        <textarea name="description" defaultValue={page?.description || ""} placeholder="写给客户看的简单说明，可不填。" />
      </label>
      <div className="admin-grid">
        <label>
          提交按钮文案
          <input name="submitLabel" defaultValue={page?.submitLabel || "Submit"} />
        </label>
      </div>
      <div className="selection-switch-grid">
        <label className="checkbox-row">
          <span>
            <input name="isPublished" type="checkbox" defaultChecked={page?.isPublished ?? true} /> 启用公开链接
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="showPrices" type="checkbox" defaultChecked={page?.showPrices ?? true} /> 前台显示价格
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="allowQuantity" type="checkbox" defaultChecked={page?.allowQuantity ?? true} /> 允许客户设置数量
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="showName" type="checkbox" defaultChecked={page?.showName ?? true} /> 显示姓名框
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="requireName" type="checkbox" defaultChecked={page?.requireName ?? false} /> 姓名必填
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="showEmail" type="checkbox" defaultChecked={page?.showEmail ?? true} /> 显示邮箱框
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="requireEmail" type="checkbox" defaultChecked={page?.requireEmail ?? false} /> 邮箱必填
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="showContact" type="checkbox" defaultChecked={page?.showContact ?? true} /> 显示联系方式框
          </span>
        </label>
        <label className="checkbox-row">
          <span>
            <input name="requireContact" type="checkbox" defaultChecked={page?.requireContact ?? false} /> 联系方式必填
          </span>
        </label>
      </div>
      <div className="admin-actions">
        <SubmitButton loadingText="保存中...">{isNew ? "创建选品单" : "保存选品单"}</SubmitButton>
      </div>
    </form>
  );
}
