import { TeamsImportForm } from "@/components/admin/TeamsImportForm";
import { StaticForm } from "@/components/ui/StaticForm";
import { listAdminTeams } from "@/lib/data";

export default async function TeamsPage() {
  const teams = await listAdminTeams();

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">團隊管理</p>
        <h1 className="section-title">團隊管理</h1>
        <p className="section-subtitle">前台會顯示啟用中的團隊名稱與簡易敘述，請在這裡獨立維護。</p>
      </div>

      <TeamsImportForm />

      <StaticForm className="card grid gap-4 p-5 md:grid-cols-4">
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
                <td className="font-bold text-navy-900">{team.name}</td>
                <td>{team.description || "-"}</td>
                <td>{team.sort_order}</td>
                <td>{team.is_active ? "啟用" : "停用"}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <StaticForm>
                      <input type="hidden" name="team_id" value={team.id} />
                      <input type="hidden" name="is_active" value={team.is_active ? "false" : "true"} />
                      <button type="submit" className="btn btn-secondary">
                        {team.is_active ? "停用" : "啟用"}
                      </button>
                    </StaticForm>
                    <StaticForm>
                      <input type="hidden" name="team_id" value={team.id} />
                      <button type="submit" className="btn btn-danger">
                        刪除
                      </button>
                    </StaticForm>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-base font-bold text-action">編輯團隊</summary>
                    <StaticForm className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2">
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
                      <button type="submit" className="btn btn-blue md:col-span-2">
                        儲存團隊
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
