import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";

export const dynamic = "force-dynamic";

export default async function SelectionPagesAdmin() {
  const [pages, baseUrl] = await Promise.all([
    prisma.selectionPage.findMany({
      include: { _count: { select: { items: true, submissions: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    requestBaseUrl(),
  ]);

  return (
    <>
      <header className="admin-header">
        <h1 className="display">选品单</h1>
        <Link className="admin-button" href="/admin/selection-pages/new">
          新建选品单
        </Link>
      </header>
      <section className="admin-card">
        {pages.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>公开链接</th>
                <th>状态</th>
                <th>选品项</th>
                <th>提交</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const publicPath = `/select/${page.slug}`;
                const publicUrl = new URL(publicPath, baseUrl).toString();

                return (
                  <tr key={page.id}>
                    <td>
                      <strong>{page.title}</strong>
                      <span className="admin-table-subtext">{page.slug}</span>
                    </td>
                    <td>
                      <div className="article-link-cell">
                        <a href={publicPath} target="_blank" rel="noreferrer">
                          {publicUrl}
                        </a>
                        <CopyLinkButton value={publicUrl} compact />
                      </div>
                    </td>
                    <td>{page.isPublished ? "已启用" : "草稿"}</td>
                    <td>{page._count.items}</td>
                    <td>{page._count.submissions}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="table-action-button" href={`/admin/selection-pages/${page.id}`}>
                          编辑
                        </Link>
                        <Link className="table-action-button" href={`/admin/selection-pages/${page.id}/submissions`}>
                          查看提交
                        </Link>
                        <form action="/api/admin/selection-pages/delete" method="post">
                          <input type="hidden" name="id" value={page.id} />
                          <SubmitButton className="table-action-button danger" loadingText="删除中...">
                            删除
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            还没有选品单。先创建一个页面，添加图片选品项后就可以把链接发给客户。
          </div>
        )}
      </section>
    </>
  );
}
