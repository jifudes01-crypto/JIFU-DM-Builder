"use client";

import type { PrintRequest } from "@/types/database";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function PrintRequestsExportButton({ requests }: { requests: PrintRequest[] }) {
  function exportCsv() {
    const rows = requests.flatMap((request) => {
      const items = request.batch_items?.length
        ? request.batch_items
        : [
            {
              contactName: request.contacts?.name ?? "",
              quantity: Number(request.print_quantity ?? 0),
              materialSize: [request.paper, request.size].filter(Boolean).join(" / "),
              vendor: request.vendor ?? "",
              label: ""
            }
          ];
      return items.map((item) => [
        request.created_at ? new Date(request.created_at).toLocaleString("zh-TW") : "",
        request.teams?.name ?? "",
        request.templates?.name ?? "",
        item.contactName,
        item.quantity,
        item.materialSize,
        item.vendor,
        request.total_quantity,
        request.status,
        request.message ?? "",
        request.internal_note ?? ""
      ]);
    });
    const header = ["申請時間", "團隊", "模板", "業務", "數量", "材質尺寸", "廠商", "總件數", "狀態", "留言", "內部備註"];
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `印刷需求紀錄-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="btn btn-primary" onClick={exportCsv}>
      匯出紀錄 CSV
    </button>
  );
}
