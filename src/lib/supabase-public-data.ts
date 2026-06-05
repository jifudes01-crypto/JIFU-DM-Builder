"use client";

import { createSupabaseBrowserClient, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";
import type { Contact, Team, Template, TemplateBlock, TemplateWithBlocks } from "@/types/database";

export async function loadPublicWorkspaceData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();
  const [teams, templates, contacts] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("templates").select("*, template_blocks(count)").order("updated_at", { ascending: false }),
    supabase.from("contacts").select("*").order("name")
  ]);
  const errors = [teams.error, templates.error, contacts.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  return {
    teams: (teams.data ?? []) as Team[],
    templates: (templates.data ?? []).map((item) => ({ ...(item as Template), block_count: item.template_blocks?.[0]?.count ?? 0 })),
    contacts: (contacts.data ?? []) as Contact[]
  };
}

export async function loadEditorData() {
  if (!(await isBrowserSupabaseConfigured())) return null;
  const supabase = await createSupabaseBrowserClient();
  const [teams, templates, contacts] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("templates").select("*, template_blocks(*)").eq("status", "published").order("updated_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("is_active", true).order("name")
  ]);
  const errors = [teams.error, templates.error, contacts.error].filter(Boolean);
  if (errors[0]) throw errors[0];
  return {
    teams: (teams.data ?? []) as Team[],
    templates: ((templates.data ?? []) as Array<Template & { template_blocks?: TemplateBlock[] }>).map((template) => ({
      ...template,
      blocks: (template.template_blocks ?? []).sort((a, b) => a.z_index - b.z_index)
    })) as TemplateWithBlocks[],
    contacts: (contacts.data ?? []) as Contact[]
  };
}
