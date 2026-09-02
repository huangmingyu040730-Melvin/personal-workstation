import { NextRequest } from "next/server";
import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { checkWorkstationRateLimit } from "@/lib/workstation/rate-limit";
import { createWorkstationRequestContext, finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { getWorkstationWeeklyReview, weeklyReviewPeriod } from "@/lib/workstation/weekly-review";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = createWorkstationRequestContext(request, "review.weekly", "system");

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

    const period = request.nextUrl.searchParams.get("period")?.trim() || weeklyReviewPeriod;

    if (period !== weeklyReviewPeriod) {
      return finishWorkstationError(context, {
        code: "VALIDATION_ERROR",
        message: "Review period must be week.",
        status: 400,
        requestSummary: { period }
      });
    }

    const result = await getWorkstationWeeklyReview();

    if (!result.ok) {
      return finishWorkstationError(context, {
        ...result.error,
        requestSummary: { period }
      });
    }

    return finishWorkstationResponse(context, result.data, {
      requestSummary: {
        period,
        attention_count: result.data.attention.length,
        health_status: result.data.health.status
      }
    });
  } catch {
    return finishWorkstationError(context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation API error.",
      status: 500
    });
  }
}
