"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { StaticForm } from "@/components/ui/StaticForm";
import type { Department, Team } from "@/types/database";

interface ContactsImportFormProps {
  teams: Team[];
  departments: Department[];
  onSuccess?: () => void | Promise<void>;
}

export function ContactsImportForm({ teams, departments, onSuccess }: ContactsImportFormProps) {
  const [contactsJson, setContactsJson] = useState("[]");
  const [count, setCount] = useState(0);

  async function parseFile(file?: File) {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    const contacts = rows
      .map((row) => ({
        name: String(row["姓名"] || row["name"] || "").trim(),
        title: String(row["職稱"] || row["title"] || "").trim(),
        mobile: String(row["手機"] || row["mobile"] || "").trim(),
        phone: String(row["電話"] || row["phone"] || "").trim(),
        email: String(row["Email"] || row["email"] || "").trim(),
        line_id: String(row["LINE"] || row["line"] || "").trim(),
        team_name: String(row["團隊名稱"] || row["team"] || row["team_name"] || "").trim(),
        department_name: String(row["部門名稱"] || row["department"] || row["department_name"] || "").trim(),
        notes: String(row["備註"] || row["notes"] || "").trim()
      }))
      .filter((contact) => contact.name);
    setContactsJson(JSON.stringify(contacts));
    setCount(contacts.length);
  }

  return (
    <StaticForm operation="import-contacts" onSuccess={onSuccess} className="card grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label>
        <span className="field-label">預設匯入團隊</span>
        <select name="team_id">
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <span className="field-help">若檔案有「團隊名稱」，會優先依檔案內容對應。</span>
      </label>
      <label>
        <span className="field-label">Excel / CSV</span>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void parseFile(event.currentTarget.files?.[0])} />
        <span className="field-help">支援欄位：姓名、職稱、手機、電話、LINE、Email、團隊名稱、部門名稱。</span>
      </label>
      <input type="hidden" name="contacts_json" value={contactsJson} />
      <button type="submit" className="btn btn-blue" disabled={count === 0}>
        匯入 {count || ""} 筆
      </button>
      <p className="md:col-span-3 text-sm text-slate-500">目前可對應 {teams.length} 個團隊、{departments.length} 個部門。</p>
    </StaticForm>
  );
}
