"use client";

import dynamic from "next/dynamic";
import type { TemplateWithBlocks } from "@/types/database";

interface TemplateBlockEditorProps {
  template: TemplateWithBlocks;
}

const TemplateBlockEditorInner = dynamic(
  () => import("@/components/admin/TemplateBlockEditorInner").then((mod) => mod.TemplateBlockEditor),
  {
    ssr: false,
    loading: () => <div className="card p-6 text-slate-500">區塊編輯器載入中...</div>
  }
);

export function TemplateBlockEditor(props: TemplateBlockEditorProps) {
  return <TemplateBlockEditorInner {...props} />;
}
