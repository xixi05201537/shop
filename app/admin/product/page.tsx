import { parseAmounts } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductAdmin() {
  const product = await prisma.product.findFirst();
  const amounts = product ? parseAmounts(product.enabledAmounts).join(",") : "0.1,1,10,30,50";

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Product</h1>
      </header>
      <form className="admin-card admin-form" action="/api/admin/product" method="post">
        <div className="admin-grid">
          <label>
            Product name
            <input name="name" defaultValue={product?.name} required />
          </label>
          <label>
            Image source
            <select name="imageSource" defaultValue={product?.imageSource || "url"}>
              <option value="url">Image URL</option>
              <option value="upload">Uploaded image</option>
            </select>
          </label>
          <label>
            Image URL
            <input name="imageUrl" defaultValue={product?.imageUrl || ""} />
          </label>
          <label>
            Uploaded image path
            <input name="uploadedImagePath" defaultValue={product?.uploadedImagePath || ""} placeholder="/uploads/file.png" />
          </label>
          <label>
            Enabled amounts
            <input name="enabledAmounts" defaultValue={amounts} />
          </label>
          <label>
            Default amount
            <input name="defaultAmount" type="number" step="0.01" defaultValue={product?.defaultAmount || 1} />
          </label>
          <label>
            Default quantity
            <input name="defaultQuantity" type="number" min="1" defaultValue={product?.defaultQuantity || 1} />
          </label>
          <label>
            Max quantity
            <input name="maxQuantity" type="number" min="1" defaultValue={product?.maxQuantity || 99} />
          </label>
        </div>
        <label>
          Short description
          <textarea name="shortDescription" defaultValue={product?.shortDescription} />
        </label>
        <label>
          Detail Markdown
          <textarea name="longDescriptionMarkdown" defaultValue={product?.longDescriptionMarkdown} />
        </label>
        <label>
          <span>
            <input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> Product active
          </span>
        </label>
        <div className="admin-actions">
          <button className="admin-button" type="submit">
            Save product
          </button>
          <a className="secondary-button" href="/admin/upload">
            Upload image
          </a>
        </div>
      </form>
    </>
  );
}
