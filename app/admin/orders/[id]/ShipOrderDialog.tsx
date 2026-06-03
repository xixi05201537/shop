"use client";

import { useRef } from "react";

export function ShipOrderDialog({ orderId, trackingNumber }: { orderId: string; trackingNumber?: string | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="admin-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        发货
      </button>
      <dialog className="admin-dialog" ref={dialogRef}>
        <form className="admin-form" action="/api/admin/orders/ship" method="post">
          <div className="dialog-title">
            <strong>订单发货</strong>
            <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              x
            </button>
          </div>
          <input type="hidden" name="id" value={orderId} />
          <label>
            运单号
            <input name="trackingNumber" defaultValue={trackingNumber || ""} required placeholder="请输入运单号" />
          </label>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <button className="admin-button" type="submit">
              确认并发送邮件
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
