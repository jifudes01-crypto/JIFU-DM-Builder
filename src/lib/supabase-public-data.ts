"use client";

import { createSupabaseBrowserClient, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type { Contact, Department, ExportRecord, SiteSettings, Team, Template, TemplateBlock, TemplateWithBlocks } from "@/types/database";

type TemplateWithBlockCount = Template & { block_count?: number };
const SUPABASE_PAGE_SIZE = 1000;

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

function isMissingOptionalSchema(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;
  const detail = error as { code?: string; message?: string; details?: string };
  const text = `${detail.message ?? ""} ${detail.details ?? ""}`.toLowerCase();
  return ["42p01", "42703", "pgrst200", "pgrst205"].includes(String(detail.code ?? "").toLowerCase()) || text.includes(tableName.toLowerCase());
}

async function fetchAllTemplateSummaries(supabase: Awaited<ReturnType<typeof createSupabaseBrowserClient>>) {
  const rows: Array<Template & { template_blocks?: unknown }> = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("templates")
      .select("*, template_blocks(count)")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as Array<Template & { template_blocks?: unknown }>;
    rows.push(...page);
    if (page.length < SUPABASE_PAGE_SIZE) break;
  }

  return rows;
}

async function fetchAllPublishedTemplates(supabase: Awaited<ReturnType<typeof createSupabaseBrowserClient>>) {
  const rows: Array<Template & { template_blocks?: TemplateBlock[] }> = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("templates")
      .select("*, template_blocks(*)")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as Array<Template & { template_blocks?: TemplateBlock[] }>;
    rows.push(...page);
    if (page.length < SUPABASE_PAGE_SIZE) break;
  }

  return rows;
}

export async function loadPublicWorkspaceData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();

  const [teams, departments, templates, contacts, settings, templateCount, exportCount, downloads] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    fetchAllTemplateSummaries(supabase),
    supabase.from("contacts").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    supabase.from("templates").select("id", { count: "exact", head: true }),
    supabase.from("exports").select("id", { count: "exact", head: true }),
    supabase.from("exports").select("*, teams(name), templates(name), contacts(name, mobile)").order("created_at", { ascending: false })
  ]);

  const errors = [teams.error, contacts.error, templateCount.error, exportCount.error, downloads.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  if (departments.error && !isMissingDepartmentSchema(departments.error)) throw departments.error;
  if (settings.error && !isMissingOptionalSchema(settings.error, "site_settings")) throw settings.error;

  return {
    teams: (teams.data ?? []) as Team[],
    departments: departments.error ? [] : ((departments.data ?? []) as Department[]),
    templates: templates.map((item) => {
      const row = item as Template & { template_blocks?: unknown };
      const { template_blocks: templateBlocks, ...template } = row;
      return { ...template, block_count: blockCountFromRelation(templateBlocks) };
    }) as TemplateWithBlockCount[],
    contacts: (contacts.data ?? []) as Contact[],
    settings: settings.error ? null : ((settings.data as SiteSettings | null) ?? null),
    stats: {
      totalTemplates: templateCount.count ?? 0,
      downloadRecords: exportCount.count ?? 0
    },
    downloads: (downloads.data ?? []) as ExportRecord[]
  };
}

export async function loadEditorData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();

  const [teams, departments, templates, contacts] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    fetchAllPublishedTemplates(supabase),
    supabase.from("contacts").select("*").eq("is_active", true).order("name", { ascending: true })
  ]);

  const errors = [teams.error, contacts.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  if (departments.error && !isMissingDepartmentSchema(departments.error)) throw departments.error;

  return {
    teams: (teams.data ?? []) as Team[],
    departments: departments.error ? [] : ((departments.data ?? []) as Department[]),
    templates: templates.map((template) => {
      const { template_blocks: templateBlocks, ...rest } = template;
      return {
        ...rest,
        blocks: (templateBlocks ?? []).sort((a, b) => a.z_index - b.z_index)
      };
    }) as TemplateWithBlocks[],
    contacts: (contacts.data ?? []) as Contact[]
  };
}
