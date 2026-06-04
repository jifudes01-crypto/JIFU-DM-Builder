"use client";

import { createClient } from "@supabase/supabase-js";

export function isBrowserSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase 尚未設定，請先在 GitHub Secrets 設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true
    }
  });
}

export function getSiteUrl() {
  if (typeof window === "undefined") return "https://jifudes01-crypto.github.io/JIFU-DM-Builder";
  const path = window.location.pathname.startsWith("/JIFU-DM-Builder") ? "/JIFU-DM-Builder" : "";
  return `${window.location.origin}${path}`;
}
