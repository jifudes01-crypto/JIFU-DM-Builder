import { Suspense } from "react";
import { TemplatesPageClient } from "@/components/front/TemplatesPageClient";

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card p-6">
            <h1 className="section-title">正在讀取模板</h1>
          </div>
        </main>
      }
    >
      <TemplatesPageClient />
    </Suspense>
  );
}
