import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import {
  deleteWorkstationJdReview,
  showWorkstationJdReview,
  updateWorkstationJdReview
} from "@/lib/workstation/career-query";
import { workstationDeleteConfirmationSchema, workstationJdReviewUpdateSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerDeleteRequest, summarizeCareerUpdateRequest, summarizeShowRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestSummary = summarizeShowRequest(id, "id");
  const auth = await authorizeCareerRequest(request, "resume_jd_reviews.show", "resume_jd_review", ["read_career"], requestSummary);
  if (!auth.ok) return auth.response;

  try {
    const result = await showWorkstationJdReview(id);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { requestSummary, targetId: result.data.id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected JD review show error.", status: 500, requestSummary, targetId: id });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeCareerRequest(request, "resume_jd_reviews.update", "resume_jd_review", ["manage_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, { ...body.error, targetId: id });
    const requestSummary = summarizeCareerUpdateRequest(id, "resume_jd_review", body.body);
    const parsed = workstationJdReviewUpdateSchema.safeParse(body.body);
    if (!parsed.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid JD review update payload.", status: 400, requestSummary, targetId: id });
    const result = await updateWorkstationJdReview(id, parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { message: "JD review updated successfully", requestSummary, targetId: result.data.id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected JD review update error.", status: 500, targetId: id });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeCareerRequest(request, "resume_jd_reviews.delete", "resume_jd_review", ["delete_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    const parsed = body.ok ? workstationDeleteConfirmationSchema.safeParse(body.body) : null;
    if (!parsed?.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: "Delete requires an explicit confirm=true payload.", status: 400, targetId: id });
    const requestSummary = summarizeCareerDeleteRequest(id);
    const result = await deleteWorkstationJdReview(id);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { message: "JD review deleted successfully", requestSummary, targetId: id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected JD review delete error.", status: 500, targetId: id });
  }
}
