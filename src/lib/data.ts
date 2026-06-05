import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  demoContacts,
  demoTeams,
  demoTemplates
} from "@/lib/demo-data";
import type {
  Contact,
  Team,
  Template,
  TemplateBlock,
  TemplateWithBlocks
} from "@/types/database";

function requireSingle<T>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

export const listTeams = cache(async (): Promise<Team[]> => {
  if (!isSupabaseConfigured()) return demoTeams;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return data ?? [];
});

export const listAdminTeams = cache(async (): Promise<Team[]> => {
  if (!isSupabaseConfigured()) return demoTeams;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("teams").select("*").order("sort_order").order("name");

  if (error) throw error;
  return data ?? [];
});

export const getTeam = cache(async (teamId: string): Promise<Team | null> => {
  const teams = await listTeams();
  return teams.find((team) => team.id === teamId) ?? null;
});

export const listAdminTemplates = cache(async (): Promise<Array<Template & { block_count?: number }>> => {
  if (!isSupabaseConfigured()) {
    return demoTemplates.map((template) => ({ ...template, block_count: template.blocks.length }));
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*, template_blocks(count)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((item) => ({
    ...(item as Template),
    block_count: item.template_blocks?.[0]?.count ?? 0
  }));
});

export const listPublishedTemplates = cache(async (teamId: string): Promise<TemplateWithBlocks[]> => {
  if (!isSupabaseConfigured()) {
    return demoTemplates.filter(
      (template) => template.team_id === teamId && template.status === "published" && template.blocks.length > 0
    );
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*, template_blocks(*)")
    .eq("team_id", teamId)
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((template) => ({
      ...(template as Template),
      blocks: ((template.template_blocks ?? []) as TemplateBlock[]).sort((a, b) => a.z_index - b.z_index)
    }))
    .filter((template) => template.blocks.length > 0);
});

export const getTemplateWithBlocks = cache(async (templateId: string): Promise<TemplateWithBlocks | null> => {
  if (!isSupabaseConfigured()) {
    return demoTemplates.find((template) => template.id === templateId) ?? null;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*, template_blocks(*)")
    .eq("id", templateId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...(data as Template),
    blocks: ((data.template_blocks ?? []) as TemplateBlock[]).sort((a, b) => a.z_index - b.z_index)
  };
});

export const listContacts = cache(async (teamId?: string, activeOnly = true): Promise<Contact[]> => {
  if (!isSupabaseConfigured()) {
    return demoContacts.filter(
      (contact) => (!teamId || contact.team_id === teamId) && (!activeOnly || contact.is_active)
    );
  }
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("contacts").select("*").order("name");
  if (teamId) query = query.eq("team_id", teamId);
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
});

export async function requireTemplateWithBlocks(templateId: string) {
  return requireSingle(await getTemplateWithBlocks(templateId), "找不到模板。");
}
