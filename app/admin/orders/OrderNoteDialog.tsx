"use client";

import { useRef } from "react";
import { SubmitButton } from "@/components/SubmitButton";

export function OrderNoteDialog({
  orderId,
  note,
  returnTo,
  triggerClassName,
  triggerChildren,
}: {
  orderId: string;
  note?: string | null;
  returnTo?: string;
  triggerClassName: string;
  triggerChildren: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className={triggerClassName} type="button" onClick={() => dialogRef.current?.showModal()}>
        {triggerChildren}
      </button>
      <dialog className="admin-dialog note-dialog" ref={dialogRef}>
        <form className="admin-form note-dialog-form" action="/api/admin/orders/note" method="post">
          <div className="dialog-title">
            <strong>订单备注</strong>
            <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              x
            </button>
          </div>
          <input type="hidden" name="id" value={orderId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <label>
            内部备注
            <textarea
              className="note-dialog-textarea"
              name="internalNote"
              defaultValue={note || ""}
              placeholder="例如：客户已联系、已人工确认、特殊要求。仅后台可见。"
            />
          </label>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <SubmitButton loadingText="保存中...">保存备注</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function PayerNoteDialog({
  payerId,
  note,
  returnTo,
  triggerClassName,
  triggerChildren,
}: {
  payerId: string;
  note?: string | null;
  returnTo?: string;
  triggerClassName: string;
  triggerChildren: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className={triggerClassName} type="button" onClick={() => dialogRef.current?.showModal()}>
        {triggerChildren}
      </button>
      <dialog className="admin-dialog note-dialog" ref={dialogRef}>
        <form className="admin-form note-dialog-form" action="/api/admin/orders/payer-note" method="post">
          <div className="dialog-title">
            <strong>付款人备注</strong>
            <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              x
            </button>
          </div>
          <input type="hidden" name="payerId" value={payerId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <label>
            付款人备注
            <textarea
              className="note-dialog-textarea"
              name="note"
              defaultValue={note || ""}
              placeholder="例如：真实付款人姓名、联系方式、常用账号、特殊提醒。所有相同 Payer ID 的订单都会显示。"
            />
          </label>
          <div className="payer-note-dialog-meta">
            Payer ID：<strong>{payerId}</strong>
          </div>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <SubmitButton loadingText="保存中...">保存付款人备注</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
