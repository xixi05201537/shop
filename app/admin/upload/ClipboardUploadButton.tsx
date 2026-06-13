"use client";

import { Clipboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClipboardUploadButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadFromClipboard() {
    setMessage("");
    if (!navigator.clipboard?.read) {
      setMessage("当前浏览器不支持读取剪贴板图片。");
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
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/uploads/clipboard", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "上传失败。");

      setMessage("已从剪贴板上传图片。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="clipboard-upload-control">
      <button className="secondary-button" type="button" onClick={uploadFromClipboard} disabled={uploading}>
        <Clipboard size={17} />
        {uploading ? "上传中..." : "从剪贴板上传"}
      </button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
