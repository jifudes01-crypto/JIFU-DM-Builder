"use client";

import dynamic from "next/dynamic";
import type { DmEditorProps } from "@/types/component-props";

const DynamicDmEditor = dynamic<DmEditorProps>(
  () => import("@/components/front/DmEditorImpl").then((mod) => mod.DmEditor),
  {
    ssr: false,
    loading: () => (
      <div className="card grid min-h-96 place-items-center p-6 text-center">
        <div>
          <p className="text-xl font-black text-navy-900">DM 編輯器載入中</p>
          <p className="section-subtitle">預覽畫布與匯出功能只會在瀏覽器端載入。</p>
        </div>
      </div>
    )
  }
);

export function DmEditorClient(props: DmEditorProps) {
  return <DynamicDmEditor {...props} />;
}
