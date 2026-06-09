import Link from "next/link";
import { countAuditLogs, listAuditLogs } from "@/lib/audit-log";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const requestedPage = Math.max(1, Number(query.page) || 1);
  const [totalLogs, config] = await Promise.all([countAuditLogs(), getConfigMap()]);
  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);
  const logs = await listAuditLogs({ skip: (safePage - 1) * PAGE_SIZE, take: PAGE_SIZE });
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);

  function pageHref(nextPage: number) {
    return nextPage > 1 ? `/admin/audit-logs?page=${nextPage}` : "/admin/audit-logs";
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">操作日志</h1>
          <p>查看后台保存配置、发货、重发邮件、备注和图片操作记录。</p>
        </div>
        <Link className="secondary-button" href="/admin">
          返回概览
        </Link>
      </header>
      <section className="admin-card dashboard-panel">
        {logs.length ? (
          <div className="audit-log-list audit-log-list-full">
            {logs.map((log) => (
              <div className="audit-log-row" key={log.id}>
                <strong>{log.summary}</strong>
                <span>{formatDateTimeWithOffset(log.createdAt, displayTimeZone)} · {log.action}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无操作记录。</div>
        )}
        <div className="admin-pagination">
          <span>{totalLogs ? `第 ${safePage} / ${totalPages} 页，共 ${totalLogs} 条` : "暂无操作记录"}</span>
          <div>
            {safePage > 1 ? (
              <Link className="secondary-button" href={pageHref(safePage - 1)}>
                上一页
              </Link>
            ) : (
              <span className="secondary-button is-disabled">上一页</span>
            )}
            {safePage < totalPages ? (
              <Link className="secondary-button" href={pageHref(safePage + 1)}>
                下一页
              </Link>
            ) : (
              <span className="secondary-button is-disabled">下一页</span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
