import { NextRequest } from "next/server";
import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeListRequest } from "@/lib/workstation/request-summary";
import {
  listWorkstationDocumentCollections,
  parseWorkstationListParams
} from "@/lib/workstation/query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = createWorkstationRequestContext(request, "document_collections.list", "document_collection");

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

    const forbidden = requireWorkstationCapability(auth, "read_assets", { requestId: context.requestId });

    if (forbidden) {
      return finishWorkstationError(context, {
        code: "FORBIDDEN",
        message: "The Workstation API token does not allow this operation.",
        status: 403
      });
    }

    const params = parseWorkstationListParams(request.nextUrl.searchParams);

    if (!params.ok) {
      return finishWorkstationError(context, {
        code: params.error.code,
        message: params.error.message,
        status: params.error.status
      });
    }

    const result = await listWorkstationDocumentCollections(params.data);

    if (!result.ok) {
      return finishWorkstationError(context, {
        code: result.error.code,
        message: result.error.message,
        status: result.error.status,
        requestSummary: summarizeListRequest(params.data)
      });
    }

    return finishWorkstationResponse(context, result.data, {
      requestSummary: summarizeListRequest(params.data)
    });
  } catch {
    return finishWorkstationError(context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation API error.",
      status: 500
    });
  }
}
