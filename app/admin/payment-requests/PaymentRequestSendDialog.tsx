"use client";

import { useRef, useState } from "react";
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
  const [sending, setSending] = useState(false);

  function closeDialog() {
    if (sending) return;
    dialogRef.current?.close();
  }

  return (
    <>
      <button className="table-action-button" type="button" disabled={disabled} onClick={() => dialogRef.current?.showModal()}>
        <Send size={14} />
        发送给客户
      </button>
      <dialog className="admin-dialog payment-request-send-dialog" ref={dialogRef}>
        <form className="admin-form payment-request-send-form" action="/api/admin/payment-requests/send" method="post" onSubmit={() => setSending(true)}>
          <div className="dialog-heading payment-request-dialog-heading payment-request-send-heading">
            <div>
              <h2>发送付款单</h2>
            </div>
            <button type="button" className="dialog-close-button" onClick={closeDialog} aria-label="关闭" disabled={sending}>
              <X size={18} />
            </button>
          </div>
          <input type="hidden" name="id" value={id} />
          <div className="payment-request-dialog-body payment-request-send-body">
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
              内部备注
              <textarea name="adminNote" defaultValue={adminNote} placeholder="只给后台内部查看，不会显示在客户页面或邮件里。" />
            </label>
          </div>
          <div className="dialog-actions payment-request-dialog-actions payment-request-send-actions">
            <button className="secondary-button" type="button" onClick={closeDialog} disabled={sending}>
              取消
            </button>
            <button className={`admin-button${sending ? " is-loading" : ""}`} type="submit" disabled={sending}>
              {sending ? (
                <>
                  <span className="button-spinner" />
                  发送中...
                </>
              ) : (
                <>
                  <Send size={16} />
                  发送
                </>
              )}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
