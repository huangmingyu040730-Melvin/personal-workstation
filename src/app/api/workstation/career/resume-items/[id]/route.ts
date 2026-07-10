import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import {
  deleteWorkstationResumeItem,
  showWorkstationResumeItem,
  updateWorkstationResumeItem
} from "@/lib/workstation/career-query";
import { workstationDeleteConfirmationSchema, workstationResumeItemUpdateSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerDeleteRequest, summarizeCareerUpdateRequest, summarizeShowRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestSummary = summarizeShowRequest(id, "id");
  const auth = await authorizeCareerRequest(request, "resume_items.show", "resume_item", ["read_career"], requestSummary);
  if (!auth.ok) return auth.response;

  try {
    const result = await showWorkstationResumeItem(id);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { requestSummary, targetId: result.data.id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume item show error.", status: 500, requestSummary, targetId: id });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeCareerRequest(request, "resume_items.update", "resume_item", ["manage_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, { ...body.error, targetId: id });
    const requestSummary = summarizeCareerUpdateRequest(id, "resume_item", body.body);
    const parsed = workstationResumeItemUpdateSchema.safeParse(body.body);
    if (!parsed.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid resume item update payload.", status: 400, requestSummary, targetId: id });
    const result = await updateWorkstationResumeItem(id, parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { message: "Resume item updated successfully", requestSummary, targetId: result.data.id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume item update error.", status: 500, targetId: id });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeCareerRequest(request, "resume_items.delete", "resume_item", ["delete_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    const parsed = body.ok ? workstationDeleteConfirmationSchema.safeParse(body.body) : null;
    if (!parsed?.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: "Delete requires an explicit confirm=true payload.", status: 400, targetId: id });
    const requestSummary = summarizeCareerDeleteRequest(id);
    const result = await deleteWorkstationResumeItem(id);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { message: "Resume item deleted successfully", requestSummary, targetId: id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume item delete error.", status: 500, targetId: id });
  }
}
