"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PackageCheck } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";

type SelectedOrder = {
  id: string;
  orderNumber: string;
  payerId: string;
  shipped: boolean;
  trackingNumber: string;
};

function collectSelected() {
  return Array.from(document.querySelectorAll<HTMLInputElement>(".order-select-checkbox:checked")).map((input) => ({
    id: input.value,
    orderNumber: input.dataset.orderNumber || input.value,
    payerId: input.dataset.payerId || `order:${input.value}`,
    shipped: input.dataset.shipped === "true",
    trackingNumber: input.dataset.trackingNumber || "",
  }));
}

export function BatchShipDialog({ returnTo }: { returnTo: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<SelectedOrder[]>([]);

  const payerCount = useMemo(() => new Set(selected.map((order) => order.payerId)).size, [selected]);
  const shippedCount = useMemo(() => selected.filter((order) => order.shipped).length, [selected]);

  useEffect(() => {
    const syncSelected = () => {
      const nextSelected = collectSelected();
      setSelected(nextSelected);
      const selectable = Array.from(document.querySelectorAll<HTMLInputElement>(".order-select-checkbox:not(:disabled)"));
      const selectAll = document.querySelector<HTMLInputElement>(".orders-select-all");
      if (selectAll) {
        selectAll.checked = Boolean(selectable.length) && selectable.every((input) => input.checked);
        selectAll.indeterminate = nextSelected.length > 0 && !selectAll.checked;
      }
    };
    const handleSelectAll = (event: Event) => {
      const checked = event.currentTarget instanceof HTMLInputElement && event.currentTarget.checked;
      document.querySelectorAll<HTMLInputElement>(".order-select-checkbox:not(:disabled)").forEach((input) => {
        input.checked = checked;
      });
      syncSelected();
    };
    const selectAll = document.querySelector<HTMLInputElement>(".orders-select-all");

    document.addEventListener("change", syncSelected);
    selectAll?.addEventListener("change", handleSelectAll);
    syncSelected();
    return () => {
      document.removeEventListener("change", syncSelected);
      selectAll?.removeEventListener("change", handleSelectAll);
    };
  }, []);

  function openDialog() {
    const nextSelected = collectSelected();
    setSelected(nextSelected);
    if (nextSelected.length) dialogRef.current?.showModal();
  }

  function removeSelectedOrder(orderId: string) {
    const checkbox = Array.from(document.querySelectorAll<HTMLInputElement>(".order-select-checkbox")).find((input) => input.value === orderId);
    if (checkbox) checkbox.checked = false;
    const nextSelected = collectSelected().filter((order) => order.id !== orderId);
    setSelected(nextSelected);
    const selectable = Array.from(document.querySelectorAll<HTMLInputElement>(".order-select-checkbox:not(:disabled)"));
    const selectAll = document.querySelector<HTMLInputElement>(".orders-select-all");
    if (selectAll) {
      selectAll.checked = Boolean(selectable.length) && selectable.every((input) => input.checked);
      selectAll.indeterminate = nextSelected.length > 0 && !selectAll.checked;
    }
    if (!nextSelected.length) dialogRef.current?.close();
  }

  function clearSelectedOrders() {
    document.querySelectorAll<HTMLInputElement>(".order-select-checkbox:checked").forEach((input) => {
      input.checked = false;
    });
    const selectAll = document.querySelector<HTMLInputElement>(".orders-select-all");
    if (selectAll) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    }
    setSelected([]);
    dialogRef.current?.close();
  }

  if (!selected.length) return null;

  return (
    <section className="batch-ship-bar">
      <div>
        <strong>已选 {selected.length} 个订单</strong>
        <span>涉及 {payerCount} 个付款人，将发送 {payerCount} 封发货邮件</span>
        {shippedCount ? <span className="batch-ship-warning">其中 {shippedCount} 个订单已发货，请确认是否需要重新批量发货。</span> : null}
      </div>
      <div className="batch-ship-actions">
        <button className="secondary-button batch-ship-clear-button" type="button" onClick={clearSelectedOrders}>
          清除选择
        </button>
        <button className="secondary-button batch-ship-button" type="button" onClick={openDialog}>
          <PackageCheck aria-hidden="true" size={16} />
          批量发货
        </button>
      </div>
      <dialog className="admin-dialog batch-ship-dialog" ref={dialogRef}>
        <form className="admin-form" action="/api/admin/orders/batch-ship" method="post">
          <div className="dialog-title">
            <strong>批量发货</strong>
            <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              x
            </button>
          </div>
          <input type="hidden" name="returnTo" value={returnTo} />
          {selected.map((order) => (
            <input key={order.id} type="hidden" name="orderIds" value={order.id} />
          ))}
          <div className="batch-ship-summary">
            <strong>{selected.length} 个订单</strong>
            <span>{payerCount} 个付款人，每个付款人只发送一封发货邮件。</span>
            {shippedCount ? (
              <p className="batch-ship-warning">包含 {shippedCount} 个已发货订单，确认后会覆盖这些订单的运单号，并可能重新发送发货邮件。</p>
            ) : null}
            <div className="batch-ship-order-tags" aria-label="已选订单">
              {selected.map((order) => (
                <span className={order.shipped ? "batch-ship-order-tag is-shipped" : "batch-ship-order-tag"} key={order.id}>
                  <strong>{order.orderNumber}</strong>
                  {order.shipped ? <em>{order.trackingNumber ? `已发货：${order.trackingNumber}` : "已发货"}</em> : null}
                  <button type="button" onClick={() => removeSelectedOrder(order.id)} aria-label={`移除订单 ${order.orderNumber}`}>
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>
          <label>
            运单号
            <input name="trackingNumber" required placeholder="请输入这批订单共用的运单号" />
          </label>
          {shippedCount ? (
            <label className="batch-ship-confirm-row">
              <span>
                <input name="confirmReship" type="checkbox" value="true" required />
                我确认包含已发货订单，仍要重新批量发货
              </span>
            </label>
          ) : null}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <SubmitButton loadingText="发货中...">确认批量发货（{selected.length} 单）</SubmitButton>
          </div>
        </form>
      </dialog>
    </section>
  );
}
