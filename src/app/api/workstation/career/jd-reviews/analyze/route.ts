import { analyzeWorkstationResumeJd } from "@/lib/workstation/career-ai";
import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import { workstationJdAnalyzeSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerAnalyzeRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authorizeCareerRequest(request, "resume_jd_reviews.analyze", "resume_jd_review", ["analyze_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, body.error);
    const requestSummary = summarizeCareerAnalyzeRequest(body.body);
    const parsed = workstationJdAnalyzeSchema.safeParse(body.body);
    if (!parsed.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid JD analysis payload.", status: 400, requestSummary });
    const result = await analyzeWorkstationResumeJd(parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    const review = result.data.review as { id?: string } | undefined;
    return finishWorkstationResponse(auth.context, result.data, { message: "AI JD analysis completed and saved", status: 201, targetId: review?.id, requestSummary });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected JD analysis error.", status: 500 });
  }
}
