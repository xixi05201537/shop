import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { getConfigValues } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DISPLAY_TIME_ZONE, formatCurrency, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { requestBaseUrl } from "@/lib/request-url";
import { selectionSubmissionNumber } from "@/lib/selection";

export const dynamic = "force-dynamic";

export default async function SelectionSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams).q?.trim() || "";
  const normalizedReferenceQuery = query.replace(/^SEL-/i, "");
  const idSearchTerms = Array.from(new Set([query, normalizedReferenceQuery].filter((item) => item.length > 0)));
  const submissionWhere = query
    ? {
        OR: [
          ...idSearchTerms.map((term) => ({ id: { contains: term } })),
          { customerName: { contains: query } },
          { customerEmail: { contains: query } },
          { customerContact: { contains: query } },
          { note: { contains: query } },
          { items: { some: { titleSnapshot: { contains: query } } } },
        ],
      }
    : undefined;
  const [page, config, baseUrl] = await Promise.all([
    prisma.selectionPage.findUnique({
      where: { id },
      include: {
        submissions: {
          where: submissionWhere,
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { submissions: true } },
      },
    }),
    getConfigValues(["displayTimeZone"]),
    requestBaseUrl(),
  ]);
  if (!page) notFound();
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);

  return (
    <>
      <header className="admin-header">
        <h1 className="display">客户提交</h1>
        <div className="admin-actions">
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}`}>
            返回编辑
          </Link>
          <Link className="secondary-button" href="/admin/selection-pages">
            返回列表
          </Link>
        </div>
      </header>

      <section className="admin-card selection-submission-head">
        <div>
          <span>选品单</span>
          <strong>{page.title}</strong>
        </div>
        <div>
          <span>提交数量</span>
          <strong>{query ? `${page.submissions.length} / ${page._count.submissions}` : page._count.submissions}</strong>
        </div>
      </section>

      <form className="admin-card selection-submission-search" action={`/admin/selection-pages/${page.id}/submissions`} method="get">
        <label>
          搜索提交
          <input name="q" defaultValue={query} placeholder="编号、客户、邮箱、联系方式、备注或选品标签" />
        </label>
        <button className="admin-button" type="submit">
          搜索
        </button>
        {query ? (
          <Link className="secondary-button" href={`/admin/selection-pages/${page.id}/submissions`}>
            清除
          </Link>
        ) : null}
      </form>

      {page.submissions.length ? (
        <section className="admin-card">
          <table className="admin-table selection-submissions-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>提交时间</th>
                <th>客户</th>
                <th>邮箱</th>
                <th>联系方式</th>
                <th>数量</th>
                <th>预估金额</th>
                <th>选品预览</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {page.submissions.map((submission) => {
                const pricedTotal = submission.items.reduce((sum, item) => {
                  if (typeof item.lineTotal === "number") return sum + item.lineTotal;
                  if (typeof item.priceSnapshot === "number") return sum + item.priceSnapshot * item.quantity;
                  return sum;
                }, 0);
                const hasPricedItems = submission.items.some((item) => typeof item.priceSnapshot === "number");
                const hasUnpricedItems = submission.items.some((item) => item.priceSnapshot === null);
                const estimatedAmount = typeof submission.totalAmount === "number" ? submission.totalAmount : hasPricedItems ? pricedTotal : null;
                const reference = selectionSubmissionNumber(submission.id);
                const detailPath = `/admin/selection-pages/${page.id}/submissions/${submission.id}`;
                const publicPath = `/select/${page.slug}/submission/${submission.id}`;
                const publicUrl = new URL(publicPath, baseUrl).toString();

                return (
                  <tr className="selection-submission-table-row" key={submission.id}>
                    <td>
                      <Link className="selection-submission-ref" href={detailPath}>
                        {reference}
                      </Link>
                    </td>
                    <td>
                      <span className="orders-table-ellipsis" title={formatDateTimeWithOffset(submission.createdAt, displayTimeZone)}>
                        {formatDateTimeWithOffset(submission.createdAt, displayTimeZone)}
                      </span>
                    </td>
                    <td>{submission.customerName || "未填写"}</td>
                    <td>
                      <span className="orders-table-ellipsis" title={submission.customerEmail || "未填写"}>
                        {submission.customerEmail || "未填写"}
                      </span>
                    </td>
                    <td>
                      <span className="orders-table-ellipsis" title={submission.customerContact || "未填写"}>
                        {submission.customerContact || "未填写"}
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
                          查看详情
                        </Link>
                        <a className="table-action-button" href={publicPath} target="_blank" rel="noreferrer">
                          客户链接
                        </a>
                        <CopyLinkButton value={publicUrl} label="复制" compact />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="empty-state">{query ? "没有匹配的客户提交。" : "还没有客户提交。"}</div>
      )}
    </>
  );
}
