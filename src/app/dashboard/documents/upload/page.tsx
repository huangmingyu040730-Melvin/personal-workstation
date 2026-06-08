import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { DocumentUploadForm } from "@/components/forms/document-upload-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getPublicationOptions } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";
import { getSkills } from "@/lib/queries/skills";

export default async function UploadDocumentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, projects, publications, skills] = await Promise.all([
    searchParams,
    getProjectOptions(),
    getPublicationOptions(),
    getSkills()
  ]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Documents" title="上传文件" description="上传到私密 workspace-files bucket，并创建真实 documents 记录。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="上传流程"
                description="文件会由浏览器直接上传到 Supabase private bucket，避免经过 Vercel Function。"
                items={["最大 20 MB。", "仅允许 PDF、Office、文本、Markdown、CSV 和常见图片。", "上传成功后才会创建 documents 记录。"]}
              />
              <AdminFormHelpCard
                title="私密文件边界"
                tone="slate"
                items={["文件权限固定为 private。", "公开页面不会展示下载入口。", "下载链接短时有效，不保存到数据库。"]}
              />
            </>
          }
        >
          <DocumentUploadForm
            projects={projects}
            publications={publications}
            skills={skills.map((skill) => ({ id: skill.id, name: skill.name }))}
            error={getFormError(params)}
          />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
