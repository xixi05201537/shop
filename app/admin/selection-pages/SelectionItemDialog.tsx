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
}: {
  item: SelectionItemDialogData;
  uploadedImages: UploadedImageOption[];
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mode = item.id ? "edit" : "create";
  const title = mode === "create" ? "添加选品项" : "编辑选品项";

  return (
    <>
      <button className={triggerClassName} type="button" onClick={() => dialogRef.current?.showModal()}>
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
