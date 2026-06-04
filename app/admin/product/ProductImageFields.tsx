import type { UploadedImageOption } from "./ProductAdminForm";

export function ProductImageFields({
  imageUrl,
  onImageUrlChange,
  uploadedImages,
}: {
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
  uploadedImages: UploadedImageOption[];
}) {
  return (
    <label className="admin-grid-full">
      图片地址
      <div className="image-url-control">
        <input
          name="imageUrl"
          placeholder="https://example.com/image.png 或 /uploads/image.svg"
          value={imageUrl}
          onChange={(event) => onImageUrlChange(event.target.value)}
        />
        <details className="image-picker-menu">
          <summary>选择图片</summary>
          <div className="image-picker-panel">
            {uploadedImages.length ? (
              uploadedImages.map((image) => (
                <button key={image.path} type="button" onClick={() => onImageUrlChange(image.fullUrl)}>
                  <img src={image.path} alt={image.name} />
                  <span>{image.name}</span>
                </button>
              ))
            ) : (
              <span className="image-picker-empty">还没有上传图片</span>
            )}
          </div>
        </details>
      </div>
    </label>
  );
}
