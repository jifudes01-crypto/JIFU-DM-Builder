"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient, getPublicUrl } from "@/lib/supabase";

const dataUrlSchema = z.string().startsWith("data:");

const printRequestSchema = z.object({
  teamId: z.string(),
  templateId: z.string(),
  contactId: z.string().nullable(),
  pngDataUrl: dataUrlSchema,
  jpgDataUrl: dataUrlSchema,
  pdfDataUrl: dataUrlSchema,
  printQuantity: z.string().optional(),
  materialSize: z.string().optional(),
  vendor: z.string().optional(),
  totalQuantity: z.number().default(0),
  batchItems: z
    .array(
      z.object({
        id: z.string(),
        contactId: z.string().nullable(),
        contactName: z.string(),
        quantity: z.number(),
        materialSize: z.string(),
        vendor: z.string(),
        label: z.string().optional()
      })
    )
    .default([]),
  isRush: z.boolean(),
  isCutting: z.boolean(),
  message: z.string().optional(),
  payload: z.record(z.unknown()).default({})
});

type SubmitPrintRequestPayload = z.infer<typeof printRequestSchema>;

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("匯出檔案格式不正確。");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

async function uploadDataUrl(bucket: string, dataUrl: string, path: string) {
  const supabase = createSupabaseAdminClient();
  const { buffer, mimeType } = parseDataUrl(dataUrl);
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false
  });

  if (error) throw error;
  return getPublicUrl(bucket, path);
}

export async function submitPrintRequestAction(rawPayload: SubmitPrintRequestPayload) {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "尚未連接 Supabase，現在可以下載檔案，但無法送出印刷需求。"
    };
  }

  try {
    const payload = printRequestSchema.parse(rawPayload);
    const folder = `${payload.teamId}/${payload.templateId}/${crypto.randomUUID()}`;
    const pngUrl = await uploadDataUrl("dm-exports", payload.pngDataUrl, `${folder}/dm.png`);
    const jpgUrl = await uploadDataUrl("dm-exports", payload.jpgDataUrl, `${folder}/dm.jpg`);
    const pdfUrl = await uploadDataUrl("dm-exports", payload.pdfDataUrl, `${folder}/dm.pdf`);
    const supabase = createSupabaseAdminClient();

    const { data: pdfExport, error: exportError } = await supabase
      .from("exports")
      .insert({
        team_id: payload.teamId,
        template_id: payload.templateId,
        contact_id: payload.contactId,
        format: "pdf",
        file_url: pdfUrl,
        preview_url: pngUrl,
        payload: payload.payload
      })
      .select("id")
      .single();
    if (exportError) throw exportError;

    const { error: extraExportsError } = await supabase.from("exports").insert([
      {
        team_id: payload.teamId,
        template_id: payload.templateId,
        contact_id: payload.contactId,
        format: "png",
        file_url: pngUrl,
        preview_url: pngUrl,
        payload: payload.payload
      },
      {
        team_id: payload.teamId,
        template_id: payload.templateId,
        contact_id: payload.contactId,
        format: "jpg",
        file_url: jpgUrl,
        preview_url: pngUrl,
        payload: payload.payload
      }
    ]);
    if (extraExportsError) throw extraExportsError;

    const { error: requestError } = await supabase.from("print_requests").insert({
      team_id: payload.teamId,
      template_id: payload.templateId,
      contact_id: payload.contactId,
      export_id: pdfExport.id,
      preview_url: pngUrl,
      png_url: pngUrl,
      jpg_url: jpgUrl,
      pdf_url: pdfUrl,
      print_quantity: payload.printQuantity || null,
      paper: payload.materialSize || null,
      size: payload.materialSize || null,
      total_quantity: payload.totalQuantity || Number(payload.printQuantity || 0) || 0,
      material_summary: payload.materialSize || null,
      vendor: payload.vendor || null,
      batch_items: payload.batchItems.map((item) => ({
        ...item,
        previewUrl: pngUrl,
        pngUrl,
        jpgUrl,
        pdfUrl
      })),
      is_rush: payload.isRush,
      is_cutting: payload.isCutting,
      message: payload.message || null,
      payload: payload.payload
    });
    if (requestError) throw requestError;

    return { ok: true, message: "印刷需求已送出，後台可以查看處理狀態。" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "送出失敗，請稍後再試。";
    return { ok: false, message };
  }
}
