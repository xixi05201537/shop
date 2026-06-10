"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";

type UploadedImageOption = {
  name: string;
  path: string;
};

type SelectionItemFormData = {
  id?: string;
  pageId: string;
  title?: string;
  imageUrl?: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  sortOrder?: number;
  minQuantity?: number;
  maxQuantity?: number;
  isActive?: boolean;
};

export function SelectionItemForm({
  item,
  uploadedImages,
  mode = "create",
}: {
  item: SelectionItemFormData;
  uploadedImages: UploadedImageOption[];
  mode?: "create" | "edit";
}) {
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "");
  const [title, setTitle] = useState(item.title || "");
  const [presets, setPresets] = useState<string[]>([]);
  const [presetInput, setPresetInput] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("selectionItemTitlePresets") || "[]");
      const base = Array.isArray(saved) ? saved.filter((value) => typeof value === "string" && value.trim()) : [];
      setPresets(base);
    } catch {
      setPresets([]);
    }
  }, []);

  function savePresets(next: string[]) {
    const unique = Array.from(new Set(next.map((value) => value.trim()).filter(Boolean))).slice(0, 16);
    setPresets(unique);
    localStorage.setItem("selectionItemTitlePresets", JSON.stringify(unique));
  }

  function addPreset(value: string) {
    if (!value.trim()) return;
    savePresets([...presets, value]);
    setPresetInput("");
  }

  async function uploadImageFile(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/admin/uploads/clipboard", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "上传失败。");
    setImageUrl(data.path || "");
  }

  async function handleLocalImage(file?: File | null) {
    if (!file) return;
    setUploadMessage("");
    setUploading(true);
    try {
      await uploadImageFile(file);
      setUploadMessage("已上传并填入图片路径。");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function uploadFromClipboard() {
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
      await uploadImageFile(file);
      setUploadMessage("已上传并填入图片路径。");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="selection-item-form" action="/api/admin/selection-items" method="post">
      {item.id ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="pageId" value={item.pageId} />
      <div className="selection-item-main-grid">
        <label>
          图片路径
          <div className="image-url-control">
            <input name="imageUrl" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="/uploads/example.jpg 或 https://..." required />
            <details className="image-picker-menu">
              <summary>选择图片</summary>
              <div className="image-picker-panel">
                {uploadedImages.length ? (
                  uploadedImages.map((image) => (
                    <button
                      key={image.path}
                      type="button"
                      onClick={(event) => {
                        setImageUrl(image.path);
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                    >
                      <img src={image.path} alt={image.name} />
                      <span>{image.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="image-picker-empty">还没有上传图片。</div>
                )}
              </div>
            </details>
          </div>
          <div className="selection-upload-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg"
              hidden
              onChange={(event) => void handleLocalImage(event.target.files?.[0])}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              选择本地照片
            </button>
            <button type="button" onClick={uploadFromClipboard} disabled={uploading}>
              {uploading ? "上传中..." : "粘贴上传图片"}
            </button>
            {uploadMessage ? <span>{uploadMessage}</span> : null}
          </div>
        </label>
        <label>
          名称
          <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="图片下方显示的名称" required />
          <div className="selection-preset-add">
            <span>预设</span>
            <input value={presetInput} onChange={(event) => setPresetInput(event.target.value)} placeholder="新增名称预设" />
            <button type="button" onClick={() => addPreset(presetInput || title)}>
              添加预设
            </button>
          </div>
          <div className="selection-preset-row">
            {presets.map((preset) => (
              <span className="selection-preset-chip" key={preset}>
                <button type="button" onClick={() => setTitle(preset)}>
                  {preset}
                </button>
                <button type="button" aria-label={`删除预设 ${preset}`} onClick={() => savePresets(presets.filter((item) => item !== preset))}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </label>
      </div>
      <label>
        介绍
        <textarea name="description" defaultValue={item.description || ""} placeholder="可选，显示在图片正下方。" />
      </label>
      <div className="admin-grid selection-item-number-grid">
        <label>
          价格
          <input name="price" type="number" min="0" step="0.01" defaultValue={item.price ?? ""} placeholder="可选" />
        </label>
        <label>
          币种
          <input name="currency" defaultValue={item.currency || "USD"} />
        </label>
        <label>
          排序
          <input name="sortOrder" type="number" defaultValue={item.sortOrder ?? 0} />
        </label>
        <label>
          最小数量
          <input name="minQuantity" type="number" min="1" defaultValue={item.minQuantity ?? 1} />
        </label>
        <label>
          最大数量
          <input name="maxQuantity" type="number" min="1" defaultValue={item.maxQuantity ?? 99} />
        </label>
      </div>
      <div className="admin-save-bar">
        <label className="checkbox-row">
          <span>
            <input name="isActive" type="checkbox" defaultChecked={item.isActive ?? true} /> 显示
          </span>
        </label>
        <SubmitButton loadingText="保存中...">{mode === "create" ? "添加选品项" : "保存选品项"}</SubmitButton>
      </div>
    </form>
  );
}
