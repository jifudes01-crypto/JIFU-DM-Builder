"use client";

import dynamic from "next/dynamic";
import type { TemplateCanvasPreviewProps } from "@/types/component-props";

const DynamicTemplateCanvasPreview = dynamic<TemplateCanvasPreviewProps>(
  () => import("@/components/front/TemplateCanvasPreviewImpl").then((mod) => mod.TemplateCanvasPreview),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-96 place-items-center rounded-lg border border-line bg-slate-100 p-4 text-center">
        <div>
          <p className="text-lg font-black text-navy-900">預覽載入中</p>
          <p className="mt-2 text-base text-slate-600">畫布只會在瀏覽器端建立。</p>
        </div>
      </div>
    )
  }
);

export function TemplateCanvasPreview(props: TemplateCanvasPreviewProps) {
  return <DynamicTemplateCanvasPreview {...props} />;
}
