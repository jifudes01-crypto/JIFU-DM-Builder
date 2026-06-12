"use client";

import { createSupabaseBrowserClient, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type {
  Contact,
  Department,
  ExportRecord,
  SiteSettings,
  Team,
  Template,
  TemplateBlock,
  TemplateWithBlocks
} from "@/types/database";

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

  return (
    ["42p01", "42703", "pgrst200", "pgrst205"].includes(String(detail.code ?? "").toLowerCase()) ||
    text.includes("departments") ||
    text.includes("department_id")
  );
}

function isMissingOptionalSchema(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;
  const detail = error as { code?: string; message?: string; details?: string };
  const text = `${detail.message ?? ""} ${detail.details ?? ""}`.toLowerCase();

  return (
    ["42p01", "42703", "pgrst200", "pgrst205"].includes(String(detail.code ?? "").toLowerCase()) ||
    text.includes(tableName.toLowerCase())
  );
}

export async function loadPublicWorkspaceData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();

  const [teams, departments, templates, contacts, settings] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("templates").select("*, template_blocks(count)").eq("status", "published").order("updated_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("site_settings").select("*").eq("id", "main").maybeSingle()
  ]);

  const errors = [teams.error, templates.error, contacts.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  if (departments.error && !isMissingDepartmentSchema(departments.error)) throw departments.error;
  if (settings.error && !isMissingOptionalSchema(settings.error, "site_settings")) throw settings.error;

  const templateRows = templates.data ?? [];

  let downloadRecords = 0;
  let downloads: ExportRecord[] = [];

  const exportCountResult = await supabase.from("exports").select("id", { count: "exact", head: true });
  if (!exportCountResult.error) {
    downloadRecords = exportCountResult.count ?? 0;
  } else if (!isMissingOptionalSchema(exportCountResult.error, "exports")) {
    throw exportCountResult.error;
  }

  const downloadsResult = await supabase
    .from("exports")
    .select("*, teams(name), templates(name), contacts(name, mobile)")
    .order("created_at", { ascending: false });

  if (!downloadsResult.error) {
    downloads = (downloadsResult.data ?? []) as ExportRecord[];
  } else if (!isMissingOptionalSchema(downloadsResult.error, "exports")) {
    throw downloadsResult.error;
  }

  return {
    teams: (teams.data ?? []) as Team[],
    departments: departments.error ? [] : ((departments.data ?? []) as Department[]),
    templates: templateRows.map((item) => {
      const row = item as Template & { template_blocks?: unknown };
      const { template_blocks: templateBlocks, ...template } = row;
      return { ...template, block_count: blockCountFromRelation(templateBlocks) };
    }) as TemplateWithBlockCount[],
    contacts: (contacts.data ?? []) as Contact[],
    settings: settings.error ? null : ((settings.data as SiteSettings | null) ?? null),
    stats: {
      totalTemplates: templateRows.length,
      downloadRecords
    },
    downloads
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
