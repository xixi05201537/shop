"use client";

import { useMemo, useRef, useState } from "react";
import { Clipboard, Download, FileSpreadsheet, ImagePlus, Plus, Trash2, Upload, X } from "lucide-react";
import type { UploadedImageOption } from "@/app/admin/product/ProductAdminForm";
import { readClipboardImageFile } from "@/lib/clipboard-image";

type PaymentImage = {
  imageUrl: string;
  caption: string;
  price: string;
  quantity: string;
};

type PaymentRequestFormValue = {
  id?: string;
  title: string;
  description: string;
  totalAmount: number;
  currency: string;
  status: string;
  adminNote: string;
  images: PaymentImage[];
};

const emptyPaymentRequest: PaymentRequestFormValue = {
  title: "",
  description: "",
  totalAmount: 0,
  currency: "USD",
  status: "pending",
  adminNote: "",
  images: [{ imageUrl: "", caption: "", price: "", quantity: "1" }],
};

export function PaymentRequestFormDialog({
  uploadedImages,
  paymentRequest,
  triggerLabel = "新建付款单",
}: {
  uploadedImages: UploadedImageOption[];
  paymentRequest?: PaymentRequestFormValue;
  triggerLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pickerDialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const initialValue = paymentRequest || emptyPaymentRequest;
  const [images, setImages] = useState<PaymentImage[]>(
    initialValue.images.length
      ? initialValue.images.map((image) => ({ ...image, quantity: image.quantity || "1" }))
      : [{ imageUrl: "", caption: "", price: "", quantity: "1" }],
  );
  const [localAddedImages, setLocalAddedImages] = useState<UploadedImageOption[]>([]);
  const imageOptions = useMemo<UploadedImageOption[]>(() => {
    const combined = [...localAddedImages, ...uploadedImages];
    const seen = new Set<string>();
    return combined.filter((image) => {
      if (seen.has(image.path)) return false;
      seen.add(image.path);
      return true;
    });
  }, [localAddedImages, uploadedImages]);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [localUploadIndex, setLocalUploadIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const calculatedTotal = useMemo(
    () =>
      Number(
        images
          .reduce((sum, image) => {
            const price = Number(image.price);
            const quantity = Number(image.quantity);
            return sum + (Number.isFinite(price) && price > 0 ? price : 0) * (Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1);
          }, 0)
          .toFixed(2),
      ),
    [images],
  );

  function updateImage(index: number, next: Partial<PaymentImage>) {
    setImages((current) => current.map((image, itemIndex) => (itemIndex === index ? { ...image, ...next } : image)));
  }

  function addUploadedOption(path: string) {
    const name = path.split("/").pop() || path;
    setLocalAddedImages((current) => {
      if (current.some((image) => image.path === path)) return current;
      return [{ name, path, fullUrl: path }, ...current];
    });
  }

  function fillUploadedImage(path: string, index: number | null) {
    if (path) addUploadedOption(path);
    setImages((current) => {
      if (index !== null && current[index]) {
        return current.map((image, itemIndex) => (itemIndex === index ? { ...image, imageUrl: path } : image));
      }
      return [...current, { imageUrl: path, caption: "", price: "", quantity: "1" }];
    });
  }

  async function uploadImageFile(file: File, index: number | null) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/admin/uploads/clipboard", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "上传失败。");
    fillUploadedImage(data.path || "", index);
  }

  async function handleLocalImage(file?: File | null) {
    if (!file) return;
    setUploadMessage("");
    setUploading(true);
    try {
      await uploadImageFile(file, localUploadIndex);
      setUploadMessage("已上传本地图片并填入图片地址。");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLocalUploadIndex(null);
    }
  }

  async function uploadFromClipboard(index: number) {
    setUploadMessage("");
    setUploading(true);
    try {
      const file = await readClipboardImageFile();
      await uploadImageFile(file, index);
      setUploadMessage("已上传剪贴板图片并填入图片地址。");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  }
  async function importExcelFile(file?: File | null) {
    if (!file) return;
    setUploadMessage("");
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/payment-requests/import", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "导入失败，请检查 Excel 格式。");
      const importedImages = Array.isArray(data.images) ? data.images : [];
      if (!importedImages.length) throw new Error("Excel 里没有可导入的图片行。");
      importedImages.forEach((image: PaymentImage) => {
        if (image.imageUrl) addUploadedOption(image.imageUrl);
      });
      setImages(importedImages);
      setUploadMessage(`已导入 ${importedImages.length} 行，数量和总金额已自动计算。`);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "导入失败，请检查 Excel 格式。");
    } finally {
      setImporting(false);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  }

  return (
    <>
      <button className={paymentRequest ? "table-action-button" : "admin-button"} type="button" onClick={() => dialogRef.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog className="admin-dialog payment-request-dialog" ref={dialogRef}>
        <form className="admin-form payment-request-form" action="/api/admin/payment-requests" method="post">
          <div className="dialog-heading payment-request-dialog-heading">
            <div>
              <h2>编辑付款单</h2>
            </div>
            <button type="button" className="dialog-close-button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
          {paymentRequest?.id ? <input type="hidden" name="id" value={paymentRequest.id} /> : null}

          <div className="payment-request-dialog-body">
            <div className="admin-grid">
              <label>
                标题
                <input name="title" defaultValue={initialValue.title} required placeholder="例如：6 月直播预留商品" />
              </label>
              <label>
                总金额
                <div className="payment-request-total-preview">
                  <strong>{formatMoney(calculatedTotal, initialValue.currency || "USD")}</strong>
                  <span>根据下方每张图片价格自动计算</span>
                </div>
              </label>
              <label>
                币种
                <input name="currency" defaultValue={initialValue.currency || "USD"} />
              </label>
              <label>
                状态
                <select name="status" defaultValue={initialValue.status || "pending"}>
                  <option value="pending">待确认</option>
                  <option value="confirmed">确认付款</option>
                  <option value="deferred">稍后付款</option>
                  <option value="paying">付款中</option>
                  <option value="paid" disabled>
                    已付款
                  </option>
                </select>
              </label>
            </div>

            <label>
              简介
              <textarea name="description" defaultValue={initialValue.description} placeholder="给客户看的付款说明，可以写商品、数量、确认事项。" />
            </label>

            <section className="payment-image-editor">
              <div className="payment-image-editor-head">
                <strong>图片</strong>
                <div className="payment-image-upload-actions">
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    hidden
                    onChange={(event) => void importExcelFile(event.target.files?.[0])}
                  />
                  <a className="secondary-button" href="/api/admin/payment-requests/template">
                    <Download size={16} />
                    下载模板
                  </a>
                  <button className="secondary-button" type="button" onClick={() => excelInputRef.current?.click()} disabled={importing}>
                    <FileSpreadsheet size={16} />
                    {importing ? "导入中..." : "导入 Excel"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    hidden
                    onChange={(event) => void handleLocalImage(event.target.files?.[0])}
                  />
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setImages((current) => [...current, { imageUrl: "", caption: "", price: "", quantity: "1" }])}
                  >
                    <Plus size={16} />
                    添加图片
                  </button>
                </div>
              </div>
              {uploadMessage ? <div className="payment-image-upload-message">{uploadMessage}</div> : null}
              {images.map((image, index) => (
                <div className="payment-image-row" key={index}>
                  <input name="imageUrl" type="hidden" value={image.imageUrl} />
                  <div className="payment-image-card-preview">
                    {image.imageUrl ? <img src={image.imageUrl} alt={image.caption || `付款单图片 ${index + 1}`} /> : <span>图片预览</span>}
                  </div>
                  <div className="payment-image-card-fields">
                    <div className="payment-image-card-top">
                      <input
                        name="imagePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={image.price}
                        onChange={(event) => updateImage(index, { price: event.target.value })}
                        placeholder="单价"
                      />
                      <input
                        name="imageQuantity"
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={image.quantity}
                        onChange={(event) => updateImage(index, { quantity: event.target.value })}
                        placeholder="数量"
                      />
                      <strong className="payment-image-line-total">{formatMoney(lineTotal(image), initialValue.currency || "USD")}</strong>
                      <div className="payment-image-card-actions">
                        <button
                          className="payment-image-icon-button"
                          type="button"
                          title="本地上传"
                          onClick={() => {
                            setLocalUploadIndex(index);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploading}
                          aria-label="本地上传"
                        >
                          <Upload size={17} />
                        </button>
                        <button
                          className="payment-image-icon-button"
                          type="button"
                          title="剪贴板上传"
                          onClick={() => void uploadFromClipboard(index)}
                          disabled={uploading}
                          aria-label="剪贴板上传"
                        >
                          <Clipboard size={17} />
                        </button>
                        <button
                          className="payment-image-icon-button"
                          type="button"
                          title="相册上传"
                          onClick={() => {
                            setPickerIndex(index);
                            pickerDialogRef.current?.showModal();
                          }}
                          aria-label="相册上传"
                        >
                          <ImagePlus size={17} />
                        </button>
                        <button
                          className="payment-image-icon-button is-danger"
                          type="button"
                          title="删除"
                          onClick={() => setImages((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : [{ imageUrl: "", caption: "", price: "", quantity: "1" }]))}
                          aria-label="删除"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                    <input
                      name="imageCaption"
                      value={image.caption}
                      onChange={(event) => updateImage(index, { caption: event.target.value })}
                      placeholder="描述"
                    />
                  </div>
                </div>
              ))}
            </section>

            <label>
              内部备注
              <textarea name="adminNote" defaultValue={initialValue.adminNote} placeholder="只给后台内部查看，不会显示在客户页面或邮件里。" />
            </label>
          </div>

          <div className="dialog-actions payment-request-dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <button className="admin-button" type="submit">
              保存付款单
            </button>
          </div>
        </form>
      </dialog>
      <dialog
        className="admin-dialog payment-image-picker-dialog"
        ref={pickerDialogRef}
        onClose={() => setPickerIndex(null)}
      >
            <div className="dialog-title">
              <strong>选择图片</strong>
              <button className="icon-text-button" type="button" onClick={() => pickerDialogRef.current?.close()} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            {imageOptions.length ? (
              <div className="selection-image-picker-grid">
                {imageOptions.map((image) => (
                  <button
                    key={image.path}
                    type="button"
                    onClick={() => {
                      if (pickerIndex !== null) updateImage(pickerIndex, { imageUrl: image.path });
                      pickerDialogRef.current?.close();
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

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

function lineTotal(image: PaymentImage) {
  const price = Number(image.price);
  const quantity = Number(image.quantity);
  return Number(((Number.isFinite(price) && price > 0 ? price : 0) * (Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1)).toFixed(2));
}
