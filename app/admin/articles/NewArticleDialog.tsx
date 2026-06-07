"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";

export function NewArticleDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="admin-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        <Plus size={18} /> 新增文章
      </button>
      <dialog className="admin-dialog wide-dialog article-dialog" ref={dialogRef}>
        <div className="dialog-title">
          <strong>新增文章</strong>
          <button className="icon-text-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <form className="admin-form" action="/api/admin/articles" method="post">
          <div className="admin-grid">
            <label>
              链接标识
              <input name="slug" placeholder="例如：about" required />
            </label>
            <label>
              标题
              <input name="title" placeholder="关于这个小店" required />
            </label>
          </div>
          <label>
            Markdown
            <textarea className="article-markdown-field" name="content" required />
          </label>
          <label className="checkbox-row">
            <span>
              <input name="published" type="checkbox" defaultChecked /> 发布
            </span>
          </label>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={() => dialogRef.current?.close()}>
              取消
            </button>
            <SubmitButton loadingText="创建中...">
              创建文章
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
