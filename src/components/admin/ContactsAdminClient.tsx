"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactsImportForm } from "@/components/admin/ContactsImportForm";
import { StaticForm } from "@/components/ui/StaticForm";
import { listContactsForAdmin, listDepartmentsForAdmin, listTeamsForAdmin, runAdminOperation } from "@/lib/supabase-admin-ops";
import type { Contact, Department, Team } from "@/types/database";

interface ContactsAdminClientProps {
  initialTeams: Team[];
  initialDepartments: Department[];
  initialContacts: Contact[];
}

function DepartmentSelect({
  departments,
  teamId,
  defaultValue = ""
}: {
  departments: Department[];
  teamId: string;
  defaultValue?: string | null;
}) {
  const visibleDepartments = departments.filter((department) => department.team_id === teamId);

  return (
    <select name="department_id" defaultValue={defaultValue ?? ""}>
      <option value="">不指定部門</option>
      {visibleDepartments.map((department) => (
        <option key={department.id} value={department.id}>
          {department.name}
        </option>
      ))}
    </select>
  );
}

function CreateContactForm({
  teams,
  departments,
  onSuccess
}: {
  teams: Team[];
  departments: Department[];
  onSuccess: () => void | Promise<void>;
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");

  useEffect(() => {
    if (!teamId && teams[0]) setTeamId(teams[0].id);
  }, [teamId, teams]);

  return (
    <StaticForm operation="create-contact" onSuccess={onSuccess} encType="multipart/form-data" className="card grid gap-4 p-5 lg:grid-cols-3">
      <label>
        <span className="field-label">姓名</span>
        <input name="name" required />
      </label>
      <label>
        <span className="field-label">團隊</span>
        <select name="team_id" value={teamId} onChange={(event) => setTeamId(event.currentTarget.value)}>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">部門</span>
        <DepartmentSelect departments={departments} teamId={teamId} />
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
  );
}

function EditContactForm({
  contact,
  teams,
  departments,
  onSuccess
}: {
  contact: Contact;
  teams: Team[];
  departments: Department[];
  onSuccess: () => void | Promise<void>;
}) {
  const [teamId, setTeamId] = useState(contact.team_id);

  return (
    <StaticForm operation="update-contact" onSuccess={onSuccess} resetOnSuccess={false} encType="multipart/form-data" className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2">
      <input type="hidden" name="contact_id" value={contact.id} />
      <label>
        <span className="field-label">姓名</span>
        <input name="name" defaultValue={contact.name} required />
      </label>
      <label>
        <span className="field-label">團隊</span>
        <select name="team_id" value={teamId} onChange={(event) => setTeamId(event.currentTarget.value)}>
          {teams.map((teamOption) => (
            <option key={teamOption.id} value={teamOption.id}>
              {teamOption.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">部門</span>
        <DepartmentSelect departments={departments} teamId={teamId} defaultValue={contact.department_id} />
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
  );
}

function selectedIdsFormData(selectedIds: string[], extra: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("contact_ids", JSON.stringify(selectedIds));
  Object.entries(extra).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

export function ContactsAdminClient({ initialTeams, initialDepartments, initialContacts }: ContactsAdminClientProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [departments, setDepartments] = useState(initialDepartments);
  const [contacts, setContacts] = useState(initialContacts);
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [teamFilter, setTeamFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [bulkTeamId, setBulkTeamId] = useState("");
  const [bulkDepartmentId, setBulkDepartmentId] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [latestTeams, latestDepartments, latestContacts] = await Promise.all([
        listTeamsForAdmin(),
        listDepartmentsForAdmin(),
        listContactsForAdmin()
      ]);
      setTeams(latestTeams);
      setDepartments(latestDepartments);
      setContacts(latestContacts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取通訊錄資料失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);
  const departmentMap = useMemo(() => new Map(departments.map((department) => [department.id, department.name])), [departments]);
  const visibleDepartments = useMemo(
    () => departments.filter((department) => !teamFilter || department.team_id === teamFilter),
    [departments, teamFilter]
  );
  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (teamFilter && contact.team_id !== teamFilter) return false;
      if (departmentFilter && contact.department_id !== departmentFilter) return false;
      if (!keyword) return true;
      return [contact.name, contact.mobile, contact.phone, contact.email, contact.line_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [contacts, departmentFilter, search, teamFilter]);
  const selectedCount = selectedIds.size;
  const filteredIds = useMemo(() => filteredContacts.map((contact) => contact.id), [filteredContacts]);
  const filteredIdKey = filteredIds.join("|");
  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every((contact) => selectedIds.has(contact.id));

  useEffect(() => {
    const visibleIdSet = new Set(filteredIds);
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => visibleIdSet.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filteredIdKey, filteredIds]);

  useEffect(() => {
    if (!bulkTeamId && teams[0]) setBulkTeamId(teams[0].id);
  }, [bulkTeamId, teams]);

  useEffect(() => {
    if (!bulkDepartmentId && departments[0]) setBulkDepartmentId(departments[0].id);
  }, [bulkDepartmentId, departments]);

  function toggleContact(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        filteredContacts.forEach((contact) => next.delete(contact.id));
      } else {
        filteredContacts.forEach((contact) => next.add(contact.id));
      }
      return next;
    });
  }

  async function runBulkOperation(operation: string, extra: Record<string, string> = {}) {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    setMessage("");
    try {
      const result = await runAdminOperation(operation, selectedIdsFormData(ids, extra));
      setSelectedIds(new Set());
      await refreshData();
      setMessage(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批量操作失敗，請稍後再試。");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm("確定要刪除已選取的業務嗎？此操作無法復原。")) return;
    await runBulkOperation("bulk-delete-contacts");
  }

  return (
    <section className="space-y-6">
      <div className="luxury-panel">
        <p className="text-sm font-black uppercase tracking-normal text-gold-300">Contacts</p>
        <h1 className="mt-2 text-3xl font-black text-white">通訊錄管理</h1>
        <p className="mt-3 text-base leading-7 text-slate-200">人員可綁定團隊與部門，前台會依選擇的部門篩選業務。</p>
      </div>

      {message ? <p className="rounded-lg bg-amber-50 p-4 text-base font-bold text-amber-900">{message}</p> : null}

      <ContactsImportForm teams={teams} departments={departments} onSuccess={refreshData} />
      <CreateContactForm teams={teams} departments={departments} onSuccess={refreshData} />

      <div className="card grid gap-4 p-5 lg:grid-cols-3">
        <label>
          <span className="field-label">依公司 / 團隊篩選</span>
          <select
            value={teamFilter}
            onChange={(event) => {
              setTeamFilter(event.currentTarget.value);
              setDepartmentFilter("");
            }}
          >
            <option value="">全部公司 / 團隊</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">依團隊＆店名篩選</span>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.currentTarget.value)}>
            <option value="">全部團隊＆店名</option>
            {visibleDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">搜尋業務</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="搜尋姓名、電話、Email、LINE ID"
          />
        </label>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <p className="font-bold text-navy-900">
            {selectedCount ? `已選取 ${selectedCount} 筆業務` : `目前顯示 ${filteredContacts.length} 筆業務`}
          </p>
          {selectedCount ? (
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedIds(new Set())}>
              取消選取
            </button>
          ) : null}
        </div>

        {selectedCount ? (
          <div className="grid gap-3 border-b border-line bg-slate-50 p-4 lg:grid-cols-[1fr_auto_1fr_auto_auto_auto_auto] lg:items-end">
            <label>
              <span className="field-label">批量修改公司 / 團隊</span>
              <select value={bulkTeamId} onChange={(event) => setBulkTeamId(event.currentTarget.value)} disabled={!teams.length || bulkBusy}>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {!teams.length ? <span className="field-help">目前沒有可套用的公司 / 團隊。</span> : null}
            </label>
            <button
              type="button"
              className="btn btn-blue"
              disabled={!teams.length || bulkBusy}
              onClick={() => void runBulkOperation("bulk-contact-team", { team_id: bulkTeamId })}
            >
              批量修改公司 / 團隊
            </button>
            <label>
              <span className="field-label">批量修改團隊＆店名</span>
              <select value={bulkDepartmentId} onChange={(event) => setBulkDepartmentId(event.currentTarget.value)} disabled={!departments.length || bulkBusy}>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {teamMap.get(department.team_id) ? `${teamMap.get(department.team_id)} / ${department.name}` : department.name}
                  </option>
                ))}
              </select>
              {!departments.length ? <span className="field-help">目前沒有可套用的團隊＆店名。</span> : null}
            </label>
            <button
              type="button"
              className="btn btn-blue"
              disabled={!departments.length || bulkBusy}
              onClick={() => void runBulkOperation("bulk-contact-department", { department_id: bulkDepartmentId })}
            >
              批量修改團隊＆店名
            </button>
            <button type="button" className="btn btn-secondary" disabled={bulkBusy} onClick={() => void runBulkOperation("bulk-contact-status", { is_active: "true" })}>
              批量啟用
            </button>
            <button type="button" className="btn btn-secondary" disabled={bulkBusy} onClick={() => void runBulkOperation("bulk-contact-status", { is_active: "false" })}>
              批量停用
            </button>
            <button type="button" className="btn btn-danger" disabled={bulkBusy} onClick={() => void handleBulkDelete()}>
              批量刪除
            </button>
            {bulkBusy ? <p className="font-bold text-navy-900 lg:col-span-7">正在批量同步到 Supabase...</p> : null}
          </div>
        ) : null}

        <table className="table-clean">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="全選目前頁面"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  disabled={!filteredContacts.length}
                />
              </th>
              <th>姓名</th>
              <th>公司 / 團隊</th>
              <th>團隊＆店名</th>
              <th>職稱</th>
              <th>手機</th>
              <th>Email / LINE</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`選取 ${contact.name}`}
                    checked={selectedIds.has(contact.id)}
                    onChange={() => toggleContact(contact.id)}
                  />
                </td>
                <td className="font-bold text-navy-900">{contact.name}</td>
                <td>{teamMap.get(contact.team_id) ?? "-"}</td>
                <td>{contact.department_id ? departmentMap.get(contact.department_id) ?? contact.departments?.name ?? "-" : "-"}</td>
                <td>{contact.title}</td>
                <td>{contact.mobile}</td>
                <td>
                  <span className="block">{contact.email}</span>
                  <span className="text-sm text-slate-500">{contact.line_id}</span>
                </td>
                <td>{contact.is_active ? "啟用" : "停用"}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <StaticForm operation="contact-status" onSuccess={refreshData} resetOnSuccess={false}>
                      <input type="hidden" name="contact_id" value={contact.id} />
                      <input type="hidden" name="is_active" value={contact.is_active ? "false" : "true"} />
                      <button type="submit" className="btn btn-secondary">
                        {contact.is_active ? "停用" : "啟用"}
                      </button>
                    </StaticForm>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-base font-bold text-action">編輯人員</summary>
                    <EditContactForm contact={contact} teams={teams} departments={departments} onSuccess={refreshData} />
                  </details>
                </td>
              </tr>
            ))}
            {!filteredContacts.length ? (
              <tr>
                <td colSpan={9}>
                  <div className="py-6 text-center">
                    <p className="text-lg font-black text-navy-900">目前沒有符合條件的業務</p>
                    <p className="mt-2 text-sm text-slate-500">請調整公司 / 團隊、團隊＆店名或搜尋條件。</p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
