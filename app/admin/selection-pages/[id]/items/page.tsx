import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Download, Settings, Upload } from "lucide-react";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { formatCurrency } from "@/lib/format";
import { listUploadedImages } from "@/lib/uploads";
import { SelectionImportDialog } from "../../SelectionImportDialog";
import { SelectionItemDialog } from "../../SelectionItemDialog";
import { SelectionItemDeleteForm } from "../../SelectionItemDeleteForm";
import { SelectionItemPreviewButton } from "../../SelectionItemPreviewButton";

export const dynamic = "force-dynamic";

export default async function SelectionPageItems({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const [page, uploadedImages, baseUrl] = await Promise.all([
    prisma.selectionPage.findUnique({
      where: { id },
      include: {
        items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] },
        submissions: {
          select: { items: { select: { itemId: true } } },
        },
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
  const imported = typeof query.imported === "string" ? query.imported : "";
  const skipped = typeof query.skipped === "string" ? query.skipped : "";
  const importError = typeof query.error === "string" ? query.error : "";
  const selectedCounts = page.submissions.reduce<Record<string, number>>((counts, submission) => {
    for (const item of submission.items) {
      if (!item.itemId) continue;
      counts[item.itemId] = (counts[item.itemId] || 0) + 1;
    }
    return counts;
  }, {});

  return (
    <>
      <header className="admin-header selection-items-header">
        <div>
          <span className="admin-kicker">Selection items</span>
          <h1 className="display">选品项</h1>
          <p>{page.title}</p>
        </div>
        <div className="admin-actions">
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}`}>
            <Settings size={16} />
            页面设置
          </Link>
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}/submissions`}>
            <ClipboardList size={16} />
            提交 {page._count.submissions}
          </Link>
          <Link className="secondary-button" href="/admin/selection-pages">
            <ArrowLeft size={16} />
            返回列表
          </Link>
        </div>
      </header>

      {imported ? (
        <div className="admin-notice">
          {importError === "template"
            ? "导入失败：请使用从本页导出的选品项 Excel 模板，不要直接上传其它 Excel。"
            : importError
              ? "导入失败：请检查 Excel 文件后重试。"
              : `已导入 ${imported} 个选品项${skipped && skipped !== "0" ? `，跳过 ${skipped} 行没有图片的数据` : ""}。`}
        </div>
      ) : null}

      <section className="admin-card selection-items-toolbar">
        <div className="selection-items-link">
          <span>公开链接</span>
          <a href={publicPath} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
        <div className="selection-items-toolbar-actions">
          <CopyLinkButton value={publicUrl} />
          <a className="secondary-button" href={`/api/admin/selection-items/export?pageId=${page.id}`}>
            <Download size={16} />
            导出 Excel
          </a>
          <SelectionImportDialog pageId={page.id} />
          <SelectionItemDialog item={{ pageId: page.id }} uploadedImages={imageOptions} triggerLabel="添加选品项" />
          <Link className="secondary-button" href="/admin/upload">
            <Upload size={16} />
            上传图片
          </Link>
        </div>
      </section>

      <section className="selection-item-editor-list">
        <div className="section-title-row selection-items-list-head">
          <div>
            <h2>当前选品项</h2>
            <p>客户页面按排序从小到大展示；导入 Excel 时，图片列可直接粘贴图片。</p>
          </div>
          <strong>{page.items.length} items</strong>
        </div>
        {page.items.length ? (
          <div className="selection-item-admin-grid">
            {page.items.map((item) => {
              const itemLabel = item.title.trim() || "未填写标签";
              const priceLabel = item.price === null ? "" : formatCurrency(item.price, item.currency);
              const selectedCount = selectedCounts[item.id] || 0;

              return (
                <article className="admin-card selection-item-admin-card" key={item.id}>
                  <div className="selection-item-admin-preview">
                    <SelectionItemPreviewButton
                      imageUrl={item.imageUrl}
                      title={item.title}
                      description={item.description}
                      detail={priceLabel}
                    />
                    <div>
                      {item.description ? <p>{item.description}</p> : null}
                      <small>
                        排序 {item.sortOrder} · {item.isActive ? "显示中" : "已隐藏"} · 数量 {item.minQuantity}-{item.maxQuantity}
                        {selectedCount ? ` · 已被选择 ${selectedCount} 次` : ""}
                      </small>
                    </div>
                  </div>
                  <div className="selection-item-card-actions">
                    <SelectionItemDialog
                      item={item}
                      uploadedImages={imageOptions}
                      selectedCount={selectedCount}
                      triggerClassName="table-action-button"
                      triggerLabel="编辑"
                    />
                    <SelectionItemDeleteForm itemId={item.id} selectedCount={selectedCount} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">还没有选品项。可以添加单个选品项，也可以导入 Excel 批量创建。</div>
        )}
      </section>
    </>
  );
}
