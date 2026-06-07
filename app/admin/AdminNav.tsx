"use client";

import Link from "next/link";
import { FileImage, FileText, Home, LogOut, Mail, Package, ReceiptText, Settings, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "概览", icon: Home, exact: true },
  { href: "/admin/product", label: "商品", icon: Package },
  { href: "/admin/orders", label: "订单", icon: ReceiptText },
  { href: "/admin/upload", label: "图片", icon: FileImage },
  { href: "/admin/email", label: "邮件", icon: Mail },
  { href: "/admin/settings", label: "设置", icon: Settings },
  { href: "/admin/floating-widget", label: "浮窗", icon: Sparkles },
  { href: "/admin/articles", label: "文章", icon: FileText },
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
