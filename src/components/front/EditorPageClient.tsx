"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DmEditorClient } from "@/components/front/DmEditorClient";
import { loadEditorData } from "@/lib/supabase-public-data";
import type { Contact, Department, Team, TemplateWithBlocks } from "@/types/database";

interface EditorPageClientProps {
  teams: Team[];
  departments: Department[];
  templates: TemplateWithBlocks[];
  contacts: Contact[];
}

export function EditorPageClient({ teams, departments, templates, contacts }: EditorPageClientProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState({ teams, departments, templates, contacts });
  const [message, setMessage] = useState("");
  const teamId = searchParams.get("team") ?? "";
  const templateId = searchParams.get("template") ?? "";
  const team = data.teams.find((item) => item.id === teamId) ?? null;
  const template = data.templates.find((item) => item.id === templateId && item.team_id === teamId) ?? null;
  const visibleDepartments = data.departments.filter((department) => department.team_id === teamId && department.is_active);
  const visibleContacts = data.contacts.filter((contact) => contact.team_id === teamId && contact.is_active);

  useEffect(() => {
    loadEditorData()
      .then((remoteData) => {
        if (remoteData) setData({ teams: remoteData.teams, departments: remoteData.departments, templates: remoteData.templates, contacts: remoteData.contacts });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "讀取 Supabase 編輯資料失敗。"));
  }, []);

  if (!teamId || !templateId) {
    return (
      <main className="page-shell">
        <div className="card p-6">
          <h1 className="section-title">缺少團隊或模板</h1>
          <Link href="/" className="btn btn-primary mt-4">
            重新開始
          </Link>
        </div>
      </main>
    );
  }

  if (!team || !template || template.status !== "published" || template.blocks.length === 0) {
    return (
      <main className="page-shell">
        <div className="card p-6">
          <h1 className="section-title">這個模板目前不可以使用</h1>
          <p className="section-subtitle">模板可能已下架，或尚未完成後台區塊設定。</p>
          <Link href={`/templates?team=${teamId}`} className="btn btn-primary mt-4">
            回模板列表
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{team.name}</p>
          <h1 className="section-title">{template.name}</h1>
        </div>
        <Link href={`/templates?team=${teamId}`} className="btn btn-secondary">
          回模板列表
        </Link>
      </div>
      {message ? <div className="mb-6 rounded-lg bg-blue-50 p-4 font-bold text-navy-900">{message}</div> : null}
      <DmEditorClient teamId={teamId} team={team} template={template} departments={visibleDepartments} contacts={visibleContacts} />
    </main>
  );
}
