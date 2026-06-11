import { TemplatesAdminClient } from "@/components/admin/TemplatesAdminClient";
import { listAdminTeams, listAdminTemplates } from "@/lib/data";

export default async function AdminTemplatesPage() {
  const [teams, templates] = await Promise.all([listAdminTeams(), listAdminTemplates()]);

  return <TemplatesAdminClient initialTeams={teams} initialTemplates={templates} />;
}
