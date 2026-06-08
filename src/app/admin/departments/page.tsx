import { DepartmentsAdminClient } from "@/components/admin/DepartmentsAdminClient";
import { listAdminDepartments, listAdminTeams } from "@/lib/data";

export default async function DepartmentsPage() {
  const [teams, departments] = await Promise.all([listAdminTeams(), listAdminDepartments()]);

  return <DepartmentsAdminClient initialDepartments={departments} initialTeams={teams} />;
}
