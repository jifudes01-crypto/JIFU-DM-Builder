import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "吉富 DM 套版系統",
  description: "吉富不動產與工商地產 DM 套版製作與管理系統"
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
                <span className="block text-sm font-black uppercase tracking-normal text-gold-300">Ji Fu Real Estate DM</span>
                <span className="block text-xl font-black text-white">吉富 DM 套版系統</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/" className="btn border-gold-300/50 bg-white/10 text-white hover:bg-white/15">
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
