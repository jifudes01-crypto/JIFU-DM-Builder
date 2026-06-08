import { ContactsAdminClient } from "@/components/admin/ContactsAdminClient";
import { listAdminDepartments, listAdminTeams, listContacts } from "@/lib/data";

export default async function ContactsPage() {
  const [teams, departments, contacts] = await Promise.all([
    listAdminTeams(),
    listAdminDepartments(),
    listContacts(undefined, false)
  ]);

  return <ContactsAdminClient initialTeams={teams} initialDepartments={departments} initialContacts={contacts} />;
}
