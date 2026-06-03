import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";

export const dynamic = "force-dynamic";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();
  const appUrl = await requestBaseUrl();
  const publicPath = `/article/${article.slug}`;
  const publicUrl = new URL(publicPath, appUrl).toString();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">编辑文章</h1>
      </header>
      <section className="admin-card article-public-card">
        <div>
          <span>公开文章链接</span>
          <a href={publicPath} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
        <CopyLinkButton value={publicUrl} />
      </section>
      <form className="admin-card admin-form" action="/api/admin/articles" method="post">
        <input type="hidden" name="id" value={article.id} />
        <div className="admin-grid">
          <label>
            链接标识
            <input name="slug" defaultValue={article.slug} required />
          </label>
          <label>
            标题
            <input name="title" defaultValue={article.title} required />
          </label>
        </div>
        <label>
          Markdown
          <textarea name="content" defaultValue={article.content} required />
        </label>
        <label>
          <span>
            <input name="published" type="checkbox" defaultChecked={article.published} /> 发布
          </span>
        </label>
        <button className="admin-button" type="submit">
          保存文章
        </button>
      </form>
    </>
  );
}
