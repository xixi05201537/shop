import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { emailStatusLabel, orderStatusLabel } from "@/lib/admin-labels";
import { getConfigMap } from "@/lib/config";
import { DEFAULT_DISPLAY_TIME_ZONE, formatDateTimeWithOffset, formatUsd, normalizeDisplayTimeZone } from "@/lib/format";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";
import { OrderNoteDialog, PayerNoteDialog } from "../OrderNoteDialog";
import { ShipOrderDialog } from "./ShipOrderDialog";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, config] = await Promise.all([prisma.order.findUnique({ where: { id } }), getConfigMap()]);
  if (!order) notFound();
  const payerNote = order.paypalPayerId
    ? await prisma.payerNote.findUnique({ where: { payerId: order.paypalPayerId } })
    : null;
  const displayTimeZone = normalizeDisplayTimeZone(config.displayTimeZone || DEFAULT_DISPLAY_TIME_ZONE);

  return (
    <>
      <header className="admin-header">
        <h1 className="display">订单详情</h1>
        <ShipOrderDialog orderId={order.id} trackingNumber={order.trackingNumber} />
      </header>
      <section className="admin-card">
        <dl className="stat-grid">
          <div className="stat-card">
            <span>订单号</span>
            <strong className="stat-copy-value">
              {order.orderNumber}
              <CopyLinkButton compact label="复制" value={order.orderNumber} />
            </strong>
          </div>
          <div className="stat-card">
            <span>状态</span>
            <strong>{orderStatusLabel(order.status)}</strong>
          </div>
          <div className="stat-card">
            <span>总金额</span>
            <strong>{formatUsd(order.totalAmount)}</strong>
          </div>
          <div className="stat-card">
            <span>数量</span>
            <strong>{order.quantity}</strong>
          </div>
        </dl>
        <section className={order.internalNote ? "internal-note-summary has-note" : "internal-note-summary"}>
          <div>
            <strong>内部备注</strong>
            <p>{order.internalNote || "暂无备注"}</p>
          </div>
          <OrderNoteDialog
            orderId={order.id}
            note={order.internalNote}
            triggerClassName="secondary-button internal-note-edit-button"
            triggerChildren={order.internalNote ? "编辑备注" : "添加备注"}
          />
        </section>
        <section className={payerNote?.note ? "internal-note-summary has-note payer-note-summary" : "internal-note-summary payer-note-summary"}>
          <div>
            <strong>付款人备注</strong>
            <p>{payerNote?.note || (order.paypalPayerId ? "暂无付款人备注" : "缺少 PayPal Payer ID，暂不能记录付款人备注")}</p>
            {order.paypalPayerId ? <small>Payer ID：{order.paypalPayerId}</small> : null}
          </div>
          {order.paypalPayerId ? (
            <PayerNoteDialog
              payerId={order.paypalPayerId}
              note={payerNote?.note}
              returnTo={`/admin/orders/${order.id}`}
              triggerClassName="secondary-button internal-note-edit-button"
              triggerChildren={payerNote?.note ? "编辑付款人备注" : "添加付款人备注"}
            />
          ) : null}
        </section>
        <table className="admin-table">
          <tbody>
            <tr>
              <th>PayPal 订单 ID</th>
              <td>
                <span className="copy-inline">
                  {order.paypalOrderId || "-"}
                  {order.paypalOrderId ? <CopyLinkButton compact label="复制" value={order.paypalOrderId} /> : null}
                </span>
              </td>
            </tr>
            <tr>
              <th>PayPal 捕获 ID</th>
              <td>
                <span className="copy-inline">
                  {order.paypalCaptureId || "-"}
                  {order.paypalCaptureId ? <CopyLinkButton compact label="复制" value={order.paypalCaptureId} /> : null}
                </span>
              </td>
            </tr>
            <tr>
              <th>买家邮箱</th>
              <td>
                <span className="copy-inline">
                  {displayOrderEmail(order)}
                  {displayOrderEmail(order) !== "-" ? <CopyLinkButton compact label="复制" value={displayOrderEmail(order)} /> : null}
                </span>
              </td>
            </tr>
            <tr>
              <th>买家昵称</th>
              <td>{displayOrderNickname(order)}</td>
            </tr>
            <tr>
              <th>PayPal 买家信息</th>
              <td>
                <div className="email-log-row">
                  <span>邮箱：{order.paypalBuyerEmail || "-"}</span>
                  <span>昵称：{order.paypalBuyerNickname || "-"}</span>
                  <span>Payer ID：{order.paypalPayerId || "-"}</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>PayPal 收货信息</th>
              <td>
                <div className="email-log-row">
                  <span>姓名：{order.paypalShippingName || "-"}</span>
                  <span>地址：{order.paypalShippingAddress || "-"}</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>商品</th>
              <td>{order.productNameSnapshot}</td>
            </tr>
            <tr>
              <th>邮件状态</th>
              <td>
                买家：{emailStatusLabel(order.buyerEmailStatus)}，管理员：{emailStatusLabel(order.adminEmailStatus)}
              </td>
            </tr>
            <tr>
              <th>买家邮件记录</th>
              <td>
                <div className="email-log-row">
                  <span>{emailStatusLabel(order.buyerEmailStatus)}</span>
                  <form action="/api/admin/orders/resend" method="post">
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="target" value="buyer" />
                    <SubmitButton className="secondary-button" loadingText="发送中...">
                      重发买家邮件
                    </SubmitButton>
                  </form>
                </div>
                {order.buyerEmailError ? <p className="error-text">{order.buyerEmailError}</p> : null}
              </td>
            </tr>
            <tr>
              <th>管理员邮件记录</th>
              <td>
                <div className="email-log-row">
                  <span>{emailStatusLabel(order.adminEmailStatus)}</span>
                  <form action="/api/admin/orders/resend" method="post">
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="target" value="admin" />
                    <SubmitButton className="secondary-button" loadingText="发送中...">
                      重发管理员邮件
                    </SubmitButton>
                  </form>
                </div>
                {order.adminEmailError ? <p className="error-text">{order.adminEmailError}</p> : null}
              </td>
            </tr>
            <tr>
              <th>发货信息</th>
              <td>
                <div className="email-log-row">
                  <span className="copy-inline">
                    运单号：{order.trackingNumber || "-"}
                    {order.trackingNumber ? <CopyLinkButton compact label="复制" value={order.trackingNumber} /> : null}
                  </span>
                  <span>发货时间：{formatDateTimeWithOffset(order.shippedAt, displayTimeZone) || "-"}</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>发货邮件记录</th>
              <td>
                <div className="email-log-row">
                  <span>{emailStatusLabel(order.shipmentEmailStatus)}</span>
                </div>
                {order.shipmentEmailError ? <p className="error-text">{order.shipmentEmailError}</p> : null}
              </td>
            </tr>
            <tr>
              <th>支付时间</th>
              <td>{formatDateTimeWithOffset(order.paidAt, displayTimeZone) || "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}
