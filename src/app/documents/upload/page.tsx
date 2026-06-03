import { uploadDocumentAction } from "@/actions/documents";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
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
      <PageHeader eyebrow="Documents" title="上传文件" description="上传到私密 workspace-files bucket，并创建真实 documents 记录。" />
      <Card>
        <DocumentUploadForm
          action={uploadDocumentAction}
          projects={projects}
          publications={publications}
          skills={skills.map((skill) => ({ id: skill.id, name: skill.name }))}
          error={getFormError(params)}
        />
      </Card>
    </AppShell>
  );
}
