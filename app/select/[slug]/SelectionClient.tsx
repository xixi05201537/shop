"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock3, Eye, Minus, Plus, Send, ShoppingBag, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { CandySelectedIcon } from "./CandySelectedIcon";

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
  showName: boolean;
  showEmail: boolean;
  showContact: boolean;
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

type SelectionHistoryRecord = {
  id: string;
  reference: string;
  path: string;
  pageTitle: string;
  totalQuantity: number;
  submittedAt: string;
};

type SelectionDraft = {
  selected: SelectedMap;
  customerName: string;
  customerEmail: string;
  customerContact: string;
  note: string;
  updatedAt: string;
};

const selectionHistoryStorageKey = "misaki-selection-history";
const maxSelectionHistoryRecords = 12;
const sheetAnimationMs = 180;

function selectionDraftStorageKey(slug: string) {
  return `misaki-selection-draft:${slug}`;
}

function readSelectionHistory() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(selectionHistoryStorageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SelectionHistoryRecord => {
        return Boolean(
          item &&
            typeof item.id === "string" &&
            typeof item.reference === "string" &&
            typeof item.path === "string" &&
            typeof item.pageTitle === "string" &&
            typeof item.totalQuantity === "number" &&
            typeof item.submittedAt === "string",
        );
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, maxSelectionHistoryRecords);
  } catch {
    return [];
  }
}

function writeSelectionHistory(record: SelectionHistoryRecord) {
  const next = [record, ...readSelectionHistory().filter((item) => item.id !== record.id)].slice(0, maxSelectionHistoryRecords);
  window.localStorage.setItem(selectionHistoryStorageKey, JSON.stringify(next));
  return next;
}

function historyTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function readSelectionDraft(slug: string, itemIds: Set<string>): SelectionDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(selectionDraftStorageKey(slug)) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const rawSelected = parsed.selected && typeof parsed.selected === "object" ? parsed.selected : {};
    const selected = Object.fromEntries(
      Object.entries(rawSelected)
        .filter(([id, quantity]) => itemIds.has(id) && Number.isFinite(Number(quantity)) && Number(quantity) > 0)
        .map(([id, quantity]) => [id, Math.floor(Number(quantity))]),
    );

    return {
      selected,
      customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
      customerEmail: typeof parsed.customerEmail === "string" ? parsed.customerEmail : "",
      customerContact: typeof parsed.customerContact === "string" ? parsed.customerContact : "",
      note: typeof parsed.note === "string" ? parsed.note : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function writeSelectionDraft(slug: string, draft: SelectionDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(selectionDraftStorageKey(slug), JSON.stringify(draft));
}

function clearSelectionDraft(slug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(selectionDraftStorageKey(slug));
}

function getInitialSelectionDraft(page: SelectionPageView) {
  if (typeof window === "undefined") return null;
  const itemIds = new Set(page.items.map((item) => item.id));
  return readSelectionDraft(page.slug, itemIds);
}

export function SelectionClient({ page }: { page: SelectionPageView }) {
  const initialDraft = useMemo(() => getInitialSelectionDraft(page), [page]);
  const [selected, setSelected] = useState<SelectedMap>(() => initialDraft?.selected ?? {});
  const [preview, setPreview] = useState<SelectionItemView | null>(null);
  const [customerName, setCustomerName] = useState(() => initialDraft?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(() => initialDraft?.customerEmail ?? "");
  const [customerContact, setCustomerContact] = useState(() => initialDraft?.customerContact ?? "");
  const [note, setNote] = useState(() => initialDraft?.note ?? "");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyClosing, setHistoryClosing] = useState(false);
  const [history, setHistory] = useState<SelectionHistoryRecord[]>(() =>
    typeof window !== "undefined" ? readSelectionHistory() : [],
  );
  const mobileBarRef = useRef<HTMLDivElement | null>(null);
  const cartVisibleRef = useRef(false);
  const historyVisibleRef = useRef(false);
  const cartCloseTimerRef = useRef<number | null>(null);
  const historyCloseTimerRef = useRef<number | null>(null);
  const itemIds = useMemo(() => new Set(page.items.map((item) => item.id)), [page.items]);

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
  const refreshHistory = useCallback(() => {
    setHistory(readSelectionHistory());
  }, []);
  const refreshHistorySoon = useCallback(() => {
    refreshHistory();
    window.setTimeout(refreshHistory, 80);
  }, [refreshHistory]);
  const restoreDraft = useCallback(() => {
    const draft = readSelectionDraft(page.slug, itemIds);
    if (!draft) return;
    setSelected(draft.selected);
    setCustomerName(draft.customerName);
    setCustomerEmail(draft.customerEmail);
    setCustomerContact(draft.customerContact);
    setNote(draft.note);
  }, [itemIds, page.slug]);

  useEffect(() => {
    writeSelectionDraft(page.slug, {
      selected,
      customerName,
      customerEmail,
      customerContact,
      note,
      updatedAt: new Date().toISOString(),
    });
  }, [customerContact, customerEmail, customerName, note, page.slug, selected]);

  useEffect(() => {
    const syncVisibleHistory = () => {
      if (document.visibilityState === "visible") {
        restoreDraft();
        refreshHistorySoon();
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        restoreDraft();
        refreshHistory();
      }
    }, 1200);

    const syncPageState = () => {
      restoreDraft();
      refreshHistorySoon();
    };

    window.addEventListener("pageshow", syncPageState);
    window.addEventListener("popstate", syncPageState);
    window.addEventListener("focus", syncPageState);
    document.addEventListener("visibilitychange", syncVisibleHistory);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pageshow", syncPageState);
      window.removeEventListener("popstate", syncPageState);
      window.removeEventListener("focus", syncPageState);
      document.removeEventListener("visibilitychange", syncVisibleHistory);
    };
  }, [refreshHistory, refreshHistorySoon, restoreDraft]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const bar = mobileBarRef.current;
    if (!viewport || !bar) return;

    const syncVisualViewport = () => {
      const hiddenBottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      bar.style.setProperty("--selection-mobile-visual-bottom", `${hiddenBottom}px`);
    };

    syncVisualViewport();
    viewport.addEventListener("resize", syncVisualViewport);
    viewport.addEventListener("scroll", syncVisualViewport);
    window.addEventListener("orientationchange", syncVisualViewport);

    return () => {
      viewport.removeEventListener("resize", syncVisualViewport);
      viewport.removeEventListener("scroll", syncVisualViewport);
      window.removeEventListener("orientationchange", syncVisualViewport);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (cartCloseTimerRef.current) window.clearTimeout(cartCloseTimerRef.current);
      if (historyCloseTimerRef.current) window.clearTimeout(historyCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    cartVisibleRef.current = cartOpen || cartClosing;
  }, [cartClosing, cartOpen]);

  useEffect(() => {
    historyVisibleRef.current = historyOpen || historyClosing;
  }, [historyClosing, historyOpen]);

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
          items: selectedItems.map((item) => ({ id: item.id, quantity: item.quantity })),
          customerName: page.showName ? customerName : "",
          customerEmail: page.showEmail ? customerEmail : "",
          customerContact: page.showContact ? customerContact : "",
          note,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not submit your selection. Please try again.");
      const result = {
        id: data.submissionId || "",
        reference: data.reference || "",
        path: data.path || "",
      };
      setSubmissionResult({
        id: result.id,
        reference: result.reference,
        path: result.path,
      });
      if (result.id && result.reference && result.path) {
        setHistory(
          writeSelectionHistory({
            id: result.id,
            reference: result.reference,
            path: result.path,
            pageTitle: page.title,
            totalQuantity,
            submittedAt: new Date().toISOString(),
          }),
        );
      }
      setSubmitted(true);
      clearSelectionDraft(page.slug);
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

  function removeItem(item: SelectionItemView) {
    setSelected((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
  }

  function scrollToReview() {
    closeCart();
    reviewSelection();
    document.querySelector("#selection-submit-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openCart() {
    if (cartCloseTimerRef.current) {
      window.clearTimeout(cartCloseTimerRef.current);
      cartCloseTimerRef.current = null;
    }
    setCartClosing(false);
    cartVisibleRef.current = true;
    setCartOpen(true);
  }

  function closeCart() {
    if (!cartVisibleRef.current || cartCloseTimerRef.current) return;
    setCartClosing(true);
    cartCloseTimerRef.current = window.setTimeout(() => {
      setCartOpen(false);
      setCartClosing(false);
      cartVisibleRef.current = false;
      cartCloseTimerRef.current = null;
    }, sheetAnimationMs);
  }

  function openHistory() {
    if (historyCloseTimerRef.current) {
      window.clearTimeout(historyCloseTimerRef.current);
      historyCloseTimerRef.current = null;
    }
    setHistory(readSelectionHistory());
    setHistoryClosing(false);
    historyVisibleRef.current = true;
    setHistoryOpen(true);
    refreshHistorySoon();
  }

  function closeHistory() {
    if (!historyVisibleRef.current || historyCloseTimerRef.current) return;
    setHistoryClosing(true);
    historyCloseTimerRef.current = window.setTimeout(() => {
      setHistoryOpen(false);
      setHistoryClosing(false);
      historyVisibleRef.current = false;
      historyCloseTimerRef.current = null;
    }, sheetAnimationMs);
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
        <div className="selection-hero-actions">
          <div className="selection-hero-note">
            <span>Available items</span>
            <strong>{page.items.length}</strong>
          </div>
          <button className="selection-history-button" type="button" onClick={openHistory}>
            <Clock3 size={16} />
            选品记录
            {history.length ? <small>{history.length}</small> : null}
          </button>
        </div>
      </section>

      <form className="container selection-layout" onSubmit={submitSelection}>
        <section className="selection-masonry" aria-label="Selection list">
          {page.items.map((item) => {
            const quantity = selected[item.id];
            const isSelected = Boolean(quantity);
            const itemLabel = item.title.trim();
            const itemAlt = itemLabel || "Selection item";
            const itemPrice = page.showPrices && item.price !== null ? formatCurrency(item.price, item.currency) : "";

            return (
              <article
                className={`selection-card ${isSelected ? "is-selected" : ""}`}
                key={item.id}
                onClick={() => toggleItem(item)}
              >
                <div className="selection-image-wrap">
                  <img src={item.imageUrl} alt={itemAlt} loading="lazy" />
                  <button
                    className="selection-preview-button"
                    type="button"
                    aria-label={`Preview ${itemAlt}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreview(item);
                    }}
                  >
                    <Eye size={17} />
                  </button>
                  {isSelected ? (
                    <span className="selection-check">
                      <CandySelectedIcon />
                    </span>
                  ) : null}
                  {(itemLabel || itemPrice) ? (
                    <div className="selection-image-meta">
                      {itemLabel ? <span>{itemLabel}</span> : <span aria-hidden="true" />}
                      {itemPrice ? <strong>{itemPrice}</strong> : null}
                    </div>
                  ) : null}
                </div>
                <div className="selection-card-body">
                  {item.description ? <p>{item.description}</p> : null}
                  {page.allowQuantity ? (
                    <div
                      className={`selection-card-stepper ${isSelected ? "" : "is-placeholder"}`}
                      aria-hidden={!isSelected}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={!isSelected}
                        onClick={() => setQuantity(item, quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        value={quantity || item.minQuantity}
                        disabled={!isSelected}
                        min={item.minQuantity}
                        max={item.maxQuantity}
                        type="number"
                        onChange={(event) => setQuantity(item, Number(event.target.value))}
                      />
                      <button
                        type="button"
                        disabled={!isSelected}
                        onClick={() => setQuantity(item, quantity + 1)}
                        aria-label="Increase quantity"
                      >
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
            {page.showName ? (
              <label>
                Name{page.requireName ? " *" : ""}
                <input value={customerName} required={page.requireName} onChange={(event) => setCustomerName(event.target.value)} />
              </label>
            ) : null}
            {page.showEmail ? (
              <label>
                Email{page.requireEmail ? " *" : ""}
                <input type="email" value={customerEmail} required={page.requireEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
              </label>
            ) : null}
            {page.showContact ? (
              <label>
                Contact{page.requireContact ? " *" : ""}
                <input value={customerContact} required={page.requireContact} onChange={(event) => setCustomerContact(event.target.value)} />
              </label>
            ) : null}
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

        <div className="selection-mobile-bar" ref={mobileBarRef} aria-label="Selection summary">
          <button className="selection-mobile-cart-button" type="button" onClick={openCart} aria-label="View selected items">
            <ShoppingBag size={19} />
            {selectedItems.length ? <small>{selectedItems.length}</small> : null}
          </button>
          <div>
            <span>{selectedItems.length} pick{selectedItems.length === 1 ? "" : "s"} / {totalQuantity} item{totalQuantity === 1 ? "" : "s"}</span>
            {canShowTotal ? <strong>{formatCurrency(totalAmount)}</strong> : <strong>Ready to review</strong>}
          </div>
          <button type="button" onClick={scrollToReview}>
            Review
          </button>
        </div>
      </form>

      {cartOpen || cartClosing ? (
        <div
          className={`selection-cart-sheet-overlay ${cartClosing ? "is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={closeCart}
        >
          <section className="selection-cart-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="selection-cart-sheet-head">
              <div>
                <span>Your picks</span>
                <strong>{selectedItems.length} pick{selectedItems.length === 1 ? "" : "s"} / {totalQuantity} item{totalQuantity === 1 ? "" : "s"}</strong>
                {canShowTotal ? <small>{formatCurrency(totalAmount)}</small> : null}
              </div>
              <button type="button" aria-label="Close selected items" onClick={closeCart}>
                <X size={18} />
              </button>
            </div>

            {selectedItems.length ? (
              <div className="selection-cart-list">
                {selectedItems.map((item) => {
                  const itemLabel = item.title.trim() || "Unlabeled item";
                  const itemPrice = page.showPrices && item.price !== null ? formatCurrency(item.price, item.currency) : "";

                  return (
                    <article className="selection-cart-item" key={item.id}>
                      <img src={item.imageUrl} alt={itemLabel} />
                      <div className="selection-cart-item-content">
                        <div className="selection-cart-item-meta">
                          <strong>{itemLabel}</strong>
                          {itemPrice ? <span>{itemPrice}</span> : null}
                        </div>
                        <div className="selection-cart-item-actions">
                          {page.allowQuantity ? (
                            <div className="selection-cart-stepper">
                              <button type="button" onClick={() => setQuantity(item, item.quantity - 1)} aria-label={`Decrease ${itemLabel}`}>
                                <Minus size={15} />
                              </button>
                              <input
                                value={item.quantity}
                                min={item.minQuantity}
                                max={item.maxQuantity}
                                type="number"
                                onChange={(event) => setQuantity(item, Number(event.target.value))}
                              />
                              <button type="button" onClick={() => setQuantity(item, item.quantity + 1)} aria-label={`Increase ${itemLabel}`}>
                                <Plus size={15} />
                              </button>
                            </div>
                          ) : (
                            <span className="selection-cart-quantity">Qty {item.quantity}</span>
                          )}
                          <button type="button" aria-label={`Remove ${itemLabel}`} onClick={() => removeItem(item)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="selection-cart-empty">No picks yet.</div>
            )}

            <button className="selection-cart-review-button" type="button" onClick={scrollToReview}>
              Review
            </button>
          </section>
        </div>
      ) : null}

      {historyOpen || historyClosing ? (
        <div
          className={`selection-history-sheet-overlay ${historyClosing ? "is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={closeHistory}
        >
          <section className="selection-history-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="selection-cart-sheet-head">
              <div>
                <span>History</span>
                <strong>选品记录</strong>
                <small>{history.length ? `${history.length} records` : "No records yet"}</small>
              </div>
              <button type="button" aria-label="Close selection history" onClick={closeHistory}>
                <X size={18} />
              </button>
            </div>
            <p className="selection-history-local-note">
              Records are saved only on this device. They will not appear if you switch browsers or devices.
            </p>

            {history.length ? (
              <div className="selection-history-sheet-list">
                {history.map((record) => (
                  <a href={record.path} className="selection-history-sheet-item" key={record.id}>
                    <div>
                      <span>{record.reference}</span>
                      <strong>{record.pageTitle}</strong>
                      <small>
                        {record.totalQuantity} items{historyTimeLabel(record.submittedAt) ? ` · ${historyTimeLabel(record.submittedAt)}` : ""}
                      </small>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="selection-cart-empty">还没有历史选品记录。</div>
            )}
          </section>
        </div>
      ) : null}

      {preview ? (
        <div className="selection-preview-overlay" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <div className="selection-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close preview" onClick={() => setPreview(null)}>
              <X size={20} />
            </button>
            <img src={preview.imageUrl} alt={preview.title.trim() || "Selection item"} />
            <div>
              <strong>{preview.title.trim() || "Unlabeled item"}</strong>
              {preview.description ? <p>{preview.description}</p> : null}
              {page.showPrices && preview.price !== null ? <span>{formatCurrency(preview.price, preview.currency)}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
