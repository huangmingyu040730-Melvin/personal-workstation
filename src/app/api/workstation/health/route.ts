import { authenticateWorkstationRequest } from "@/lib/workstation/auth";
import { WORKSTATION_API_VERSION } from "@/lib/workstation/api-response";
import { getWorkstationDataAccessDiagnostics } from "@/lib/workstation/diagnostics";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeHealthRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = createWorkstationRequestContext(request, "health.check", "system");

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

    const dataAccess = await getWorkstationDataAccessDiagnostics();
    const data = {
      apiVersion: WORKSTATION_API_VERSION,
      auth: "ok",
      capabilities: auth.capabilities,
      status: "ok",
      dataAccess
    };

    return finishWorkstationResponse(context, data, {
      message: "Workstation API is available",
      requestSummary: summarizeHealthRequest(dataAccess)
    });
  } catch {
    return finishWorkstationError(context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation API error.",
      status: 500
    });
  }
}
