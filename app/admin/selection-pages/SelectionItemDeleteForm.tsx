"use client";

import { SubmitButton } from "@/components/SubmitButton";

export function SelectionItemDeleteForm({ itemId, selectedCount }: { itemId: string; selectedCount: number }) {
  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedCount) return;
    const ok = window.confirm(
      `这个选品项已经被客户选择过 ${selectedCount} 次。删除后，已有提交会保留当时的快照，但后续客户编辑时不会再看到这个选品项。确定继续删除吗？`,
    );
    if (!ok) event.preventDefault();
  }

  return (
    <form className="selection-delete-form" action="/api/admin/selection-items/delete" method="post" onSubmit={confirmDelete}>
      <input type="hidden" name="id" value={itemId} />
      <SubmitButton className="table-action-button danger" loadingText="删除中...">
        删除
      </SubmitButton>
    </form>
  );
}
