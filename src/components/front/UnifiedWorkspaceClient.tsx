"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadPublicWorkspaceData } from "@/lib/supabase-public-data";
import type { Contact, Department, Team, Template } from "@/types/database";

interface UnifiedWorkspaceClientProps {
  teams?: Team[];
  departments?: Department[];
  templates?: Array<Template & { block_count?: number }>;
  contacts?: Contact[];
}

export function UnifiedWorkspaceClient({
  teams = [],
  departments = [],
  templates = [],
  contacts = []
}: UnifiedWorkspaceClientProps) {
  const [data, setData] = useState({ teams, departments, templates, contacts });
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

  return (
    <main className="page-shell">
      <div className="mb-6 flex justify-end">
        <Link href="/admin" className="btn btn-primary">
          管理後台
        </Link>
      </div>

      <section className="mb-6 rounded-2xl bg-white p-6 shadow-tight">
        <p className="eyebrow">Shared Template Center</p>
        <h1 className="section-title">共用模板中心</h1>
        <p className="section-subtitle">
          請選擇您的團隊，進入後即可選擇團隊專屬模板進行編輯。
        </p>
      </section>

      {loading ? (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">
          資料載入中...
        </div>
      ) : null}

      {message ? (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">
          {message}
        </div>
      ) : null}

      <section>
        {data.teams.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.teams.map((team) => (
              <Link key={team.id} href={`/templates?team=${team.id}`} className="step-card">
                <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">
                  啟用中
                </span>

                <div className="mt-4 flex items-center gap-4">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.logo_url}
                      alt={`${team.name} Logo`}
                      className="h-14 w-14 shrink-0 rounded-lg border border-line object-contain"
                    />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-navy-900 text-base font-black text-white">
                      ST
                    </span>
                  )}

                  <h3 className="text-2xl font-black text-navy-900">{team.name}</h3>
                </div>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  {team.description || "請由後台補上這個團隊的簡易敘述。"}
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
    </main>
  );
}