"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadEditorData } from "@/lib/supabase-public-data";
import type { Team, TemplateWithBlocks } from "@/types/database";

interface TemplatesPageClientProps {
  teams?: Team[];
  templates?: TemplateWithBlocks[];
}

export function TemplatesPageClient({ teams = [], templates = [] }: TemplatesPageClientProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState({ teams, templates });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const teamId = searchParams.get("team") ?? "";
  const team = data.teams.find((item) => item.id === teamId) ?? null;
  const visibleTemplates = data.templates.filter((template) => template.team_id === teamId && template.status === "published");

  async function refreshEditorData() {
    try {
      setLoading(true);
      setMessage("");
      const remoteData = await loadEditorData();
      if (remoteData) {
        setData({ teams: remoteData.teams, templates: remoteData.templates });
      } else {
        setMessage("Supabase 尚未完成前台資料設定，請檢查 supabase-config.json 與 GitHub Secrets。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取 Supabase 模板失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshEditorData();
  }, []);

  if (!teamId) {
    return (
      <main className="page-shell">
        <div className="card p-6">
          <h1 className="section-title">請先選擇團隊</h1>
          <Link href="/" className="btn btn-primary mt-4">
            回到選擇團隊
          </Link>
        </div>
      </main>
    );
  }

  if (loading && !team) {
    return (
      <main className="page-shell">
        <div className="card p-6">
          <h1 className="section-title">資料載入中...</h1>
          <p className="section-subtitle">正在從 Supabase 讀取最新團隊與模板資料。</p>
        </div>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="page-shell">
        <div className="card p-6">
          <h1 className="section-title">找不到這個團隊</h1>
          {message ? <p className="section-subtitle">{message}</p> : <p className="section-subtitle">請回到首頁重新選擇團隊。</p>}
          <Link href="/" className="btn btn-primary mt-4">
            回到選擇團隊
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="mb-6 rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Step 2</p>
        <h1 className="section-title">選擇模板</h1>
        <p className="section-subtitle">{team.description || `${team.name} 目前只會顯示已上架且完成區塊設定的模板。`}</p>
        <button type="button" className="btn btn-secondary mt-4" onClick={refreshEditorData}>
          重新整理模板
        </button>
      </section>

      {loading ? <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">資料載入中...</div> : null}
      {message ? <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">{message}</div> : null}

      {visibleTemplates.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/editor?team=${team.id}&template=${template.id}`}
              className="step-card overflow-hidden"
            >
              <div className="grid aspect-[4/3] place-items-center rounded-lg border border-line bg-slate-100 text-slate-500">
                {template.thumbnail_url || template.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.thumbnail_url || template.image_url} alt={template.name} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <span className="text-lg font-black">模板預覽</span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">{template.size_label}</span>
                <span className="status-pill border-line bg-white text-slate-600">{template.blocks.length} 個區塊</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-navy-900">{template.name}</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">{template.description || template.category}</p>
              <span className="btn btn-primary mt-5 w-full">使用這個模板</span>
            </Link>
          ))}
        </section>
      ) : (
        <div className="card p-6">
          <h2 className="text-xl font-black text-navy-900">此團隊目前尚無可用模板</h2>
          <p className="section-subtitle">請到後台確認模板已上架 published，並完成區塊設定。後台新增或上架後，前台按重新整理即可看到。</p>
          <Link href="/admin/templates" className="btn btn-primary mt-4">
            到後台模板管理
          </Link>
        </div>
      )}
    </main>
  );
}
