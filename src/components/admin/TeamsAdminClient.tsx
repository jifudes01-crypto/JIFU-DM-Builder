"use client";

import { useCallback, useEffect, useState } from "react";
import { TeamsImportForm } from "@/components/admin/TeamsImportForm";
import { StaticForm } from "@/components/ui/StaticForm";
import { listTeamsForAdmin } from "@/lib/supabase-admin-ops";
import type { Team } from "@/types/database";

export function TeamsAdminClient({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [message, setMessage] = useState("");

  const refreshTeams = useCallback(async () => {
    try {
      const latestTeams = await listTeamsForAdmin();
      setTeams(latestTeams as Team[]);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取團隊資料失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    void refreshTeams();
  }, [refreshTeams]);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">團隊管理</p>
        <h1 className="section-title">團隊管理</h1>
        <p className="section-subtitle">前台會顯示啟用中的團隊名稱與簡易敘述，請在這裡獨立維護。</p>
      </div>

      {message ? <p className="rounded-lg bg-amber-50 p-4 text-base font-bold text-amber-900">{message}</p> : null}

      <TeamsImportForm onSuccess={refreshTeams} />

      <StaticForm operation="create-team" onSuccess={refreshTeams} encType="multipart/form-data" className="card grid gap-4 p-5 md:grid-cols-4">
        <label>
          <span className="field-label">團隊名稱</span>
          <input name="name" required />
        </label>
        <label className="md:col-span-2">
          <span className="field-label">簡易敘述</span>
          <input name="description" placeholder="例如：北區住宅 DM、商辦團隊、豪宅團隊" />
        </label>
        <label>
          <span className="field-label">排序</span>
          <input name="sort_order" type="number" defaultValue={100} />
        </label>
        <label className="md:col-span-2">
          <span className="field-label">小 Logo</span>
          <input name="logo" type="file" accept="image/*" />
          <span className="field-help">前台會以 56x56 小圖顯示。</span>
        </label>
        <div className="md:col-span-4">
          <button type="submit" className="btn btn-blue">
            新增團隊
          </button>
        </div>
      </StaticForm>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>團隊名稱</th>
              <th>簡易敘述</th>
              <th>排序</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td className="font-bold text-navy-900">
                  <span className="flex items-center gap-3">
                    {team.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={team.logo_url} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-lg bg-navy-900 text-base font-black text-white">JF</span>
                    )}
                    {team.name}
                  </span>
                </td>
                <td>{team.description || "-"}</td>
                <td>{team.sort_order}</td>
                <td>{team.is_active ? "啟用" : "停用"}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <StaticForm operation="team-status" onSuccess={refreshTeams} resetOnSuccess={false}>
                      <input type="hidden" name="team_id" value={team.id} />
                      <input type="hidden" name="is_active" value={team.is_active ? "false" : "true"} />
                      <button type="submit" className="btn btn-secondary">
                        {team.is_active ? "停用" : "啟用"}
                      </button>
                    </StaticForm>
                    <StaticForm operation="delete-team" onSuccess={refreshTeams} resetOnSuccess={false}>
                      <input type="hidden" name="team_id" value={team.id} />
                      <button type="submit" className="btn btn-danger">
                        刪除
                      </button>
                    </StaticForm>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-base font-bold text-action">編輯團隊</summary>
                    <StaticForm operation="update-team" onSuccess={refreshTeams} resetOnSuccess={false} encType="multipart/form-data" className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2">
                      <input type="hidden" name="team_id" value={team.id} />
                      <label>
                        <span className="field-label">團隊名稱</span>
                        <input name="name" defaultValue={team.name} required />
                      </label>
                      <label>
                        <span className="field-label">排序</span>
                        <input name="sort_order" type="number" defaultValue={team.sort_order} />
                      </label>
                      <label className="md:col-span-2">
                        <span className="field-label">簡易敘述</span>
                        <textarea name="description" defaultValue={team.description ?? ""} />
                      </label>
                      <label className="md:col-span-2">
                        <span className="field-label">更換小 Logo</span>
                        <input name="logo" type="file" accept="image/*" />
                      </label>
                      <button type="submit" className="btn btn-blue md:col-span-2">
                        更新團隊
                      </button>
                    </StaticForm>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
