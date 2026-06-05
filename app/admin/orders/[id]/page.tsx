import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { emailStatusLabel, orderStatusLabel } from "@/lib/admin-labels";
import { formatUsd } from "@/lib/format";
import { displayOrderEmail, displayOrderNickname } from "@/lib/paypal-order-details";
import { prisma } from "@/lib/prisma";
import { ShipOrderDialog } from "./ShipOrderDialog";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

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
            <strong>{order.orderNumber}</strong>
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
        <table className="admin-table">
          <tbody>
            <tr>
              <th>PayPal 订单 ID</th>
              <td>{order.paypalOrderId || "-"}</td>
            </tr>
            <tr>
              <th>PayPal 捕获 ID</th>
              <td>{order.paypalCaptureId || "-"}</td>
            </tr>
            <tr>
              <th>买家邮箱</th>
              <td>{displayOrderEmail(order)}</td>
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
                  <span>运单号：{order.trackingNumber || "-"}</span>
                  <span>发货时间：{order.shippedAt?.toLocaleString() || "-"}</span>
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
              <td>{order.paidAt?.toLocaleString() || "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}
