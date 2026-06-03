import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";

export const dynamic = "force-dynamic";

export default async function ArticlesAdmin() {
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  const appUrl = await requestBaseUrl();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">文章</h1>
      </header>
      <section className="admin-card">
        <form className="admin-form" action="/api/admin/articles" method="post">
          <div className="admin-grid">
            <label>
              链接标识
              <input name="slug" placeholder="例如：about" required />
            </label>
            <label>
              标题
              <input name="title" placeholder="关于这个小店" required />
            </label>
          </div>
          <label>
            Markdown
            <textarea name="content" required />
          </label>
          <label>
            <span>
              <input name="published" type="checkbox" defaultChecked /> 发布
            </span>
          </label>
          <button className="admin-button" type="submit">
            创建文章
          </button>
        </form>
      </section>
      <section className="admin-card" style={{ marginTop: 18 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>链接标识</th>
              <th>公开链接</th>
              <th>状态</th>
              <th>操作</th>
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
                  <td>{article.published ? "已发布" : "草稿"}</td>
                  <td>
                    <Link href={`/admin/articles/${article.id}`}>编辑</Link>{" "}
                    <form action="/api/admin/articles/delete" method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={article.id} />
                      <button type="submit">删除</button>
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
