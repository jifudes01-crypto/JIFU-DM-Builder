"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DmEditorClient } from "@/components/front/DmEditorClient";
import type { Contact, PrintOption, Team, TemplateWithBlocks } from "@/types/database";

interface EditorPageClientProps {
  teams: Team[];
  templates: TemplateWithBlocks[];
  contacts: Contact[];
  printOptions: PrintOption[];
}

export function EditorPageClient({ teams, templates, contacts, printOptions }: EditorPageClientProps) {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? "";
  const templateId = searchParams.get("template") ?? "";
  const team = teams.find((item) => item.id === teamId) ?? null;
  const template = templates.find((item) => item.id === templateId && item.team_id === teamId) ?? null;
  const visibleContacts = contacts.filter((contact) => contact.team_id === teamId && contact.is_active);

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
      <DmEditorClient teamId={teamId} template={template} contacts={visibleContacts} printOptions={printOptions} />
    </main>
  );
}
