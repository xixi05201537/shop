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
          <Sparkles size={22} /> Misaki 后台
        </Link>
        <nav className="admin-nav">
          <Link href="/admin">
            <Home size={18} /> 概览
          </Link>
          <Link href="/admin/product">
            <Package size={18} /> 商品
          </Link>
          <Link href="/admin/orders">
            <ReceiptText size={18} /> 订单
          </Link>
          <Link href="/admin/email">
            <Mail size={18} /> 邮件
          </Link>
          <Link href="/admin/floating-widget">
            <Sparkles size={18} /> 浮窗
          </Link>
          <Link href="/admin/articles">
            <FileText size={18} /> 文章
          </Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit">
              <LogOut size={18} /> 退出登录
            </button>
          </form>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
