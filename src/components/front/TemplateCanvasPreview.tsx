"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import type Konva from "konva";
import type { Contact, TemplateWithBlocks } from "@/types/database";

interface TemplateCanvasPreviewProps {
  template: TemplateWithBlocks;
  values: Record<string, string>;
  images: Record<string, string>;
  contact: Contact | null;
  scale?: number;
  stageRef?: RefObject<Konva.Stage | null>;
  showGuides?: boolean;
}

const TemplateCanvasPreviewInner = dynamic(
  () => import("@/components/front/TemplateCanvasPreviewInner").then((mod) => mod.TemplateCanvasPreview),
  {
    ssr: false,
    loading: () => <div className="flex min-h-[420px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">預覽載入中...</div>
  }
);

export function TemplateCanvasPreview(props: TemplateCanvasPreviewProps) {
  return <TemplateCanvasPreviewInner {...props} />;
}
