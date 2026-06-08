"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadPublicWorkspaceData } from "@/lib/supabase-public-data";
import type { Contact, Team, Template } from "@/types/database";

interface UnifiedWorkspaceClientProps {
  teams?: Team[];
  templates?: Array<Template & { block_count?: number }>;
  contacts?: Contact[];
}

export function UnifiedWorkspaceClient({
  teams = [],
  templates = [],
  contacts = []
}: UnifiedWorkspaceClientProps) {
  const [tab, setTab] = useState<"front" | "admin">("front");
  const [data, setData] = useState({ teams, templates, contacts });
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
    const saved = localStorage.getItem("jifu-workspace-tab");
    if (saved === "front" || saved === "admin") setTab(saved);
    refreshWorkspaceData();
  }, []);

  function chooseTab(nextTab: "front" | "admin") {
    setTab(nextTab);
    localStorage.setItem("jifu-workspace-tab", nextTab);
  }

  const adminCards = [
    { label: "團隊", value: data.teams.length, href: "/admin/teams" },
    { label: "模板", value: data.templates.length, href: "/admin/templates" },
    { label: "通訊錄", value: data.contacts.length, href: "/admin/contacts" }
  ];

  return (
    <main className="page-shell">
      <section className="mb-6 rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">吉富 DM 系統</p>
        <h1 className="section-title">DM 製作與管理工作台</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" className={`btn ${tab === "front" ? "btn-primary" : "btn-secondary"} w-full`} onClick={() => chooseTab("front")}>
            DM 製作
          </button>
          <button type="button" className={`btn ${tab === "admin" ? "btn-primary" : "btn-secondary"} w-full`} onClick={() => chooseTab("admin")}>
            管理後台
          </button>
        </div>
      </section>

      {loading ? <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">資料載入中...</div> : null}
      {message ? <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">{message}</div> : null}

      {tab === "front" ? (
        <section>
          <div className="mb-6 rounded-lg bg-white p-6 shadow-tight">
            <p className="eyebrow">Step 1</p>
            <h2 className="section-title">選擇團隊</h2>
            <p className="section-subtitle">請依照團隊說明選擇這次要製作 DM 的團隊。</p>
            <button type="button" className="btn btn-secondary mt-4" onClick={refreshWorkspaceData}>
              重新整理前台資料
            </button>
          </div>

          {data.teams.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.teams.map((team) => (
                <Link key={team.id} href={`/templates?team=${team.id}`} className="step-card">
                  <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">啟用中</span>
                  <h3 className="mt-4 text-2xl font-black text-navy-900">{team.name}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{team.description || "請由後台補上這個團隊的簡易敘述。"}</p>
                  <span className="btn btn-primary mt-5 w-full">選擇這個團隊</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="text-xl font-black text-navy-900">目前尚無可用團隊</h3>
              <p className="section-subtitle">請切換到管理後台，先新增或啟用團隊。新增後重新整理前台即可看到。</p>
            </div>
          )}
        </section>
      ) : (
        <section>
          <div className="mb-6 rounded-lg bg-white p-6 shadow-tight">
            <p className="eyebrow">管理後台</p>
            <h2 className="section-title">後台管理</h2>
            <p className="section-subtitle">從同一個網站進入團隊、模板與通訊錄管理。</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card) => (
              <Link key={card.label} href={card.href} className="card p-5">
                <p className="text-base font-bold text-slate-500">{card.label}</p>
                <p className="mt-3 text-4xl font-black text-navy-900">{card.value}</p>
                <span className="btn btn-secondary mt-5 w-full">進入管理</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
