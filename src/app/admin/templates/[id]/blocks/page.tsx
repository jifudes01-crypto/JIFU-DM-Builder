import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  // GitHub Pages is a static export. Do not generate demo/template placeholder
  // routes such as demo-template-a4, because Supabase template IDs are UUIDs.
  // The active block editor now lives at /admin/templates/blocks?id=<template_uuid>.
  return [];
}

export default function DeprecatedTemplateBlocksPage() {
  return (
    <section className="card p-6">
      <h1 className="section-title">區塊設定路徑已更新</h1>
      <p className="section-subtitle">
        為了相容 GitHub Pages 靜態部署，請從模板列表進入區塊設定。
      </p>
      <Link href="/admin/templates" className="btn btn-primary mt-4">
        回模板列表
      </Link>
    </section>
  );
}
