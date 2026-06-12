"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StaticForm } from "@/components/ui/StaticForm";
import { listTeamsForAdmin, listTemplatesForAdmin } from "@/lib/supabase-admin-ops";
import type { Team, Template } from "@/types/database";

type TemplateWithCount = Template & { block_count?: number };

const SIZE_PRESETS = [
  { label: "A4直式", widthMm: 210, heightMm: 297 },
  { label: "A4橫式", widthMm: 297, heightMm: 210 },
  { label: "名片", widthMm: 90, heightMm: 54 },
  { label: "IG貼文", widthMm: 108, heightMm: 108 },
  { label: "IG限動", widthMm: 108, heightMm: 192 },
  { label: "自訂尺寸", widthMm: 210, heightMm: 297 }
];

function normalizeSizeLabel(label?: string | null) {
  const normalized = (label ?? "").replace(/\s+/g, "");
  return SIZE_PRESETS.some((preset) => preset.label === normalized) ? normalized : "自訂尺寸";
}

function mmFromTemplate(template: TemplateWithCount, key: "width" | "height") {
  const mmValue = key === "width" ? template.width_mm : template.height_mm;
  if (typeof mmValue === "number") return mmValue;
  const pxValue = key === "width" ? template.width_px ?? template.width : template.height_px ?? template.height;
  return Math.round((pxValue / 300) * 25.4);
}

function TemplateSizeFields({ template }: { template?: TemplateWithCount }) {
  const initialPreset = normalizeSizeLabel(template?.size_label ?? "A4直式");
  const initial = SIZE_PRESETS.find((preset) => preset.label === initialPreset) ?? SIZE_PRESETS[0];
  const [preset, setPreset] = useState(initialPreset);
  const [widthMm, setWidthMm] = useState(template ? mmFromTemplate(template, "width") : initial.widthMm);
  const [heightMm, setHeightMm] = useState(template ? mmFromTemplate(template, "height") : initial.heightMm);
  const isCustom = preset === "自訂尺寸";

  function changePreset(nextPreset: string) {
    setPreset(nextPreset);
    const next = SIZE_PRESETS.find((item) => item.label === nextPreset);
    if (next && next.label !== "自訂尺寸") {
      setWidthMm(next.widthMm);
      setHeightMm(next.heightMm);
    }
  }

  return (
    <>
      <label>
        <span className="field-label">尺寸類型</span>
        <select name="size_label" value={preset} onChange={(event) => changePreset(event.currentTarget.value)}>
          {SIZE_PRESETS.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">寬度 mm</span>
        <input
          name="width_mm"
          type="number"
          min={1}
          step="0.1"
          value={widthMm}
          readOnly={!isCustom}
          onChange={(event) => setWidthMm(Number(event.currentTarget.value))}
        />
      </label>
      <label>
        <span className="field-label">高度 mm</span>
        <input
          name="height_mm"
          type="number"
          min={1}
          step="0.1"
          value={heightMm}
          readOnly={!isCustom}
          onChange={(event) => setHeightMm(Number(event.currentTarget.value))}
        />
      </label>
    </>
  );
}

export function TemplatesAdminClient({
  initialTeams,
  initialTemplates
}: {
  initialTeams: Team[];
  initialTemplates: TemplateWithCount[];
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [templates, setTemplates] = useState(initialTemplates);
  const [message, setMessage] = useState("");

  const refreshData = useCallback(async () => {
    try {
      const [latestTeams, latestTemplates] = await Promise.all([listTeamsForAdmin(), listTemplatesForAdmin()]);
      setTeams(latestTeams);
      setTemplates(latestTemplates);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取模板資料失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  return (
    <section className="space-y-6">
      <div className="luxury-panel">
        <p className="text-sm font-black uppercase tracking-normal text-gold-300">Templates</p>
        <h1 className="mt-2 text-3xl font-black text-white">模板管理</h1>
        <p className="mt-3 text-base leading-7 text-slate-200">上架模板才會顯示在前台；沒有區塊設定的模板不能進入製作。</p>
      </div>

      {message ? <p className="rounded-lg bg-amber-50 p-4 text-base font-bold text-amber-900">{message}</p> : null}

      <StaticForm operation="create-template" onSuccess={refreshData} encType="multipart/form-data" className="card grid gap-4 p-5 lg:grid-cols-3">
        <label>
          <span className="field-label">模板名稱</span>
          <input name="name" required placeholder="請輸入模板名稱" />
        </label>
        <label>
          <span className="field-label">團隊</span>
          <select name="team_id" required>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">分類</span>
          <input name="category" placeholder="例如：每月精選物件" />
        </label>
        <TemplateSizeFields />
        <label>
          <span className="field-label">狀態</span>
          <select name="status" defaultValue="draft">
            <option value="draft">下架 / 草稿</option>
            <option value="published">上架</option>
            <option value="archived">封存</option>
          </select>
        </label>
        <label>
          <span className="field-label">模板底圖 JPG / PNG / WebP</span>
          <input name="images" type="file" accept="image/*" multiple required />
        </label>
        <label className="lg:col-span-3">
          <span className="field-label">模板介紹</span>
          <textarea name="description" placeholder="前台會顯示給使用者看的模板介紹。" />
        </label>
        <label className="lg:col-span-3">
          <span className="field-label">內部備註</span>
          <textarea name="notes" placeholder="內部備註，不會顯示在前台" />
        </label>
        <div className="lg:col-span-3">
          <button type="submit" className="btn btn-blue" disabled={!teams.length}>
            新增模板
          </button>
          {!teams.length ? <p className="field-help">請先新增團隊，再上傳模板。</p> : null}
        </div>
      </StaticForm>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>模板</th>
              <th>團隊</th>
              <th>分類</th>
              <th>尺寸</th>
              <th>區塊</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => {
              const team = teams.find((item) => item.id === template.team_id);
              return (
                <tr key={template.id}>
                  <td>
                    <strong className="block text-navy-900">{template.name}</strong>
                    <span className="block text-sm text-slate-500">{template.description || template.category || "-"}</span>
                    {template.notes ? <span className="block text-xs text-slate-400">內部備註：{template.notes}</span> : null}
                  </td>
                  <td>{team?.name ?? "-"}</td>
                  <td>{template.category || "-"}</td>
                  <td>
                    <strong className="block text-navy-900">{normalizeSizeLabel(template.size_label)}</strong>
                    <span className="block text-sm text-slate-500">{mmFromTemplate(template, "width")} × {mmFromTemplate(template, "height")} mm</span>
                  </td>
                  <td>{template.block_count ?? 0}</td>
                  <td>
                    <span className="status-pill border-gold-300 bg-gold-50 text-gold-700">
                      {template.status === "published" ? "上架" : template.status === "archived" ? "封存" : "草稿"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/templates/blocks?id=${encodeURIComponent(template.id)}`} className="btn btn-secondary">
                        設定區塊
                      </Link>
                      <StaticForm operation="template-status" onSuccess={refreshData} resetOnSuccess={false}>
                        <input type="hidden" name="template_id" value={template.id} />
                        <input type="hidden" name="status" value={template.status === "published" ? "draft" : "published"} />
                        <button type="submit" className="btn btn-muted">{template.status === "published" ? "下架" : "上架"}</button>
                      </StaticForm>
                      <StaticForm operation="duplicate-template" onSuccess={refreshData}>
                        <input type="hidden" name="template_id" value={template.id} />
                        <button type="submit" className="btn btn-secondary">複製</button>
                      </StaticForm>
                      <StaticForm operation="delete-template" onSuccess={refreshData}>
                        <input type="hidden" name="template_id" value={template.id} />
                        <button type="submit" className="btn btn-danger">刪除</button>
                      </StaticForm>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-base font-bold text-action">編輯模板資料</summary>
                      <StaticForm operation="update-template" onSuccess={refreshData} resetOnSuccess={false} encType="multipart/form-data" className="mt-3 grid gap-3 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-2">
                        <input type="hidden" name="template_id" value={template.id} />
                        <label>
                          <span className="field-label">名稱</span>
                          <input name="name" defaultValue={template.name} required />
                        </label>
                        <label>
                          <span className="field-label">團隊</span>
                          <select name="team_id" defaultValue={template.team_id}>
                            {teams.map((teamOption) => (
                              <option key={teamOption.id} value={teamOption.id}>
                                {teamOption.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className="field-label">分類</span>
                          <input name="category" defaultValue={template.category} />
                        </label>
                        <TemplateSizeFields template={template} />
                        <label className="md:col-span-2">
                          <span className="field-label">模板介紹</span>
                          <textarea name="description" defaultValue={template.description ?? ""} />
                        </label>
                        <label className="md:col-span-2">
                          <span className="field-label">更換底圖</span>
                          <input name="image" type="file" accept="image/*" />
                        </label>
                        <label className="md:col-span-2">
                          <span className="field-label">內部備註</span>
                          <textarea name="notes" defaultValue={template.notes ?? ""} />
                        </label>
                        <button type="submit" className="btn btn-blue md:col-span-2">儲存修改</button>
                      </StaticForm>
                    </details>
                  </td>
                </tr>
              );
            })}
            {!templates.length ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-6 text-center">
                    <p className="text-lg font-black text-navy-900">目前尚無模板</p>
                    <p className="mt-2 text-sm text-slate-500">請先新增團隊，再上傳模板底圖。</p>
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
