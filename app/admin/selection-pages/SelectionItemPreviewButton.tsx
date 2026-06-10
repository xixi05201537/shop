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

  return (
    <>
      <button className="selection-item-admin-image-button" type="button" onClick={() => setPreviewOpen(true)} aria-label={`预览 ${title}`}>
        <img src={imageUrl} alt={title} />
      </button>
      {previewOpen ? (
        <div className="admin-image-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreviewOpen(false)}>
          <div className="admin-image-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="关闭预览" onClick={() => setPreviewOpen(false)}>
              <X size={20} />
            </button>
            <img src={imageUrl} alt={title} />
            <div>
              <strong>{title}</strong>
              {description ? <p>{description}</p> : null}
              {detail ? <span>{detail}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
