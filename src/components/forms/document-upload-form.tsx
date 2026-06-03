"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import { documentCategories, documentRelatedTypes } from "@/lib/content-options";
import { formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { getDocumentAcceptAttribute, MAX_DOCUMENT_FILE_SIZE, validateDocumentFile } from "@/lib/storage/documents";
import {
  finalizeDocumentUploadAction,
  prepareDocumentUploadAction,
  rollbackPreparedDocumentUploadAction,
  type PreparedDocumentUpload
} from "@/actions/documents";
import { ErrorNotice, Field, Select, TextInput } from "./form-fields";

type UploadPhase = "idle" | "preparing" | "uploading" | "finalizing" | "rolling_back";

function phaseLabel(phase: UploadPhase) {
  switch (phase) {
    case "preparing":
      return "准备上传中...";
    case "uploading":
      return "上传到 Supabase Storage 中...";
    case "finalizing":
      return "保存文件记录中...";
    case "rolling_back":
      return "清理失败上传中...";
    default:
      return "上传文件";
  }
}

export function DocumentUploadForm({
  projects,
  publications,
  skills,
  error
}: {
  projects: Pick<ProjectRecord, "id" | "title">[];
  publications: Pick<PublicationRecord, "id" | "title">[];
  skills: Pick<SkillRecord, "id" | "name">[];
  error?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(error ?? "");
  const [phase, setPhase] = useState<UploadPhase>("idle");

  const pending = phase !== "idle";

  async function rollback(upload: PreparedDocumentUpload) {
    setPhase("rolling_back");
    await rollbackPreparedDocumentUploadAction(upload);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const rawFormData = new FormData(form);
    const file = rawFormData.get("file");

    if (!(file instanceof File)) {
      setMessage("请选择需要上传的文件。");
      return;
    }

    const clientValidation = validateDocumentFile(file);

    if (!clientValidation.ok) {
      setMessage(clientValidation.message);
      return;
    }

    const relatedKey = String(rawFormData.get("related_key") ?? "");
    const [relatedType, relatedId] = relatedKey ? relatedKey.split(":") : ["", ""];

    const metadata = new FormData();
    metadata.set("name", String(rawFormData.get("name") ?? ""));
    metadata.set("category", String(rawFormData.get("category") ?? ""));
    metadata.set("related_type", relatedType ?? "");
    metadata.set("related_id", relatedId ?? "");
    metadata.set("file_name", file.name);
    metadata.set("file_type", file.type);
    metadata.set("file_size", String(file.size));

    setPhase("preparing");
    const prepared = await prepareDocumentUploadAction(metadata);

    if (!prepared.ok) {
      setPhase("idle");
      setMessage(prepared.message);
      return;
    }

    const upload = prepared.upload;
    const supabase = createClient();

    setPhase("uploading");
    const { error: uploadError } = await supabase.storage.from(upload.storageBucket).upload(upload.storagePath, file, {
      contentType: upload.mimeType,
      upsert: false
    });

    if (uploadError) {
      setPhase("idle");
      setMessage(uploadError.message || "文件上传到 Supabase Storage 失败，请稍后重试。");
      return;
    }

    setPhase("finalizing");
    const finalized = await finalizeDocumentUploadAction(upload);

    if (!finalized.ok) {
      await rollback(upload);
      setPhase("idle");
      setMessage(finalized.message);
      return;
    }

    router.push(`/documents/${finalized.documentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <ErrorNotice message={message} />
      <Field label="选择文件" hint={`支持 PDF、Office、Markdown、文本、图片与 CSV，最大 ${formatFileSize(MAX_DOCUMENT_FILE_SIZE)}。`}>
        <input
          name="file"
          type="file"
          accept={getDocumentAcceptAttribute()}
          required
          disabled={pending}
          className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="文件显示名称" hint="留空时将使用清理后的原文件名。">
          <TextInput name="name" placeholder="例如 私募产品比较报告.pdf" disabled={pending} />
        </Field>
        <Field label="文件分类">
          <Select name="category" defaultValue="research_material" disabled={pending}>
            {documentCategories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="关联对象" hint="可选。关联类型与对象绑定在同一个选项中，避免误选。">
        <Select name="related_key" defaultValue="" disabled={pending}>
          <option value="">不关联对象</option>
          <optgroup label={documentRelatedTypes.find((type) => type.value === "publication")?.label}>
            {publications.map((publication) => (
              <option key={publication.id} value={`publication:${publication.id}`}>{publication.title}</option>
            ))}
          </optgroup>
          <optgroup label={documentRelatedTypes.find((type) => type.value === "project")?.label}>
            {projects.map((project) => (
              <option key={project.id} value={`project:${project.id}`}>{project.title}</option>
            ))}
          </optgroup>
          <optgroup label={documentRelatedTypes.find((type) => type.value === "skill")?.label}>
            {skills.map((skill) => (
              <option key={skill.id} value={`skill:${skill.id}`}>{skill.name}</option>
            ))}
          </optgroup>
        </Select>
      </Field>
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
        文件权限固定为私密。文件会由浏览器直接上传到 Supabase Storage，不经过 Vercel Function；即使关联到公开成果，附件也只允许管理员通过短时链接下载。
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phaseLabel(phase)}
        </button>
        <Link href="/documents" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
