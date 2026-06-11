"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";

type ImportResult = {
  ok?: boolean;
  imported?: number;
  skipped?: number;
  error?: string;
};

const errorText: Record<string, string> = {
  file: "导入失败：请选择一个 .xlsx Excel 文件。",
  sheet: "导入失败：Excel 中没有可导入的工作表。",
  template: "导入失败：请使用从本页导出的选品项 Excel 模板，不要直接上传其它 Excel。",
  parse: "导入失败：无法读取 Excel 文件，请检查文件后重试。",
  unauthorized: "登录已失效，请重新登录后台后再导入。",
};

export function SelectionImportDialog({ pageId }: { pageId: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function closeDialog(force = false) {
    if (loading && !force) return;
    setError("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    dialogRef.current?.close();
  }

  async function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError(errorText.file);
      return;
    }

    const formData = new FormData();
    formData.set("pageId", pageId);
    formData.set("file", file);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/selection-items/import", {
        method: "POST",
        headers: { Accept: "application/json", "X-Import-Mode": "dialog" },
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as ImportResult;
      if (!response.ok || !data.ok) {
        throw new Error(errorText[data.error || ""] || data.error || "导入失败：请检查 Excel 文件后重试。");
      }
      closeDialog(true);
      router.refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "导入失败：请检查 Excel 文件后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="secondary-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        <Upload size={16} />
        导入 Excel
      </button>
      <dialog className="admin-dialog selection-import-dialog" ref={dialogRef}>
        <div className="dialog-title">
          <strong>导入选品项 Excel</strong>
          <button className="icon-text-button" type="button" onClick={() => closeDialog()} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <form className="selection-import-dialog-form" onSubmit={submitImport}>
          <label className="selection-import-file-picker">
            <Upload size={18} />
            <span>选择 Excel 文件</span>
            <input
              ref={inputRef}
              name="file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                setError("");
                setFileName(event.currentTarget.files?.[0]?.name || "");
              }}
            />
          </label>
          <div className="selection-import-file-name">
            <span>已选择文件</span>
            <strong>{fileName || "未选择"}</strong>
          </div>
          {error ? <p className="selection-import-error">{error}</p> : null}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => closeDialog()} disabled={loading}>
              取消
            </button>
            <button className="admin-button" type="submit" disabled={loading || !fileName}>
              {loading ? "导入中..." : "上传导入"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
