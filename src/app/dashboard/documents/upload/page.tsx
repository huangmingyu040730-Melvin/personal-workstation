import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { DocumentUploadForm, type DocumentUploadInitialValues } from "@/components/forms/document-upload-form";
import { PageHeader } from "@/components/page-header";
import type { DocumentCategory, DocumentCollectionType, DocumentRelatedType } from "@/lib/content-types";
import { documentCategories, documentCollectionTypes, documentRelatedTypes } from "@/lib/content-options";
import { getFormError } from "@/lib/forms";
import { getKnowledgeNoteOptions } from "@/lib/queries/knowledge";
import { getPublicationOptions } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";
import { getSkills } from "@/lib/queries/skills";

type UploadSearchParams = Record<string, string | string[] | undefined>;

export default async function UploadDocumentPage({ searchParams }: { searchParams: Promise<UploadSearchParams> }) {
  const [params, projects, publications, knowledgeNotes, skills] = await Promise.all([
    searchParams,
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkills()
  ]);
  const initialValues = getDocumentUploadInitialValues(params, {
    projects,
    publications,
    knowledgeNotes,
    skills: skills.map((skill) => ({ id: skill.id, name: skill.name }))
  });

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Documents" title="上传文件" description="上传到私密 workspace-files bucket，可创建单文件记录或统一文档包。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="上传流程"
                description="文件会由浏览器直接上传到 Supabase private bucket，避免经过 Vercel Function。"
                items={["单文件最大 50 MB。", "批次最多 100 个文件，总量 200 MB。", "支持研究资料、代码、Notebook、图片和压缩包等常见格式。", "上传成功后才会创建 documents 记录。"]}
              />
              <AdminFormHelpCard
                title="文件夹行为"
                description="文件夹上传会保存每个文件的相对路径；普通浏览器文件选择器不会稳定上传空文件夹。"
                items={["需要完整目录结构时，请上传 zip 包。", "Skill 包只作为私密文件存储，不执行、不解析、不安装。"]}
              />
              <AdminFormHelpCard
                title="私密文件边界"
                tone="slate"
                items={["文件权限固定为 private。", "公开页面不会展示下载入口。", "下载链接短时有效，不保存到数据库。", "关联公开内容也不会开放附件。"]}
              />
            </>
          }
        >
          <DocumentUploadForm
            projects={projects}
            publications={publications}
            knowledgeNotes={knowledgeNotes}
            skills={skills.map((skill) => ({ id: skill.id, name: skill.name }))}
            initialValues={initialValues}
            error={getFormError(params)}
          />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}

function getFirstParam(params: UploadSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getDocumentUploadInitialValues(
  params: UploadSearchParams,
  options: {
    projects: Array<{ id: string; title: string }>;
    publications: Array<{ id: string; title: string }>;
    knowledgeNotes: Array<{ id: string; title: string }>;
    skills: Array<{ id: string; name: string }>;
  }
): DocumentUploadInitialValues {
  const rawMode = getFirstParam(params, "mode");
  const rawCategory = getFirstParam(params, "category");
  const rawCollectionType = getFirstParam(params, "collection_type");
  const rawRelatedType = getFirstParam(params, "related_type");
  const rawRelatedId = getFirstParam(params, "related_id");
  const category = documentCategories.some((item) => item.value === rawCategory)
    ? (rawCategory as DocumentCategory)
    : "research_material";
  const collectionType = documentCollectionTypes.some((item) => item.value === rawCollectionType)
    ? (rawCollectionType as DocumentCollectionType)
    : "folder_upload";
  const relatedType = documentRelatedTypes.some((item) => item.value === rawRelatedType)
    ? (rawRelatedType as DocumentRelatedType)
    : null;
  let relatedKey = "";
  let prefillWarning: string | undefined;

  if (relatedType && rawRelatedId) {
    const exists =
      relatedType === "publication"
        ? options.publications.some((item) => item.id === rawRelatedId)
        : relatedType === "project"
          ? options.projects.some((item) => item.id === rawRelatedId)
          : relatedType === "knowledge"
            ? options.knowledgeNotes.some((item) => item.id === rawRelatedId)
            : options.skills.some((item) => item.id === rawRelatedId);

    if (exists) {
      relatedKey = `${relatedType}:${rawRelatedId}`;
    } else {
      prefillWarning = "关联对象预填失败：query params 中的 related_type / related_id 不存在或当前账号无权读取，已保留为不关联对象。";
    }
  } else if (rawRelatedType || rawRelatedId) {
    prefillWarning = "关联对象预填失败：related_type 和 related_id 需要同时存在且有效，已保留为不关联对象。";
  }

  return {
    mode: rawMode === "batch" ? "batch" : "single",
    category,
    collectionType,
    relatedKey,
    prefillWarning
  };
}
