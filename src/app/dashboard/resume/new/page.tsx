import { createResumeItemAction } from "@/actions/resume";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ResumeItemForm } from "@/components/forms/resume-item-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getResumeRelationOptions } from "@/lib/queries/resume";

export default async function NewResumeItemPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, options] = await Promise.all([searchParams, getResumeRelationOptions()]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Resume Library" title="新建简历素材" description="创建结构化履历素材，保存后会写入 Supabase resume_items 表。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="素材边界"
                description="这里维护的是履历数据库，不是单份静态简历。"
                items={["素材默认 private。", "不要填写身份证号、家庭住址、私人手机号或密钥。", "本阶段不会自动导出 PDF 或 Word。"]}
              />
              <AdminFormHelpCard
                title="Bullet 建议"
                tone="emerald"
                items={["尽量写清行动、方法和结果。", "可量化时优先量化，但不要编造数据。", "后续简历生成器会按岗位选择和组合这些素材。"]}
              />
            </>
          }
        >
          <ResumeItemForm action={createResumeItemAction} options={options} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
