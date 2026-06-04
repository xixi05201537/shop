import Link from "next/link";
import { Sparkles } from "lucide-react";
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
          <Sparkles size={22} /> Misaki 后台
        </Link>
        <AdminNav />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
