import { UnifiedWorkspaceClient } from "@/components/front/UnifiedWorkspaceClient";
import { listAdminTemplates, listContacts, listPrintOptions, listPrintRequests, listTeams } from "@/lib/data";

export default async function HomePage() {
  const [teams, templates, contacts, printOptions, printRequests] = await Promise.all([
    listTeams(),
    listAdminTemplates(),
    listContacts(undefined, false),
    listPrintOptions(false),
    listPrintRequests()
  ]);

  return <UnifiedWorkspaceClient teams={teams} templates={templates} contacts={contacts} printOptions={printOptions} printRequests={printRequests} />;
}
