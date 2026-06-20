import { z } from "zod";
import { documentCategories } from "@/lib/content-options";

export const WORKSTATION_DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const documentCategoryValues = documentCategories.map((item) => item.value) as [string, ...string[]];

const allowedMimeTypesByExtension = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  csv: ["text/csv"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"]
} as const;

const blockedExtensions = new Set([
  "app",
  "bat",
  "cmd",
  "com",
  "dmg",
  "exe",
  "msi",
  "ps1",
  "rar",
  "scr",
  "sh",
  "zip",
  "7z"
]);

const baseUploadMetadataSchema = z.object({
  collection_id: z.string().uuid("collection_id must be a valid UUID."),
  filename: z.string().trim().min(1, "filename is required.").max(240, "filename is too long."),
  mime_type: z.string().trim().min(1, "mime_type is required.").max(120, "mime_type is too long."),
  size_bytes: z.number().int("size_bytes must be an integer.").positive("size_bytes must be positive.").max(WORKSTATION_DOCUMENT_UPLOAD_MAX_SIZE_BYTES, "File size exceeds the Workstation upload limit."),
  title: z.string().trim().min(2, "title must be at least 2 characters.").max(180, "title is too long."),
  category: z.enum(documentCategoryValues, { message: "category is not supported." })
}).strict();

export const workstationDocumentUploadIntentSchema = baseUploadMetadataSchema.superRefine(validateFileMetadata);

export const workstationDocumentControlledUploadSchema = baseUploadMetadataSchema.omit({
  title: true
}).extend({
  upload_id: z.string().trim().regex(/^wup_[A-Za-z0-9_-]{16,64}$/, "upload_id is invalid."),
  storage_path: z.string().trim().min(1, "storage_path is required.").max(512, "storage_path is too long.")
}).strict().superRefine(validateFileMetadata);

export const workstationDocumentFinalizeSchema = baseUploadMetadataSchema.extend({
  upload_id: z.string().trim().regex(/^wup_[A-Za-z0-9_-]{16,64}$/, "upload_id is invalid."),
  storage_path: z.string().trim().min(1, "storage_path is required.").max(512, "storage_path is too long.")
}).strict().superRefine(validateFileMetadata);

export type WorkstationDocumentUploadIntentInput = z.infer<typeof workstationDocumentUploadIntentSchema>;
export type WorkstationDocumentControlledUploadInput = z.infer<typeof workstationDocumentControlledUploadSchema>;
export type WorkstationDocumentFinalizeInput = z.infer<typeof workstationDocumentFinalizeSchema>;

export function getWorkstationDocumentExtension(filename: string) {
  const cleanName = filename.replace(/\\/g, "/").split("/").pop()?.trim() ?? "";
  const parts = cleanName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

export function getWorkstationDocumentFilenameExt(filename: string) {
  const extension = getWorkstationDocumentExtension(filename);
  return extension ? `.${extension}` : "";
}

export function isAllowedWorkstationDocumentMime(extension: string, mimeType: string) {
  const allowedMimeTypes = allowedMimeTypesByExtension[extension as keyof typeof allowedMimeTypesByExtension] as readonly string[] | undefined;
  return Boolean(allowedMimeTypes?.includes(mimeType));
}

export function getAllowedWorkstationDocumentMimeType(extension: string, mimeType: string) {
  const allowedMimeTypes = allowedMimeTypesByExtension[extension as keyof typeof allowedMimeTypesByExtension] as readonly string[] | undefined;

  return isAllowedWorkstationDocumentMime(extension, mimeType)
    ? mimeType
    : allowedMimeTypes?.[0] ?? mimeType;
}

function validateFileMetadata(value: { filename: string; mime_type: string }, ctx: z.RefinementCtx) {
  const extension = getWorkstationDocumentExtension(value.filename);

  if (!extension) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["filename"],
      message: "filename must include a supported extension."
    });
    return;
  }

  if (blockedExtensions.has(extension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["filename"],
      message: "Executable, installer, archive, and script files are not supported."
    });
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(allowedMimeTypesByExtension, extension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["filename"],
      message: "File extension is not supported for Workstation uploads."
    });
    return;
  }

  if (!isAllowedWorkstationDocumentMime(extension, value.mime_type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mime_type"],
      message: "mime_type does not match the file extension."
    });
  }
}
