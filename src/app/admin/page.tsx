import Link from "next/link";
import { listAdminTemplates, listContacts, listPrintOptions, listPrintRequests, listTeams } from "@/lib/data";

export default async function AdminPage() {
  const [teams, templates, contacts, printOptions, printRequests] = await Promise.all([
    listTeams(),
    listAdminTemplates(),
    listContacts(undefined, false),
    listPrintOptions(false),
    listPrintRequests()
  ]);

  const cards = [
    { label: "團隊", value: teams.length, href: "/admin/templates" },
    { label: "模板", value: templates.length, href: "/admin/templates" },
    { label: "通訊錄", value: contacts.length, href: "/admin/contacts" },
    { label: "印刷選項", value: printOptions.length, href: "/admin/print-options" },
    { label: "待處理印刷需求", value: printRequests.filter((request) => request.status === "pending").length, href: "/admin/print-requests" }
  ];

  return (
    <section>
      <div className="mb-6 rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Admin</p>
        <h1 className="section-title">吉富 DM 管理後台</h1>
        <p className="section-subtitle">後台設定模板、框選可編輯區域、維護通訊錄與印刷需求。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
