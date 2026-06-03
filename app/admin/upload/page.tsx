import Link from "next/link";

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ path?: string; error?: string }> }) {
  const query = await searchParams;
  const uploadedPath = query.path || "";

  return (
    <>
      <header className="admin-header">
        <h1 className="display">上传图片</h1>
        <Link className="secondary-button" href="/admin/product">
          返回商品
        </Link>
      </header>
      <div className="upload-grid">
        <section className="admin-card upload-panel">
          <form className="admin-form" action="/api/admin/product/image" method="post" encType="multipart/form-data">
            <label>
              商品图片
              <input className="file-input" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
            </label>
            <div className="upload-dropzone">
              <strong>支持 PNG、JPG、WebP 或 GIF</strong>
              <span>最大文件大小 5MB，上传后的文件会保存在 public/uploads。</span>
            </div>
            {query.error ? <div className="notice">{query.error}</div> : null}
            <div className="admin-actions">
              <button className="admin-button" type="submit">
                上传图片
              </button>
              <Link className="secondary-button" href="/admin/product">
                取消
              </Link>
            </div>
          </form>
        </section>

        <section className="admin-card upload-result-card">
          <span>上传路径</span>
          {uploadedPath ? (
            <>
              <code>{uploadedPath}</code>
              <img src={uploadedPath} alt="已上传图片预览" />
              <Link className="admin-button" href={`/admin/product?uploaded=${encodeURIComponent(uploadedPath)}`}>
                用作商品图片
              </Link>
            </>
          ) : (
            <p>上传图片后，这里会显示可用于商品的图片路径。</p>
          )}
        </section>
      </div>
    </>
  );
}
