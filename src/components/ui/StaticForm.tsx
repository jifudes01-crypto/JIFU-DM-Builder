"use client";

import { useState, type FormHTMLAttributes, type ReactNode } from "react";
import { runAdminOperation } from "@/lib/supabase-admin-ops";

interface StaticFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> {
  children: ReactNode;
  message?: string;
  operation?: string;
}

export function StaticForm({
  children,
  message = "這個表單尚未指定同步動作，請重新整理後再試一次。",
  operation,
  className,
  ...props
}: StaticFormProps) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      {...props}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        if (!operation) {
          setNotice(message);
          return;
        }
        setBusy(true);
        runAdminOperation(operation, new FormData(event.currentTarget))
          .then((result) => {
            setNotice(result);
            event.currentTarget.reset();
          })
          .catch((error) => setNotice(error instanceof Error ? error.message : "同步失敗，請稍後再試。"))
          .finally(() => setBusy(false));
      }}
    >
      {children}
      {busy ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-bold text-navy-900">正在同步到 Supabase...</p> : null}
      {notice ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-bold text-navy-900">{notice}</p> : null}
    </form>
  );
}
