import { createProjectAction } from "@/actions/projects";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Projects" title="新建研究项目" description="创建真实项目记录，保存后会写入 Supabase projects 表。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="项目录入建议"
                description="先补齐标题、简介、状态和进度，再逐步完善研究背景、问题与方法。"
                items={["slug 建议使用英文小写与连字符。", "public + featured 会影响公开首页展示。", "可选字段留空不会阻塞保存。"]}
              />
              <AdminFormHelpCard
                title="安全边界"
                tone="slate"
                items={["不要录入客户真实信息或内部敏感数据。", "private 内容仅管理员后台可见。", "适合展示的内容再设为 public。"]}
              />
            </>
          }
        >
          <ProjectForm action={createProjectAction} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
