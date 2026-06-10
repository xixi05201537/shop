import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { formatCurrency } from "@/lib/format";
import { listUploadedImages } from "@/lib/uploads";
import { SelectionItemForm } from "../SelectionItemForm";
import { SelectionPageForm } from "../SelectionPageForm";

export const dynamic = "force-dynamic";

export default async function EditSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, uploadedImages, baseUrl] = await Promise.all([
    prisma.selectionPage.findUnique({
      where: { id },
      include: {
        items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] },
        _count: { select: { submissions: true } },
      },
    }),
    listUploadedImages(),
    requestBaseUrl(),
  ]);
  if (!page) notFound();

  const publicPath = `/select/${page.slug}`;
  const publicUrl = new URL(publicPath, baseUrl).toString();
  const imageOptions = uploadedImages.map((image) => ({ name: image.name, path: image.path }));

  return (
    <>
      <header className="admin-header">
        <h1 className="display">编辑选品单</h1>
        <div className="admin-actions">
          <Link className="secondary-button" href="/admin/selection-pages">
            返回列表
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
            <p>控制客户看到的标题、介绍、字段必填规则和展示方式。先添加图片选品项，再复制公开链接发给客户；客户提交后在“查看提交”里看每张图和数量。</p>
          </div>
        </div>
        <SelectionPageForm page={page} />
      </section>

      <section className="admin-card selection-item-create-card">
        <div className="section-title-row">
          <div>
            <h2>添加选品项</h2>
            <p>图片、介绍、价格都会显示在客户页面；介绍和价格可以不填。</p>
          </div>
          <Link className="secondary-button" href="/admin/upload">
            上传图片
          </Link>
        </div>
        <SelectionItemForm item={{ pageId: page.id }} uploadedImages={imageOptions} />
      </section>

      <section className="selection-item-editor-list">
        <div className="section-title-row">
          <div>
            <h2>当前选品项</h2>
            <p>客户页面会按排序从小到大展示，图片高度不同也会自动形成瀑布流。</p>
          </div>
        </div>
        {page.items.length ? (
          <div className="selection-item-admin-grid">
            {page.items.map((item) => (
              <article className="admin-card selection-item-admin-card" key={item.id}>
                <div className="selection-item-admin-preview">
                  <img src={item.imageUrl} alt={item.title} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.price === null ? "未设置价格" : formatCurrency(item.price, item.currency)}</span>
                  </div>
                </div>
                <details className="selection-item-edit-details">
                  <summary>编辑选品项</summary>
                  <SelectionItemForm item={item} uploadedImages={imageOptions} mode="edit" />
                  <form className="selection-delete-form" action="/api/admin/selection-items/delete" method="post">
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton className="table-action-button danger" loadingText="删除中...">
                      删除这个选品项
                    </SubmitButton>
                  </form>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">还没有选品项。添加第一张图片后，客户页面就有内容了。</div>
        )}
      </section>
    </>
  );
}
