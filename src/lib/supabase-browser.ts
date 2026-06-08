"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface RuntimeSupabaseConfig {
  url: string;
  anonKey: string;
}

let configPromise: Promise<RuntimeSupabaseConfig | null> | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

function getBasePath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.startsWith("/JIFU-DM-Builder") ? "/JIFU-DM-Builder" : "";
}

async function loadRuntimeConfig() {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(`${getBasePath()}/supabase-config.json`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<RuntimeSupabaseConfig>;
    if (data.url && data.anonKey) return { url: data.url.trim(), anonKey: data.anonKey.trim() };
  } catch {
    return null;
  }
  return null;
}

async function getBrowserSupabaseConfig() {
  if (!configPromise) {
    configPromise = loadRuntimeConfig().then((runtimeConfig) => {
      if (runtimeConfig) return runtimeConfig;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
      return url && anonKey ? { url, anonKey } : null;
    });
  }
  return configPromise;
}

export async function isBrowserSupabaseConfigured() {
  return Boolean(await getBrowserSupabaseConfig());
}

export async function createSupabaseBrowserClient() {
  if (clientPromise) return clientPromise;

  clientPromise = getBrowserSupabaseConfig().then((config) => {
    if (!config) {
      throw new Error("Supabase 尚未完成部署設定，請檢查 GitHub Secrets 是否已設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
    }

    return createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
        storageKey: "jifu-dm-disabled-auth-session"
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
            headers: {
              ...Object.fromEntries(new Headers(init?.headers).entries()),
              "Cache-Control": "no-cache"
            }
          })
      }
    });
  });

  return clientPromise;
}
