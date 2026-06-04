"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { BlockType, PrintStatus, TemplateBlock } from "@/types/database";

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function slugValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    || crypto.randomUUID();
}

async function uploadFile(bucket: string, file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "png";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function runAdminOperation(operation: string, formData: FormData) {
  const supabase = createSupabaseBrowserClient();

  if (operation === "create-team") {
    const name = textValue(formData, "name");
    const { error } = await supabase.from("teams").insert({
      name,
      slug: slugValue(name),
      description: textValue(formData, "description"),
      sort_order: numberValue(formData, "sort_order", 100),
      is_active: true
    });
    if (error) throw error;
    return "團隊已同步新增。";
  }

  if (operation === "update-team") {
    const teamId = textValue(formData, "team_id");
    const name = textValue(formData, "name");
    const { error } = await supabase.from("teams").update({
      name,
      slug: slugValue(name),
      description: textValue(formData, "description"),
      sort_order: numberValue(formData, "sort_order", 100)
    }).eq("id", teamId);
    if (error) throw error;
    return "團隊已同步更新。";
  }

  if (operation === "team-status") {
    const { error } = await supabase.from("teams").update({ is_active: formData.get("is_active") === "true" }).eq("id", textValue(formData, "team_id"));
    if (error) throw error;
    return "團隊狀態已同步。";
  }

  if (operation === "delete-team") {
    const { error } = await supabase.from("teams").delete().eq("id", textValue(formData, "team_id"));
    if (error) throw error;
    return "團隊已刪除。";
  }

  if (operation === "import-teams") {
    const rows = JSON.parse(textValue(formData, "teams_json", "[]")) as Array<{ name: string; description?: string; sort_order?: number; is_active?: boolean }>;
    const { error } = await supabase.from("teams").upsert(rows.map((row, index) => ({
      name: row.name,
      slug: slugValue(row.name),
      description: row.description ?? "",
      sort_order: row.sort_order ?? index + 1,
      is_active: row.is_active ?? true
    })), { onConflict: "slug" });
    if (error) throw error;
    return `已同步匯入 ${rows.length} 筆團隊。`;
  }

  if (operation === "create-template") {
    const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    const rows = await Promise.all(files.map(async (file, index) => ({
      team_id: textValue(formData, "team_id"),
      name: files.length > 1 ? `${textValue(formData, "name")} ${index + 1}` : textValue(formData, "name"),
      category: textValue(formData, "category", "每月精選物件"),
      size_label: textValue(formData, "size_label", "A4 直式"),
      width: numberValue(formData, "width", 794),
      height: numberValue(formData, "height", 1123),
      status: textValue(formData, "status", "draft"),
      image_url: await uploadFile("template-assets", file, "templates"),
      thumbnail_url: null,
      notes: textValue(formData, "notes")
    })));
    const { error } = await supabase.from("templates").insert(rows);
    if (error) throw error;
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
      notes: textValue(formData, "notes")
    };
    const imageUrl = await uploadFile("template-assets", formData.get("image") as File | null, "templates");
    if (imageUrl) patch.image_url = imageUrl;
    const { error } = await supabase.from("templates").update(patch).eq("id", textValue(formData, "template_id"));
    if (error) throw error;
    return "模板已同步更新。";
  }

  if (operation === "template-status") {
    const { error } = await supabase.from("templates").update({ status: textValue(formData, "status", "draft") }).eq("id", textValue(formData, "template_id"));
    if (error) throw error;
    return "模板狀態已同步。";
  }

  if (operation === "delete-template") {
    const { error } = await supabase.from("templates").delete().eq("id", textValue(formData, "template_id"));
    if (error) throw error;
    return "模板已刪除。";
  }

  if (operation === "duplicate-template") {
    const id = textValue(formData, "template_id");
    const { data: template, error } = await supabase.from("templates").select("*").eq("id", id).single();
    if (error) throw error;
    const { data: blocks } = await supabase.from("template_blocks").select("*").eq("template_id", id);
    const { data: copied, error: copyError } = await supabase.from("templates").insert({
      ...template,
      id: undefined,
      name: `${template.name} 複製`,
      status: "draft",
      duplicated_from: id,
      created_at: undefined,
      updated_at: undefined
    }).select("id").single();
    if (copyError) throw copyError;
    if (blocks?.length) {
      const { error: blockError } = await supabase.from("template_blocks").insert(blocks.map((block) => ({
        ...block,
        id: undefined,
        template_id: copied.id,
        created_at: undefined,
        updated_at: undefined
      })));
      if (blockError) throw blockError;
    }
    return "模板已複製。";
  }

  if (operation === "create-contact" || operation === "update-contact") {
    const patch: Record<string, unknown> = {
      team_id: textValue(formData, "team_id"),
      name: textValue(formData, "name"),
      title: textValue(formData, "title"),
      mobile: textValue(formData, "mobile"),
      phone: textValue(formData, "phone"),
      email: textValue(formData, "email"),
      line_id: textValue(formData, "line_id"),
      notes: textValue(formData, "notes")
    };
    const avatarUrl = await uploadFile("contact-assets", formData.get("avatar") as File | null, "avatars");
    const qrcodeUrl = await uploadFile("contact-assets", formData.get("qrcode") as File | null, "qrcodes");
    if (avatarUrl) patch.avatar_url = avatarUrl;
    if (qrcodeUrl) patch.qrcode_url = qrcodeUrl;
    const query = operation === "create-contact"
      ? supabase.from("contacts").insert(patch)
      : supabase.from("contacts").update(patch).eq("id", textValue(formData, "contact_id"));
    const { error } = await query;
    if (error) throw error;
    return operation === "create-contact" ? "人員已同步新增。" : "人員已同步更新。";
  }

  if (operation === "contact-status") {
    const { error } = await supabase.from("contacts").update({ is_active: formData.get("is_active") === "true" }).eq("id", textValue(formData, "contact_id"));
    if (error) throw error;
    return "人員狀態已同步。";
  }

  if (operation === "import-contacts") {
    const contacts = JSON.parse(textValue(formData, "contacts_json", "[]")) as Array<Record<string, string>>;
    const { error } = await supabase.from("contacts").insert(contacts.map((contact) => ({
      ...contact,
      team_id: textValue(formData, "team_id"),
      is_active: true
    })));
    if (error) throw error;
    return `已同步匯入 ${contacts.length} 筆人員。`;
  }

  if (operation === "create-print-option") {
    const { error } = await supabase.from("print_options").insert({
      type: textValue(formData, "type"),
      label: textValue(formData, "label"),
      value: textValue(formData, "value"),
      vendor: textValue(formData, "vendor"),
      is_active: true
    });
    if (error) throw error;
    return "印刷選項已同步新增。";
  }

  if (operation === "print-option-status") {
    const { error } = await supabase.from("print_options").update({ is_active: formData.get("is_active") === "true" }).eq("id", textValue(formData, "option_id"));
    if (error) throw error;
    return "印刷選項狀態已同步。";
  }

  if (operation === "print-request-status") {
    const { error } = await supabase.from("print_requests").update({
      status: textValue(formData, "status") as PrintStatus,
      internal_note: textValue(formData, "internal_note")
    }).eq("id", textValue(formData, "request_id"));
    if (error) throw error;
    return "印刷需求狀態已同步。";
  }

  throw new Error("未知的後台操作。");
}

export async function saveTemplateBlocks(templateId: string, blocks: Array<Omit<TemplateBlock, "created_at" | "updated_at" | "metadata">>) {
  const supabase = createSupabaseBrowserClient();
  const { error: deleteError } = await supabase.from("template_blocks").delete().eq("template_id", templateId);
  if (deleteError) throw deleteError;
  if (!blocks.length) return;
  const { error } = await supabase.from("template_blocks").insert(blocks.map((block, index) => ({
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
  })));
  if (error) throw error;
}
