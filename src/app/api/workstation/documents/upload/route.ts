import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { uploadWorkstationDocumentObject } from "@/lib/workstation/document-upload";
import { workstationDocumentControlledUploadSchema } from "@/lib/workstation/document-upload-schemas";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeDocumentUploadRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

type MultipartBodyResult =
  | {
    ok: true;
    metadata: Record<string, unknown>;
    file: File;
  }
  | {
    ok: false;
    error: {
      code: "VALIDATION_ERROR";
      message: string;
      status: number;
    };
    requestSummary?: Record<string, unknown>;
  };

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function readMultipartBody(request: Request): Promise<MultipartBodyResult> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must be multipart/form-data.",
        status: 400
      }
    };
  }

  const metadata = {
    upload_id: formString(formData, "upload_id"),
    collection_id: formString(formData, "collection_id"),
    storage_path: formString(formData, "storage_path"),
    filename: formString(formData, "filename"),
    mime_type: formString(formData, "mime_type"),
    size_bytes: Number(formString(formData, "size_bytes")),
    category: formString(formData, "category")
  };
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "file is required.",
        status: 400
      },
      requestSummary: summarizeDocumentUploadRequest(metadata)
    };
  }

  return {
    ok: true,
    metadata,
    file
  };
}

export async function POST(request: Request) {
  const context = createWorkstationRequestContext(request, "documents.upload", "document_collection");

  try {
    const rateLimit = checkWorkstationRateLimit(context);

    if (!rateLimit.ok) {
      return finishWorkstationError(context, {
        code: "RATE_LIMITED",
        message: "Too many Workstation API requests. Please try again later.",
        status: 429
      });
    }

    const auth = authenticateWorkstationRequest(request, { requestId: context.requestId });

    if (!auth.ok) {
      return finishWorkstationError(context, {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Workstation API token.",
        status: 401
      });
    }

    const forbidden = requireWorkstationCapability(auth, "upload_documents", { requestId: context.requestId });

    if (forbidden) {
      return finishWorkstationError(context, {
        code: "FORBIDDEN",
        message: "The Workstation API token does not allow this operation.",
        status: 403
      });
    }

    const bodyResult = await readMultipartBody(request);

    if (!bodyResult.ok) {
      return finishWorkstationError(context, {
        ...bodyResult.error,
        requestSummary: bodyResult.requestSummary ?? { body: "invalid_multipart" }
      });
    }

    const requestSummary = summarizeDocumentUploadRequest(bodyResult.metadata);
    const parsed = workstationDocumentControlledUploadSchema.safeParse(bodyResult.metadata);

    if (!parsed.success) {
      return finishWorkstationError(context, {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid document upload payload.",
        status: 400,
        requestSummary
      });
    }

    const result = await uploadWorkstationDocumentObject(parsed.data, bodyResult.file);

    if (!result.ok) {
      return finishWorkstationError(context, {
        code: result.error.code,
        message: result.error.message,
        status: result.error.status,
        targetId: parsed.data.collection_id,
        requestSummary
      });
    }

    return finishWorkstationResponse(context, result.data, {
      message: "Document uploaded successfully",
      targetId: result.data.collection_id,
      requestSummary
    });
  } catch {
    return finishWorkstationError(context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation API error.",
      status: 500
    });
  }
}
