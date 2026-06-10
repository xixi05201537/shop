"use client";

import { useRef } from "react";
import { X } from "lucide-react";

type UploadedImageOption = {
  name: string;
  path: string;
};

export function SelectionImagePickerDialog({
  uploadedImages,
  onSelect,
}: {
  uploadedImages: UploadedImageOption[];
  onSelect: (path: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="secondary-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        选择图片
      </button>
      <dialog className="admin-dialog selection-image-picker-dialog" ref={dialogRef}>
        <div className="dialog-title">
          <strong>选择图片</strong>
          <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        {uploadedImages.length ? (
          <div className="selection-image-picker-grid">
            {uploadedImages.map((image) => (
              <button
                key={image.path}
                type="button"
                onClick={() => {
                  onSelect(image.path);
                  dialogRef.current?.close();
                }}
              >
                <img src={image.path} alt={image.name} />
                <span>{image.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="image-picker-empty">还没有上传图片。</div>
        )}
      </dialog>
    </>
  );
}
