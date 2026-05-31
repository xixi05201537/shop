import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ArticlesAdmin() {
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <>
      <header className="admin-header">
        <h1 className="display">Articles</h1>
      </header>
      <section className="admin-card">
        <form className="admin-form" action="/api/admin/articles" method="post">
          <div className="admin-grid">
            <label>
              Slug
              <input name="slug" placeholder="about" required />
            </label>
            <label>
              Title
              <input name="title" placeholder="About this tiny shop" required />
            </label>
          </div>
          <label>
            Markdown
            <textarea name="content" required />
          </label>
          <label>
            <span>
              <input name="published" type="checkbox" defaultChecked /> Published
            </span>
          </label>
          <button className="admin-button" type="submit">
            Create article
          </button>
        </form>
      </section>
      <section className="admin-card" style={{ marginTop: 18 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Public link</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => {
              const publicPath = `/article/${article.slug}`;
              const publicUrl = new URL(publicPath, appUrl).toString();

              return (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>{article.slug}</td>
                  <td>
                    <div className="article-link-cell">
                      <a href={publicPath} target="_blank" rel="noreferrer">
                        {publicUrl}
                      </a>
                      <CopyLinkButton value={publicUrl} />
                    </div>
                  </td>
                  <td>{article.published ? "Published" : "Draft"}</td>
                  <td>
                    <Link href={`/admin/articles/${article.id}`}>Edit</Link>{" "}
                    <form action="/api/admin/articles/delete" method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={article.id} />
                      <button type="submit">Delete</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
