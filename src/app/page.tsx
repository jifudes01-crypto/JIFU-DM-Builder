import Link from "next/link";
import { listTeams } from "@/lib/data";

export default async function HomePage() {
  const teams = await listTeams();

  return (
    <main className="page-shell">
      <section className="mb-6 rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Step 1</p>
        <h1 className="section-title">選擇團隊</h1>
        <p className="section-subtitle">前台每個畫面只做一件事。請先選擇這次要製作 DM 的團隊。</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link key={team.id} href={`/templates?team=${team.id}`} className="step-card">
            <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">啟用中</span>
            <h2 className="mt-4 text-2xl font-black text-navy-900">{team.name}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">查看此團隊可使用的上架模板與啟用人員。</p>
            <span className="btn btn-primary mt-5 w-full">選擇這個團隊</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
