import Link from "next/link";
import { listAdminTeams, listAdminTemplates, listContacts, listPrintOptions } from "@/lib/data";

export default async function AdminPage() {
  const [teams, templates, contacts, printOptions] = await Promise.all([
    listAdminTeams(),
    listAdminTemplates(),
    listContacts(undefined, false),
    listPrintOptions(false)
  ]);

  const cards = [
    { label: "團隊", value: teams.length, href: "/admin/teams" },
    { label: "模板", value: templates.length, href: "/admin/templates" },
    { label: "通訊錄", value: contacts.length, href: "/admin/contacts" },
    { label: "印刷選項", value: printOptions.length, href: "/admin/print-options" }
  ];

  return (
    <section>
      <div className="mb-6 rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Admin</p>
        <h1 className="section-title">吉富 DM 管理後台</h1>
        <p className="section-subtitle">後台設定模板、框選可編輯區域、維護團隊與通訊錄。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card p-5">
            <p className="text-base font-bold text-slate-500">{card.label}</p>
            <p className="mt-3 text-4xl font-black text-navy-900">{card.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
