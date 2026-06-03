"use client";

import { useState, type FormHTMLAttributes, type ReactNode } from "react";

interface StaticFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> {
  children: ReactNode;
  message?: string;
}

export function StaticForm({
  children,
  message = "GitHub Pages 是公開靜態網站，這裡不會直接寫入資料。若要正式同步資料，請連接 Supabase 前端權限或改用支援後端的部署環境。",
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
