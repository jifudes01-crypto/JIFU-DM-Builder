"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient, getSiteUrl, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";

interface AdminAuthGateProps {
  children: ReactNode;
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) {
      setMessage("尚未設定 Supabase public 環境變數，後台同步功能無法啟用。");
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data: admin, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", nextUser.id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) setMessage(error.message);
      setIsAdmin(Boolean(admin));
      setLoading(false);
    }

    void loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      void loadSession();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getSiteUrl()}/admin/`
      }
    });
    if (error) setMessage(error.message);
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  if (loading) {
    return (
      <section className="card p-6">
        <h1 className="section-title">正在確認管理員身分</h1>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="card p-6">
        <p className="eyebrow">管理後台</p>
        <h1 className="section-title">請先登入管理員 Google 帳號</h1>
        <p className="section-subtitle">登入後，只有已加入 admin_users 的帳號可以管理資料。</p>
        <button type="button" className="btn btn-blue mt-5" onClick={() => void signInWithGoogle()}>
          使用 Google 登入
        </button>
        {message ? <p className="mt-4 rounded-lg bg-blue-50 p-3 font-bold text-navy-900">{message}</p> : null}
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="card p-6">
        <p className="eyebrow">管理後台</p>
        <h1 className="section-title">這個 Google 帳號尚未開通管理權限</h1>
        <p className="section-subtitle">請到 Supabase 的 admin_users 表加入這個帳號。</p>
        <div className="mt-4 rounded-lg border border-line bg-slate-50 p-4">
          <p className="font-bold text-navy-900">Email：{user.email}</p>
          <p className="mt-2 text-sm text-slate-600">User ID：{user.id}</p>
        </div>
        <button type="button" className="btn btn-secondary mt-5" onClick={() => void signOut()}>
          登出
        </button>
        {message ? <p className="mt-4 rounded-lg bg-blue-50 p-3 font-bold text-navy-900">{message}</p> : null}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-white p-4 shadow-tight">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-navy-900">已登入：{user.email}</p>
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
            登出
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
