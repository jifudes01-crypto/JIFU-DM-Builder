"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { BlockType, Contact, Department, ExportRecord, SiteSettings, Team, Template, TemplateBlock } from "@/types/database";

const SITE_ASSETS_BUCKET = "site-assets";
const TEMPLATE_ASSETS_BUCKET = "template-assets";
const CONTACT_ASSETS_BUCKET = "contact-assets";
const DM_EXPORTS_BUCKET = "dm-exports";

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function slugValue(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || crypto.randomUUID()
  );
}

function readableSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return error instanceof Error ? error.message : "同步失敗，請稍後再試。";
  const detail = error as { message?: string; code?: string; details?: string; hint?: string; status?: number };
  const text = `${detail.message ?? ""} ${detail.details ?? ""} ${detail.hint ?? ""}`.toLowerCase();
  if (text.includes("bucket not found") || text.includes("bucket") && text.includes("not found")) {
    return `Supabase Storage bucket 找不到。請確認已執行 supabase/schema.sql，並建立 ${SITE_ASSETS_BUCKET}、${TEMPLATE_ASSETS_BUCKET}、${CONTACT_ASSETS_BUCKET}、${DM_EXPORTS_BUCKET}。`;
  }
  return [detail.message, detail.code ? `代碼：${detail.code}` : "", detail.details, detail.hint].filter(Boolean).join(" / ") || "同步失敗，請稍後再試。";
}

function isBucketMissing(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const detail = error as { message?: string; details?: string; hint?: string };
  const text = `${detail.message ?? ""} ${detail.details ?? ""} ${detail.hint ?? ""}`.toLowerCase();
  return text.includes("bucket not found") || (text.includes("bucket") && text.includes("not found"));
}

function isMissingDepartmentSchema(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const detail = error as { code?: string; message?: string; details?: string };
  const text = `${detail.message ?? ""} ${detail.details ?? ""}`.toLowerCase();
  return ["42p01", "42703", "pgrst200", "pgrst205"].includes(String(detail.code ?? "").toLowerCase()) || text.includes("departments") || text.includes("department_id");
}

async function getUniqueTeamSlug(supabase: SupabaseClient, name: string, currentTeamId?: string) {
  const baseSlug = slugValue(name);

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const { data, error } = await supabase.from("teams").select("id").eq("slug", candidate).maybeSingle();
    if (error) throw new Error(readableSupabaseError(error));
    if (!data || data.id === currentTeamId) return candidate;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

async function uploadFile(bucket: string, file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "png";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const supabase = await createSupabaseBrowserClient();
  let targetBucket = bucket;
  let { error } = await supabase.storage.from(targetBucket).upload(path, file, { upsert: false });

  if (error && targetBucket === SITE_ASSETS_BUCKET && isBucketMissing(error)) {
    targetBucket = CONTACT_ASSETS_BUCKET;
    const fallback = await supabase.storage.from(targetBucket).upload(path, file, { upsert: false });
    error = fallback.error;
  }

  if (error) throw new Error(readableSupabaseError(error));
  return supabase.storage.from(targetBucket).getPublicUrl(path).data.publicUrl;
}

export async function listTeamsForAdmin() {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase.from("teams").select("*").order("sort_order").order("name");
  if (error) throw new Error(readableSupabaseError(error));
  return (data ?? []) as Team[];
}

export async function listDepartmentsForAdmin() {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase.from("departments").select("*, teams(name)").order("sort_order").order("name");
  if (error) {
    if (isMissingDepartmentSchema(error)) return [];
    throw new Error(readableSupabaseError(error));
  }
  return (data ?? []) as Department[];
}

export async function listContactsForAdmin() {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase.from("contacts").select("*, departments(name)").order("name");
  if (error && isMissingDepartmentSchema(error)) {
    const fallback = await supabase.from("contacts").select("*").order("name");
    if (fallback.error) throw new Error(readableSupabaseError(fallback.error));
    return (fallback.data ?? []).map((contact) => ({ ...contact, department_id: null })) as Contact[];
  }
  if (error) throw new Error(readableSupabaseError(error));
  return (data ?? []) as Contact[];
}

export async function listTemplatesForAdmin() {
  const supabase = await createSupabaseBrowserClient();
  const pageSize = 1000;
  const rows: Array<Template & { template_blocks?: Array<{ count?: number }> }> = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("templates")
      .select("*, template_blocks(count)")
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(readableSupabaseError(error));
    const page = (data ?? []) as Array<Template & { template_blocks?: Array<{ count?: number }> }>;
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows.map((item) => ({
    ...(item as Template),
    block_count: item.template_blocks?.[0]?.count ?? 0
  }));
}

export async function getSiteSettingsForAdmin() {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
  if (error) throw new Error(readableSupabaseError(error));
  return (data as SiteSettings | null) ?? null;
}

export async function listExportRecordsForAdmin() {
  const supabase = await createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("exports")
    .select("*, teams(name), templates(name), contacts(name, mobile)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(readableSupabaseError(error));
  return (data ?? []) as ExportRecord[];
}

async function findTeamByName(supabase: SupabaseClient, name: string) {
  if (!name) return null;
  const { data, error } = await supabase.from("teams").select("id").eq("name", name).maybeSingle();
  if (error) throw new Error(readableSupabaseError(error));
  return data?.id ?? null;
}

async function findDepartmentByName(supabase: SupabaseClient, teamId: string, name: string) {
  if (!teamId || !name) return null;
  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("team_id", teamId)
    .eq("name", name)
    .maybeSingle();
  if (error) throw new Error(readableSupabaseError(error));
  return data?.id ?? null;
}

export async function runAdminOperation(operation: string, formData: FormData) {
  const supabase = await createSupabaseBrowserClient();

  if (operation === "create-team") {
    const name = textValue(formData, "name");
    const logoUrl = await uploadFile(SITE_ASSETS_BUCKET, formData.get("logo") as File | null, "team-logos");
    const { error } = await supabase.from("teams").insert({
      name,
      slug: await getUniqueTeamSlug(supabase, name),
      description: textValue(formData, "description"),
      logo_url: logoUrl,
      sort_order: numberValue(formData, "sort_order", 100),
      is_active: true
    });
    if (error) throw new Error(readableSupabaseError(error));
    return "團隊已同步新增。";
  }

  if (operation === "update-team") {
    const teamId = textValue(formData, "team_id");
    const name = textValue(formData, "name");
    const patch: Record<string, unknown> = {
      name,
      slug: await getUniqueTeamSlug(supabase, name, teamId),
      description: textValue(formData, "description"),
      sort_order: numberValue(formData, "sort_order", 100)
    };
    const logoUrl = await uploadFile(SITE_ASSETS_BUCKET, formData.get("logo") as File | null, "team-logos");
    if (logoUrl) patch.logo_url = logoUrl;
    const { error } = await supabase
      .from("teams")
      .update(patch)
      .eq("id", teamId);
    if (error) throw new Error(readableSupabaseError(error));
    return "團隊已同步更新。";
  }

  if (operation === "team-status") {
    const { error } = await supabase.from("teams").update({ is_active: formData.get("is_active") === "true" }).eq("id", textValue(formData, "team_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "團隊狀態已同步。";
  }

  if (operation === "delete-team") {
    const { error } = await supabase.from("teams").delete().eq("id", textValue(formData, "team_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "團隊已刪除。";
  }

  if (operation === "import-teams") {
    const rows = JSON.parse(textValue(formData, "teams_json", "[]")) as Array<{ name: string; description?: string; sort_order?: number; is_active?: boolean }>;
    const rowsWithSlugs = [];
    for (const [index, row] of rows.entries()) {
      rowsWithSlugs.push({
        name: row.name,
        slug: await getUniqueTeamSlug(supabase, row.name),
        description: row.description ?? "",
        sort_order: row.sort_order ?? index + 1,
        is_active: row.is_active ?? true
      });
    }
    const { error } = await supabase.from("teams").insert(rowsWithSlugs);
    if (error) throw new Error(readableSupabaseError(error));
    return `已同步匯入 ${rows.length} 筆團隊。`;
  }

  if (operation === "create-department") {
    const { error } = await supabase.from("departments").insert({
      team_id: textValue(formData, "team_id"),
      name: textValue(formData, "name"),
      description: textValue(formData, "description"),
      sort_order: numberValue(formData, "sort_order", 100),
      is_active: true
    });
    if (error) throw new Error(readableSupabaseError(error));
    return "部門已同步新增。";
  }

  if (operation === "update-department") {
    const { error } = await supabase
      .from("departments")
      .update({
        team_id: textValue(formData, "team_id"),
        name: textValue(formData, "name"),
        description: textValue(formData, "description"),
        sort_order: numberValue(formData, "sort_order", 100)
      })
      .eq("id", textValue(formData, "department_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "部門已同步更新。";
  }

  if (operation === "department-status") {
    const { error } = await supabase
      .from("departments")
      .update({ is_active: formData.get("is_active") === "true" })
      .eq("id", textValue(formData, "department_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "部門狀態已同步。";
  }

  if (operation === "delete-department") {
    const { error } = await supabase.from("departments").delete().eq("id", textValue(formData, "department_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "部門已刪除。";
  }

  if (operation === "create-template") {
    const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    const rows = await Promise.all(
      files.map(async (file, index) => ({
        team_id: textValue(formData, "team_id"),
        name: files.length > 1 ? `${textValue(formData, "name")} ${index + 1}` : textValue(formData, "name"),
        category: textValue(formData, "category", "每月精選物件"),
        size_label: textValue(formData, "size_label", "A4 直式"),
        width: numberValue(formData, "width", 794),
        height: numberValue(formData, "height", 1123),
        status: textValue(formData, "status", "draft"),
        image_url: await uploadFile(TEMPLATE_ASSETS_BUCKET, file, "templates"),
        thumbnail_url: null,
        description: textValue(formData, "description"),
        notes: textValue(formData, "notes")
      }))
    );
    const { error } = await supabase.from("templates").insert(rows);
    if (error) throw new Error(readableSupabaseError(error));
    return "模板已同步新增。";
  }

  if (operation === "update-template") {
    const patch: Record<string, unknown> = {
      team_id: textValue(formData, "team_id"),
      name: textValue(formData, "name"),
      category: textValue(formData, "category", "每月精選物件"),
      size_label: textValue(formData, "size_label", "A4 直式"),
      width: numberValue(formData, "width", 794),
      height: numberValue(formData, "height", 1123),
      description: textValue(formData, "description"),
      notes: textValue(formData, "notes")
    };
    const imageUrl = await uploadFile(TEMPLATE_ASSETS_BUCKET, formData.get("image") as File | null, "templates");
    if (imageUrl) patch.image_url = imageUrl;
    const { error } = await supabase.from("templates").update(patch).eq("id", textValue(formData, "template_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "模板已同步更新。";
  }

  if (operation === "template-status") {
    const { error } = await supabase.from("templates").update({ status: textValue(formData, "status", "draft") }).eq("id", textValue(formData, "template_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "模板狀態已同步。";
  }

  if (operation === "delete-template") {
    const { error } = await supabase.from("templates").delete().eq("id", textValue(formData, "template_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "模板已刪除。";
  }

  if (operation === "duplicate-template") {
    const id = textValue(formData, "template_id");
    const { data: template, error } = await supabase.from("templates").select("*").eq("id", id).single();
    if (error) throw new Error(readableSupabaseError(error));
    const { data: blocks } = await supabase.from("template_blocks").select("*").eq("template_id", id);
    const { data: copied, error: copyError } = await supabase
      .from("templates")
      .insert({
        ...template,
        id: undefined,
        name: `${template.name} 複製`,
        status: "draft",
        duplicated_from: id,
        created_at: undefined,
        updated_at: undefined
      })
      .select("id")
      .single();
    if (copyError) throw new Error(readableSupabaseError(copyError));
    if (blocks?.length) {
      const { error: blockError } = await supabase.from("template_blocks").insert(
        blocks.map((block) => ({
          ...block,
          id: undefined,
          template_id: copied.id,
          created_at: undefined,
          updated_at: undefined
        }))
      );
      if (blockError) throw new Error(readableSupabaseError(blockError));
    }
    return "模板已複製。";
  }

  if (operation === "create-contact" || operation === "update-contact") {
    const departmentId = textValue(formData, "department_id");
    const patch: Record<string, unknown> = {
      team_id: textValue(formData, "team_id"),
      department_id: departmentId || null,
      name: textValue(formData, "name"),
      title: textValue(formData, "title"),
      mobile: textValue(formData, "mobile"),
      phone: textValue(formData, "phone"),
      email: textValue(formData, "email"),
      line_id: textValue(formData, "line_id"),
      notes: textValue(formData, "notes")
    };
    const avatarUrl = await uploadFile(CONTACT_ASSETS_BUCKET, formData.get("avatar") as File | null, "avatars");
    const qrcodeUrl = await uploadFile(CONTACT_ASSETS_BUCKET, formData.get("qrcode") as File | null, "qrcodes");
    if (avatarUrl) patch.avatar_url = avatarUrl;
    if (qrcodeUrl) patch.qrcode_url = qrcodeUrl;
    const query = operation === "create-contact" ? supabase.from("contacts").insert(patch) : supabase.from("contacts").update(patch).eq("id", textValue(formData, "contact_id"));
    const { error } = await query;
    if (error) throw new Error(readableSupabaseError(error));
    return operation === "create-contact" ? "人員已同步新增。" : "人員已同步更新。";
  }

  if (operation === "contact-status") {
    const { error } = await supabase.from("contacts").update({ is_active: formData.get("is_active") === "true" }).eq("id", textValue(formData, "contact_id"));
    if (error) throw new Error(readableSupabaseError(error));
    return "人員狀態已同步。";
  }

  if (operation === "update-site-settings") {
    const bannerUrl = await uploadFile(SITE_ASSETS_BUCKET, formData.get("banner") as File | null, "banners");
    const patch: SiteSettings = {
      id: "main",
      banner_image_url: bannerUrl || textValue(formData, "current_banner_url") || null
    };
    const { error } = await supabase.from("site_settings").upsert(patch, { onConflict: "id" });
    if (error) throw new Error(readableSupabaseError(error));
    return "首頁 Banner 已同步更新。";
  }

  if (operation === "import-contacts") {
    const fallbackTeamId = textValue(formData, "team_id");
    const contacts = JSON.parse(textValue(formData, "contacts_json", "[]")) as Array<Record<string, string>>;
    const rows = [];
    for (const contact of contacts) {
      const teamId = contact.team_id || (await findTeamByName(supabase, contact.team_name || contact["團隊名稱"] || "")) || fallbackTeamId;
      const departmentId =
        contact.department_id ||
        (await findDepartmentByName(supabase, teamId, contact.department_name || contact["部門名稱"] || "")) ||
        null;
      const { team_id: _teamId, department_id: _departmentId, team_name: _teamName, department_name: _departmentName, 團隊名稱: _teamNameZh, 部門名稱: _departmentNameZh, ...contactFields } = contact;
      rows.push({
        ...contactFields,
        team_id: teamId,
        department_id: departmentId,
        is_active: true
      });
    }
    const { error } = await supabase.from("contacts").insert(rows);
    if (error) throw new Error(readableSupabaseError(error));
    return `已同步匯入 ${contacts.length} 筆人員。`;
  }

  throw new Error("未知的後台操作。");
}

export async function saveTemplateBlocks(templateId: string, blocks: Array<Omit<TemplateBlock, "created_at" | "updated_at" | "metadata">>) {
  const supabase = await createSupabaseBrowserClient();
  const { error: deleteError } = await supabase.from("template_blocks").delete().eq("template_id", templateId);
  if (deleteError) throw new Error(readableSupabaseError(deleteError));
  if (!blocks.length) return;
  const { error } = await supabase.from("template_blocks").insert(
    blocks.map((block, index) => ({
      template_id: templateId,
      type: block.type as BlockType,
      label: block.label,
      required: block.required,
      max_length: block.max_length,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      font_size: block.font_size,
      color: block.color,
      text_align: block.text_align,
      image_fit: block.image_fit,
      z_index: index + 1
    }))
  );
  if (error) throw new Error(readableSupabaseError(error));
}
