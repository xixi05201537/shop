"use client";

import { useState } from "react";
import { X } from "lucide-react";

type SubmissionPreviewItem = {
  id: string;
  title: string;
  image: string;
  description: string | null;
  detail: string;
};

export function SubmissionItemsPreview({ items }: { items: SubmissionPreviewItem[] }) {
  const [preview, setPreview] = useState<SubmissionPreviewItem | null>(null);

  return (
    <>
      <div className="selection-submission-items selection-submission-detail-items">
        {items.map((item) => (
          <div className="selection-submission-item selection-submission-detail-item" key={item.id}>
            <button className="selection-submission-image-button" type="button" onClick={() => setPreview(item)} aria-label={`预览 ${item.title}`}>
              <img src={item.image} alt={item.title} />
              <span>查看大图</span>
            </button>
            <div>
              <strong>{item.title}</strong>
              {item.description ? <span>{item.description}</span> : null}
              <small>{item.detail}</small>
            </div>
          </div>
        ))}
      </div>

      {preview ? (
        <div className="admin-image-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <div className="admin-image-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="关闭预览" onClick={() => setPreview(null)}>
              <X size={20} />
            </button>
            <img src={preview.image} alt={preview.title} />
            <div>
              <strong>{preview.title}</strong>
              {preview.description ? <p>{preview.description}</p> : null}
              <span>{preview.detail}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
