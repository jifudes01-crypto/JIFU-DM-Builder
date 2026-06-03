"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Team, TemplateWithBlocks } from "@/types/database";

interface TemplatesPageClientProps {
  teams: Team[];
  templates: TemplateWithBlocks[];
}

export function TemplatesPageClient({ teams, templates }: TemplatesPageClientProps) {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? "";
  const team = teams.find((item) => item.id === teamId) ?? null;
  const visibleTemplates = templates.filter((template) => template.team_id === teamId);

  if (!teamId || !team) {
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

  return (
    <main className="page-shell">
      <section className="mb-6 rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Step 2</p>
        <h1 className="section-title">選擇模板</h1>
        <p className="section-subtitle">{team.name} 目前只會顯示已上架且完成區塊設定的模板。</p>
      </section>

      {visibleTemplates.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/editor?team=${team.id}&template=${template.id}`}
              className="step-card overflow-hidden"
            >
              <div className="grid aspect-[4/3] place-items-center rounded-lg border border-line bg-slate-100 text-slate-500">
                {template.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.thumbnail_url} alt={template.name} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <span className="text-lg font-black">模板預覽</span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">{template.size_label}</span>
                <span className="status-pill border-line bg-white text-slate-600">{template.blocks.length} 個區塊</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-navy-900">{template.name}</h2>
              <p className="mt-2 text-base text-slate-600">{template.category}</p>
              <span className="btn btn-primary mt-5 w-full">使用這個模板</span>
            </Link>
          ))}
        </section>
      ) : (
        <div className="card p-6">
          <h2 className="text-xl font-black text-navy-900">目前沒有可用模板</h2>
          <p className="section-subtitle">請到後台確認模板已上架，並完成區塊設定。</p>
          <Link href="/admin/templates" className="btn btn-primary mt-4">
            到後台模板管理
          </Link>
        </div>
      )}
    </main>
  );
}
