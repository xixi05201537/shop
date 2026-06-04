import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { NewArticleDialog } from "./NewArticleDialog";

export const dynamic = "force-dynamic";

export default async function ArticlesAdmin() {
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  const appUrl = await requestBaseUrl();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">文章</h1>
        <NewArticleDialog />
      </header>
      <section className="admin-card">
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
                    <div className="table-actions">
                      <Link className="table-action-button" href={`/admin/articles/${article.id}`}>
                        编辑
                      </Link>
                      <form action="/api/admin/articles/delete" method="post">
                        <input type="hidden" name="id" value={article.id} />
                        <button className="table-action-button danger" type="submit">
                          删除
                        </button>
                      </form>
                    </div>
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
