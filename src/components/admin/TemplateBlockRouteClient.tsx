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
  const [message, setMessage] = useState("正在讀取模板區塊...");

  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      if (!templateId) {
        setMessage("缺少模板 ID，請回到模板管理重新進入區塊設定。");
        setTemplate(null);
        return;
      }

      try {
        setMessage("正在讀取模板區塊...");
        const supabase = await createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("templates")
          .select("*, template_blocks(*)")
          .eq("id", templateId)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;

        if (!data) {
          setTemplate(null);
          setMessage("找不到這個模板，請確認模板仍存在。");
          return;
        }

        setTemplate({
          ...(data as TemplateWithBlocks),
          blocks: sortBlocks((data.template_blocks ?? []) as TemplateBlock[])
        });
        setMessage("");
      } catch (error) {
        if (cancelled) return;
        setTemplate(null);
        setMessage(error instanceof Error ? error.message : "讀取模板失敗，請稍後再試。");
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
          回模板管理
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="luxury-panel">
        <p className="text-sm font-black uppercase tracking-normal text-gold-300">Block Editor</p>
        <h1 className="mt-2 text-3xl font-black text-white">{template.name}</h1>
        <p className="mt-3 text-base leading-7 text-slate-200">拖曳、縮放或刪除可編輯區塊，前台版面會依照這裡的設定顯示。</p>
      </div>
      <TemplateBlockEditorClient template={template} />
    </section>
  );
}
