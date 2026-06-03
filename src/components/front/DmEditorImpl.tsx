"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

function groupOptions(options: DmEditorProps["printOptions"], type: DmEditorProps["printOptions"][number]["type"]) {
  return options.filter((option) => option.type === type);
}

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

export function DmEditor({ teamId, template, contacts, printOptions }: DmEditorProps) {
  const stageRef = useRef<StageExportHandle | null>(null);
  const [message, setMessage] = useState("");
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [needsPrint, setNeedsPrint] = useState(false);
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createSchema(template.blocks), [template.blocks]);
  const textBlocks = template.blocks.filter((block) => !isImageBlock(block) && block.type !== "qrcode");
  const imageBlocks = template.blocks.filter((block) => isImageBlock(block));
  const quantityOptions = groupOptions(printOptions, "quantity");
  const paperOptions = groupOptions(printOptions, "paper");
  const sizeOptions = groupOptions(printOptions, "size");
  const rushOptions = groupOptions(printOptions, "rush");
  const cuttingOptions = groupOptions(printOptions, "cutting");

  const form = useForm<EditorFormValues>({
    resolver: zodResolver(schema) as Resolver<EditorFormValues>,
    defaultValues: {
      contactId: contacts[0]?.id ?? "",
      values: {},
      images: {}
    }
  });
  const watched = form.watch();
  const selectedContact = contacts.find((contact) => contact.id === watched.contactId) ?? null;

  useEffect(() => {
    const raw = localStorage.getItem(getStorageKey(teamId, template.id));
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as EditorFormValues & { batchRows?: BatchRow[]; batchIndex?: number };
      form.reset({
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
      throw new Error("請先補齊必填欄位，再下載或送印。");
    }

    const stage = stageRef.current;
    if (!stage) throw new Error("預覽尚未準備好，請稍候再試。");

    try {
      const png = stage.toDataURL({ mimeType: "image/png", pixelRatio: 2 });
      const jpg = stage.toDataURL({ mimeType: "image/jpeg", quality: 0.92, pixelRatio: 2 });
      const pdf = dataUrlToPdfDataUrl(png, template);
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

  function handlePrintSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        setMessage("正在送出印刷需求...");
        const exports = await createExports();
        const requestPayload = {
          id: crypto.randomUUID(),
          teamId,
          templateId: template.id,
          contactId: selectedContact?.id ?? null,
          printQuantity: String(formData.get("print_quantity") ?? ""),
          paper: String(formData.get("paper") ?? ""),
          size: String(formData.get("size") ?? ""),
          isRush: formData.get("is_rush") === "yes",
          isCutting: formData.get("is_cutting") === "yes",
          message: String(formData.get("message") ?? ""),
          createdAt: new Date().toISOString(),
          files: {
            png: exports.png,
            jpg: exports.jpg,
            pdf: exports.pdf
          },
          payload: {
            values: form.getValues("values"),
            batchRow: batchRows[batchIndex] ?? null
          }
        };
        localStorage.setItem(`jifu-print-request:${requestPayload.id}`, JSON.stringify(requestPayload));
        setMessage("GitHub Pages 是靜態展示環境，印刷需求已暫存在這台電腦；正式送印需部署到可連接 Supabase 的環境。");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "送出失敗，請再試一次。");
      }
    });
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
          <label className="field-label" htmlFor="contactId">
            聯絡人
          </label>
          <select id="contactId" {...form.register("contactId")}>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} {contact.title ? `- ${contact.title}` : ""}
              </option>
            ))}
          </select>
          <p className="field-help">選擇後會自動帶入聯絡資訊、頭像與 QR Code。</p>
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
        </div>

        <div className="card p-5">
          <p className="eyebrow">Step 6</p>
          <h2 className="section-title">是否需要印刷</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn btn-secondary" onClick={() => setNeedsPrint(false)}>
              不需要印刷，只下載檔案
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setNeedsPrint(true)}>
              需要印刷
            </button>
          </div>

          {needsPrint ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handlePrintSubmit(new FormData(event.currentTarget));
              }}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label>
                <span className="field-label">印刷數量</span>
                <select name="print_quantity" required>
                  {quantityOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">紙張材質</span>
                <select name="paper" required>
                  {paperOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">尺寸</span>
                <select name="size" required>
                  {sizeOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">是否急件</span>
                <select name="is_rush">
                  <option value="no">一般件</option>
                  {rushOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">是否裁切</span>
                <select name="is_cutting">
                  <option value="no">不裁切</option>
                  {cuttingOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">備註留言</span>
                <textarea name="message" placeholder="有特殊需求可寫在這裡" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="btn btn-blue w-full" disabled={isPending}>
                  {isPending ? "送出中..." : "送出印刷需求"}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {message ? <div className="card border-blue-200 bg-blue-50 p-4 text-base font-bold text-navy-900">{message}</div> : null}
      </section>
    </div>
  );
}
