"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TemplateBlockEditorClient } from "@/components/admin/TemplateBlockEditorClient";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { TemplateBlock, TemplateWithBlocks } from "@/types/database";

function sortBlocks(blocks: TemplateBlock[] | null | undefined) {
  return [...(blocks ?? [])].sort((a, b) => a.z_index - b.z_index);
}

export function TemplateBlockRouteClient() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id") ?? "";
  const [template, setTemplate] = useState<TemplateWithBlocks | null>(null);
  const [message, setMessage] = useState("正在讀取模板資料...");

  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      if (!templateId) {
        setMessage("缺少模板 ID，請從模板列表重新進入區塊設定。");
        setTemplate(null);
        return;
      }

      try {
        setMessage("正在讀取模板資料...");
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("templates")
          .select("*, template_blocks(*)")
          .eq("id", templateId)
          .maybeSingle();

        if (cancelled) return;

        if (error) throw error;

        if (!data) {
          setTemplate(null);
          setMessage("找不到模板，請確認模板是否仍存在。");
          return;
        }

        const nextTemplate = {
          ...(data as TemplateWithBlocks),
          blocks: sortBlocks((data.template_blocks ?? []) as TemplateBlock[])
        };

        setTemplate(nextTemplate);
        setMessage("");
      } catch (error) {
        if (cancelled) return;
        setTemplate(null);
        setMessage(error instanceof Error ? error.message : "模板讀取失敗，請稍後再試。");
      }
    }

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (!template) {
    return (
      <section className="card p-6">
        <h1 className="section-title">區塊設定</h1>
        <p className="section-subtitle">{message}</p>
        <Link href="/admin/templates" className="btn btn-primary mt-4">
          回模板列表
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">區塊設定</p>
        <h1 className="section-title">{template.name}</h1>
        <p className="section-subtitle">後台人工框選可編輯區域；前台只能填資料，不能拖曳或修改版面。</p>
      </div>
      <TemplateBlockEditorClient template={template} />
    </section>
  );
}
