import { StaticForm } from "@/components/ui/StaticForm";
import { listPrintOptions } from "@/lib/data";

export default async function PrintOptionsPage() {
  const options = await listPrintOptions(false);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Print Options</p>
        <h1 className="section-title">印刷選項</h1>
        <p className="section-subtitle">這些選項會顯示在前台「需要印刷」表單中。</p>
      </div>

      <StaticForm className="card grid gap-4 p-5 md:grid-cols-5">
        <label>
          <span className="field-label">類型</span>
          <select name="type">
            <option value="quantity">印刷數量</option>
            <option value="paper">紙張材質</option>
            <option value="size">尺寸</option>
            <option value="rush">急件</option>
            <option value="cutting">裁切</option>
          </select>
        </label>
        <label>
          <span className="field-label">顯示文字</span>
          <input name="label" required />
        </label>
        <label>
          <span className="field-label">值</span>
          <input name="value" required />
        </label>
        <label>
          <span className="field-label">排序</span>
          <input name="sort_order" type="number" defaultValue={100} />
        </label>
        <div className="self-end">
          <button type="submit" className="btn btn-blue w-full">
            新增
          </button>
        </div>
      </StaticForm>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>類型</th>
              <th>顯示文字</th>
              <th>值</th>
              <th>排序</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id}>
                <td>{option.type}</td>
                <td className="font-bold text-navy-900">{option.label}</td>
                <td>{option.value}</td>
                <td>{option.sort_order}</td>
                <td>{option.is_active ? "啟用" : "停用"}</td>
                <td>
                  <StaticForm>
                    <input type="hidden" name="option_id" value={option.id} />
                    <input type="hidden" name="is_active" value={option.is_active ? "false" : "true"} />
                    <button type="submit" className="btn btn-secondary">
                      {option.is_active ? "停用" : "啟用"}
                    </button>
                  </StaticForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
