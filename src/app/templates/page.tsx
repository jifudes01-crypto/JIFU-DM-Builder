import { Suspense } from "react";
import { TemplatesPageClient } from "@/components/front/TemplatesPageClient";
import { listPublishedTemplates, listTeams } from "@/lib/data";

export default async function TemplatesPage() {
  const teams = await listTeams();
  const templates = (await Promise.all(teams.map((team) => listPublishedTemplates(team.id)))).flat();

  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card p-6">
            <h1 className="section-title">正在讀取模板</h1>
          </div>
        </main>
      }
    >
      <TemplatesPageClient teams={teams} templates={templates} />
    </Suspense>
  );
}
