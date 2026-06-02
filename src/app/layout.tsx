import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "吉富 DM 快速製作系統",
  description: "吉富 DM 管理後台與前台快速製作系統"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="flex items-center gap-3">
              <span className="brand-mark">JF</span>
              <span>
                <span className="eyebrow block">Ji Fu DM System</span>
                <span className="block text-xl font-black text-navy-900">吉富 DM 快速製作</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/" className="btn btn-secondary hidden sm:inline-flex">
                前台製作
              </Link>
              <Link href="/admin" className="btn btn-primary">
                後台管理
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
