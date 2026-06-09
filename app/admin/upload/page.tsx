import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { listUploadedImages } from "@/lib/uploads";

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ path?: string; error?: string }> }) {
  const query = await searchParams;
  const images = await listUploadedImages();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">图片</h1>
        <Link className="secondary-button" href="/admin/product">
          返回商品
        </Link>
      </header>
      <div className="upload-grid single-upload-grid">
        <section className="admin-card upload-panel">
          <form className="admin-form" action="/api/admin/product/image" method="post" encType="multipart/form-data">
            <label>
              商品图片
              <input
                className="file-input"
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg"
                required
              />
            </label>
            <div className="upload-dropzone">
              <strong>支持 PNG、JPG、WebP、GIF 或 SVG</strong>
              <span>最大文件大小 5MB，上传后的文件会保存在 public/uploads。</span>
            </div>
            {query.error ? <div className="notice">{query.error}</div> : null}
            <div className="admin-actions">
              <SubmitButton loadingText="上传中...">
                上传图片
              </SubmitButton>
              <Link className="secondary-button" href="/admin/product">
                取消
              </Link>
            </div>
          </form>
        </section>
      </div>
      <section className="admin-card dashboard-upload-card">
        <div className="section-title-row">
          <div>
            <h2>已上传图片列表</h2>
            <p>这些图片来自 .env 里的 UPLOAD_DIR，对外访问路径为 /uploads/文件名。</p>
          </div>
          <Link className="secondary-button" href="/admin/product">
            返回商品选择
          </Link>
        </div>
        {images.length ? (
          <div className="uploaded-image-grid">
            {images.map((image) => (
              <div className="uploaded-image-card" key={image.path}>
                <img src={image.path} alt={image.name} />
                <span>{image.name}</span>
                <code>{image.path}</code>
                <div className="uploaded-card-actions">
                  <CopyLinkButton value={image.path} label="复制路径" />
                  <a href={image.path} target="_blank" rel="noreferrer">
                    查看
                  </a>
                  <Link href={`/admin/product?uploaded=${encodeURIComponent(image.path)}`}>用作商品图</Link>
                  <form action="/api/admin/uploads/delete" method="post">
                    <input type="hidden" name="path" value={image.path} />
                    <button className="link-copy-button danger-link-button" type="submit">
                      删除
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂时还没有上传图片。</div>
        )}
      </section>
    </>
  );
}
