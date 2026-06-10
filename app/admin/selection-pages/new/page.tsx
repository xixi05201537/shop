import Link from "next/link";
import { SelectionPageForm } from "../SelectionPageForm";

export default function NewSelectionPage() {
  return (
    <>
      <header className="admin-header">
        <h1 className="display">新建选品单</h1>
        <Link className="secondary-button" href="/admin/selection-pages">
          返回列表
        </Link>
      </header>
      <SelectionPageForm />
    </>
  );
}
