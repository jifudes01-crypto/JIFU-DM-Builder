import Link from "next/link";
import type { ReactNode } from "react";
import { AdminCodeGate } from "@/components/admin/AdminCodeGate";

const links = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/teams", label: "公司管理" },
  { href: "/admin/departments", label: "團隊＆店名管理" },
  { href: "/admin/templates", label: "模板管理" },
  { href: "/admin/contacts", label: "通訊錄" },
  { href: "/admin/downloads", label: "下載紀錄" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <div className="mb-6 rounded-2xl border border-gold-300/25 bg-navy-900 p-3 shadow-luxury">
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="btn border-white/10 bg-white/8 text-white hover:border-gold-300 hover:bg-gold-500 hover:text-navy-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <AdminCodeGate>{children}</AdminCodeGate>
    </main>
  );
}
