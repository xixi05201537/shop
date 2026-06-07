import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { AdminToast } from "@/components/AdminToast";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "./AdminNav";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) return children;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span className="admin-brand-mark">
            <Sparkles size={19} />
          </span>
          <span>
            <strong>Misaki</strong>
            <small>商店后台</small>
          </span>
        </Link>
        <AdminNav />
      </aside>
      <main className="admin-main">
        <Suspense fallback={null}>
          <AdminToast />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
