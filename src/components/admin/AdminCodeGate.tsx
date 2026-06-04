"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const STORAGE_KEY = "jifu-admin-code-ok";
const DEFAULT_ACCESS_CODE = "JIFU7513";

interface AdminCodeGateProps {
  children: ReactNode;
}

export function AdminCodeGate({ children }: AdminCodeGateProps) {
  const accessCode = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE?.trim() || DEFAULT_ACCESS_CODE;
  const [code, setCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accessCode) return;
    setIsUnlocked(window.localStorage.getItem(STORAGE_KEY) === accessCode);
  }, [accessCode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!accessCode) {
      setMessage("尚未設定管理代碼，請先到 GitHub Secrets 新增 NEXT_PUBLIC_ADMIN_ACCESS_CODE。");
      return;
    }

    if (code.trim() !== accessCode) {
      setMessage("管理代碼不正確，請重新輸入。");
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, accessCode);
    setIsUnlocked(true);
    setCode("");
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    setCode("");
    setMessage("");
  }

  if (!accessCode) {
    return (
      <section className="card p-6">
        <p className="eyebrow">管理後台</p>
        <h1 className="section-title">尚未設定管理代碼</h1>
        <p className="section-subtitle">
          請先到 GitHub Actions Secrets 新增 NEXT_PUBLIC_ADMIN_ACCESS_CODE，重新部署後才能進入後台。
        </p>
      </section>
    );
  }

  if (!isUnlocked) {
    return (
      <section className="card p-6">
        <p className="eyebrow">管理後台</p>
        <h1 className="section-title">請輸入管理代碼</h1>
        <p className="section-subtitle">代碼正確後，這台裝置會記住狀態，下次可直接進入。</p>
        <p className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-base font-bold text-slate-600">
          目前版本：代碼登入
        </p>
        <form className="mt-5 max-w-xl space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="form-label">管理代碼</span>
            <input
              type="password"
              className="input mt-2 text-lg"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="current-password"
              placeholder="請輸入管理代碼"
            />
          </label>
          <button type="submit" className="btn btn-blue">
            進入後台
          </button>
        </form>
        {message ? <p className="mt-4 rounded-lg bg-blue-50 p-3 font-bold text-navy-900">{message}</p> : null}
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-base leading-7 text-amber-900">
          簡易代碼方便操作，但不是高安全性的登入方式；適合內部低風險使用。
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-white p-4 shadow-tight">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-navy-900">已通過管理代碼</p>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            登出
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
