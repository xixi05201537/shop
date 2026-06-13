"use client";

import { useRef } from "react";
import { Send, X } from "lucide-react";

export function PaymentRequestSendDialog({
  id,
  title,
  totalAmount,
  emailRecipient,
  adminNote,
  disabled,
}: {
  id: string;
  title: string;
  totalAmount: string;
  emailRecipient: string;
  adminNote: string;
  disabled?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  return (
    <>
      <button className="table-action-button" type="button" disabled={disabled} onClick={() => dialogRef.current?.showModal()}>
        <Send size={14} />
        发送给客户
      </button>
      <dialog className="admin-dialog payment-request-send-dialog" ref={dialogRef}>
        <form className="admin-form" action="/api/admin/payment-requests/send" method="post">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">Send payment</span>
              <h2>发送付款单</h2>
            </div>
            <button type="button" className="dialog-close-button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
          <input type="hidden" name="id" value={id} />
          <div className="payment-request-send-summary">
            <span>当前付款单</span>
            <strong>{title}</strong>
            <small>总金额：{totalAmount}</small>
          </div>
          <label>
            收件邮箱
            <input name="emailRecipient" type="text" defaultValue={emailRecipient} placeholder="多个邮箱可用逗号隔开" required />
          </label>
          <label>
            备注
            <textarea name="adminNote" defaultValue={adminNote} placeholder="可以写给客户看的补充说明，也会保存到付款单。" />
          </label>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <button className="admin-button" type="submit">
              发送
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
