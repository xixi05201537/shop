"use client";

import Link from "next/link";
import { FileImage, FileText, Home, Images, LogOut, Mail, Package, ReceiptText, Settings, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "概览", icon: Home, exact: true },
  { href: "/admin/orders", label: "订单", icon: ReceiptText },
  { href: "/admin/product", label: "商品", icon: Package },
  { href: "/admin/selection-pages", label: "选品单", icon: Images },
  { href: "/admin/upload", label: "图片", icon: FileImage },
  { href: "/admin/email", label: "邮件", icon: Mail },
  { href: "/admin/articles", label: "文章", icon: FileText },
  { href: "/admin/floating-widget", label: "浮窗", icon: Sparkles },
  { href: "/admin/settings", label: "设置", icon: Settings },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const exact = "exact" in item && item.exact;
        const active = exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined} href={item.href} key={item.href}>
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <form action="/api/admin/logout" method="post">
        <button type="submit">
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </form>
    </nav>
  );
}
