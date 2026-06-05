"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { ProductImageFields } from "./ProductImageFields";
import { ProductImagePreview } from "./ProductImagePreview";

export type UploadedImageOption = {
  name: string;
  path: string;
  fullUrl: string;
};

type ProductFormData = {
  name: string;
  imageUrl: string;
  amounts: string;
  defaultAmount: number;
  defaultQuantity: number;
  maxQuantity: number;
  shortDescription: string;
  longDescriptionMarkdown: string;
  isActive: boolean;
};

export function ProductAdminForm({ product, uploadedImages }: { product: ProductFormData; uploadedImages: UploadedImageOption[] }) {
  const [imageUrl, setImageUrl] = useState(product.imageUrl);

  const previewImage = useMemo(() => {
    return imageUrl.trim();
  }, [imageUrl]);

  return (
    <div className="product-admin-layout">
      <form className="admin-card admin-form product-settings-card" action="/api/admin/product" method="post">
        <div className="admin-grid">
          <label>
            商品名称
            <input name="name" defaultValue={product.name} required />
          </label>
          <ProductImageFields
            imageUrl={imageUrl}
            onImageUrlChange={setImageUrl}
            uploadedImages={uploadedImages}
          />
          <label>
            可选金额
            <input name="enabledAmounts" defaultValue={product.amounts} />
          </label>
          <label>
            默认金额
            <input name="defaultAmount" type="number" step="0.01" defaultValue={product.defaultAmount} />
          </label>
          <label>
            默认数量
            <input name="defaultQuantity" type="number" min="1" defaultValue={product.defaultQuantity} />
          </label>
          <label>
            最大数量
            <input name="maxQuantity" type="number" min="1" defaultValue={product.maxQuantity} />
          </label>
        </div>
        <label>
          简短介绍
          <textarea name="shortDescription" defaultValue={product.shortDescription} />
        </label>
        <label>
          详情 Markdown
          <textarea name="longDescriptionMarkdown" defaultValue={product.longDescriptionMarkdown} />
        </label>
        <label className="checkbox-row">
          <span>
            <input name="isActive" type="checkbox" defaultChecked={product.isActive} /> 启用商品
          </span>
        </label>
        <div className="admin-actions">
          <SubmitButton loadingText="保存中...">
            保存商品
          </SubmitButton>
        </div>
      </form>
      <ProductImagePreview imagePath={previewImage} />
    </div>
  );
}
