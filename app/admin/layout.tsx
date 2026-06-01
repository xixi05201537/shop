import Link from "next/link";
import { FileText, Home, LogOut, Mail, Package, ReceiptText, Sparkles } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) return children;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <Sparkles size={22} /> Pink Admin
        </Link>
        <nav className="admin-nav">
          <Link href="/admin">
            <Home size={18} /> Overview
          </Link>
          <Link href="/admin/product">
            <Package size={18} /> Product
          </Link>
          <Link href="/admin/orders">
            <ReceiptText size={18} /> Orders
          </Link>
          <Link href="/admin/email">
            <Mail size={18} /> Email
          </Link>
          <Link href="/admin/floating-widget">
            <Sparkles size={18} /> Floating
          </Link>
          <Link href="/admin/articles">
            <FileText size={18} /> Articles
          </Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit">
              <LogOut size={18} /> Logout
            </button>
          </form>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
