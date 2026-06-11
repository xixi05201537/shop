import Link from "next/link";
import { SelectionPageForm } from "../SelectionPageForm";

export default async function NewSelectionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParams ? await searchParams : {};

  return (
    <>
      <header className="admin-header">
        <h1 className="display">新建选品单</h1>
        <Link className="secondary-button" href="/admin/selection-pages">
          返回列表
        </Link>
      </header>
      {query.error === "save" ? <div className="admin-notice">创建失败，请检查链接标识是否重复或稍后重试。</div> : null}
      <SelectionPageForm />
    </>
  );
}
