import { NextRequest } from "next/server";
import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeKnowledgeCreateRequest, summarizeListRequest } from "@/lib/workstation/request-summary";
import {
  createWorkstationKnowledge,
  listWorkstationKnowledge,
  parseWorkstationListParams
} from "@/lib/workstation/query";
import { workstationKnowledgeCreateSchema } from "@/lib/workstation/schemas";

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

export async function GET(request: NextRequest) {
  const context = createWorkstationRequestContext(request, "knowledge.list", "knowledge");

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

    const result = await listWorkstationKnowledge(params.data);

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

export async function POST(request: Request) {
  const context = createWorkstationRequestContext(request, "knowledge.create", "knowledge");

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

    const forbidden = requireWorkstationCapability(auth, "create_assets", { requestId: context.requestId });

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

    const requestSummary = summarizeKnowledgeCreateRequest(bodyResult.body);
    const parsed = workstationKnowledgeCreateSchema.safeParse(bodyResult.body);

    if (!parsed.success) {
      return finishWorkstationError(context, {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid knowledge payload.",
        status: 400,
        requestSummary
      });
    }

    const result = await createWorkstationKnowledge(parsed.data);

    if (!result.ok) {
      return finishWorkstationError(context, {
        code: result.error.code,
        message: result.error.message,
        status: result.error.status,
        requestSummary
      });
    }

    return finishWorkstationResponse(context, result.data, {
      message: "Knowledge created successfully",
      status: 201,
      targetId: result.data.id,
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
