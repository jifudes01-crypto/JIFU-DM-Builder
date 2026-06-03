import Link from "next/link";
import {
  createTemplateAction,
  deleteTemplateAction,
  duplicateTemplateAction,
  updateTemplateAction,
  updateTemplateStatusAction
} from "@/actions/admin";
import { listAdminTeams, listAdminTemplates } from "@/lib/data";

export default async function AdminTemplatesPage() {
  const [teams, templates] = await Promise.all([listAdminTeams(), listAdminTemplates()]);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">模板管理</p>
        <h1 className="section-title">模板管理</h1>
        <p className="section-subtitle">上架模板才會顯示在前台；沒有區塊設定的模板不能進入製作。</p>
      </div>

      <form action={createTemplateAction} encType="multipart/form-data" className="card grid gap-4 p-5 lg:grid-cols-3">
        <label>
          <span className="field-label">模板名稱</span>
          <input name="name" required placeholder="每月精選 A4 直式" />
        </label>
        <label>
          <span className="field-label">團隊</span>
          <select name="team_id" required>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">分類</span>
          <input name="category" defaultValue="每月精選物件" />
        </label>
        <label>
          <span className="field-label">尺寸名稱</span>
          <input name="size_label" defaultValue="A4 直式" />
        </label>
        <label>
          <span className="field-label">寬度 px</span>
          <input name="width" type="number" defaultValue={794} />
        </label>
        <label>
          <span className="field-label">高度 px</span>
          <input name="height" type="number" defaultValue={1123} />
        </label>
        <label>
          <span className="field-label">狀態</span>
          <select name="status" defaultValue="draft">
            <option value="draft">下架 / 草稿</option>
            <option value="published">上架</option>
            <option value="archived">封存</option>
          </select>
        </label>
        <label>
          <span className="field-label">模板底圖 JPG / PNG / WebP</span>
          <input name="images" type="file" accept="image/*" multiple required />
        </label>
        <label className="lg:col-span-3">
          <span className="field-label">備註</span>
          <textarea name="notes" placeholder="內部備註，不會顯示在前台" />
        </label>
        <div className="lg:col-span-3">
          <button type="submit" className="btn btn-blue">
            新增模板
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>模板</th>
              <th>團隊</th>
              <th>分類</th>
              <th>尺寸</th>
              <th>區塊</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => {
              const team = teams.find((item) => item.id === template.team_id);
              return (
                <tr key={template.id}>
                  <td>
                    <strong className="block text-navy-900">{template.name}</strong>
                    <span className="text-sm text-slate-500">{template.notes}</span>
                  </td>
                  <td>{team?.name ?? "-"}</td>
                  <td>{template.category}</td>
                  <td>{template.size_label}</td>
                  <td>{template.block_count ?? 0}</td>
                  <td>
                    <span className="status-pill border-line bg-white text-slate-700">
                      {template.status === "published" ? "上架" : template.status === "archived" ? "封存" : "草稿"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/templates/${template.id}/blocks`} className="btn btn-secondary">
                        設定區塊
                      </Link>
                      <form action={updateTemplateStatusAction}>
                        <input type="hidden" name="template_id" value={template.id} />
                        <input type="hidden" name="status" value={template.status === "published" ? "draft" : "published"} />
                        <button type="submit" className="btn btn-muted">
                          {template.status === "published" ? "下架" : "上架"}
                        </button>
                      </form>
                      <form action={duplicateTemplateAction}>
                        <input type="hidden" name="template_id" value={template.id} />
                        <button type="submit" className="btn btn-secondary">
                          複製
                        </button>
                      </form>
                      <form action={deleteTemplateAction}>
                        <input type="hidden" name="template_id" value={template.id} />
                        <button type="submit" className="btn btn-danger">
                          刪除
                        </button>
                      </form>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-base font-bold text-action">編輯模板資料</summary>
                      <form
                        action={updateTemplateAction}
                        encType="multipart/form-data"
                        className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2"
                      >
                        <input type="hidden" name="template_id" value={template.id} />
                        <label>
                          <span className="field-label">名稱</span>
                          <input name="name" defaultValue={template.name} required />
                        </label>
                        <label>
                          <span className="field-label">團隊</span>
                          <select name="team_id" defaultValue={template.team_id}>
                            {teams.map((teamOption) => (
                              <option key={teamOption.id} value={teamOption.id}>
                                {teamOption.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className="field-label">分類</span>
                          <input name="category" defaultValue={template.category} />
                        </label>
                        <label>
                          <span className="field-label">尺寸</span>
                          <input name="size_label" defaultValue={template.size_label} />
                        </label>
                        <label>
                          <span className="field-label">寬度</span>
                          <input name="width" type="number" defaultValue={template.width} />
                        </label>
                        <label>
                          <span className="field-label">高度</span>
                          <input name="height" type="number" defaultValue={template.height} />
                        </label>
                        <label className="md:col-span-2">
                          <span className="field-label">更換底圖</span>
                          <input name="image" type="file" accept="image/*" />
                        </label>
                        <label className="md:col-span-2">
                          <span className="field-label">備註</span>
                          <textarea name="notes" defaultValue={template.notes ?? ""} />
                        </label>
                        <button type="submit" className="btn btn-blue md:col-span-2">
                          儲存修改
                        </button>
                      </form>
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
