import Link from "next/link";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { DEFAULT_DISPLAY_TIME_ZONE, formatCurrency, formatDateTimeWithOffset, normalizeDisplayTimeZone } from "@/lib/format";
import { normalizePaymentRequestStatus, paymentRequestNumber, paymentRequestStatusLabel } from "@/lib/payment-request";
import { prisma } from "@/lib/prisma";
import { requestBaseUrl } from "@/lib/request-url";
import { listUploadedImages } from "@/lib/uploads";
import { PaymentRequestFormDialog } from "./PaymentRequestFormDialog";
import { PaymentRequestSendDialog } from "./PaymentRequestSendDialog";

export const dynamic = "force-dynamic";

export default async function PaymentRequestsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; sent?: string; deleted?: string; error?: string; emailStatus?: string; emailError?: string }>;
}) {
  const params = await searchParams;
  const [paymentRequests, uploadedImages, baseUrl, config] = await Promise.all([
    prisma.paymentRequest.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    listUploadedImages(),
    requestBaseUrl(),
    prisma.siteConfig.findUnique({ where: { key: "displayTimeZone" } }),
  ]);
  const displayTimeZone = normalizeDisplayTimeZone(config?.value || DEFAULT_DISPLAY_TIME_ZONE);
  const imageOptions = uploadedImages.map((image) => ({
    name: image.name,
    path: image.path,
    fullUrl: new URL(image.path, baseUrl).toString(),
  }));

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="display">付款单</h1>
          <p>创建带图片和总价的付款单，发送给客户确认并通过 PayPal 付款。</p>
        </div>
        <PaymentRequestFormDialog uploadedImages={imageOptions} />
      </header>

      {params.error ? <div className="admin-notice">{params.error}</div> : null}
      {params.saved ? <div className="admin-notice">付款单已保存：{paymentRequestNumber(params.saved)}</div> : null}
      {params.sent ? (
        <div className="admin-notice">
          付款单已发送：{paymentRequestNumber(params.sent)}，邮件状态 {params.emailStatus || "sent"}
          {params.emailError ? `：${params.emailError}` : ""}
        </div>
      ) : null}
      {params.deleted ? <div className="admin-notice">付款单已删除。</div> : null}

      <section className="admin-card payment-request-list-card">
        {paymentRequests.length ? (
          <table className="admin-table payment-request-table">
            <thead>
              <tr>
                <th>付款单</th>
                <th>金额</th>
                <th>状态</th>
                <th>图片</th>
                <th>邮件</th>
                <th>创建时间</th>
                <th>客户链接</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.map((paymentRequest) => {
                const status = normalizePaymentRequestStatus(paymentRequest.status);
                const publicPath = `/pay/${paymentRequest.token}`;
                const publicUrl = new URL(publicPath, baseUrl).toString();
                const editable = status !== "paid";

                return (
                  <tr key={paymentRequest.id}>
                    <td>
                      <strong>{paymentRequest.title}</strong>
                      <span className="admin-table-subtext">{paymentRequestNumber(paymentRequest.token)}</span>
                    </td>
                    <td>
                      <strong>{formatCurrency(paymentRequest.totalAmount, paymentRequest.currency)}</strong>
                    </td>
                    <td>
                      <span className={`status-badge status-payment-${status}`}>{paymentRequestStatusLabel(status)}</span>
                      {paymentRequest.paidAt ? <span className="admin-table-subtext">{formatDateTimeWithOffset(paymentRequest.paidAt, displayTimeZone)}</span> : null}
                    </td>
                    <td>
                      <div className="payment-request-thumb-row">
                        {paymentRequest.images.slice(0, 3).map((image) => (
                          <img src={image.imageUrl} alt={image.caption || paymentRequest.title} key={image.id} />
                        ))}
                        {paymentRequest.images.length > 3 ? <span>+{paymentRequest.images.length - 3}</span> : null}
                      </div>
                    </td>
                    <td>
                      <strong>{paymentRequest.emailStatus}</strong>
                      <span className="admin-table-subtext">{paymentRequest.emailRecipient || "未发送"}</span>
                      <span className="admin-table-subtext">付款成功：{paymentRequest.paidEmailStatus}</span>
                    </td>
                    <td>{formatDateTimeWithOffset(paymentRequest.createdAt, displayTimeZone)}</td>
                    <td>
                      <div className="article-link-cell">
                        <a href={publicPath} target="_blank" rel="noreferrer">
                          {publicUrl}
                        </a>
                        <CopyLinkButton value={publicUrl} compact />
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <PaymentRequestFormDialog
                          uploadedImages={imageOptions}
                          triggerLabel="编辑"
                          paymentRequest={{
                            id: paymentRequest.id,
                            title: paymentRequest.title,
                            description: paymentRequest.description,
                            totalAmount: paymentRequest.totalAmount,
                            currency: paymentRequest.currency,
                            status: paymentRequest.status,
                            adminNote: paymentRequest.adminNote || "",
                            images: paymentRequest.images.map((image) => ({
                              imageUrl: image.imageUrl,
                              caption: image.caption || "",
                              price: image.price ? String(image.price) : "",
                              quantity: image.quantity ? String(image.quantity) : "1",
                            })),
                          }}
                        />
                        <PaymentRequestSendDialog
                          id={paymentRequest.id}
                          title={paymentRequest.title}
                          totalAmount={formatCurrency(paymentRequest.totalAmount, paymentRequest.currency)}
                          emailRecipient={paymentRequest.emailRecipient || ""}
                          adminNote={paymentRequest.adminNote || ""}
                          disabled={!editable}
                        />
                        <Link className="table-action-button" href={publicPath} target="_blank">
                          预览
                        </Link>
                        {editable ? (
                          <form action="/api/admin/payment-requests/delete" method="post">
                            <input type="hidden" name="id" value={paymentRequest.id} />
                            <SubmitButton className="table-action-button danger" loadingText="删除中...">
                              删除
                            </SubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">还没有付款单。创建一张付款单，添加图片和总金额后就可以发送给客户。</div>
        )}
      </section>
    </>
  );
}
