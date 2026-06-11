"use client";

import { useCallback, useEffect, useState } from "react";
import { listExportRecordsForAdmin } from "@/lib/supabase-admin-ops";
import type { ExportRecord } from "@/types/database";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function DownloadRecordsClient({ initialRecords = [] }: { initialRecords?: ExportRecord[] }) {
  const [records, setRecords] = useState<ExportRecord[]>(initialRecords);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshRecords = useCallback(async () => {
    try {
      setLoading(true);
      setRecords(await listExportRecordsForAdmin());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取下載紀錄失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRecords();
  }, [refreshRecords]);

  return (
    <section className="space-y-6">
      <div className="luxury-panel">
        <p className="text-sm font-black uppercase tracking-normal text-gold-300">Download Records</p>
        <h1 className="mt-2 text-3xl font-black text-white">下載紀錄</h1>
        <p className="mt-3 text-base leading-7 text-slate-200">使用者下載 PNG、JPG、PDF 時會同步建立紀錄，方便後台追蹤。</p>
        <button type="button" className="btn btn-secondary mt-4" onClick={() => void refreshRecords()}>
          重新整理紀錄
        </button>
      </div>

      {loading ? <p className="rounded-lg bg-blue-50 p-4 text-base font-bold text-navy-900">正在讀取最新紀錄...</p> : null}
      {message ? <p className="rounded-lg bg-amber-50 p-4 text-base font-bold text-amber-900">{message}</p> : null}

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>下載時間</th>
              <th>團隊</th>
              <th>模板</th>
              <th>聯絡人</th>
              <th>格式</th>
              <th>檔案</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{formatDate(record.created_at)}</td>
                <td>{record.teams?.name ?? "-"}</td>
                <td>{record.templates?.name ?? "-"}</td>
                <td>{record.contacts?.name ?? "-"}</td>
                <td className="font-black uppercase text-navy-900">{record.format}</td>
                <td>
                  <a className="btn btn-secondary" href={record.file_url} target="_blank" rel="noreferrer">
                    開啟檔案
                  </a>
                </td>
              </tr>
            ))}
            {!records.length ? (
              <tr>
                <td colSpan={6}>
                  <div className="py-6 text-center">
                    <p className="text-lg font-black text-navy-900">目前沒有下載紀錄</p>
                    <p className="mt-2 text-sm text-slate-500">前台完成下載後，這裡會顯示真實紀錄。</p>
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
