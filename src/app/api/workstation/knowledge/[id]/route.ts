import { authenticateWorkstationRequest, requireAnyWorkstationCapability, requireWorkstationCapability } from "@/lib/workstation/auth";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeKnowledgeUpdateRequest, summarizeShowRequest } from "@/lib/workstation/request-summary";
import { getWorkstationLookupType, showWorkstationKnowledge, updateWorkstationKnowledge } from "@/lib/workstation/query";
import { workstationKnowledgeUpdateSchema } from "@/lib/workstation/schemas";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lookup = id.trim();
  const requestSummary = summarizeShowRequest(lookup, getWorkstationLookupType(lookup));
  const context = createWorkstationRequestContext(request, "knowledge.show", "knowledge");

  try {
    const rateLimit = checkWorkstationRateLimit(context);

    if (!rateLimit.ok) {
      return finishWorkstationError(context, {
        code: "RATE_LIMITED",
        message: "Too many Workstation API requests. Please try again later.",
        status: 429,
        requestSummary
      });
    }

    const auth = authenticateWorkstationRequest(request, { requestId: context.requestId });

    if (!auth.ok) {
      return finishWorkstationError(context, {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Workstation API token.",
        status: 401,
        requestSummary
      });
    }

    const forbidden = requireWorkstationCapability(auth, "read_assets", { requestId: context.requestId });

    if (forbidden) {
      return finishWorkstationError(context, {
        code: "FORBIDDEN",
        message: "The Workstation API token does not allow this operation.",
        status: 403,
        requestSummary
      });
    }

    const result = await showWorkstationKnowledge(lookup);

    if (!result.ok) {
      return finishWorkstationError(context, {
        code: result.error.code,
        message: result.error.message,
        status: result.error.status,
        requestSummary
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
      requestSummary
    });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createWorkstationRequestContext(request, "knowledge.update", "knowledge");

  try {
    const rateLimit = checkWorkstationRateLimit(context);

    if (!rateLimit.ok) {
      return finishWorkstationError(context, {
        code: "RATE_LIMITED",
        message: "Too many Workstation API requests. Please try again later.",
        status: 429,
        targetId: id
      });
    }

    const auth = authenticateWorkstationRequest(request, { requestId: context.requestId });

    if (!auth.ok) {
      return finishWorkstationError(context, {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Workstation API token.",
        status: 401,
        targetId: id
      });
    }

    const forbidden = requireAnyWorkstationCapability(auth, ["update_assets", "create_assets"], { requestId: context.requestId });

    if (forbidden) {
      return finishWorkstationError(context, {
        code: "FORBIDDEN",
        message: "The Workstation API token does not allow this operation.",
        status: 403,
        targetId: id
      });
    }

    if (!UUID_PATTERN.test(id)) {
      return finishWorkstationError(context, {
        code: "VALIDATION_ERROR",
        message: "Invalid knowledge id.",
        status: 400
      });
    }

    const bodyResult = await readJsonBody(request);

    if (!bodyResult.ok) {
      return finishWorkstationError(context, {
        ...bodyResult.error,
        requestSummary: { id, body: "invalid_json" },
        targetId: id
      });
    }

    const requestSummary = summarizeKnowledgeUpdateRequest(id, bodyResult.body);
    const parsed = workstationKnowledgeUpdateSchema.safeParse(bodyResult.body);

    if (!parsed.success) {
      return finishWorkstationError(context, {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid knowledge update payload.",
        status: 400,
        requestSummary,
        targetId: id
      });
    }

    const result = await updateWorkstationKnowledge(id, parsed.data);

    if (!result.ok) {
      return finishWorkstationError(context, {
        code: result.error.code,
        message: result.error.message,
        status: result.error.status,
        requestSummary,
        targetId: id
      });
    }

    return finishWorkstationResponse(context, result.data, {
      message: "Knowledge updated successfully",
      targetId: result.data.id,
      requestSummary
    });
  } catch {
    return finishWorkstationError(context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation API error.",
      status: 500,
      targetId: id
    });
  }
}
