"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clipboard, ImagePlus, Plus, Trash2, Upload, X } from "lucide-react";
import type { UploadedImageOption } from "@/app/admin/product/ProductAdminForm";

type PaymentImage = {
  imageUrl: string;
  caption: string;
  price: string;
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
  images: [{ imageUrl: "", caption: "", price: "" }],
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
  const initialValue = paymentRequest || emptyPaymentRequest;
  const [images, setImages] = useState<PaymentImage[]>(initialValue.images.length ? initialValue.images : [{ imageUrl: "", caption: "", price: "" }]);
  const [imageOptions, setImageOptions] = useState<UploadedImageOption[]>(uploadedImages);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [localUploadIndex, setLocalUploadIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const calculatedTotal = useMemo(
    () =>
      Number(
        images
          .reduce((sum, image) => {
            const price = Number(image.price);
            return sum + (Number.isFinite(price) && price > 0 ? price : 0);
          }, 0)
          .toFixed(2),
      ),
    [images],
  );

  useEffect(() => {
    setImageOptions(uploadedImages);
  }, [uploadedImages]);

  function updateImage(index: number, next: Partial<PaymentImage>) {
    setImages((current) => current.map((image, itemIndex) => (itemIndex === index ? { ...image, ...next } : image)));
  }

  function addUploadedOption(path: string) {
    const name = path.split("/").pop() || path;
    setImageOptions((current) => {
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
      return [...current, { imageUrl: path, caption: "", price: "" }];
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
    if (!navigator.clipboard?.read) {
      setUploadMessage("当前浏览器不支持读取剪贴板图片。");
      return;
    }

    setUploading(true);
    try {
      const items = await navigator.clipboard.read();
      let blob: Blob | null = null;
      let mimeType = "";
      for (const clipboardItem of items) {
        const type = clipboardItem.types.find((itemType) => itemType.startsWith("image/"));
        if (!type) continue;
        blob = await clipboardItem.getType(type);
        mimeType = type;
        break;
      }
      if (!blob) throw new Error("剪贴板里没有图片。");

      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const file = new File([blob], `clipboard.${ext}`, { type: mimeType });
      await uploadImageFile(file, index);
      setUploadMessage("已上传剪贴板图片并填入图片地址。");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
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
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg"
                    hidden
                    onChange={(event) => void handleLocalImage(event.target.files?.[0])}
                  />
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setImages((current) => [...current, { imageUrl: "", caption: "", price: "" }])}
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
                        placeholder="价格"
                      />
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
                          onClick={() => setImages((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : [{ imageUrl: "", caption: "", price: "" }]))}
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
              备注
              <textarea name="adminNote" defaultValue={initialValue.adminNote} placeholder="内部备注或随邮件发送给客户的补充说明。" />
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
