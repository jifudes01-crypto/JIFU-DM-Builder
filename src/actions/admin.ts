"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient, getPublicUrl } from "@/lib/supabase";
import type { BlockType, ImageFit, TextAlign } from "@/types/database";

const blockSchema = z.object({
  id: z.string().optional(),
  type: z.custom<BlockType>(),
  label: z.string().min(1),
  required: z.boolean(),
  max_length: z.number().nullable(),
  x: z.number(),
  y: z.number(),
  width: z.number().min(10),
  height: z.number().min(10),
  font_size: z.number().min(8),
  color: z.string().min(1),
  text_align: z.custom<TextAlign>(),
  image_fit: z.custom<ImageFit>(),
  z_index: z.number()
});

function assertSupabaseReady() {
  if (!isSupabaseConfigured()) {
    throw new Error("尚未設定 Supabase，請先依 README 建立 .env.local。");
  }
}

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function safeFileName(name: string) {
  return name.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").toLowerCase();
}

function slugValue(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || crypto.randomUUID();
}

async function uploadFile(bucket: string, file: File, folder: string) {
  const supabase = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(file.name || `file.${ext}`)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined
  });

  if (error) throw error;
  return getPublicUrl(bucket, path);
}

export async function createTemplateAction(formData: FormData) {
  assertSupabaseReady();
  const files = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);
  const fallbackFile = formData.get("image") as File | null;
  if (files.length === 0 && fallbackFile && fallbackFile.size > 0) {
    files.push(fallbackFile);
  }
  if (files.length === 0) {
    throw new Error("請上傳模板底圖。");
  }

  const teamId = textValue(formData, "team_id");
  const supabase = createSupabaseAdminClient();
  const name = textValue(formData, "name");
  const rows = await Promise.all(
    files.map(async (file, index) => {
      const imageUrl = await uploadFile("template-assets", file, teamId);
      return {
        team_id: teamId,
        name: files.length > 1 ? `${name} ${index + 1}` : name,
        category: textValue(formData, "category", "每月精選物件"),
        size_label: textValue(formData, "size_label", "A4 直式"),
        width: numberValue(formData, "width", 794),
        height: numberValue(formData, "height", 1123),
        status: textValue(formData, "status", "draft"),
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        notes: textValue(formData, "notes") || null
      };
    })
  );

  const { error } = await supabase.from("templates").insert(rows);

  if (error) throw error;
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}

export async function createTeamAction(formData: FormData) {
  assertSupabaseReady();
  const name = textValue(formData, "name");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teams").insert({
    name,
    description: textValue(formData, "description") || null,
    slug: slugValue(textValue(formData, "slug", name)),
    sort_order: numberValue(formData, "sort_order", 100),
    is_active: formData.get("is_active") !== "off"
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin/teams");
}

export async function updateTeamAction(formData: FormData) {
  assertSupabaseReady();
  const teamId = textValue(formData, "team_id");
  const name = textValue(formData, "name");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name,
      description: textValue(formData, "description") || null,
      slug: slugValue(textValue(formData, "slug", name)),
      sort_order: numberValue(formData, "sort_order", 100)
    })
    .eq("id", teamId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin/teams");
}

export async function updateTeamStatusAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("teams")
    .update({ is_active: formData.get("is_active") === "true" })
    .eq("id", textValue(formData, "team_id"));
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin/teams");
}

export async function deleteTeamAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teams").delete().eq("id", textValue(formData, "team_id"));
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin/teams");
}

export async function importTeamsAction(formData: FormData) {
  assertSupabaseReady();
  const teams = z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sort_order: z.number().optional(),
        is_active: z.boolean().optional()
      })
    )
    .parse(JSON.parse(textValue(formData, "teams_json", "[]")));

  if (!teams.length) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teams").upsert(
    teams.map((team, index) => ({
      name: team.name,
      description: team.description || null,
      slug: slugValue(team.name),
      sort_order: team.sort_order ?? index + 1,
      is_active: team.is_active ?? true
    })),
    { onConflict: "slug" }
  );
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin/teams");
}

export async function updateTemplateAction(formData: FormData) {
  assertSupabaseReady();
  const templateId = textValue(formData, "template_id");
  const file = formData.get("image") as File | null;
  const patch: Record<string, unknown> = {
    team_id: textValue(formData, "team_id"),
    name: textValue(formData, "name"),
    category: textValue(formData, "category", "每月精選物件"),
    size_label: textValue(formData, "size_label", "A4 直式"),
    width: numberValue(formData, "width", 794),
    height: numberValue(formData, "height", 1123),
    notes: textValue(formData, "notes") || null
  };

  if (file && file.size > 0) {
    const imageUrl = await uploadFile("template-assets", file, textValue(formData, "team_id"));
    patch.image_url = imageUrl;
    patch.thumbnail_url = imageUrl;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("templates").update(patch).eq("id", templateId);
  if (error) throw error;
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}/blocks`);
  revalidatePath("/templates");
}

export async function updateTemplateStatusAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("templates")
    .update({ status: textValue(formData, "status", "draft") })
    .eq("id", textValue(formData, "template_id"));

  if (error) throw error;
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}

export async function deleteTemplateAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("templates").delete().eq("id", textValue(formData, "template_id"));
  if (error) throw error;
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}

export async function duplicateTemplateAction(formData: FormData) {
  assertSupabaseReady();
  const templateId = textValue(formData, "template_id");
  const supabase = createSupabaseAdminClient();
  const { data: template, error } = await supabase.from("templates").select("*").eq("id", templateId).single();
  if (error) throw error;

  const { data: blocks, error: blockError } = await supabase
    .from("template_blocks")
    .select("*")
    .eq("template_id", templateId);
  if (blockError) throw blockError;

  const { data: copy, error: copyError } = await supabase
    .from("templates")
    .insert({
      team_id: template.team_id,
      name: `${template.name} 副本`,
      category: template.category,
      size_label: template.size_label,
      width: template.width,
      height: template.height,
      status: "draft",
      image_url: template.image_url,
      thumbnail_url: template.thumbnail_url,
      notes: template.notes,
      duplicated_from: template.id
    })
    .select("id")
    .single();
  if (copyError) throw copyError;

  if (blocks?.length) {
    const { error: insertBlocksError } = await supabase.from("template_blocks").insert(
      blocks.map((block) => ({
        template_id: copy.id,
        type: block.type,
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
        z_index: block.z_index,
        metadata: block.metadata
      }))
    );
    if (insertBlocksError) throw insertBlocksError;
  }

  revalidatePath("/admin/templates");
}

export async function saveTemplateBlocksAction(templateId: string, rawBlocks: unknown) {
  assertSupabaseReady();
  const blocks = z.array(blockSchema).parse(rawBlocks);
  const supabase = createSupabaseAdminClient();
  const { error: deleteError } = await supabase.from("template_blocks").delete().eq("template_id", templateId);
  if (deleteError) throw deleteError;

  if (blocks.length > 0) {
    const { error } = await supabase.from("template_blocks").insert(
      blocks.map((block, index) => ({
        template_id: templateId,
        type: block.type,
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
    if (error) throw error;
  }

  revalidatePath(`/admin/templates/${templateId}/blocks`);
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}

export async function createContactAction(formData: FormData) {
  assertSupabaseReady();
  const avatar = formData.get("avatar") as File | null;
  const qrcode = formData.get("qrcode") as File | null;
  const teamId = textValue(formData, "team_id");
  const avatarUrl = avatar && avatar.size > 0 ? await uploadFile("contact-assets", avatar, teamId) : null;
  const qrcodeUrl = qrcode && qrcode.size > 0 ? await uploadFile("contact-assets", qrcode, teamId) : null;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contacts").insert({
    team_id: teamId,
    name: textValue(formData, "name"),
    title: textValue(formData, "title") || null,
    mobile: textValue(formData, "mobile") || null,
    phone: textValue(formData, "phone") || null,
    email: textValue(formData, "email") || null,
    line_id: textValue(formData, "line_id") || null,
    avatar_url: avatarUrl,
    qrcode_url: qrcodeUrl,
    is_active: formData.get("is_active") !== "off",
    notes: textValue(formData, "notes") || null
  });

  if (error) throw error;
  revalidatePath("/admin/contacts");
}

export async function updateContactAction(formData: FormData) {
  assertSupabaseReady();
  const contactId = textValue(formData, "contact_id");
  const teamId = textValue(formData, "team_id");
  const avatar = formData.get("avatar") as File | null;
  const qrcode = formData.get("qrcode") as File | null;
  const patch: Record<string, unknown> = {
    team_id: teamId,
    name: textValue(formData, "name"),
    title: textValue(formData, "title") || null,
    mobile: textValue(formData, "mobile") || null,
    phone: textValue(formData, "phone") || null,
    email: textValue(formData, "email") || null,
    line_id: textValue(formData, "line_id") || null,
    notes: textValue(formData, "notes") || null
  };

  if (avatar && avatar.size > 0) {
    patch.avatar_url = await uploadFile("contact-assets", avatar, teamId);
  }
  if (qrcode && qrcode.size > 0) {
    patch.qrcode_url = await uploadFile("contact-assets", qrcode, teamId);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contacts").update(patch).eq("id", contactId);
  if (error) throw error;
  revalidatePath("/admin/contacts");
}

export async function updateContactStatusAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("contacts")
    .update({ is_active: formData.get("is_active") === "true" })
    .eq("id", textValue(formData, "contact_id"));
  if (error) throw error;
  revalidatePath("/admin/contacts");
}

export async function importContactsAction(formData: FormData) {
  assertSupabaseReady();
  const teamId = textValue(formData, "team_id");
  const contacts = z
    .array(
      z.object({
        name: z.string().min(1),
        title: z.string().optional(),
        mobile: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        line_id: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .parse(JSON.parse(textValue(formData, "contacts_json", "[]")));

  if (contacts.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contacts").insert(
    contacts.map((contact) => ({
      team_id: teamId,
      name: contact.name,
      title: contact.title || null,
      mobile: contact.mobile || null,
      phone: contact.phone || null,
      email: contact.email || null,
      line_id: contact.line_id || null,
      notes: contact.notes || null,
      is_active: true
    }))
  );

  if (error) throw error;
  revalidatePath("/admin/contacts");
}

export async function createPrintOptionAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("print_options").insert({
    type: textValue(formData, "type"),
    label: textValue(formData, "label"),
    value: textValue(formData, "value"),
    vendor: textValue(formData, "vendor") || null,
    sort_order: numberValue(formData, "sort_order", 100),
    is_active: formData.get("is_active") !== "off"
  });
  if (error) throw error;
  revalidatePath("/admin/print-options");
}

export async function updatePrintOptionStatusAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("print_options")
    .update({ is_active: formData.get("is_active") === "true" })
    .eq("id", textValue(formData, "option_id"));
  if (error) throw error;
  revalidatePath("/admin/print-options");
}

export async function updatePrintRequestAction(formData: FormData) {
  assertSupabaseReady();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("print_requests")
    .update({
      status: textValue(formData, "status", "pending"),
      internal_note: textValue(formData, "internal_note") || null
    })
    .eq("id", textValue(formData, "request_id"));
  if (error) throw error;
  revalidatePath("/admin/print-requests");
}
