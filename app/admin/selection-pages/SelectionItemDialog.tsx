"use client";

import { useRef } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { SelectionItemForm } from "./SelectionItemForm";

type UploadedImageOption = {
  name: string;
  path: string;
};

type SelectionItemDialogData = {
  id?: string;
  pageId: string;
  title?: string;
  imageUrl?: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  sortOrder?: number;
  minQuantity?: number;
  maxQuantity?: number;
  isActive?: boolean;
};

export function SelectionItemDialog({
  item,
  uploadedImages,
  triggerLabel,
  triggerClassName = "admin-button",
  selectedCount = 0,
}: {
  item: SelectionItemDialogData;
  uploadedImages: UploadedImageOption[];
  triggerLabel?: string;
  triggerClassName?: string;
  selectedCount?: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mode = item.id ? "edit" : "create";
  const title = mode === "create" ? "添加选品项" : "编辑选品项";

  function openDialog() {
    if (mode === "edit" && selectedCount > 0) {
      const ok = window.confirm(
        `这个选品项已经被客户选择过 ${selectedCount} 次。修改图片、标签、价格或数量范围后，只会影响客户后续查看/编辑，已有提交仍保留提交时快照。确定继续编辑吗？`,
      );
      if (!ok) return;
    }
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button className={triggerClassName} type="button" onClick={openDialog}>
        {mode === "create" ? <Plus size={18} /> : <Pencil size={15} />}
        {triggerLabel || title}
      </button>
      <dialog className="admin-dialog wide-dialog selection-item-dialog" ref={dialogRef}>
        <div className="dialog-title">
          <strong>{title}</strong>
          <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <div className="selection-item-dialog-body">
          <SelectionItemForm item={item} uploadedImages={uploadedImages} mode={mode} />
        </div>
      </dialog>
    </>
  );
}
