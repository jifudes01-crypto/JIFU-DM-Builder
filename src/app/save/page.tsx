import { Suspense } from "react";
import { SaveImagePageClient } from "@/components/front/SaveImagePageClient";

export default function SavePage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card p-6">
            <h1 className="section-title">正在開啟儲存頁</h1>
          </div>
        </main>
      }
    >
      <SaveImagePageClient />
    </Suspense>
  );
}
