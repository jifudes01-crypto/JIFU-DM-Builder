import { createPrintOptionAction, updatePrintOptionStatusAction } from "@/actions/admin";
import { listPrintOptions } from "@/lib/data";

export default async function PrintOptionsPage() {
  const options = await listPrintOptions(false);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">印刷選項</p>
        <h1 className="section-title">印刷選項</h1>
        <p className="section-subtitle">這些選項會顯示在前台「需要印刷」表單中。</p>
      </div>

      <form action={createPrintOptionAction} className="card grid gap-4 p-5 md:grid-cols-5">
        <label>
          <span className="field-label">類別</span>
          <select name="type">
            <option value="quantity">印刷數量</option>
            <option value="material_size">材質尺寸</option>
            <option value="vendor">廠商</option>
            <option value="rush">急件</option>
            <option value="cutting">裁切</option>
          </select>
        </label>
        <label>
          <span className="field-label">材質尺寸</span>
          <input name="label" required />
        </label>
        <label>
          <span className="field-label">數量</span>
          <input name="value" required />
        </label>
        <label>
          <span className="field-label">廠商</span>
          <input name="vendor" />
        </label>
        <div className="self-end">
          <button type="submit" className="btn btn-blue w-full">
            新增
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>類別</th>
              <th>材質尺寸</th>
              <th>數量</th>
              <th>廠商</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id}>
                <td>
                  {option.type === "quantity"
                    ? "印刷數量"
                    : option.type === "material_size"
                      ? "材質尺寸"
                      : option.type === "vendor"
                        ? "廠商"
                        : option.type === "rush"
                          ? "急件"
                          : option.type === "cutting"
                            ? "裁切"
                            : option.type}
                </td>
                <td className="font-bold text-navy-900">{option.label}</td>
                <td>{option.value}</td>
                <td>{option.vendor ?? "-"}</td>
                <td>{option.is_active ? "啟用" : "停用"}</td>
                <td>
                  <form action={updatePrintOptionStatusAction}>
                    <input type="hidden" name="option_id" value={option.id} />
                    <input type="hidden" name="is_active" value={option.is_active ? "false" : "true"} />
                    <button type="submit" className="btn btn-secondary">
                      {option.is_active ? "停用" : "啟用"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
