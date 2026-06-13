"use client";

import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";

type PaymentRequestImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
  captionText: string;
  label: string;
  price: string;
  quantity: number;
  lineTotal: string;
};

export function PaymentRequestGallery({ images }: { images: PaymentRequestImage[] }) {
  const [preview, setPreview] = useState<PaymentRequestImage | null>(null);

  if (!images.length) return null;

  return (
    <>
      <section className="payment-request-public-gallery">
        {images.map((image, index) => (
          <article className="payment-request-public-image" key={image.id}>
            <button type="button" onClick={() => setPreview(image)} aria-label={`Preview ${image.label}`}>
              <img src={image.imageUrl} alt={image.label} />
              <span>
                <Search size={16} />
              </span>
            </button>
            <div className="payment-request-public-image-meta">
              <div className="payment-request-public-image-price">
                <span>
                  <Sparkles size={14} />
                  Item {index + 1}
                </span>
                <em>{image.lineTotal}</em>
              </div>
              <div className="payment-request-public-image-detail">
                <span>{image.price} x {image.quantity}</span>
              </div>
              <strong>{image.label}</strong>
            </div>
          </article>
        ))}
      </section>

      {preview ? (
        <div className="selection-preview-overlay payment-request-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <div className="selection-preview-dialog payment-request-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close preview" onClick={() => setPreview(null)}>
              <X size={20} />
            </button>
            <figure className={`payment-request-preview-figure${preview.captionText ? " has-caption" : ""}`}>
              <div className="payment-request-preview-image-wrap">
                <img src={preview.imageUrl} alt={preview.label} />
                <div className="payment-request-preview-price-bar">
                  <span>{preview.price} x {preview.quantity}</span>
                  <strong>{preview.lineTotal}</strong>
                </div>
              </div>
              {preview.captionText ? <figcaption>{preview.captionText}</figcaption> : null}
            </figure>
          </div>
        </div>
      ) : null}
    </>
  );
}
