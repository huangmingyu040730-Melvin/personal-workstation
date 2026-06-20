import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { createWorkstationDocumentUploadIntent } from "@/lib/workstation/document-upload";
import { workstationDocumentUploadIntentSchema } from "@/lib/workstation/document-upload-schemas";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeDocumentUploadRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

async function readJsonBody(request: Request) {
  try {
    const body = await request.json();
    return { ok: true as const, body };
  } catch {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Request body must be valid JSON.",
        status: 400
      }
    };
  }
}

export async function POST(request: Request) {
  const context = createWorkstationRequestContext(request, "documents.upload_intent", "document_collection");

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

    const bodyResult = await readJsonBody(request);

    if (!bodyResult.ok) {
      return finishWorkstationError(context, {
        ...bodyResult.error,
        requestSummary: { body: "invalid_json" }
      });
    }

    const requestSummary = summarizeDocumentUploadRequest(bodyResult.body);
    const parsed = workstationDocumentUploadIntentSchema.safeParse(bodyResult.body);

    if (!parsed.success) {
      return finishWorkstationError(context, {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid document upload intent payload.",
        status: 400,
        requestSummary
      });
    }

    const result = await createWorkstationDocumentUploadIntent(parsed.data);

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
      message: "Document upload intent created successfully",
      status: 201,
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
