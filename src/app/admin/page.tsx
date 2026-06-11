import Link from "next/link";
import { SiteSettingsAdminClient } from "@/components/admin/SiteSettingsAdminClient";
import { getExportStats, getSiteSettings, listAdminDepartments, listAdminTeams, listAdminTemplates, listContacts } from "@/lib/data";

export default async function AdminPage() {
  const [teams, departments, templates, contacts, stats, settings] = await Promise.all([
    listAdminTeams(),
    listAdminDepartments(),
    listAdminTemplates(),
    listContacts(undefined, false),
    getExportStats(),
    getSiteSettings()
  ]);

  const cards = [
    { label: "團隊", value: teams.length, href: "/admin/teams" },
    { label: "部門", value: departments.length, href: "/admin/departments" },
    { label: "模板", value: templates.length, href: "/admin/templates" },
    { label: "通訊錄", value: contacts.length, href: "/admin/contacts" },
    { label: "下載紀錄", value: stats.downloadRecords, href: "/admin/downloads" }
  ];

  return (
    <section className="space-y-6">
      <div className="luxury-panel mb-6">
        <p className="text-sm font-black uppercase tracking-normal text-gold-300">Admin Console</p>
        <h1 className="mt-2 text-3xl font-black text-white">共用模板系統管理後台</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">集中維護 Banner、團隊、部門、模板、通訊錄與可編輯區域，讓前台快速產出一致的高質感模板。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card group p-5 transition hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-luxury">
            <p className="text-base font-black text-slate-500">{card.label}</p>
            <p className="mt-3 text-4xl font-black text-navy-900">{card.value}</p>
            <span className="mt-5 inline-flex text-sm font-black text-gold-700 group-hover:text-navy-900">進入管理</span>
          </Link>
        ))}
      </div>
      <SiteSettingsAdminClient initialSettings={settings} />
    </section>
  );
}
