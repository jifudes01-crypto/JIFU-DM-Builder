"use client";

import { useState, type FormHTMLAttributes, type ReactNode } from "react";

interface StaticFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> {
  children: ReactNode;
  message?: string;
}

export function StaticForm({
  children,
  message = "GitHub Pages 是靜態展示環境，這裡不會寫入資料。請在連接 Supabase 的部署環境使用儲存功能。",
  className,
  ...props
}: StaticFormProps) {
  const [notice, setNotice] = useState("");

  return (
    <form
      {...props}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        setNotice(message);
      }}
    >
      {children}
      {notice ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-bold text-navy-900">{notice}</p> : null}
    </form>
  );
}
