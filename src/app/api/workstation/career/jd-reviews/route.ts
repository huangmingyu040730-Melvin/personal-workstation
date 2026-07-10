import { NextRequest } from "next/server";
import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import {
  createWorkstationJdReview,
  listWorkstationJdReviews,
  parseWorkstationCareerListParams
} from "@/lib/workstation/career-query";
import { workstationJdReviewCreateSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerCreateRequest, summarizeCareerListRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authorizeCareerRequest(request, "resume_jd_reviews.list", "resume_jd_review", ["read_career"]);
  if (!auth.ok) return auth.response;

  try {
    const params = parseWorkstationCareerListParams(request.nextUrl.searchParams);
    if (!params.ok) return finishWorkstationError(auth.context, params.error);
    const requestSummary = summarizeCareerListRequest(params.data);
    const result = await listWorkstationJdReviews(params.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    return finishWorkstationResponse(auth.context, result.data, { requestSummary });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected JD review list error.", status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeCareerRequest(request, "resume_jd_reviews.create", "resume_jd_review", ["manage_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, body.error);
    const requestSummary = summarizeCareerCreateRequest("resume_jd_review", body.body);
    const parsed = workstationJdReviewCreateSchema.safeParse(body.body);
    if (!parsed.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid JD review payload.", status: 400, requestSummary });
    const result = await createWorkstationJdReview(parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    return finishWorkstationResponse(auth.context, result.data, { message: "JD review created successfully", status: 201, targetId: result.data.id, requestSummary });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected JD review create error.", status: 500 });
  }
}
