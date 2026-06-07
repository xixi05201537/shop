import { parseAmounts } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { listUploadedImages } from "@/lib/uploads";
import { ProductAdminForm } from "./ProductAdminForm";

export const dynamic = "force-dynamic";

export default async function ProductAdmin({ searchParams }: { searchParams: Promise<{ uploaded?: string }> }) {
  const query = await searchParams;
  const [product, uploadedImages, baseUrl] = await Promise.all([prisma.product.findFirst(), listUploadedImages(), requestBaseUrl()]);
  const amounts = product ? parseAmounts(product.enabledAmounts).join(",") : "0.1,1,10,30,50";
  const selectedImage = query.uploaded ? new URL(query.uploaded, baseUrl).toString() : product?.imageUrl || product?.uploadedImagePath || "";
  const imageOptions = uploadedImages.map((image) => ({
    name: image.name,
    path: image.path,
    fullUrl: new URL(image.path, baseUrl).toString(),
  }));

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">商品</h1>
          <p>维护首页展示商品、金额选项、图片和详情文案。</p>
        </div>
      </header>
      <ProductAdminForm
        product={{
          name: product?.name || "",
          imageUrl: selectedImage,
          amounts,
          defaultAmount: product?.defaultAmount || 1,
          defaultQuantity: product?.defaultQuantity || 1,
          maxQuantity: product?.maxQuantity || 99,
          shortDescription: product?.shortDescription || "",
          longDescriptionMarkdown: product?.longDescriptionMarkdown || "",
          isActive: product?.isActive ?? true,
        }}
        uploadedImages={imageOptions}
      />
    </>
  );
}
