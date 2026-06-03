import { parseAmounts } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductAdmin({ searchParams }: { searchParams: Promise<{ uploaded?: string }> }) {
  const query = await searchParams;
  const product = await prisma.product.findFirst();
  const amounts = product ? parseAmounts(product.enabledAmounts).join(",") : "0.1,1,10,30,50";
  const uploadedPath = query.uploaded || product?.uploadedImagePath || "";

  return (
    <>
      <header className="admin-header">
        <h1 className="display">商品</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/product" method="post">
        <div className="admin-grid">
          <label>
            商品名称
            <input name="name" defaultValue={product?.name} required />
          </label>
          <label>
            图片来源
            <select name="imageSource" defaultValue={query.uploaded ? "upload" : product?.imageSource || "url"}>
              <option value="url">图片 URL</option>
              <option value="upload">本地上传图片</option>
            </select>
          </label>
          <label>
            图片 URL
            <input name="imageUrl" defaultValue={product?.imageUrl || ""} />
          </label>
          <label>
            已上传图片路径
            <input name="uploadedImagePath" defaultValue={uploadedPath} placeholder="例如：/uploads/file.png" />
          </label>
          <label>
            可选金额
            <input name="enabledAmounts" defaultValue={amounts} />
          </label>
          <label>
            默认金额
            <input name="defaultAmount" type="number" step="0.01" defaultValue={product?.defaultAmount || 1} />
          </label>
          <label>
            默认数量
            <input name="defaultQuantity" type="number" min="1" defaultValue={product?.defaultQuantity || 1} />
          </label>
          <label>
            最大数量
            <input name="maxQuantity" type="number" min="1" defaultValue={product?.maxQuantity || 99} />
          </label>
        </div>
        <label>
          简短介绍
          <textarea name="shortDescription" defaultValue={product?.shortDescription} />
        </label>
        <label>
          详情 Markdown
          <textarea name="longDescriptionMarkdown" defaultValue={product?.longDescriptionMarkdown} />
        </label>
        <label className="checkbox-row">
          <span>
            <input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> 启用商品
          </span>
        </label>
        <div className="admin-actions">
          <button className="admin-button" type="submit">
            保存商品
          </button>
          <a className="secondary-button" href="/admin/upload">
            上传图片
          </a>
        </div>
      </form>
    </>
  );
}
