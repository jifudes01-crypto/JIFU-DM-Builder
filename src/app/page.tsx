import { UnifiedWorkspaceClient } from "@/components/front/UnifiedWorkspaceClient";
import { listAdminTemplates, listContacts, listPrintOptions, listTeams } from "@/lib/data";

export default async function HomePage() {
  const [teams, templates, contacts, printOptions] = await Promise.all([
    listTeams(),
    listAdminTemplates(),
    listContacts(undefined, false),
    listPrintOptions(false)
  ]);

  return <UnifiedWorkspaceClient teams={teams} templates={templates} contacts={contacts} printOptions={printOptions} />;
}
