import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "共用模板中心",
  description: "多團隊共用模板選擇、編輯與管理系統"
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
              <span className="brand-mark">ST</span>
              <span>
                <span className="eyebrow block">Shared Template Center</span>
                <span className="block text-xl font-black text-navy-900">共用模板中心</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/" className="btn btn-primary">
                回首頁
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
