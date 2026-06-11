"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function SelectionItemPreviewButton({
  imageUrl,
  title,
  description,
  detail,
}: {
  imageUrl: string;
  title: string;
  description?: string | null;
  detail?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const label = title.trim() || "未填写标签";

  return (
    <>
      <button className="selection-item-admin-image-button" type="button" onClick={() => setPreviewOpen(true)} aria-label={`预览 ${label}`}>
        <img src={imageUrl} alt={label} />
        <div className="selection-item-admin-image-meta">
          {title.trim() ? <span>{title}</span> : null}
          {detail ? <strong>{detail}</strong> : null}
        </div>
      </button>
      {previewOpen ? (
        <div className="admin-image-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreviewOpen(false)}>
          <div className="admin-image-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="关闭预览" onClick={() => setPreviewOpen(false)}>
              <X size={20} />
            </button>
            <img src={imageUrl} alt={label} />
            <div>
              <strong>{label}</strong>
              {description ? <p>{description}</p> : null}
              {detail ? <span>{detail}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
