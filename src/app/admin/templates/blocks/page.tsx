import { Suspense } from "react";
import { TemplateBlockRouteClient } from "@/components/admin/TemplateBlockRouteClient";

export default function TemplateBlocksQueryPage() {
  return (
    <Suspense
      fallback={
        <section className="card p-6">
          <h1 className="section-title">區塊設定載入中</h1>
          <p className="section-subtitle">正在讀取模板資料...</p>
        </section>
      }
    >
      <TemplateBlockRouteClient />
    </Suspense>
  );
}
