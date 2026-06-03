"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface SavedImage {
  png: string;
  jpg: string;
  pdf: string;
  name: string;
}

export function SaveImagePageClient() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key") ?? "";
  const [saved, setSaved] = useState<SavedImage | null>(null);

  useEffect(() => {
    if (!key) return;
    const raw = localStorage.getItem(`jifu-save-image:${key}`);
    if (!raw) return;
    try {
      setSaved(JSON.parse(raw) as SavedImage);
    } catch {
      setSaved(null);
    }
  }, [key]);

  return (
    <main className="page-shell">
      <section className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">專用儲存頁</p>
        <h1 className="section-title">長按圖片儲存 DM</h1>
        <p className="section-subtitle">使用 LINE、iPhone、Android 或社群 App 開啟時，若下載按鈕無效，請長按圖片後選擇儲存圖片。</p>
      </section>

      {saved ? (
        <section className="card mt-6 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={saved.png} alt={saved.name} className="w-full rounded-lg border border-line bg-white" />
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={saved.png} download={`${saved.name}.png`}>
              下載 PNG
            </a>
            <a className="btn btn-secondary" href={saved.jpg} download={`${saved.name}.jpg`}>
              下載 JPG
            </a>
            <a className="btn btn-blue" href={saved.pdf} download={`${saved.name}.pdf`}>
              下載 PDF
            </a>
          </div>
        </section>
      ) : (
        <section className="card mt-6 p-6">
          <h2 className="text-xl font-black text-navy-900">找不到圖片</h2>
          <p className="section-subtitle">請回到 DM 編輯頁重新產生圖片。</p>
          <Link href="/" className="btn btn-primary mt-4">
            回首頁
          </Link>
        </section>
      )}
    </main>
  );
}
