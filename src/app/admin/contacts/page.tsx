import { ContactsImportForm } from "@/components/admin/ContactsImportForm";
import { StaticForm } from "@/components/ui/StaticForm";
import { listAdminTeams, listContacts } from "@/lib/data";

export default async function ContactsPage() {
  const [teams, contacts] = await Promise.all([listAdminTeams(), listContacts(undefined, false)]);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">通訊錄</p>
        <h1 className="section-title">通訊錄管理</h1>
        <p className="section-subtitle">前台選擇團隊後，只會看到該團隊啟用中的人員。</p>
      </div>

      <ContactsImportForm teams={teams} />

      <StaticForm encType="multipart/form-data" className="card grid gap-4 p-5 lg:grid-cols-3">
        <label>
          <span className="field-label">姓名</span>
          <input name="name" required />
        </label>
        <label>
          <span className="field-label">團隊</span>
          <select name="team_id">
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">職稱</span>
          <input name="title" />
        </label>
        <label>
          <span className="field-label">手機</span>
          <input name="mobile" />
        </label>
        <label>
          <span className="field-label">電話</span>
          <input name="phone" />
        </label>
        <label>
          <span className="field-label">Email</span>
          <input name="email" type="email" />
        </label>
        <label>
          <span className="field-label">LINE</span>
          <input name="line_id" />
        </label>
        <label>
          <span className="field-label">頭像</span>
          <input name="avatar" type="file" accept="image/*" />
        </label>
        <label>
          <span className="field-label">QR Code 圖片</span>
          <input name="qrcode" type="file" accept="image/*" />
        </label>
        <label className="lg:col-span-3">
          <span className="field-label">備註</span>
          <textarea name="notes" />
        </label>
        <div className="lg:col-span-3">
          <button type="submit" className="btn btn-blue">
            新增人員
          </button>
        </div>
      </StaticForm>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>姓名</th>
              <th>團隊</th>
              <th>職稱</th>
              <th>手機</th>
              <th>Email / LINE</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const team = teams.find((item) => item.id === contact.team_id);
              return (
                <tr key={contact.id}>
                  <td className="font-bold text-navy-900">{contact.name}</td>
                  <td>{team?.name ?? "-"}</td>
                  <td>{contact.title}</td>
                  <td>{contact.mobile}</td>
                  <td>
                    <span className="block">{contact.email}</span>
                    <span className="text-sm text-slate-500">{contact.line_id}</span>
                  </td>
                  <td>{contact.is_active ? "啟用" : "停用"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <StaticForm>
                        <input type="hidden" name="contact_id" value={contact.id} />
                        <input type="hidden" name="is_active" value={contact.is_active ? "false" : "true"} />
                        <button type="submit" className="btn btn-secondary">
                          {contact.is_active ? "停用" : "啟用"}
                        </button>
                      </StaticForm>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-base font-bold text-action">編輯人員</summary>
                      <StaticForm
                        encType="multipart/form-data"
                        className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2"
                      >
                        <input type="hidden" name="contact_id" value={contact.id} />
                        <label>
                          <span className="field-label">姓名</span>
                          <input name="name" defaultValue={contact.name} required />
                        </label>
                        <label>
                          <span className="field-label">團隊</span>
                          <select name="team_id" defaultValue={contact.team_id}>
                            {teams.map((teamOption) => (
                              <option key={teamOption.id} value={teamOption.id}>
                                {teamOption.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className="field-label">職稱</span>
                          <input name="title" defaultValue={contact.title ?? ""} />
                        </label>
                        <label>
                          <span className="field-label">手機</span>
                          <input name="mobile" defaultValue={contact.mobile ?? ""} />
                        </label>
                        <label>
                          <span className="field-label">電話</span>
                          <input name="phone" defaultValue={contact.phone ?? ""} />
                        </label>
                        <label>
                          <span className="field-label">Email</span>
                          <input name="email" type="email" defaultValue={contact.email ?? ""} />
                        </label>
                        <label>
                          <span className="field-label">LINE</span>
                          <input name="line_id" defaultValue={contact.line_id ?? ""} />
                        </label>
                        <label>
                          <span className="field-label">更換頭像</span>
                          <input name="avatar" type="file" accept="image/*" />
                        </label>
                        <label>
                          <span className="field-label">更換 QR Code</span>
                          <input name="qrcode" type="file" accept="image/*" />
                        </label>
                        <label className="md:col-span-2">
                          <span className="field-label">備註</span>
                          <textarea name="notes" defaultValue={contact.notes ?? ""} />
                        </label>
                        <button type="submit" className="btn btn-blue md:col-span-2">
                          儲存修改
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
