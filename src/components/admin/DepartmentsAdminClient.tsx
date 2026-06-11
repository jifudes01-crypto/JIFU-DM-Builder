"use client";

import { useCallback, useEffect, useState } from "react";
import { StaticForm } from "@/components/ui/StaticForm";
import { listDepartmentsForAdmin, listTeamsForAdmin } from "@/lib/supabase-admin-ops";
import type { Department, Team } from "@/types/database";

interface DepartmentsAdminClientProps {
  initialDepartments: Department[];
  initialTeams: Team[];
}

export function DepartmentsAdminClient({ initialDepartments, initialTeams }: DepartmentsAdminClientProps) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [teams, setTeams] = useState(initialTeams);
  const [message, setMessage] = useState("");

  const refreshData = useCallback(async () => {
    try {
      const [latestTeams, latestDepartments] = await Promise.all([listTeamsForAdmin(), listDepartmentsForAdmin()]);
      setTeams(latestTeams);
      setDepartments(latestDepartments);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取部門資料失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  return (
    <section className="space-y-6">
      <div className="luxury-panel">
        <p className="text-sm font-black uppercase tracking-normal text-gold-300">Department</p>
        <h1 className="mt-2 text-3xl font-black text-white">部門管理</h1>
        <p className="mt-3 text-base leading-7 text-slate-200">部門會依附在團隊底下，前台編輯 DM 時可用來篩選業務。</p>
      </div>

      {message ? <p className="rounded-lg bg-amber-50 p-4 text-base font-bold text-amber-900">{message}</p> : null}

      <StaticForm operation="create-department" onSuccess={refreshData} className="card grid gap-4 p-5 lg:grid-cols-4">
        <label>
          <span className="field-label">所屬團隊</span>
          <select name="team_id" required>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">部門名稱</span>
          <input name="name" required />
        </label>
        <label>
          <span className="field-label">排序</span>
          <input name="sort_order" type="number" defaultValue={100} />
        </label>
        <label>
          <span className="field-label">簡易敘述</span>
          <input name="description" />
        </label>
        <div className="lg:col-span-4">
          <button type="submit" className="btn btn-blue">
            新增部門
          </button>
        </div>
      </StaticForm>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>部門名稱</th>
              <th>所屬團隊</th>
              <th>簡易敘述</th>
              <th>排序</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => {
              const team = teams.find((item) => item.id === department.team_id);
              return (
                <tr key={department.id}>
                  <td className="font-bold text-navy-900">{department.name}</td>
                  <td>{team?.name ?? department.teams?.name ?? "-"}</td>
                  <td>{department.description || "-"}</td>
                  <td>{department.sort_order}</td>
                  <td>{department.is_active ? "啟用" : "停用"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <StaticForm operation="department-status" onSuccess={refreshData} resetOnSuccess={false}>
                        <input type="hidden" name="department_id" value={department.id} />
                        <input type="hidden" name="is_active" value={department.is_active ? "false" : "true"} />
                        <button type="submit" className="btn btn-secondary">
                          {department.is_active ? "停用" : "啟用"}
                        </button>
                      </StaticForm>
                      <StaticForm operation="delete-department" onSuccess={refreshData} resetOnSuccess={false}>
                        <input type="hidden" name="department_id" value={department.id} />
                        <button type="submit" className="btn btn-danger">
                          刪除
                        </button>
                      </StaticForm>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-base font-bold text-action">編輯部門</summary>
                      <StaticForm operation="update-department" onSuccess={refreshData} resetOnSuccess={false} className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2">
                        <input type="hidden" name="department_id" value={department.id} />
                        <label>
                          <span className="field-label">所屬團隊</span>
                          <select name="team_id" defaultValue={department.team_id} required>
                            {teams.map((teamOption) => (
                              <option key={teamOption.id} value={teamOption.id}>
                                {teamOption.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className="field-label">部門名稱</span>
                          <input name="name" defaultValue={department.name} required />
                        </label>
                        <label>
                          <span className="field-label">排序</span>
                          <input name="sort_order" type="number" defaultValue={department.sort_order} />
                        </label>
                        <label>
                          <span className="field-label">簡易敘述</span>
                          <input name="description" defaultValue={department.description ?? ""} />
                        </label>
                        <button type="submit" className="btn btn-blue md:col-span-2">
                          更新部門
                        </button>
                      </StaticForm>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
