"use client";

import type { ChangeEvent } from "react";

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

export function PageSizeSelect({ pageSize, queryString }: { pageSize: number; queryString: string }) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(queryString);
    params.set("pageSize", event.target.value);
    params.delete("page");
    const nextQuery = params.toString();
    window.location.href = `/admin/orders${nextQuery ? `?${nextQuery}` : ""}`;
  }

  return (
    <label className="pagination-page-size">
      <span>每页</span>
      <select aria-label="每页显示订单数量" value={String(pageSize)} onChange={handleChange}>
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size} 条
          </option>
        ))}
      </select>
    </label>
  );
}
