import Link from "next/link";
import { TemplateBlockEditor } from "@/components/admin/TemplateBlockEditor";
import { getTemplateWithBlocks } from "@/lib/data";

interface BlocksPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlocksPage({ params }: BlocksPageProps) {
  const { id } = await params;
  const template = await getTemplateWithBlocks(id);

  if (!template) {
    return (
      <section className="card p-6">
        <h1 className="section-title">找不到模板</h1>
        <Link href="/admin/templates" className="btn btn-primary mt-4">
          回模板列表
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-tight">
        <p className="eyebrow">Editable Blocks</p>
        <h1 className="section-title">{template.name}</h1>
        <p className="section-subtitle">後台人工框選可編輯區域；前台只能填資料，不能拖曳或修改版面。</p>
      </div>
      <TemplateBlockEditor template={template} />
    </section>
  );
}
