import Link from "next/link";

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ path?: string; error?: string }> }) {
  const query = await searchParams;
  const uploadedPath = query.path || "";

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Upload Image</h1>
        <Link className="secondary-button" href="/admin/product">
          Back to product
        </Link>
      </header>
      <div className="upload-grid">
        <section className="admin-card upload-panel">
          <form className="admin-form" action="/api/admin/product/image" method="post" encType="multipart/form-data">
            <label>
              Product image
              <input className="file-input" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
            </label>
            <div className="upload-dropzone">
              <strong>PNG, JPG, WebP or GIF</strong>
              <span>Maximum file size is 5MB. Uploaded files are stored under public/uploads.</span>
            </div>
            {query.error ? <div className="notice">{query.error}</div> : null}
            <div className="admin-actions">
              <button className="admin-button" type="submit">
                Upload image
              </button>
              <Link className="secondary-button" href="/admin/product">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <section className="admin-card upload-result-card">
          <span>Uploaded path</span>
          {uploadedPath ? (
            <>
              <code>{uploadedPath}</code>
              <img src={uploadedPath} alt="Uploaded product preview" />
              <Link className="admin-button" href={`/admin/product?uploaded=${encodeURIComponent(uploadedPath)}`}>
                Use on product
              </Link>
            </>
          ) : (
            <p>Upload an image to get a product image path.</p>
          )}
        </section>
      </div>
    </>
  );
}
