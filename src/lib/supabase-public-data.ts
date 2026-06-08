"use client";

import { createSupabaseBrowserClient, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type { Contact, Department, Team, Template, TemplateBlock, TemplateWithBlocks } from "@/types/database";

type TemplateWithBlockCount = Template & { block_count?: number };

function blockCountFromRelation(value: unknown) {
  if (!Array.isArray(value)) return 0;
  const first = value[0] as { count?: number } | undefined;
  return Number(first?.count ?? 0);
}

function isMissingDepartmentSchema(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const detail = error as { code?: string; message?: string; details?: string };
  const text = `${detail.message ?? ""} ${detail.details ?? ""}`.toLowerCase();
  return ["42p01", "42703", "pgrst200", "pgrst205"].includes(String(detail.code ?? "").toLowerCase()) || text.includes("departments") || text.includes("department_id");
}

export async function loadPublicWorkspaceData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();

  const [teams, departments, templates, contacts] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("templates").select("*, template_blocks(count)").eq("status", "published").order("updated_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("is_active", true).order("name", { ascending: true })
  ]);

  const errors = [teams.error, templates.error, contacts.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  if (departments.error && !isMissingDepartmentSchema(departments.error)) throw departments.error;

  return {
    teams: (teams.data ?? []) as Team[],
    departments: departments.error ? [] : ((departments.data ?? []) as Department[]),
    templates: (templates.data ?? []).map((item) => {
      const row = item as Template & { template_blocks?: unknown };
      const { template_blocks: templateBlocks, ...template } = row;
      return { ...template, block_count: blockCountFromRelation(templateBlocks) };
    }) as TemplateWithBlockCount[],
    contacts: (contacts.data ?? []) as Contact[]
  };
}

export async function loadEditorData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();

  const [teams, departments, templates, contacts] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("templates").select("*, template_blocks(*)").eq("status", "published").order("updated_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("is_active", true).order("name", { ascending: true })
  ]);

  const errors = [teams.error, templates.error, contacts.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  if (departments.error && !isMissingDepartmentSchema(departments.error)) throw departments.error;

  return {
    teams: (teams.data ?? []) as Team[],
    departments: departments.error ? [] : ((departments.data ?? []) as Department[]),
    templates: ((templates.data ?? []) as Array<Template & { template_blocks?: TemplateBlock[] }>).map((template) => {
      const { template_blocks: templateBlocks, ...rest } = template;
      return {
        ...rest,
        blocks: (templateBlocks ?? []).sort((a, b) => a.z_index - b.z_index)
      };
    }) as TemplateWithBlocks[],
    contacts: (contacts.data ?? []) as Contact[]
  };
}
