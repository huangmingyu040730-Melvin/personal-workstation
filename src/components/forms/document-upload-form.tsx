"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminFormSection, AdminSecurityNote } from "@/components/admin-ui";
import type { DocumentCategory, DocumentCollectionType, KnowledgeNoteRecord, ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import type { DocumentAssetLinkInput } from "@/lib/queries/document-asset-links";
import { documentAssetRelationTypes, documentCategories, documentCollectionTypes } from "@/lib/content-options";
import { formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  getDocumentAcceptAttribute,
  hasBlockedDocumentPath,
  MAX_DOCUMENT_BATCH_FILE_COUNT,
  MAX_DOCUMENT_BATCH_TOTAL_SIZE,
  MAX_DOCUMENT_FILE_SIZE,
  validateDocumentBatch,
  validateDocumentFile
} from "@/lib/storage/documents";
import {
  finalizeDocumentUploadAction,
  prepareDocumentCollectionUploadAction,
  prepareDocumentUploadAction,
  rollbackPreparedDocumentUploadAction,
  type PreparedDocumentUpload
} from "@/actions/documents";
import { DocumentAssetLinkPicker } from "./document-asset-link-picker";
import { ErrorNotice, Field, Select, TextInput, Textarea } from "./form-fields";

type UploadPhase = "idle" | "preparing" | "uploading" | "finalizing" | "rolling_back";
type UploadMode = "single" | "batch";

type UploadProgress = {
  total: number;
  current: number;
  currentFile: string;
  successCount: number;
  failureCount: number;
};

type UploadFailure = {
  name: string;
  reason: string;
};

type StorageUploadErrorLike = {
  message?: unknown;
  name?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

const STORAGE_UPLOAD_FALLBACK_MESSAGE = "请确认 0018 migration 已执行、workspace-files bucket file_size_limit 为 52428800，且当前账号是管理员。";

export type DocumentUploadInitialValues = {
  mode?: UploadMode;
  category?: DocumentCategory;
  collectionType?: DocumentCollectionType;
  relatedKey?: string;
  collectionId?: string;
  collectionTitle?: string;
  returnTo?: string;
  prefillWarning?: string;
};

function phaseLabel(phase: UploadPhase, mode: UploadMode) {
  switch (phase) {
    case "preparing":
      return mode === "batch" ? "准备文档包中..." : "准备上传中...";
    case "uploading":
      return "上传到 Supabase Storage 中...";
    case "finalizing":
      return "保存文件记录中...";
    case "rolling_back":
      return "清理失败上传中...";
    default:
      return mode === "batch" ? "上传文档包" : "上传文件";
  }
}

function getAssetLinkValues(formData: FormData) {
  return formData
    .getAll("asset_links")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getPrimaryRelatedParts(assetLinks: string[]) {
  const [relatedType, relatedId] = assetLinks[0] ? assetLinks[0].split(":") : ["", ""];
  return { relatedType: relatedType ?? "", relatedId: relatedId ?? "" };
}

function appendAssetLinks(metadata: FormData, assetLinks: string[]) {
  for (const value of assetLinks) {
    metadata.append("asset_links", value);
  }
}

function appendPreparedAssetLinks(metadata: FormData, assetLinks: DocumentAssetLinkInput[]) {
  for (const link of assetLinks) {
    metadata.append("asset_links", `${link.asset_type}:${link.asset_id}`);
  }
}

function getFileRelativePath(file: File) {
  const webkitRelativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return webkitRelativePath || file.name;
}

function getRootFolderName(files: File[]) {
  const firstFolderPath = files.map(getFileRelativePath).find((path) => path.includes("/"));

  if (!firstFolderPath) {
    return "";
  }

  return firstFolderPath.split("/").filter(Boolean)[0] ?? "";
}

function getFilesFromFormData(formData: FormData) {
  const files = [...formData.getAll("files"), ...formData.getAll("folder_files")].filter((item): item is File => item instanceof File && item.size > 0);
  const seen = new Set<string>();

  return files.filter((file) => {
    const key = `${getFileRelativePath(file)}:${file.size}:${file.lastModified}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function safeStorageErrorPart(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const text = String(value).trim();

  if (!text) {
    return "";
  }

  return text
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL 已隐藏]")
    .replace(/\b(authorization|cookie|set-cookie|headers?|service[_-]?role|api[_-]?key|apikey|bearer|token|jwt|signed\s*url|signature|access[_-]?token|refresh[_-]?token)\b[^\n,;。]*/gi, "敏感信息已隐藏")
    .slice(0, 500);
}

function formatStorageUploadError(error: StorageUploadErrorLike | null | undefined) {
  const message = safeStorageErrorPart(error?.message);
  const details = [
    safeStorageErrorPart(error?.name),
    safeStorageErrorPart(error?.statusCode ?? error?.status)
  ].filter(Boolean);

  if (!message && details.length === 0) {
    return STORAGE_UPLOAD_FALLBACK_MESSAGE;
  }

  return [message || STORAGE_UPLOAD_FALLBACK_MESSAGE, ...details].join(" · ");
}

function storageUploadFailureMessage(error: StorageUploadErrorLike | null | undefined) {
  return `上传到 Supabase Storage 失败：${formatStorageUploadError(error)}`;
}

async function rollback(upload: PreparedDocumentUpload) {
  await rollbackPreparedDocumentUploadAction(upload);
}

export function DocumentUploadForm({
  projects,
  publications,
  knowledgeNotes,
  skills,
  initialValues,
  error
}: {
  projects: Pick<ProjectRecord, "id" | "title">[];
  publications: Pick<PublicationRecord, "id" | "title">[];
  knowledgeNotes: Pick<KnowledgeNoteRecord, "id" | "title">[];
  skills: Pick<SkillRecord, "id" | "name">[];
  initialValues?: DocumentUploadInitialValues;
  error?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(error ?? "");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const uploadToExistingCollection = Boolean(initialValues?.collectionId);
  const [mode, setMode] = useState<UploadMode>(uploadToExistingCollection ? "single" : initialValues?.mode ?? "single");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const [collectionLink, setCollectionLink] = useState<string | null>(null);

  const pending = phase !== "idle";
  const directoryInputProps = { webkitdirectory: "true", directory: "true" } as React.InputHTMLAttributes<HTMLInputElement>;
  const relatedOptions = {
    publications,
    projects,
    knowledgeNotes,
    skills: skills.map((skill) => ({ id: skill.id, title: skill.name }))
  };

  async function onSingleSubmit(formData: FormData) {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setMessage("请选择需要上传的文件。");
      return;
    }

    const clientValidation = validateDocumentFile(file);

    if (!clientValidation.ok) {
      setMessage(clientValidation.message);
      return;
    }

    const assetLinks = getAssetLinkValues(formData);
    const { relatedType, relatedId } = getPrimaryRelatedParts(assetLinks);
    const metadata = new FormData();
    metadata.set("name", String(formData.get("name") ?? ""));
    metadata.set("category", String(formData.get("category") ?? ""));
    metadata.set("related_type", relatedType);
    metadata.set("related_id", relatedId);
    metadata.set("collection_id", String(formData.get("collection_id") ?? ""));
    metadata.set("asset_relation_type", String(formData.get("asset_relation_type") ?? "related"));
    metadata.set("asset_note", String(formData.get("asset_note") ?? ""));
    appendAssetLinks(metadata, assetLinks);
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
      setMessage(storageUploadFailureMessage(uploadError));
      return;
    }

    setPhase("finalizing");
    const finalized = await finalizeDocumentUploadAction(upload);

    if (!finalized.ok) {
      setPhase("rolling_back");
      await rollback(upload);
      setPhase("idle");
      setMessage(finalized.message);
      return;
    }

    router.push(initialValues?.returnTo ?? `/dashboard/documents/${finalized.documentId}`);
    router.refresh();
  }

  async function onBatchSubmit(formData: FormData) {
    const files = getFilesFromFormData(formData);
    const batchValidation = validateDocumentBatch(files);

    if (!batchValidation.ok) {
      setMessage(batchValidation.message);
      return;
    }

    const blockedPath = files.map(getFileRelativePath).find(hasBlockedDocumentPath);

    if (blockedPath) {
      setMessage(`不支持上传包含可执行安装包或脚本的路径：${blockedPath}`);
      return;
    }

    const assetLinks = getAssetLinkValues(formData);
    const { relatedType, relatedId } = getPrimaryRelatedParts(assetLinks);
    const rootFolderName = getRootFolderName(files);
    const collectionTitle = String(formData.get("collection_title") ?? "").trim() || rootFolderName || "文档包";
    const collectionMetadata = new FormData();
    collectionMetadata.set("title", collectionTitle);
    collectionMetadata.set("description", String(formData.get("collection_description") ?? ""));
    collectionMetadata.set("collection_type", String(formData.get("collection_type") ?? "general_batch"));
    collectionMetadata.set("related_type", relatedType);
    collectionMetadata.set("related_id", relatedId);
    collectionMetadata.set("asset_relation_type", String(formData.get("asset_relation_type") ?? "related"));
    collectionMetadata.set("asset_note", String(formData.get("asset_note") ?? ""));
    appendAssetLinks(collectionMetadata, assetLinks);
    collectionMetadata.set("root_folder_name", rootFolderName);
    collectionMetadata.set("file_count", String(batchValidation.fileCount));
    collectionMetadata.set("total_size", String(batchValidation.totalSize));

    setPhase("preparing");
    setProgress({ total: files.length, current: 0, currentFile: "", successCount: 0, failureCount: 0 });
    const preparedCollection = await prepareDocumentCollectionUploadAction(collectionMetadata);

    if (!preparedCollection.ok) {
      setPhase("idle");
      setProgress(null);
      setMessage(preparedCollection.message);
      return;
    }

    const collectionId = preparedCollection.collection.collectionId;
    setCollectionLink(`/dashboard/documents/collections/${collectionId}`);
    const supabase = createClient();
    const nextFailures: UploadFailure[] = [];
    let successCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]!;
      const relativePath = getFileRelativePath(file);
      setProgress({
        total: files.length,
        current: index + 1,
        currentFile: relativePath,
        successCount,
        failureCount: nextFailures.length
      });

      const metadata = new FormData();
      metadata.set("name", file.name);
      metadata.set("category", String(formData.get("category") ?? ""));
      metadata.set("related_type", preparedCollection.collection.relatedType ?? "");
      metadata.set("related_id", preparedCollection.collection.relatedId ?? "");
      metadata.set("asset_relation_type", String(formData.get("asset_relation_type") ?? "related"));
      metadata.set("asset_note", String(formData.get("asset_note") ?? ""));
      appendPreparedAssetLinks(metadata, preparedCollection.collection.assetLinks);
      metadata.set("collection_id", collectionId);
      metadata.set("original_name", file.name);
      metadata.set("relative_path", relativePath);
      metadata.set("file_name", file.name);
      metadata.set("file_type", file.type);
      metadata.set("file_size", String(file.size));

      setPhase("preparing");
      const prepared = await prepareDocumentUploadAction(metadata);

      if (!prepared.ok) {
        nextFailures.push({ name: relativePath, reason: prepared.message });
        setFailures([...nextFailures]);
        continue;
      }

      const upload = prepared.upload;
      setPhase("uploading");
      const { error: uploadError } = await supabase.storage.from(upload.storageBucket).upload(upload.storagePath, file, {
        contentType: upload.mimeType,
        upsert: false
      });

      if (uploadError) {
        nextFailures.push({ name: relativePath, reason: storageUploadFailureMessage(uploadError) });
        setFailures([...nextFailures]);
        setProgress({
          total: files.length,
          current: index + 1,
          currentFile: relativePath,
          successCount,
          failureCount: nextFailures.length
        });
        continue;
      }

      setPhase("finalizing");
      const finalized = await finalizeDocumentUploadAction(upload);

      if (!finalized.ok) {
        setPhase("rolling_back");
        await rollback(upload);
        nextFailures.push({ name: relativePath, reason: finalized.message });
        setFailures([...nextFailures]);
        continue;
      }

      successCount += 1;
      setProgress({
        total: files.length,
        current: index + 1,
        currentFile: relativePath,
        successCount,
        failureCount: nextFailures.length
      });
    }

    setPhase("idle");
    setFailures(nextFailures);
    setProgress({
      total: files.length,
      current: files.length,
      currentFile: "",
      successCount,
      failureCount: nextFailures.length
    });

    if (nextFailures.length > 0) {
      setMessage(`批量上传完成：成功 ${successCount} 个，失败 ${nextFailures.length} 个。已成功文件会保留。`);
      router.refresh();
      return;
    }

    router.push(`/dashboard/documents/collections/${collectionId}`);
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFailures([]);
    setCollectionLink(null);

    const formData = new FormData(event.currentTarget);

    if (mode === "single") {
      await onSingleSubmit(formData);
      return;
    }

    await onBatchSubmit(formData);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {initialValues?.collectionId && mode === "single" ? (
        <input type="hidden" name="collection_id" value={initialValues.collectionId} />
      ) : null}
      <ErrorNotice message={message} />

      {initialValues?.prefillWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {initialValues.prefillWarning}
        </div>
      ) : null}

      {initialValues?.collectionId ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          本次上传会加入文档包：
          <span className="font-semibold text-blue-950 [overflow-wrap:anywhere]">{initialValues.collectionTitle ?? "当前文档包"}</span>
          。文件仍默认私密，不会自动公开；上传成功后可在文档包详情页查看。
        </div>
      ) : null}

      {collectionLink ? (
        <Link href={collectionLink} className="inline-flex rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
          查看已创建的文档包
        </Link>
      ) : null}

      {uploadToExistingCollection ? (
        <AdminFormSection title="上传模式" description="当前入口用于给已有文档包补充单个文件。">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span className="block font-semibold">单文件上传到已有文档包</span>
            <span className="mt-1 block text-xs leading-5">不会新建文档包；文件会继承当前文档包的已有关系，并可叠加下方额外关联。</span>
          </div>
        </AdminFormSection>
      ) : (
        <AdminFormSection title="上传模式" description="单文件流程保持兼容；多文件和文件夹会创建一个默认私密的文档包。">
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode("single")}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${mode === "single" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
            >
              <span className="block font-semibold">单文件上传</span>
              <span className="mt-1 block text-xs leading-5">保留原有 prepare 到 Storage upload 再 finalize 的流程。</span>
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode("batch")}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${mode === "batch" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"}`}
            >
              <span className="block font-semibold">多文件 / 文件夹上传</span>
              <span className="mt-1 block text-xs leading-5">创建 document collection，并保存文件相对路径。</span>
            </button>
          </div>
        </AdminFormSection>
      )}

      <AdminFormSection title="文件选择" description="浏览器会直接上传到私密 workspace-files bucket，文件二进制不经过 Vercel Function。如果 20-50MB 文件失败，请确认生产 Supabase 已执行 0018，workspace-files.file_size_limit 为 52428800。">
        {mode === "single" ? (
          <Field label="选择文件" hint={`最大 ${formatFileSize(MAX_DOCUMENT_FILE_SIZE)}。`}>
            <input
              name="file"
              type="file"
              accept={getDocumentAcceptAttribute()}
              required
              disabled={pending}
              className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </Field>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="选择多个文件" hint={`最多 ${MAX_DOCUMENT_BATCH_FILE_COUNT} 个文件，批次总量 ${formatFileSize(MAX_DOCUMENT_BATCH_TOTAL_SIZE)}。`}>
              <input
                name="files"
                type="file"
                accept={getDocumentAcceptAttribute()}
                multiple
                disabled={pending}
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </Field>
            <Field label="选择文件夹" hint="浏览器不会稳定上传空文件夹；如需完整目录结构，请上传 zip 包。">
              <input
                {...directoryInputProps}
                name="folder_files"
                type="file"
                accept={getDocumentAcceptAttribute()}
                multiple
                disabled={pending}
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </Field>
          </div>
        )}
      </AdminFormSection>

      {mode === "batch" ? (
        <AdminFormSection title="文档包信息" description="文档包表示一次上传批次、文件夹或附件包；新文件默认保持私密。">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="文档包名称" hint="留空时会使用根文件夹名称或默认文档包名称。">
              <TextInput name="collection_title" placeholder="例如 因子研究数据包" disabled={pending} />
            </Field>
            <Field label="文档包类型">
              <Select name="collection_type" defaultValue={initialValues?.collectionType ?? "folder_upload"} disabled={pending}>
                {documentCollectionTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="文档包描述">
            <Textarea name="collection_description" placeholder="可选：记录这一批文件的来源、用途或整理口径。" disabled={pending} />
          </Field>
        </AdminFormSection>
      ) : null}

      <AdminFormSection title="元数据" description="这些信息用于后台文件列表、文档包和关联内容展示。">
        <div className="grid gap-5 md:grid-cols-2">
          {mode === "single" ? (
            <Field label="文件显示名称" hint="留空时将使用清理后的原文件名。">
              <TextInput name="name" placeholder="例如 研究报告.pdf" disabled={pending} />
            </Field>
          ) : null}
          <Field label="文件分类">
            <Select name="category" defaultValue={initialValues?.category ?? "research_material"} disabled={pending}>
              {documentCategories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="关联对象" description="文件和文档包可以同时关联多个 Project、Publication、Knowledge 或 Skill；新文件默认私密，后续可在文件中心显式设为公开。">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Field
            label="关联对象"
            hint="可以同时关联多个资产；添加或移除关联不会移动、重命名或删除 Storage object。"
          >
            <DocumentAssetLinkPicker
              options={relatedOptions}
              defaultValues={initialValues?.relatedKey ? [initialValues.relatedKey] : []}
              disabled={pending}
            />
          </Field>
          <div className="space-y-5">
            <Field label="这批文件与所选资产的关系" hint="例如：交付物 / 支持材料 / 原始材料。">
              <Select name="asset_relation_type" defaultValue="related" disabled={pending}>
                {documentAssetRelationTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="备注">
              <Textarea name="asset_note" placeholder="可选：说明这批文件与所选资产的关系。" disabled={pending} />
            </Field>
          </div>
        </div>
      </AdminFormSection>

      {progress ? (
        <AdminFormSection title="上传进度" description={progress.currentFile || "等待上传开始。"}>
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-500">总文件数</p><p className="mt-1 font-semibold text-slate-950">{progress.total}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-500">当前文件</p><p className="mt-1 font-semibold text-slate-950">{progress.current}/{progress.total}</p></div>
            <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-emerald-700">成功</p><p className="mt-1 font-semibold text-emerald-900">{progress.successCount}</p></div>
            <div className="rounded-2xl bg-rose-50 p-4"><p className="text-rose-700">失败</p><p className="mt-1 font-semibold text-rose-900">{progress.failureCount}</p></div>
          </div>
        </AdminFormSection>
      ) : null}

      {failures.length > 0 ? (
        <AdminFormSection title="失败文件" description="已成功上传的文件会保留；失败项可以稍后重新上传。">
          <ul className="space-y-2 text-sm">
            {failures.map((failure) => (
              <li key={`${failure.name}-${failure.reason}`} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-800">
                <span className="font-semibold">{failure.name}</span>
                <span className="mt-1 block break-words text-rose-700">{failure.reason}</span>
              </li>
            ))}
          </ul>
        </AdminFormSection>
      ) : null}

      <AdminSecurityNote>上传后的文件默认是私密。只有管理员显式设为公开、且文件关联到公开 Project / Publication / Knowledge / Skill 时，公开页面才会显示安全下载入口。Skill 包只作为文件存储，不执行、不解析、不安装。</AdminSecurityNote>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phaseLabel(phase, mode)}
        </button>
        <Link href={initialValues?.returnTo ?? "/dashboard/documents"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
