import { CopyLinkButton } from "@/components/CopyLinkButton";

export function ProductImagePreview({ imagePath }: { imagePath: string }) {
  return (
    <aside className="admin-card product-preview-card">
      <div className="product-image-preview">
        <div className="product-image-preview-head">
          <span>图片预览</span>
          {imagePath ? (
            <div className="product-image-link">
              <code>{imagePath}</code>
              <CopyLinkButton value={imagePath} label="复制路径" />
              <a href={imagePath} target="_blank" rel="noreferrer">
                打开图片
              </a>
            </div>
          ) : (
            <small>还没有设置图片</small>
          )}
        </div>
        {imagePath ? <img src={imagePath} alt="商品图片预览" /> : <div className="empty-state">暂无图片预览。</div>}
      </div>
    </aside>
  );
}
