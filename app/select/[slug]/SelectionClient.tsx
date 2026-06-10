"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Minus, Plus, Send, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type SelectionItemView = {
  id: string;
  title: string;
  imageUrl: string;
  description: string | null;
  price: number | null;
  currency: string;
  minQuantity: number;
  maxQuantity: number;
};

type SelectionPageView = {
  title: string;
  slug: string;
  description: string | null;
  submitLabel: string;
  showPrices: boolean;
  allowQuantity: boolean;
  requireName: boolean;
  requireEmail: boolean;
  requireContact: boolean;
  items: SelectionItemView[];
};

type SelectedMap = Record<string, number>;

type SubmissionResult = {
  id: string;
  reference: string;
  path: string;
};

export function SelectionClient({ page }: { page: SelectionPageView }) {
  const [selected, setSelected] = useState<SelectedMap>({});
  const [preview, setPreview] = useState<SelectionItemView | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedItems = useMemo(
    () =>
      page.items
        .filter((item) => selected[item.id])
        .map((item) => ({ ...item, quantity: selected[item.id] || 1 })),
    [page.items, selected],
  );
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const canShowTotal = page.showPrices && selectedItems.length > 0 && selectedItems.every((item) => item.price !== null);
  const totalAmount = canShowTotal
    ? selectedItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
    : 0;
  const submitLabel = /[\u4e00-\u9fa5]/.test(page.submitLabel) ? "Submit" : page.submitLabel || "Submit";

  function toggleItem(item: SelectionItemView) {
    setMessage("");
    setSelected((current) => {
      const next = { ...current };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item.minQuantity;
      }
      return next;
    });
  }

  function setQuantity(item: SelectionItemView, quantity: number) {
    setSelected((current) => {
      if (!current[item.id]) return current;
      return {
        ...current,
        [item.id]: Math.max(item.minQuantity, Math.min(item.maxQuantity, quantity)),
      };
    });
  }

  async function submitSelection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!selectedItems.length) {
      setMessage("Please select at least one item.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/select/${page.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerContact,
          note,
          items: selectedItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not submit your selection. Please try again.");
      setSubmissionResult({
        id: data.submissionId || "",
        reference: data.reference || "",
        path: data.path || "",
      });
      setSubmitted(true);
      setSelected({});
      setNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit your selection. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reviewSelection() {
    if (!selectedItems.length) {
      setMessage("Please select at least one item.");
    }
  }

  if (submitted) {
    const shareUrl = submissionResult?.path ? `${window.location.origin}${submissionResult.path}` : "";

    return (
      <main className="selection-page">
        <section className="container selection-success">
          <div className="selection-success-mark">
            <Check size={34} />
          </div>
          <h1 className="display">Submitted</h1>
          <p>Your selection has been received. We will review it and contact you soon.</p>
          {submissionResult ? (
            <div className="selection-success-reference">
              <span>Selection reference</span>
              <strong>{submissionResult.reference}</strong>
              {shareUrl ? (
                <div>
                  <a href={submissionResult.path}>View selection</a>
                  <button type="button" onClick={() => void navigator.clipboard?.writeText(shareUrl)}>
                    Copy link
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <button className="primary-button selection-return-button" type="button" onClick={() => setSubmitted(false)}>
            Continue selecting
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="selection-page">
      <section className="container selection-hero">
        <div>
          <span className="eyebrow">Pick your favorites</span>
          <h1 className="display">{page.title}</h1>
          {page.description ? <p>{page.description}</p> : null}
        </div>
        <div className="selection-hero-note">
          <span>Available items</span>
          <strong>{page.items.length}</strong>
        </div>
      </section>

      <form className="container selection-layout" onSubmit={submitSelection}>
        <section className="selection-masonry" aria-label="Selection list">
          {page.items.map((item) => {
            const quantity = selected[item.id];
            const isSelected = Boolean(quantity);

            return (
              <article
                className={`selection-card ${isSelected ? "is-selected" : ""}`}
                key={item.id}
                onClick={() => toggleItem(item)}
              >
                <div className="selection-image-wrap">
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  <button
                    className="selection-preview-button"
                    type="button"
                    aria-label={`Preview ${item.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreview(item);
                    }}
                  >
                    <Eye size={17} />
                  </button>
                  {isSelected ? (
                    <span className="selection-check">
                      <Check size={17} />
                    </span>
                  ) : null}
                </div>
                <div className="selection-card-body">
                  <strong>{item.title}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                  {page.showPrices && item.price !== null ? <span>{formatCurrency(item.price, item.currency)}</span> : null}
                  {isSelected && page.allowQuantity ? (
                    <div className="selection-card-stepper" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => setQuantity(item, quantity - 1)} aria-label="Decrease quantity">
                        <Minus size={16} />
                      </button>
                      <input
                        value={quantity}
                        min={item.minQuantity}
                        max={item.maxQuantity}
                        type="number"
                        onChange={(event) => setQuantity(item, Number(event.target.value))}
                      />
                      <button type="button" onClick={() => setQuantity(item, quantity + 1)} aria-label="Increase quantity">
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <aside className="selection-submit-panel" id="selection-submit-panel">
          <div>
            <span className="label">Your picks</span>
            <h2>Review before submitting</h2>
          </div>
          <div className="selection-summary-box">
            <strong>{selectedItems.length}</strong>
            <span>{totalQuantity} item{totalQuantity === 1 ? "" : "s"} selected</span>
            {canShowTotal ? <small>{formatCurrency(totalAmount)}</small> : null}
          </div>
          <div className="selection-contact-grid">
            <label>
              Name{page.requireName ? " *" : ""}
              <input value={customerName} required={page.requireName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <label>
              Email{page.requireEmail ? " *" : ""}
              <input type="email" value={customerEmail} required={page.requireEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
            </label>
            <label>
              Contact{page.requireContact ? " *" : ""}
              <input value={customerContact} required={page.requireContact} onChange={(event) => setCustomerContact(event.target.value)} />
            </label>
            <label>
              Notes
              <textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
          {message ? <div className="notice">{message}</div> : null}
          <button className="primary-button selection-submit-button" type="submit" disabled={loading}>
            <Send size={18} />
            {loading ? "Submitting..." : submitLabel}
          </button>
        </aside>

        <div className="selection-mobile-bar">
          <div>
            <span>{selectedItems.length} pick{selectedItems.length === 1 ? "" : "s"} / {totalQuantity} item{totalQuantity === 1 ? "" : "s"}</span>
            {canShowTotal ? <strong>{formatCurrency(totalAmount)}</strong> : <strong>Ready to review</strong>}
          </div>
          <a href="#selection-submit-panel" onClick={reviewSelection}>
            Review
          </a>
        </div>
      </form>

      {preview ? (
        <div className="selection-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <div className="selection-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close preview" onClick={() => setPreview(null)}>
              <X size={20} />
            </button>
            <img src={preview.imageUrl} alt={preview.title} />
            <div>
              <strong>{preview.title}</strong>
              {preview.description ? <p>{preview.description}</p> : null}
              {page.showPrices && preview.price !== null ? <span>{formatCurrency(preview.price, preview.currency)}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
