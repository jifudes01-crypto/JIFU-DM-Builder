"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import * as XLSX from "xlsx";
import { z } from "zod";
import { ImageUploadField } from "@/components/front/ImageUploadField";
import { TemplateCanvasPreview } from "@/components/front/TemplateCanvasPreview";
import type { DmEditorProps, StageExportHandle } from "@/types/component-props";
import type {
  BatchRow,
  EditorFormValues,
  TemplateBlock
} from "@/types/database";

function isImageBlock(block: TemplateBlock) {
  return ["image", "avatar", "logo"].includes(block.type);
}

function getStorageKey(teamId: string, templateId: string) {
  return `jifu-dm-editor:${teamId}:${templateId}`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function dataUrlToPdfDataUrl(imageDataUrl: string, template: DmEditorProps["template"]) {
  const pdf = new jsPDF({
    orientation: template.width > template.height ? "landscape" : "portrait",
    unit: "px",
    format: [template.width, template.height],
    compress: true
  });
  pdf.addImage(imageDataUrl, "PNG", 0, 0, template.width, template.height);
  return pdf.output("datauristring");
}

function createSchema(blocks: TemplateBlock[]) {
  return z
    .object({
      departmentId: z.string().default(""),
      contactId: z.string().default(""),
      values: z.record(z.string()).default({}),
      images: z.record(z.string()).default({})
    })
    .superRefine((data, ctx) => {
      blocks.forEach((block) => {
        if (!block.required) return;
        if (isImageBlock(block)) {
          if (!data.images[block.id]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["images", block.id],
              message: `${block.label} 是必填圖片`
            });
          }
          return;
        }

        if (!data.values[block.id]?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["values", block.id],
            message: `${block.label} 是必填欄位`
          });
        }
      });
    });
}

function normalizedLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function contactValueForBlock(label: string, data: {
  teamName: string;
  departmentName: string;
  name: string;
  title: string;
  mobile: string;
  phone: string;
  line: string;
  email: string;
}) {
  const normalized = normalizedLabel(label);
  if (normalized.includes("團隊")) return data.teamName;
  if (normalized.includes("部門")) return data.departmentName;
  if (normalized.includes("姓名") || normalized.includes("業務") || normalized.includes("聯絡人")) return data.name;
  if (normalized.includes("職稱") || normalized.includes("職務")) return data.title;
  if (normalized.includes("手機") || normalized.includes("行動")) return data.mobile;
  if (normalized.includes("電話") || normalized.includes("市話")) return data.phone;
  if (normalized.includes("line")) return data.line;
  if (normalized.includes("email") || normalized.includes("e-mail") || normalized.includes("信箱")) return data.email;
  return "";
}

export function DmEditor({ teamId, team, template, departments, contacts }: DmEditorProps) {
  const stageRef = useRef<StageExportHandle | null>(null);
  const [message, setMessage] = useState("");
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [generated, setGenerated] = useState<{ png: string; jpg: string; pdf: string; saveKey: string } | null>(null);
  const schema = useMemo(() => createSchema(template.blocks), [template.blocks]);
  const textBlocks = useMemo(() => template.blocks.filter((block) => !isImageBlock(block) && block.type !== "qrcode"), [template.blocks]);
  const imageBlocks = useMemo(() => template.blocks.filter((block) => isImageBlock(block)), [template.blocks]);

  const form = useForm<EditorFormValues>({
    resolver: zodResolver(schema) as Resolver<EditorFormValues>,
    defaultValues: {
      departmentId: "",
      contactId: contacts[0]?.id ?? "",
      values: {},
      images: {}
    }
  });
  const watched = form.watch();
  const selectedDepartment = departments.find((department) => department.id === watched.departmentId) ?? null;
  const filteredContacts = contacts.filter((contact) => !watched.departmentId || contact.department_id === watched.departmentId);
  const selectedContact = filteredContacts.find((contact) => contact.id === watched.contactId) ?? filteredContacts[0] ?? null;
  useEffect(() => {
    const raw = localStorage.getItem(getStorageKey(teamId, template.id));
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as EditorFormValues & { batchRows?: BatchRow[]; batchIndex?: number };
      form.reset({
        departmentId: saved.departmentId || "",
        contactId: saved.contactId || contacts[0]?.id || "",
        values: saved.values || {},
        images: saved.images || {}
      });
      setBatchRows(saved.batchRows || []);
      setBatchIndex(saved.batchIndex || 0);
      setMessage("已載入上次暫存內容。");
    } catch {
      localStorage.removeItem(getStorageKey(teamId, template.id));
    }
  }, [contacts, form, teamId, template.id]);

  useEffect(() => {
    if (!selectedContact && watched.contactId) {
      form.setValue("contactId", "", { shouldValidate: true });
      return;
    }
    if (selectedContact && selectedContact.id !== watched.contactId) {
      form.setValue("contactId", selectedContact.id, { shouldValidate: true });
    }
  }, [form, selectedContact, watched.contactId]);

  useEffect(() => {
    if (!selectedContact) return;
    const department = departments.find((item) => item.id === selectedContact.department_id) ?? selectedDepartment;
    const data = {
      teamName: team.name,
      departmentName: department?.name ?? "",
      name: selectedContact.name,
      title: selectedContact.title ?? "",
      mobile: selectedContact.mobile ?? "",
      phone: selectedContact.phone ?? "",
      line: selectedContact.line_id ?? "",
      email: selectedContact.email ?? ""
    };
    const currentValues = form.getValues("values") ?? {};
    const nextValues = { ...currentValues };
    let changed = false;
    textBlocks.forEach((block) => {
      const nextValue = contactValueForBlock(block.label, data);
      if (nextValue && nextValues[block.id] !== nextValue) {
        nextValues[block.id] = nextValue;
        changed = true;
      }
    });
    if (changed) form.setValue("values", nextValues, { shouldValidate: true });
  }, [departments, form, selectedContact, selectedDepartment, team.name, textBlocks]);

  useEffect(() => {
    localStorage.setItem(
      getStorageKey(teamId, template.id),
      JSON.stringify({ ...watched, batchRows, batchIndex })
    );
  }, [batchIndex, batchRows, watched, teamId, template.id]);

  function applyBatchRow(index: number) {
    const row = batchRows[index];
    if (!row) return;
    const nextValues = { ...form.getValues("values") };
    template.blocks.forEach((block) => {
      const value = row.values[block.label] || row.values[block.id];
      if (value && !isImageBlock(block)) {
        nextValues[block.id] = value;
      }
      if (value && isImageBlock(block) && /^https?:\/\//.test(value)) {
        form.setValue(`images.${block.id}`, value, { shouldValidate: true });
      }
    });
    form.setValue("values", nextValues, { shouldValidate: true });
    setBatchIndex(index);
    setMessage(`已套入第 ${index + 1} 筆：${row.label}`);
  }

  async function parseBatchFile(file?: File) {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: "" });
    const mappedRows = rows.map((row, index) => ({
      id: `${Date.now()}-${index}`,
      label: row["主標題"] || row["名稱"] || row["地址"] || `第 ${index + 1} 筆`,
      values: Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), String(value).trim()]))
    }));

    setBatchRows(mappedRows);
    if (mappedRows[0]) applyBatchRowFromRows(mappedRows, 0);
    setMessage(`已匯入 ${mappedRows.length} 筆批次資料。`);
  }

  function applyBatchRowFromRows(rows: BatchRow[], index: number) {
    const row = rows[index];
    if (!row) return;
    const nextValues = { ...form.getValues("values") };
    template.blocks.forEach((block) => {
      const value = row.values[block.label] || row.values[block.id];
      if (value && !isImageBlock(block)) nextValues[block.id] = value;
      if (value && isImageBlock(block) && /^https?:\/\//.test(value)) {
        form.setValue(`images.${block.id}`, value, { shouldValidate: true });
      }
    });
    form.setValue("values", nextValues, { shouldValidate: true });
    setBatchIndex(index);
  }

  async function createExports() {
    const valid = await form.trigger();
    if (!valid) {
      throw new Error("請先補齊必填欄位，再下載。");
    }

    const stage = stageRef.current;
    if (!stage) throw new Error("預覽尚未準備好，請稍候再試。");

    try {
      const png = stage.toDataURL({ mimeType: "image/png", pixelRatio: 2 });
      const jpg = stage.toDataURL({ mimeType: "image/jpeg", quality: 0.92, pixelRatio: 2 });
      const pdf = dataUrlToPdfDataUrl(png, template);
      const saveKey = crypto.randomUUID();
      localStorage.setItem(`jifu-save-image:${saveKey}`, JSON.stringify({ png, jpg, pdf, name: template.name }));
      setGenerated({ png, jpg, pdf, saveKey });
      return { png, jpg, pdf };
    } catch {
      throw new Error("下載失敗。若使用外部圖片網址，請改用手動上傳圖片後再試一次。");
    }
  }

  async function handleDownload(format: "png" | "jpg" | "pdf") {
    try {
      setMessage("正在準備下載檔案...");
      const exports = await createExports();
      const name = `${template.name}-${batchRows[batchIndex]?.label || "DM"}`;
      if (format === "png") downloadDataUrl(exports.png, `${name}.png`);
      if (format === "jpg") downloadDataUrl(exports.jpg, `${name}.jpg`);
      if (format === "pdf") downloadDataUrl(exports.pdf, `${name}.pdf`);
      setMessage("下載已開始。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "下載失敗，請再試一次。");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(360px,460px)_1fr]">
      <section className="space-y-5">
        <div className="card p-5">
          <p className="eyebrow">Step 3</p>
          <h1 className="section-title">填寫內容</h1>
          <p className="section-subtitle">版面由後台鎖定，前台只填資料與上傳圖片。</p>
        </div>

        <div className="card p-5">
          <label className="field-label" htmlFor="departmentId">
            部門
          </label>
          <select id="departmentId" {...form.register("departmentId")}>
            <option value="">全部部門</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <p className="field-help">只會顯示目前團隊底下啟用中的部門。</p>
        </div>

        <div className="card p-5">
          <label className="field-label" htmlFor="contactId">
            業務
          </label>
          <select id="contactId" {...form.register("contactId")}>
            {filteredContacts.map((contact) => {
              const department = departments.find((item) => item.id === contact.department_id);
              return (
              <option key={contact.id} value={contact.id}>
                {department ? `${department.name} / ` : ""}{contact.name} {contact.title ? `- ${contact.title}` : ""}
              </option>
              );
            })}
          </select>
          <p className="field-help">選擇後會自動帶入團隊、部門、姓名、職稱、手機、電話、LINE、Email、頭像與 QR Code。</p>
        </div>

        <div className="card p-5">
          <label className="field-label">批次匯入 Excel / CSV</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => void parseBatchFile(event.currentTarget.files?.[0])}
          />
          <p className="field-help">欄名請使用後台區塊 label，例如：主標題、價格、地址、特色說明。</p>
          {batchRows.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {batchRows.map((row, index) => (
                <button
                  key={row.id}
                  type="button"
                  className={`btn ${index === batchIndex ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => applyBatchRow(index)}
                >
                  {index + 1}. {row.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          {textBlocks.map((block) => {
            const current = watched.values?.[block.id] || "";
            const remaining = block.max_length ? block.max_length - current.length : null;
            const error = form.formState.errors.values?.[block.id]?.message;
            return (
              <div key={block.id} className="card p-5">
                <label className="field-label" htmlFor={block.id}>
                  {block.label} {block.required ? <span className="text-red-600">*</span> : null}
                </label>
                {block.height > 72 || block.type === "body" || block.type === "feature" ? (
                  <textarea
                    id={block.id}
                    maxLength={block.max_length ?? undefined}
                    {...form.register(`values.${block.id}`)}
                  />
                ) : (
                  <input
                    id={block.id}
                    maxLength={block.max_length ?? undefined}
                    {...form.register(`values.${block.id}`)}
                  />
                )}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-red-600">{String(error ?? "")}</p>
                  {remaining !== null ? <p className="text-sm text-slate-500">剩餘 {remaining} 字</p> : null}
                </div>
              </div>
            );
          })}

          {imageBlocks.map((block) => (
            <div key={block.id} className="card p-5">
              <ImageUploadField
                label={`${block.label}${block.required ? " *" : ""}`}
                value={watched.images?.[block.id]}
                onChange={(dataUrl) => form.setValue(`images.${block.id}`, dataUrl, { shouldValidate: true })}
                onClear={() => form.setValue(`images.${block.id}`, "", { shouldValidate: true })}
              />
              <p className="mt-2 text-sm font-bold text-red-600">
                {String(form.formState.errors.images?.[block.id]?.message ?? "")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Step 4</p>
              <h2 className="section-title">即時預覽</h2>
            </div>
            <span className="status-pill border-blue-200 bg-blue-50 text-navy-800">{template.size_label}</span>
          </div>
          <div className="mt-5">
            <TemplateCanvasPreview
              template={template}
              values={watched.values || {}}
              images={watched.images || {}}
              contact={selectedContact}
              team={team}
              department={selectedDepartment ?? departments.find((item) => item.id === selectedContact?.department_id) ?? null}
              stageRef={stageRef}
              scale={0.48}
            />
          </div>
        </div>

        <div className="card p-5">
          <p className="eyebrow">Step 5</p>
          <h2 className="section-title">下載成品</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void handleDownload("png")}>
              下載 PNG
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void handleDownload("jpg")}>
              下載 JPG
            </button>
            <button type="button" className="btn btn-blue" onClick={() => void handleDownload("pdf")}>
              下載 PDF
            </button>
          </div>
          {generated ? (
            <div className="mt-5 rounded-lg border border-line bg-slate-50 p-4">
              <p className="text-base font-bold text-navy-900">手機或 LINE 無法下載時，請長按下方圖片儲存。</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generated.png} alt="可長按儲存的 DM 圖片" className="mt-3 w-full rounded-lg border border-line bg-white" />
              <a className="btn btn-primary mt-4 w-full" href={`/save?key=${generated.saveKey}`} target="_blank" rel="noreferrer">
                開啟專用儲存頁
              </a>
            </div>
          ) : null}
        </div>

        {message ? <div className="card border-blue-200 bg-blue-50 p-4 text-base font-bold text-navy-900">{message}</div> : null}
      </section>
    </div>
  );
}
