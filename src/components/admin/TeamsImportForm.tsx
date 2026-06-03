"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { StaticForm } from "@/components/ui/StaticForm";

type ImportTeamRow = {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};

function boolValue(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return true;
  return !["否", "停用", "false", "0", "no"].includes(text.toLowerCase());
}

export function TeamsImportForm() {
  const [rows, setRows] = useState<ImportTeamRow[]>([]);

  async function parseFile(file?: File) {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    setRows(
      rawRows
        .map((row, index) => ({
          name: String(row["團隊名稱"] ?? row["名稱"] ?? "").trim(),
          description: String(row["簡易敘述"] ?? row["敘述"] ?? "").trim(),
          sort_order: Number(row["排序"] ?? index + 1),
          is_active: boolValue(row["啟用"])
        }))
        .filter((row) => row.name)
    );
  }

  return (
    <StaticForm className="card grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end">
      <input type="hidden" name="teams_json" value={JSON.stringify(rows)} />
      <label>
        <span className="field-label">匯入團隊 CSV / Excel</span>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void parseFile(event.currentTarget.files?.[0])} />
        <span className="field-help">欄位固定：團隊名稱、簡易敘述、排序、啟用。</span>
      </label>
      <button type="submit" className="btn btn-blue" disabled={!rows.length}>
        匯入 {rows.length || ""} 筆
      </button>
    </StaticForm>
  );
}
