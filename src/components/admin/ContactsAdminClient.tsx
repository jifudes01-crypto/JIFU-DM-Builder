"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactsImportForm } from "@/components/admin/ContactsImportForm";
import { StaticForm } from "@/components/ui/StaticForm";
import { listContactsForAdmin, listDepartmentsForAdmin, listTeamsForAdmin } from "@/lib/supabase-admin-ops";
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

export function ContactsAdminClient({ initialTeams, initialDepartments, initialContacts }: ContactsAdminClientProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [departments, setDepartments] = useState(initialDepartments);
  const [contacts, setContacts] = useState(initialContacts);
  const [message, setMessage] = useState("");

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
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取通訊錄資料失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);
  const departmentMap = useMemo(() => new Map(departments.map((department) => [department.id, department.name])), [departments]);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">通訊錄</p>
        <h1 className="section-title">通訊錄管理</h1>
        <p className="section-subtitle">人員可綁定團隊與部門，前台會依選擇的部門篩選業務。</p>
      </div>

      {message ? <p className="rounded-lg bg-amber-50 p-4 text-base font-bold text-amber-900">{message}</p> : null}

      <ContactsImportForm teams={teams} departments={departments} onSuccess={refreshData} />
      <CreateContactForm teams={teams} departments={departments} onSuccess={refreshData} />

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>姓名</th>
              <th>團隊</th>
              <th>部門</th>
              <th>職稱</th>
              <th>手機</th>
              <th>Email / LINE</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
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
          </tbody>
        </table>
      </div>
    </section>
  );
}
