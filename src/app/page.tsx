import { UnifiedWorkspaceClient } from "@/components/front/UnifiedWorkspaceClient";
import { listAdminTemplates, listContacts, listTeams } from "@/lib/data";

export default async function HomePage() {
  const [teams, templates, contacts] = await Promise.all([
    listTeams(),
    listAdminTemplates(),
    listContacts(undefined, false)
  ]);

  return <UnifiedWorkspaceClient teams={teams} templates={templates} contacts={contacts} />;
}
