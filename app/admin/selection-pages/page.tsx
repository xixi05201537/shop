import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { getConfigValues } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatCurrency, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { selectionCheckoutNumber, normalizeSelectionCheckoutStatus, selectionCheckoutStatusLabel } from "@/lib/selection-checkout";
import { selectionSubmissionNumber } from "@/lib/selection";
import { normalizeSelectionSubmissionStatus, selectionSubmissionStatusLabel } from "@/lib/selection-status";
import { PageSizeSelect } from "../orders/PageSizeSelect";
import { SelectionCheckoutDialog } from "./submissions/SelectionCheckoutDialog";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

type SelectionPageSearchParams = {
  tab?: string;
  q?: string;
  page?: string;
  pageSize?: string;
  checkoutToken?: string;
  checkoutError?: string;
  emailStatus?: string;
};

function pageSizeFromQuery(value?: string) {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : 10;
}

function queryWithoutPage(params: SelectionPageSearchParams) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === "page") continue;
    next.set(key, value);
  }
  return next.toString();
}

export default async function SelectionPagesAdmin({
  searchParams,
}: {
  searchParams: Promise<SelectionPageSearchParams>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "submissions" ? "submissions" : "pages";
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
        {activeTab === "pages" ? (
          <Link className="admin-button" href="/admin/selection-pages/new">
            新建选品单
          </Link>
        ) : null}
      </header>

      <section className="admin-card tab-card selection-pages-tabs-card">
        <div className="admin-tabs selection-pages-tabs" role="tablist" aria-label="选品单管理">
          <Link aria-selected={activeTab === "pages"} className={activeTab === "pages" ? "is-active" : ""} href="/admin/selection-pages" role="tab">
            选品单
          </Link>
          <Link
            aria-selected={activeTab === "submissions"}
            className={activeTab === "submissions" ? "is-active" : ""}
            href="/admin/selection-pages?tab=submissions"
            role="tab"
          >
            客户提交
          </Link>
        </div>

        {activeTab === "pages" ? <SelectionPagesTable pages={pages} baseUrl={baseUrl} /> : <SelectionSubmissionsTab params={params} baseUrl={baseUrl} />}
      </section>
    </>
  );
}

function SelectionPagesTable({
  pages,
  baseUrl,
}: {
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    _count: { items: number; submissions: number };
  }>;
  baseUrl: string;
}) {
  return pages.length ? (
    <div className="selection-tab-panel">
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
                      设置
                    </Link>
                    <Link className="table-action-button" href={`/admin/selection-pages/${page.id}/items`}>
                      选品项
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
    </div>
  ) : (
    <div className="empty-state">还没有选品单。先创建一个页面，添加图片选品项后就可以把链接发给客户。</div>
  );
}

async function SelectionSubmissionsTab({
  params,
  baseUrl,
}: {
  params: SelectionPageSearchParams;
  baseUrl: string;
}) {
  const query = params.q?.trim() || "";
  const normalizedReferenceQuery = query.replace(/^SEL-/i, "");
  const idSearchTerms = Array.from(new Set([query, normalizedReferenceQuery].filter((item) => item.length > 0)));
  const submissionWhere = query
    ? {
        OR: [
          ...idSearchTerms.map((term) => ({ id: { contains: term } })),
          { page: { title: { contains: query } } },
          { customerName: { contains: query } },
          { customerEmail: { contains: query } },
          { customerContact: { contains: query } },
          { note: { contains: query } },
          { items: { some: { titleSnapshot: { contains: query } } } },
        ],
      }
    : undefined;
  const pageSize = pageSizeFromQuery(params.pageSize);
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const pageQuery = queryWithoutPage({ ...params, tab: "submissions" });
  const [totalSubmissions, config, checkout] = await Promise.all([
    prisma.selectionSubmission.count({ where: submissionWhere }),
    getConfigValues(["displayTimeZone"]),
    params.checkoutToken
      ? prisma.selectionCheckout.findUnique({ where: { token: params.checkoutToken }, select: { token: true, totalAmount: true, totalQuantity: true, status: true } })
      : null,
  ]);
  const totalPages = Math.max(1, Math.ceil(totalSubmissions / pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const pageStart = totalSubmissions ? (safePage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(safePage * pageSize, totalSubmissions);
  const submissions = await prisma.selectionSubmission.findMany({
    where: submissionWhere,
    include: {
      page: { select: { id: true, title: true, slug: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });
  const submissionCheckoutLinks = submissions.length
    ? await prisma.selectionCheckoutSubmission.findMany({
        where: { submissionId: { in: submissions.map((submission) => submission.id) } },
        include: { checkout: true },
      })
    : [];
  const checkoutsBySubmissionId = new Map<string, typeof submissionCheckoutLinks>();
  for (const link of submissionCheckoutLinks) {
    checkoutsBySubmissionId.set(link.submissionId, [...(checkoutsBySubmissionId.get(link.submissionId) || []), link]);
  }
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const checkoutUrl = checkout ? new URL(`/select/checkout/${checkout.token}`, baseUrl).toString() : "";
  const submissionRows = submissions.map((submission) => {
    const checkouts = checkoutsBySubmissionId.get(submission.id) || [];
    const pricedTotal = submission.items.reduce((sum, item) => {
      if (typeof item.lineTotal === "number") return sum + item.lineTotal;
      if (typeof item.priceSnapshot === "number") return sum + item.priceSnapshot * item.quantity;
      return sum;
    }, 0);
    const hasPricedItems = submission.items.some((item) => typeof item.priceSnapshot === "number");
    const hasUnpricedItems = submission.items.some((item) => item.priceSnapshot === null || item.lineTotal === null);
    const estimatedAmount = typeof submission.totalAmount === "number" ? submission.totalAmount : hasPricedItems ? pricedTotal : null;
    const pendingCheckout = checkouts
      .map((entry) => entry.checkout)
      .find((entry) => normalizeSelectionCheckoutStatus(entry.status) === "pending");
    return {
      submission,
      checkouts,
      hasUnpricedItems,
      estimatedAmount,
      pendingCheckout,
      mergeable: canGenerateCheckout({ status: submission.status, items: submission.items, checkouts }),
    };
  });

  function pageHref(nextPage: number) {
    const next = new URLSearchParams(pageQuery);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    return `/admin/selection-pages${next.toString() ? `?${next.toString()}` : "?tab=submissions"}`;
  }

  return (
    <div className="selection-tab-panel selection-submissions-tab-panel">
      {checkout ? (
        <section className="selection-checkout-created">
          <div>
            <span>已生成合并付款链接</span>
            <strong>{selectionCheckoutNumber(checkout.token)}</strong>
            <small>
              {checkout.totalQuantity} 件，{formatCurrency(checkout.totalAmount)}，{selectionCheckoutStatusLabel(checkout.status)}
            </small>
          </div>
          <a href={`/select/checkout/${checkout.token}`} target="_blank" rel="noreferrer">
            {checkoutUrl}
          </a>
          <CopyLinkButton value={checkoutUrl} label="复制客户链接" compact />
        </section>
      ) : null}

      {params.checkoutError ? <div className="admin-notice">{params.checkoutError}</div> : null}

      <section className="selection-submission-head selection-global-submission-head">
        <div>
          <span>列表范围</span>
          <strong>{query ? "搜索结果" : "全部选品单"}</strong>
        </div>
        <div>
          <span>显示记录</span>
          <strong>{totalSubmissions}</strong>
        </div>
        <div>
          <span>可生成付款</span>
          <strong>{submissionRows.filter((row) => row.mergeable).length}</strong>
        </div>
      </section>

      <form className="selection-submission-search" action="/admin/selection-pages" method="get">
        <input type="hidden" name="tab" value="submissions" />
        <input type="hidden" name="pageSize" value={String(pageSize)} />
        <label>
          搜索提交
          <input name="q" defaultValue={query} placeholder="编号、选品单、客户、邮箱、联系方式、备注或选品标签" />
        </label>
        <button className="admin-button" type="submit">
          搜索
        </button>
        {query ? (
          <Link className="secondary-button" href={`/admin/selection-pages?tab=submissions&pageSize=${pageSize}`}>
            清除
          </Link>
        ) : null}
      </form>

      {submissions.length ? (
        <section className="selection-global-submission-form" data-selection-checkout-form>
          <div className="selection-global-batch-bar">
            <div>
              <strong>发送给客户付款</strong>
              <span>勾选已确认记录，确认总价和邮件后生成付款链接。</span>
            </div>
            <SelectionCheckoutDialog
              submissions={submissionRows
                .filter((row) => row.mergeable)
                .map((row) => ({
                  id: row.submission.id,
                  reference: selectionSubmissionNumber(row.submission.id),
                  title: row.submission.page.title,
                  customer: row.submission.customerName || "未填写",
                  email: row.submission.customerEmail || "",
                  quantity: row.submission.totalQuantity,
                  amount: row.estimatedAmount,
                  hasUnpricedItems: row.hasUnpricedItems,
                }))}
            />
          </div>
          <table className="admin-table selection-submissions-table selection-global-submissions-table">
            <thead>
              <tr>
                <th>选择</th>
                <th>编号</th>
                <th>选品单</th>
                <th>提交时间</th>
                <th>客户</th>
                <th>状态</th>
                <th>数量</th>
                <th>金额</th>
                <th>付款链接</th>
                <th>选品预览</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {submissionRows.map(({ submission, hasUnpricedItems, estimatedAmount, pendingCheckout, mergeable, checkouts }) => {
                const reference = selectionSubmissionNumber(submission.id);
                const detailPath = `/admin/selection-pages/${submission.page.id}/submissions/${submission.id}`;
                const publicPath = `/select/${submission.page.slug}/submission/${submission.id}`;
                const publicUrl = new URL(publicPath, baseUrl).toString();
                const normalizedStatus = normalizeSelectionSubmissionStatus(submission.status);

                return (
                  <tr className="selection-submission-table-row" key={submission.id}>
                    <td>
                      <label className={mergeable ? "selection-row-checkbox" : "selection-row-checkbox is-disabled"} title={mergeBlockReason({ status: submission.status, items: submission.items, checkouts })}>
                        <input type="checkbox" name="submissionIds" value={submission.id} disabled={!mergeable} />
                        <span>{mergeable ? "勾选" : "不可选"}</span>
                      </label>
                    </td>
                    <td>
                      <Link className="selection-submission-ref" href={detailPath}>
                        {reference}
                      </Link>
                    </td>
                    <td>
                      <Link className="selection-submission-ref" href={`/admin/selection-pages/${submission.page.id}/submissions`}>
                        {submission.page.title}
                      </Link>
                    </td>
                    <td>
                      <span className="orders-table-ellipsis" title={formatDateTimeWithOffset(submission.createdAt, displayTimeZone)}>
                        {formatDateTimeWithOffset(submission.createdAt, displayTimeZone)}
                      </span>
                    </td>
                    <td>
                      <strong>{submission.customerName || "未填写"}</strong>
                      <span className="admin-table-subtext">{submission.customerEmail || submission.customerContact || "无联系方式"}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-selection-${normalizedStatus}`}>
                        {selectionSubmissionStatusLabel(submission.status)}
                      </span>
                    </td>
                    <td>{submission.totalQuantity}</td>
                    <td>
                      <span className="selection-submission-amount">
                        {estimatedAmount === null ? "未设置价格" : formatCurrency(estimatedAmount)}
                        {estimatedAmount !== null && hasUnpricedItems ? <small>部分未计价</small> : null}
                      </span>
                    </td>
                    <td>
                      {pendingCheckout ? (
                        <Link className="selection-checkout-pill" href={`/select/checkout/${pendingCheckout.token}`} target="_blank">
                          {selectionCheckoutNumber(pendingCheckout.token)}
                        </Link>
                      ) : (
                        <span className="admin-table-subtext">未生成</span>
                      )}
                    </td>
                    <td>
                      <div className="selection-submission-preview">
                        {submission.items.slice(0, 4).map((item) => {
                          const itemLabel = item.titleSnapshot.trim() || "未填写标签";

                          return (
                            <span key={item.id} title={`${itemLabel} x ${item.quantity}`}>
                              <img src={item.imageSnapshot} alt={itemLabel} />
                              <strong>{item.quantity}</strong>
                            </span>
                          );
                        })}
                        {submission.items.length > 4 ? <em>+{submission.items.length - 4}</em> : null}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link className="table-action-button" href={detailPath}>
                          详情
                        </Link>
                        <CopyLinkButton value={publicUrl} label="复制" compact />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="admin-pagination">
            <span>{totalSubmissions ? `${pageStart}-${pageEnd} / ${totalSubmissions} 条` : "暂无客户提交"}</span>
            <div>
              {safePage > 1 ? (
                <Link className="secondary-button" href={pageHref(safePage - 1)}>
                  上一页
                </Link>
              ) : (
                <span className="secondary-button is-disabled">上一页</span>
              )}
              <strong>
                第 {safePage} / {totalPages} 页
              </strong>
              {safePage < totalPages ? (
                <Link className="secondary-button" href={pageHref(safePage + 1)}>
                  下一页
                </Link>
              ) : (
                <span className="secondary-button is-disabled">下一页</span>
              )}
            </div>
            <PageSizeSelect pageSize={pageSize} queryString={pageQuery} basePath="/admin/selection-pages" ariaLabel="每页显示客户提交数量" />
          </div>
        </section>
      ) : (
        <div className="empty-state">{query ? "没有匹配的客户提交。" : "还没有客户提交。"}</div>
      )}
    </div>
  );
}

function canGenerateCheckout(submission: {
  status: string;
  items: Array<{ priceSnapshot: number | null; lineTotal: number | null }>;
  checkouts: Array<{ checkout: { status: string } }>;
}) {
  return (
    normalizeSelectionSubmissionStatus(submission.status) === "confirmed" &&
    submission.items.length > 0 &&
    !submission.checkouts.some(({ checkout }) => normalizeSelectionCheckoutStatus(checkout.status) === "pending")
  );
}

function mergeBlockReason(submission: {
  status: string;
  items: Array<{ priceSnapshot: number | null; lineTotal: number | null }>;
  checkouts: Array<{ checkout: { status: string } }>;
}) {
  if (normalizeSelectionSubmissionStatus(submission.status) !== "confirmed") return "只有已确认记录可以生成付款链接。";
  if (submission.checkouts.some(({ checkout }) => normalizeSelectionCheckoutStatus(checkout.status) === "pending")) return "已有待付款链接。";
  if (!submission.items.length) return "没有选品明细。";
  if (submission.items.some((item) => item.priceSnapshot === null || item.lineTotal === null)) return "可生成，生成时需要手动填写总价。";
  return "可以生成付款链接。";
}
