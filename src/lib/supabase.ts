import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function getPublicUrl(bucket: string, path: string) {
  const { url } = getSupabaseConfig();
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
