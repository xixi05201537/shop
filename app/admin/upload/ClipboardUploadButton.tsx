"use client";

import { Clipboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { readClipboardImageFile } from "@/lib/clipboard-image";

export function ClipboardUploadButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadFromClipboard() {
    setMessage("");
    setUploading(true);
    try {
      const file = await readClipboardImageFile();
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/uploads/clipboard", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Upload failed.");

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
