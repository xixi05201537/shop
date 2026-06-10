"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type EditableItem = {
  id: string;
  title: string;
  imageUrl: string;
  description: string | null;
  price: number | null;
  currency: string;
  minQuantity: number;
  maxQuantity: number;
};

type ReadonlyItem = {
  id: string;
  title: string;
  image: string;
  description: string | null;
  price: number | null;
  currency: string;
  quantity: number;
};

type SubmissionDetail = {
  id: string;
  reference: string;
  slug: string;
  pageTitle: string;
  submittedAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerContact: string | null;
  note: string | null;
  showPrices: boolean;
  allowQuantity: boolean;
  initialSelected: Record<string, number>;
  unavailableItems: ReadonlyItem[];
  items: EditableItem[];
};

type PreviewItem = {
  title: string;
  imageUrl: string;
  description: string | null;
  price: number | null;
  currency: string;
};

export function SubmissionDetailClient({ detail }: { detail: SubmissionDetail }) {
  const [selected, setSelected] = useState<Record<string, number>>(detail.initialSelected);
  const [addQuantities, setAddQuantities] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<PreviewItem | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedItems = useMemo(
    () =>
      detail.items
        .filter((item) => selected[item.id])
        .map((item) => ({ ...item, quantity: selected[item.id] || item.minQuantity })),
    [detail.items, selected],
  );
  const availableItems = detail.items.filter((item) => !selected[item.id]);
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const pricedTotal = selectedItems.reduce((sum, item) => {
    if (item.price === null) return sum;
    return sum + item.price * item.quantity;
  }, 0);
  const hasPricedItems = detail.showPrices && selectedItems.some((item) => item.price !== null);
  const hasUnpricedItems = detail.showPrices && selectedItems.some((item) => item.price === null);

  function addItem(item: EditableItem) {
    setSelected((current) => ({ ...current, [item.id]: detail.allowQuantity ? getAddQuantity(item) : 1 }));
    setMessage("");
  }

  function removeItem(id: string) {
    setSelected((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setMessage("");
  }

  function setQuantity(item: EditableItem, quantity: number) {
    setSelected((current) => ({
      ...current,
      [item.id]: detail.allowQuantity ? Math.max(item.minQuantity, Math.min(item.maxQuantity, Math.floor(quantity || item.minQuantity))) : 1,
    }));
  }

  function getAddQuantity(item: EditableItem) {
    return Math.max(item.minQuantity, Math.min(item.maxQuantity, Math.floor(addQuantities[item.id] || item.minQuantity)));
  }

  function setAddQuantity(item: EditableItem, quantity: number) {
    setAddQuantities((current) => ({
      ...current,
      [item.id]: Math.max(item.minQuantity, Math.min(item.maxQuantity, Math.floor(quantity || item.minQuantity))),
    }));
  }

  async function saveChanges() {
    setMessage("");
    if (!selectedItems.length) {
      setMessage("Please keep at least one item in your selection.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/select/${detail.slug}/submission/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your changes.");
      setMessage("Saved. Your shared link now shows the updated selection.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="selection-page">
      <section className="container selection-submission-public">
        <header className="selection-submission-public-head">
          <div>
            <span className="eyebrow">Selection details</span>
            <h1 className="display">{detail.reference}</h1>
            <p>{detail.pageTitle}</p>
          </div>
          <Link className="primary-button selection-return-button" href={`/select/${detail.slug}`}>
            Back to selection
          </Link>
        </header>

        <section className="selection-public-summary">
          <div>
            <span>Submitted at</span>
            <strong>{detail.submittedAt}</strong>
          </div>
          <div>
            <span>Total quantity</span>
            <strong>{totalQuantity}</strong>
          </div>
          {detail.showPrices ? (
            <div>
              <span>Estimated amount</span>
              <strong>
                {hasPricedItems ? formatCurrency(pricedTotal) : "Price not set"}
                {hasPricedItems && hasUnpricedItems ? <small>Partially priced</small> : null}
              </strong>
            </div>
          ) : null}
          {detail.customerName ? (
            <div>
              <span>Name</span>
              <strong>{detail.customerName}</strong>
            </div>
          ) : null}
          {detail.customerEmail ? (
            <div>
              <span>Email</span>
              <strong>{detail.customerEmail}</strong>
            </div>
          ) : null}
          {detail.customerContact ? (
            <div>
              <span>Contact</span>
              <strong>{detail.customerContact}</strong>
            </div>
          ) : null}
        </section>

        {detail.note ? <p className="selection-public-note">{detail.note}</p> : null}

        <section className="selection-edit-toolbar">
          <div>
            <strong>Edit your selection</strong>
            <span>Remove items you do not want, adjust quantities, or add more items below.</span>
          </div>
        </section>

        <section className="selection-public-items" aria-label="Selected items">
          {selectedItems.map((item) => (
            <article className="selection-public-item selection-public-item-editable" key={item.id}>
              <button className="selection-public-image-button" type="button" onClick={() => setPreview(item)} aria-label={`Preview ${item.title}`}>
                <img src={item.imageUrl} alt={item.title} />
              </button>
              <div className="selection-public-item-copy">
                <strong>{item.title}</strong>
                {item.description ? <p>{item.description}</p> : null}
                <span>
                  Quantity {item.quantity}
                  {detail.showPrices && item.price !== null ? ` · ${formatCurrency(item.price, item.currency)}` : ""}
                </span>
                <div className="selection-edit-actions">
                  {detail.allowQuantity ? (
                    <div className="selection-edit-stepper">
                      <button type="button" onClick={() => setQuantity(item, item.quantity - 1)} aria-label="Decrease quantity">
                        <Minus size={15} />
                      </button>
                      <input value={item.quantity} type="number" min={item.minQuantity} max={item.maxQuantity} onChange={(event) => setQuantity(item, Number(event.target.value))} />
                      <button type="button" onClick={() => setQuantity(item, item.quantity + 1)} aria-label="Increase quantity">
                        <Plus size={15} />
                      </button>
                    </div>
                  ) : null}
                  <button className="selection-remove-button" type="button" onClick={() => removeItem(item.id)}>
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
          {detail.unavailableItems.map((item) => (
            <article className="selection-public-item is-unavailable" key={item.id}>
              <button
                className="selection-public-image-button"
                type="button"
                onClick={() => setPreview({ title: item.title, imageUrl: item.image, description: item.description, price: item.price, currency: item.currency })}
                aria-label={`Preview ${item.title}`}
              >
                <img src={item.image} alt={item.title} />
              </button>
              <div className="selection-public-item-copy">
                <strong>{item.title}</strong>
                {item.description ? <p>{item.description}</p> : null}
                <span>Unavailable item · Quantity {item.quantity}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="selection-add-more">
          <div>
            <strong>Add more items</strong>
            <span>These items are still available on the original selection page.</span>
          </div>
          {availableItems.length ? (
            <div className="selection-add-more-grid">
              {availableItems.map((item) => (
                <article className="selection-add-card" key={item.id}>
                  <button className="selection-public-image-button" type="button" onClick={() => setPreview(item)} aria-label={`Preview ${item.title}`}>
                    <img src={item.imageUrl} alt={item.title} />
                  </button>
                  <div className="selection-add-copy">
                    <strong>{item.title}</strong>
                    {detail.showPrices ? item.price === null ? <span>Price not set</span> : <span>{formatCurrency(item.price, item.currency)}</span> : null}
                  </div>
                  {detail.allowQuantity ? (
                    <div className="selection-add-stepper">
                      <button type="button" onClick={() => setAddQuantity(item, getAddQuantity(item) - 1)} aria-label="Decrease quantity">
                        <Minus size={15} />
                      </button>
                      <input value={getAddQuantity(item)} type="number" min={item.minQuantity} max={item.maxQuantity} onChange={(event) => setAddQuantity(item, Number(event.target.value))} />
                      <button type="button" onClick={() => setAddQuantity(item, getAddQuantity(item) + 1)} aria-label="Increase quantity">
                        <Plus size={15} />
                      </button>
                    </div>
                  ) : null}
                  <button className="selection-add-button" type="button" onClick={() => addItem(item)}>
                    <Check size={15} />
                    Add
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="selection-public-note">All available items are already in this selection.</p>
          )}
        </section>

        <section className="selection-save-footer">
          <div>
            <strong>Ready to save?</strong>
            <span>
              {selectedItems.length} pick{selectedItems.length === 1 ? "" : "s"} · {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
            </span>
          </div>
          <button type="button" onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {message ? <div className={`selection-edit-message ${message.startsWith("Saved") ? "is-success" : ""}`}>{message}</div> : null}
        </section>

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
                {detail.showPrices && preview.price !== null ? <span>{formatCurrency(preview.price, preview.currency)}</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
