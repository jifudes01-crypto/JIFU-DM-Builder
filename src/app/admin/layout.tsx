import Link from "next/link";
import type { ReactNode } from "react";
import { AdminCodeGate } from "@/components/admin/AdminCodeGate";

const links = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/teams", label: "團隊管理" },
  { href: "/admin/templates", label: "模板管理" },
  { href: "/admin/contacts", label: "通訊錄" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <div className="mb-6 rounded-lg border border-line bg-white p-3 shadow-tight">
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="btn btn-muted">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <AdminCodeGate>{children}</AdminCodeGate>
    </main>
  );
}
