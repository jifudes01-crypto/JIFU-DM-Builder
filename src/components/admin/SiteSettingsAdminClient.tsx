"use client";

import { useCallback, useEffect, useState } from "react";
import { StaticForm } from "@/components/ui/StaticForm";
import { getSiteSettingsForAdmin } from "@/lib/supabase-admin-ops";
import type { SiteSettings } from "@/types/database";

export function SiteSettingsAdminClient({ initialSettings }: { initialSettings: SiteSettings | null }) {
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings);
  const [message, setMessage] = useState("");

  const refreshSettings = useCallback(async () => {
    try {
      setSettings(await getSiteSettingsForAdmin());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取首頁設定失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  return (
    <section className="card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5">
          <p className="eyebrow">首頁 Banner</p>
          <h2 className="mt-2 text-2xl font-black text-navy-900">共用模板系統首頁設定</h2>
          <p className="section-subtitle">上傳後，前台重新整理會立即讀取 Supabase 最新 Banner。</p>

          {message ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">{message}</p> : null}

          <StaticForm operation="update-site-settings" onSuccess={refreshSettings} resetOnSuccess={false} encType="multipart/form-data" className="mt-5 space-y-4">
            <input type="hidden" name="current_banner_url" value={settings?.banner_image_url ?? ""} />
            <label>
              <span className="field-label">Banner 圖片</span>
              <input name="banner" type="file" accept="image/*" />
              <span className="field-help">建議使用寬版圖片。若未選新圖，會保留目前 Banner。</span>
            </label>
            <button type="submit" className="btn btn-blue">
              儲存 Banner
            </button>
          </StaticForm>
        </div>

        <div className="border-t border-line bg-navy-50 p-5 lg:border-l lg:border-t-0">
          {settings?.banner_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.banner_image_url} alt="目前首頁 Banner" className="h-full min-h-56 w-full rounded-xl border border-line bg-white object-cover" />
          ) : (
            <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-gold-300 bg-white p-6 text-center">
              <div>
                <p className="text-lg font-black text-navy-900">尚未上傳 Banner</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">前台會顯示乾淨的空狀態，不會套用任何預設圖片。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
