"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FloatingWidgetView } from "@/lib/floating-widgets";
import { SelectionImagePickerDialog } from "../selection-pages/SelectionImagePickerDialog";

type UploadedImageOption = {
  name: string;
  path: string;
};

type FloatingWidgetRow = FloatingWidgetView & {
  rowKey: string;
};

export function FloatingWidgetTable({
  initialWidgets,
  uploadedImages,
}: {
  initialWidgets: FloatingWidgetView[];
  uploadedImages: UploadedImageOption[];
}) {
  const [rows, setRows] = useState<FloatingWidgetRow[]>(() =>
    (initialWidgets.length ? initialWidgets : [newFloatingWidgetRow()]).map((widget, index) => ({
      ...widget,
      rowKey: widget.id === "legacy-floating-widget" ? `legacy-${index}` : widget.id,
    })),
  );
  const serializedRows = useMemo(
    () =>
      JSON.stringify(
        rows.map((row, index) => ({
          id: row.id,
          url: row.url,
          displayType: "image",
          label: row.label,
          imageUrl: row.imageUrl,
          openMode: row.openMode,
          size: row.size,
          width: row.width,
          height: row.height,
          shape: row.shape,
          position: row.position,
          enabled: row.enabled,
          sortOrder: index,
        })),
      ),
    [rows],
  );

  function updateRow(rowKey: string, patch: Partial<FloatingWidgetRow>) {
    setRows((current) => current.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)));
  }

  function removeRow(rowKey: string) {
    setRows((current) => current.filter((row) => row.rowKey !== rowKey));
  }

  return (
    <form className="admin-card floating-widget-admin-card" action="/api/admin/floating-widget" method="post">
      <input name="floatingWidgets" type="hidden" value={serializedRows} />
      <div className="floating-widget-toolbar">
        <div>
          <strong>浮窗列表</strong>
          <span>仅使用图片素材。WhatsApp 横条选“胶囊”，右侧书签选“书签”。</span>
        </div>
        <button className="secondary-button" type="button" onClick={() => setRows((current) => [...current, newFloatingWidgetRow()])}>
          <Plus size={16} />
          添加浮窗
        </button>
      </div>

      {rows.length ? (
        <div className="floating-widget-table-wrap">
          <table className="admin-table floating-widget-table">
            <thead>
              <tr>
                <th>启用</th>
                <th>跳转 URL</th>
                <th>图片</th>
                <th>打开方式</th>
                <th>宽</th>
                <th>高</th>
                <th>形状</th>
                <th>位置</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowKey}>
                  <td>
                    <label className="floating-widget-enabled">
                      <input
                        checked={row.enabled}
                        type="checkbox"
                        onChange={(event) => updateRow(row.rowKey, { enabled: event.target.checked })}
                      />
                      <span>{row.enabled ? "开" : "关"}</span>
                    </label>
                  </td>
                  <td>
                    <input
                      aria-label="跳转 URL"
                      value={row.url}
                      onChange={(event) => updateRow(row.rowKey, { url: event.target.value })}
                      placeholder="/article/about 或 https://..."
                    />
                  </td>
                  <td>
                    <div className="floating-image-cell">
                      <input
                        aria-label="图片 URL"
                        value={row.imageUrl}
                        onChange={(event) => updateRow(row.rowKey, { imageUrl: event.target.value })}
                        placeholder="/uploads/widget.png"
                      />
                      <SelectionImagePickerDialog
                        uploadedImages={uploadedImages}
                        onSelect={(path) => updateRow(row.rowKey, { imageUrl: path, displayType: "image" })}
                      />
                      {row.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.imageUrl} alt="" />
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <select
                      aria-label="打开方式"
                      value={row.openMode}
                      onChange={(event) => updateRow(row.rowKey, { openMode: event.target.value })}
                    >
                      <option value="current">当前窗口</option>
                      <option value="new">新窗口</option>
                    </select>
                  </td>
                  <td>
                    <input
                      aria-label="宽"
                      min={24}
                      max={240}
                      type="number"
                      value={row.width}
                      onChange={(event) => updateRow(row.rowKey, { width: Number(event.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      aria-label="高"
                      min={24}
                      max={240}
                      type="number"
                      value={row.height}
                      onChange={(event) => updateRow(row.rowKey, { height: Number(event.target.value) })}
                    />
                  </td>
                  <td>
                    <select aria-label="形状" value={row.shape} onChange={(event) => updateRow(row.rowKey, { shape: event.target.value })}>
                      <option value="rounded">圆角</option>
                      <option value="circle">圆形</option>
                      <option value="square">方形</option>
                      <option value="pill">胶囊</option>
                      <option value="bookmark">书签</option>
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label="位置"
                      value={row.position}
                      onChange={(event) => updateRow(row.rowKey, { position: event.target.value })}
                    >
                      <option value="right-bottom">右下角</option>
                      <option value="left-bottom">左下角</option>
                      <option value="right-middle">右侧居中</option>
                      <option value="left-middle">左侧居中</option>
                    </select>
                  </td>
                  <td>
                    <button className="table-action-button danger" type="button" onClick={() => removeRow(row.rowKey)}>
                      <Trash2 size={14} />
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">暂无浮窗。</div>
      )}

      <div className="admin-save-bar">
        <SubmitButton loadingText="保存中...">保存浮窗</SubmitButton>
      </div>
    </form>
  );
}

function newFloatingWidgetRow(): FloatingWidgetRow {
  return {
    id: "",
    rowKey: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url: "/article/about",
    displayType: "image",
    label: "Floating link",
    imageUrl: "",
    openMode: "current",
    size: "medium",
    width: 180,
    height: 64,
    shape: "bookmark",
    position: "right-middle",
    enabled: true,
    sortOrder: 0,
  };
}
