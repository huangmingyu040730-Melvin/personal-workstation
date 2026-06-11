import type { DocumentCategory, DocumentCollectionType, DocumentRelatedType } from "@/lib/content-types";

export type AfterCreateUploadAction = "detail" | "upload_single" | "upload_batch";

export function getAfterCreateUploadAction(value: FormDataEntryValue | null): AfterCreateUploadAction {
  if (value === "upload_single" || value === "upload_batch") {
    return value;
  }

  return "detail";
}

export function buildRelatedDocumentUploadHref({
  relatedType,
  relatedId,
  mode,
  category,
  collectionType
}: {
  relatedType: DocumentRelatedType;
  relatedId: string;
  mode: "single" | "batch";
  category: DocumentCategory;
  collectionType?: DocumentCollectionType;
}) {
  const params = new URLSearchParams({
    related_type: relatedType,
    related_id: relatedId,
    mode,
    category
  });

  if (collectionType) {
    params.set("collection_type", collectionType);
  }

  return `/dashboard/documents/upload?${params.toString()}`;
}
