import {
  authenticateWorkstationRequest,
  requireAnyWorkstationCapability,
  type WorkstationCapability
} from "./auth";
import type { WorkstationOperationTargetType } from "./operation-log";
import { checkWorkstationRateLimit } from "./rate-limit";
import {
  createWorkstationRequestContext,
  finishWorkstationError,
  type WorkstationRequestContext
} from "./request-context";

export async function authorizeCareerRequest(
  request: Request,
  action: string,
  targetType: WorkstationOperationTargetType,
  capabilities: WorkstationCapability[],
  requestSummary?: Record<string, unknown>
): Promise<
  | { ok: true; context: WorkstationRequestContext }
  | { ok: false; response: Response }
> {
  const context = createWorkstationRequestContext(request, action, targetType);
  const rateLimit = checkWorkstationRateLimit(context);

  if (!rateLimit.ok) {
    return {
      ok: false,
      response: await finishWorkstationError(context, {
        code: "RATE_LIMITED",
        message: "Too many Workstation API requests. Please try again later.",
        status: 429,
        requestSummary
      })
    };
  }

  const auth = authenticateWorkstationRequest(request, { requestId: context.requestId });
  if (!auth.ok) {
    return {
      ok: false,
      response: await finishWorkstationError(context, {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Workstation API token.",
        status: 401,
        requestSummary
      })
    };
  }

  const forbidden = requireAnyWorkstationCapability(auth, capabilities, { requestId: context.requestId });
  if (forbidden) {
    return {
      ok: false,
      response: await finishWorkstationError(context, {
        code: "FORBIDDEN",
        message: "The Workstation API token does not allow this operation.",
        status: 403,
        requestSummary
      })
    };
  }

  return { ok: true, context };
}

export async function readCareerJsonBody(request: Request) {
  try {
    return { ok: true as const, body: await request.json() };
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
