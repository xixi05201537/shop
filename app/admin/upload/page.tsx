export default function UploadPage() {
  return (
    <>
      <header className="admin-header">
        <h1 className="display">Upload Image</h1>
      </header>
      <section className="admin-card">
        <form className="admin-form" action="/api/admin/product/image" method="post" encType="multipart/form-data">
          <label>
            Product image
            <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
          </label>
          <button className="admin-button" type="submit">
            Upload
          </button>
        </form>
        <p>After upload, copy the returned path into the product page and set image source to Uploaded image.</p>
      </section>
    </>
  );
}
