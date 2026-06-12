import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { getConfigValues } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatCurrency, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { selectionSubmissionNumber } from "@/lib/selection";
import { normalizeSelectionSubmissionStatus, selectionSubmissionStatuses, selectionSubmissionStatusLabel } from "@/lib/selection-status";
import { SubmissionItemsPreview } from "./SubmissionItemsPreview";

export const dynamic = "force-dynamic";

export default async function SelectionSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const [submission, config, baseUrl] = await Promise.all([
    prisma.selectionSubmission.findFirst({
      where: { id: submissionId, pageId: id },
      include: {
        page: true,
        items: {
          orderBy: { id: "asc" },
        },
      },
    }),
    getConfigValues(["displayTimeZone"]),
    requestBaseUrl(),
  ]);

  if (!submission) notFound();

  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);
  const pricedTotal = submission.items.reduce((sum, item) => {
    if (typeof item.lineTotal === "number") return sum + item.lineTotal;
    if (typeof item.priceSnapshot === "number") return sum + item.priceSnapshot * item.quantity;
    return sum;
  }, 0);
  const hasPricedItems = submission.items.some((item) => typeof item.priceSnapshot === "number");
  const hasUnpricedItems = submission.items.some((item) => item.priceSnapshot === null);
  const estimatedAmount = typeof submission.totalAmount === "number" ? submission.totalAmount : hasPricedItems ? pricedTotal : null;
  const publicPath = `/select/${submission.page.slug}/submission/${submission.id}`;
  const publicUrl = new URL(publicPath, baseUrl).toString();
  const reference = selectionSubmissionNumber(submission.id);
  const normalizedStatus = normalizeSelectionSubmissionStatus(submission.status);

  return (
    <div className="selection-submission-detail-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">客户提交详情</span>
          <h1 className="display">{reference}</h1>
        </div>
        <div className="admin-actions">
          <Link className="secondary-button" href={`/admin/selection-pages/${submission.pageId}/submissions`}>
            返回提交列表
          </Link>
          <Link className="secondary-button" href={`/admin/selection-pages/${submission.pageId}`}>
            返回编辑
          </Link>
        </div>
      </header>

      <section className="admin-card selection-submission-detail-head">
        <div>
          <span>选品单</span>
          <strong>{submission.page.title}</strong>
        </div>
        <div>
          <span>客户链接</span>
          <strong>
            <a href={publicPath} target="_blank" rel="noreferrer">
              打开客户链接
            </a>
            <CopyLinkButton value={publicUrl} label="复制客户链接" compact />
          </strong>
        </div>
      </section>

      <section className="admin-card selection-submission-meta selection-submission-detail-meta">
        <div>
          <span>编号</span>
          <strong>{reference}</strong>
        </div>
        <div>
          <span>提交时间</span>
          <strong>{formatDateTimeWithOffset(submission.createdAt, displayTimeZone)}</strong>
        </div>
        <div>
          <span>客户</span>
          <strong>{submission.customerName || "未填写"}</strong>
        </div>
        <div>
          <span>邮箱</span>
          <strong>{submission.customerEmail || "未填写"}</strong>
        </div>
        <div>
          <span>联系方式</span>
          <strong>{submission.customerContact || "未填写"}</strong>
        </div>
        <div>
          <span>合计数量</span>
          <strong>{submission.totalQuantity}</strong>
        </div>
        <div>
          <span>状态</span>
          <strong>
            <span className={`status-badge status-selection-${normalizedStatus}`}>
              {selectionSubmissionStatusLabel(submission.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>预估金额</span>
          <strong>
            {estimatedAmount === null ? "未设置价格" : formatCurrency(estimatedAmount)}
            {estimatedAmount !== null && hasUnpricedItems ? <small>部分未计价</small> : null}
          </strong>
        </div>
      </section>

      <section className="admin-card selection-submission-status-card">
        <div>
          <h2>提交状态</h2>
          <p>只有待确认状态允许客户继续修改；已确认、已付款、已完成、已取消都会锁定客户链接。</p>
        </div>
        <form action="/api/admin/selection-submissions/status" method="post">
          <input type="hidden" name="id" value={submission.id} />
          <input type="hidden" name="returnTo" value={`/admin/selection-pages/${submission.pageId}/submissions/${submission.id}`} />
          <select name="status" defaultValue={normalizedStatus}>
            {selectionSubmissionStatuses.map((status) => (
              <option value={status} key={status}>
                {selectionSubmissionStatusLabel(status)}
              </option>
            ))}
          </select>
          <button className="admin-button" type="submit">
            更新状态
          </button>
        </form>
      </section>

      {submission.note ? (
        <section className="admin-card">
          <h2>客户备注</h2>
          <p className="selection-submission-note">{submission.note}</p>
        </section>
      ) : null}

      <section className="admin-card selection-submission-detail-section">
        <h2>选品明细</h2>
        <SubmissionItemsPreview
          items={submission.items.map((item) => ({
            id: item.id,
            title: item.titleSnapshot,
            image: item.imageSnapshot,
            description: item.descriptionSnapshot,
            detail: [
              `数量 ${item.quantity}`,
              item.priceSnapshot === null ? "" : formatCurrency(item.priceSnapshot, item.currencySnapshot),
              item.lineTotal === null ? "" : `小计 ${formatCurrency(item.lineTotal, item.currencySnapshot)}`,
            ]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </section>
    </div>
  );
}
