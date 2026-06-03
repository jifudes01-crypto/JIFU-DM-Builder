import { Suspense } from "react";
import { EditorPageClient } from "@/components/front/EditorPageClient";
import { listContacts, listPrintOptions, listPublishedTemplates, listTeams } from "@/lib/data";

export default async function EditorPage() {
  const teams = await listTeams();
  const [templates, contacts, printOptions] = await Promise.all([
    Promise.all(teams.map((team) => listPublishedTemplates(team.id))).then((items) => items.flat()),
    listContacts(undefined, true),
    listPrintOptions(true)
  ]);

  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card p-6">
            <h1 className="section-title">正在開啟編輯器</h1>
          </div>
        </main>
      }
    >
      <EditorPageClient teams={teams} templates={templates} contacts={contacts} printOptions={printOptions} />
    </Suspense>
  );
}
