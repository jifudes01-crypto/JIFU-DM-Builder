import Link from "next/link";
import { DmEditor } from "@/components/front/DmEditor";
import { getTeam, getTemplateWithBlocks, listContacts, listPrintOptions } from "@/lib/data";

interface EditorPageProps {
  searchParams: Promise<{ team?: string; template?: string }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const params = await searchParams;
  const teamId = params.team;
  const templateId = params.template;

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

  const [team, template, contacts, printOptions] = await Promise.all([
    getTeam(teamId),
    getTemplateWithBlocks(templateId),
    listContacts(teamId, true),
    listPrintOptions(true)
  ]);

  if (!team || !template || template.status !== "published" || template.blocks.length === 0) {
    return (
      <main className="page-shell">
        <div className="card p-6">
          <h1 className="section-title">這個模板目前不可使用</h1>
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
      <DmEditor teamId={teamId} template={template} contacts={contacts} printOptions={printOptions} />
    </main>
  );
}
