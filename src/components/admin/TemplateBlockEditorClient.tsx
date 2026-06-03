"use client";

import dynamic from "next/dynamic";
import type { TemplateBlockEditorProps } from "@/types/component-props";

const DynamicTemplateBlockEditor = dynamic<TemplateBlockEditorProps>(
  () => import("@/components/admin/TemplateBlockEditorImpl").then((mod) => mod.TemplateBlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="card grid min-h-96 place-items-center p-6 text-center">
        <div>
          <p className="text-xl font-black text-navy-900">區塊編輯器載入中</p>
          <p className="section-subtitle">畫布功能只會在瀏覽器端載入。</p>
        </div>
      </div>
    )
  }
);

export function TemplateBlockEditorClient(props: TemplateBlockEditorProps) {
  return <DynamicTemplateBlockEditor {...props} />;
}
