import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { SelectionPageForm } from "../SelectionPageForm";

export const dynamic = "force-dynamic";

export default async function EditSelectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const [page, baseUrl] = await Promise.all([
    prisma.selectionPage.findUnique({
      where: { id },
      include: {
        _count: { select: { items: true, submissions: true } },
      },
    }),
    requestBaseUrl(),
  ]);
  if (!page) notFound();

  const publicPath = `/select/${page.slug}`;
  const publicUrl = new URL(publicPath, baseUrl).toString();

  return (
    <>
      <header className="admin-header">
        <h1 className="display">编辑选品单</h1>
        <div className="admin-actions">
          <Link className="secondary-button" href="/admin/selection-pages">
            返回列表
          </Link>
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}/items`}>
            选品项 {page._count.items}
          </Link>
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}/submissions`}>
            查看提交 {page._count.submissions}
          </Link>
        </div>
      </header>

      <section className="admin-card article-public-card">
        <div>
          <span>公开选品链接</span>
          <a href={publicPath} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
        <CopyLinkButton value={publicUrl} />
      </section>

      <section className="selection-admin-layout">
        <div className="section-title-row">
          <div>
            <h2>页面设置</h2>
            <p>控制客户看到的标题、介绍、字段必填规则和展示方式。选品项请进入单独页面维护。</p>
          </div>
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}/items`}>
            管理选品项
          </Link>
        </div>
        {query.error === "save" ? <div className="admin-notice">保存失败，请检查链接标识是否重复或稍后重试。</div> : null}
        <SelectionPageForm page={page} />
      </section>
    </>
  );
}
