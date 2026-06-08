import { TeamsAdminClient } from "@/components/admin/TeamsAdminClient";
import { listAdminTeams } from "@/lib/data";

export default async function TeamsPage() {
  const teams = await listAdminTeams();

  return <TeamsAdminClient initialTeams={teams} />;
}
