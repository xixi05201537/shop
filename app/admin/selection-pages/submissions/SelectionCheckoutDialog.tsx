"use client";

import { useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";

type SubmissionOption = {
  id: string;
  reference: string;
  title: string;
  customer: string;
  email: string;
  quantity: number;
  amount: number | null;
  hasUnpricedItems: boolean;
};

export function SelectionCheckoutDialog({ submissions }: { submissions: SubmissionOption[] }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(
    () => submissions.filter((submission) => selectedIds.includes(submission.id)),
    [selectedIds, submissions],
  );
  const subtotal = selected.reduce((sum, submission) => sum + (submission.amount || 0), 0);
  const hasUnpricedItems = selected.some((submission) => submission.hasUnpricedItems);
  const defaultEmails = Array.from(new Set(selected.map((submission) => submission.email).filter(Boolean))).join(", ");

  function openDialog() {
    const container = document.querySelector<HTMLElement>("[data-selection-checkout-form]");
    if (!container) return;
    const checked = Array.from(container.querySelectorAll<HTMLInputElement>('input[name="submissionIds"]:checked')).map((input) => input.value);
    setSelectedIds(checked);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button className="admin-button" type="button" onClick={openDialog}>
        <Send size={16} />
        生成付款链接
      </button>
      <dialog className="admin-dialog selection-checkout-dialog" ref={dialogRef}>
        <form className="admin-form" action="/api/admin/selection-checkouts" method="post">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">合并发送</span>
              <h2>生成确认付款链接</h2>
            </div>
            <button type="button" className="dialog-close-button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              ×
            </button>
          </div>

          {selectedIds.map((id) => (
            <input type="hidden" name="submissionIds" value={id} key={id} />
          ))}

          {selected.length ? (
            <>
              <div className="selection-checkout-dialog-summary">
                <div>
                  <span>已选记录</span>
                  <strong>{selected.length}</strong>
                </div>
                <div>
                  <span>合计数量</span>
                  <strong>{selected.reduce((sum, submission) => sum + submission.quantity, 0)}</strong>
                </div>
                <div>
                  <span>系统总价</span>
                  <strong>{formatUsd(subtotal)}</strong>
                </div>
              </div>
              <div className="selection-checkout-dialog-list">
                {selected.map((submission) => (
                  <div key={submission.id}>
                    <strong>{submission.reference}</strong>
                    <span>
                      {submission.title} · {submission.customer} · {submission.amount === null ? "未计价" : formatUsd(submission.amount)}
                      {submission.hasUnpricedItems ? " · 含未计价" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <label>
                手动合并总价
                <input
                  name="manualTotalAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={hasUnpricedItems || subtotal <= 0 ? "" : subtotal.toFixed(2)}
                  placeholder={hasUnpricedItems ? "含未计价选品，请填写最终价格" : "留空则使用系统总价"}
                />
              </label>
              <label>
                收件邮箱
                <input name="emailRecipient" type="text" defaultValue={defaultEmails} placeholder="多个邮箱用逗号隔开" />
              </label>
              <label className="checkbox-row">
                <span>
                  <input name="sendEmail" type="checkbox" defaultChecked /> 生成后自动发送确认邮件
                </span>
              </label>
              <p className="admin-help">如果手动总价低于系统总价，客户页会显示原价和优惠价；高于或等于系统总价时只显示总价。</p>
            </>
          ) : (
            <p className="admin-notice">请先勾选至少一条已确认记录。</p>
          )}

          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <button className="admin-button" type="submit" disabled={!selected.length}>
              生成链接
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
