"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { importContactsAction } from "@/actions/admin";
import type { Team } from "@/types/database";

interface ContactsImportFormProps {
  teams: Team[];
}

export function ContactsImportForm({ teams }: ContactsImportFormProps) {
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
        notes: String(row["備註"] || row["notes"] || "").trim()
      }))
      .filter((contact) => contact.name);
    setContactsJson(JSON.stringify(contacts));
    setCount(contacts.length);
  }

  return (
    <form action={importContactsAction} className="card grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label>
        <span className="field-label">匯入到團隊</span>
        <select name="team_id">
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Excel / CSV</span>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void parseFile(event.currentTarget.files?.[0])} />
      </label>
      <input type="hidden" name="contacts_json" value={contactsJson} />
      <button type="submit" className="btn btn-blue" disabled={count === 0}>
        匯入 {count || ""} 筆
      </button>
    </form>
  );
}
