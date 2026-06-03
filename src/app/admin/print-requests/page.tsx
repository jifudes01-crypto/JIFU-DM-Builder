import { PrintRequestsExportButton } from "@/components/admin/PrintRequestsExportButton";
import { StaticForm } from "@/components/ui/StaticForm";
import { listPrintRequests } from "@/lib/data";
import type { PrintStatus } from "@/types/database";

const statuses: Array<{ value: PrintStatus; label: string }> = [
  { value: "pending", label: "待處理" },
  { value: "processing", label: "處理中" },
  { value: "sent", label: "已送印" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" }
];

export default async function PrintRequestsPage() {
  const requests = await listPrintRequests();

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">印刷需求</p>
        <h1 className="section-title">印刷需求後台</h1>
        <p className="section-subtitle">查看前台送出的印刷需求，更新處理狀態與內部備註。</p>
        <div className="mt-4">
          <PrintRequestsExportButton requests={requests} />
        </div>
      </div>

      <div className="grid gap-4">
        {requests.length ? (
          requests.map((request) => (
            <article key={request.id} className="card grid gap-5 p-5 lg:grid-cols-[180px_1fr_320px]">
              <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-lg border border-line bg-slate-100">
                {request.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={request.preview_url} alt="DM 預覽圖" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-slate-500">無預覽圖</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">
                    {statuses.find((status) => status.value === request.status)?.label}
                  </span>
                  <span className="status-pill border-line bg-white text-slate-600">
                    {request.created_at ? new Date(request.created_at).toLocaleString("zh-TW") : "-"}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-black text-navy-900">{request.templates?.name ?? "DM 模板"}</h2>
                <dl className="mt-4 grid gap-2 text-base text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-slate-500">團隊</dt>
                    <dd>{request.teams?.name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">聯絡人</dt>
                    <dd>{request.contacts?.name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">總件數</dt>
                    <dd>{request.total_quantity || request.print_quantity || "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">材質尺寸</dt>
                    <dd>{request.material_summary || [request.paper, request.size].filter(Boolean).join(" / ") || "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">廠商</dt>
                    <dd>{request.vendor ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">急件</dt>
                    <dd>{request.is_rush ? "是" : "否"}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-500">裁切</dt>
                    <dd>{request.is_cutting ? "是" : "否"}</dd>
                  </div>
                </dl>
                {request.batch_items?.length ? (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-line">
                    <table className="table-clean">
                      <thead>
                        <tr>
                          <th>業務</th>
                          <th>數量</th>
                          <th>材質尺寸</th>
                          <th>廠商</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.batch_items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.contactName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.materialSize}</td>
                            <td>{item.vendor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-base text-slate-700">{request.message || "無留言"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.png_url ? (
                    <a className="btn btn-secondary" href={request.png_url} target="_blank" rel="noreferrer">
                      PNG
                    </a>
                  ) : null}
                  {request.jpg_url ? (
                    <a className="btn btn-secondary" href={request.jpg_url} target="_blank" rel="noreferrer">
                      JPG
                    </a>
                  ) : null}
                  {request.pdf_url ? (
                    <a className="btn btn-primary" href={request.pdf_url} target="_blank" rel="noreferrer">
                      PDF
                    </a>
                  ) : null}
                </div>
              </div>
              <StaticForm className="grid content-start gap-4">
                <input type="hidden" name="request_id" value={request.id} />
                <label>
                  <span className="field-label">處理狀態</span>
                  <select name="status" defaultValue={request.status}>
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">內部備註</span>
                  <textarea name="internal_note" defaultValue={request.internal_note ?? ""} />
                </label>
                <button type="submit" className="btn btn-blue">
                  更新狀態
                </button>
              </StaticForm>
            </article>
          ))
        ) : (
          <div className="card p-6">
            <h2 className="text-xl font-black text-navy-900">目前沒有印刷需求</h2>
            <p className="section-subtitle">前台送出印刷需求後，會出現在這裡。</p>
          </div>
        )}
      </div>
    </section>
  );
}
