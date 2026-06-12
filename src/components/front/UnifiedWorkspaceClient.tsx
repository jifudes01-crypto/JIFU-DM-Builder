"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadPublicWorkspaceData } from "@/lib/supabase-public-data";
import type { Contact, Department, ExportRecord, SiteSettings, Team, Template } from "@/types/database";

interface UnifiedWorkspaceClientProps {
  teams?: Team[];
  departments?: Department[];
  templates?: Array<Template & { block_count?: number }>;
  contacts?: Contact[];
  settings?: SiteSettings | null;
  stats?: {
    totalTemplates: number;
    downloadRecords: number;
  };
  downloads?: ExportRecord[];
}

export function UnifiedWorkspaceClient({
  teams = [],
  departments = [],
  templates = [],
  contacts = [],
  settings = null,
  stats = { totalTemplates: 0, downloadRecords: 0 },
  downloads = []
}: UnifiedWorkspaceClientProps) {
  const [data, setData] = useState({ teams, departments, templates, contacts, settings, stats, downloads });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function refreshWorkspaceData() {
    try {
      setLoading(true);
      setMessage("");
      const remoteData = await loadPublicWorkspaceData();
      if (remoteData) {
        setData(remoteData);
      } else {
        setMessage("Supabase 尚未完成前台資料設定，請檢查 supabase-config.json 與 GitHub Secrets。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取 Supabase 資料失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshWorkspaceData();
  }, []);

  const bannerUrl = data.settings?.banner_image_url ?? "";

  return (
    <main className="page-shell">
      <section
        className="relative mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-navy-950 px-6 py-12 shadow-2xl sm:px-10 lg:aspect-[12/5] lg:min-h-[360px] lg:px-12 lg:py-16"
        style={
          bannerUrl
            ? {
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat"
              }
            : undefined
        }
      >
        <div className="relative max-w-2xl">
          <p
            className="text-sm font-black uppercase tracking-normal text-gold-300"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,.45)" }}
          >
            Shared Template System
          </p>
          <h1
            className="mt-2 text-3xl font-black text-white sm:text-5xl"
            style={{ textShadow: "0 3px 18px rgba(0,0,0,.55)" }}
          >
            共用模板系統
          </h1>
          <p
            className="mt-4 max-w-2xl text-lg leading-8 text-white"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,.55)" }}
          >
            統一吉富工商地產團隊視覺，快速製作DM、名片與各式行銷模板，提升物件曝光與作業效率。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin" className="btn btn-secondary">
              管理後台
            </Link>
            <button
              type="button"
              className="btn border-white/25 bg-white/15 text-white shadow-lg hover:border-gold-300 hover:bg-white/20"
              onClick={() => void refreshWorkspaceData()}
            >
              重新整理
            </button>
          </div>
        </div>

        {!bannerUrl ? (
          <div className="relative mt-8 rounded-2xl border border-dashed border-gold-300/45 bg-navy-800/80 p-6 text-center text-slate-300 lg:absolute lg:right-10 lg:top-10 lg:mt-0 lg:w-[38%]">
            <p className="text-lg font-black text-gold-300">尚未設定 Banner</p>
            <p className="mt-2 text-sm leading-6">請從後台上傳首頁 Banner。</p>
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="mb-6 rounded-xl border border-gold-300/40 bg-gold-50 p-4 font-bold text-navy-900">
          資料載入中...
        </div>
      ) : null}

      {message ? (
        <div className="mb-6 rounded-xl border border-gold-300/40 bg-gold-50 p-4 font-bold text-navy-900">
          {message}
        </div>
      ) : null}

      <section className="mb-6">
        <div className="mb-4">
          <p className="eyebrow">Team Selection</p>
          <h2 className="section-title">選擇團隊</h2>
        </div>
        {data.teams.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.teams.map((team) => (
              <Link key={team.id} href={`/templates?team=${team.id}`} className="step-card">
                <div className="mt-4 flex items-center gap-4">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.logo_url}
                      alt={`${team.name} Logo`}
                      className="h-14 w-14 shrink-0 rounded-lg border border-line object-contain"
                    />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-dashed border-gold-300 bg-gold-50 text-xs font-black text-gold-700">
                      無 Logo
                    </span>
                  )}

                  <h3 className="text-2xl font-black text-navy-900">{team.name}</h3>
                </div>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  {team.description || "此團隊尚未設定簡易敘述。"}
                </p>

                <span className="btn btn-primary mt-5 w-full">進入團隊</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-6">
            <h3 className="text-xl font-black text-navy-900">目前尚無可用團隊</h3>
            <p className="section-subtitle">
              請由後台先新增或啟用團隊。新增後重新整理前台即可看到。
            </p>
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">System Information</p>
            <h2 className="section-title">系統資訊</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-line bg-navy-50 px-5 py-4">
              <p className="text-sm font-black text-slate-500">總模板數</p>
              <p className="mt-1 text-3xl font-black text-navy-900">{data.stats.totalTemplates}</p>
            </div>
            <div className="rounded-xl border border-line bg-gold-50 px-5 py-4">
              <p className="text-sm font-black text-slate-500">下載紀錄</p>
              <p className="mt-1 text-3xl font-black text-navy-900">{data.stats.downloadRecords}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>下載時間</th>
                <th>團隊</th>
                <th>模板</th>
                <th>格式</th>
              </tr>
            </thead>
            <tbody>
              {data.downloads.map((record) => (
                <tr key={record.id}>
                  <td>{record.created_at ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.created_at)) : "-"}</td>
                  <td>{record.teams?.name ?? "-"}</td>
                  <td>{record.templates?.name ?? "-"}</td>
                  <td className="font-black uppercase text-navy-900">{record.format}</td>
                </tr>
              ))}
              {!data.downloads.length ? (
                <tr>
                  <td colSpan={4}>
                    <div className="py-6 text-center">
                      <p className="text-lg font-black text-navy-900">目前沒有下載紀錄</p>
                      <p className="mt-2 text-sm text-slate-500">下載完成後會顯示 Supabase 中的真實紀錄。</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
