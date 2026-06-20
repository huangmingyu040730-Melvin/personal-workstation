import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCollectionShowRequest } from "@/lib/workstation/request-summary";
import { showWorkstationDocumentCollection } from "@/lib/workstation/query";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collectionId = id.trim();
  const requestSummary = summarizeCollectionShowRequest(collectionId);
  const context = createWorkstationRequestContext(request, "document_collections.show", "document_collection");

  try {
    const rateLimit = checkWorkstationRateLimit(context);

    if (!rateLimit.ok) {
      return finishWorkstationError(context, {
        code: "RATE_LIMITED",
        message: "Too many Workstation API requests. Please try again later.",
        status: 429,
        requestSummary,
        targetId: collectionId
      });
    }

    const auth = authenticateWorkstationRequest(request, { requestId: context.requestId });

    if (!auth.ok) {
      return finishWorkstationError(context, {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Workstation API token.",
        status: 401,
        requestSummary,
        targetId: collectionId
      });
    }

    const forbidden = requireWorkstationCapability(auth, "read_assets", { requestId: context.requestId });

    if (forbidden) {
      return finishWorkstationError(context, {
        code: "FORBIDDEN",
        message: "The Workstation API token does not allow this operation.",
        status: 403,
        requestSummary,
        targetId: collectionId
      });
    }

    const result = await showWorkstationDocumentCollection(collectionId);

    if (!result.ok) {
      return finishWorkstationError(context, {
        code: result.error.code,
        message: result.error.message,
        status: result.error.status,
        requestSummary,
        targetId: collectionId
      });
    }

    return finishWorkstationResponse(context, result.data, {
      requestSummary,
      targetId: result.data.id
    });
  } catch {
    return finishWorkstationError(context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation API error.",
      status: 500,
      requestSummary,
      targetId: collectionId
    });
  }
}
