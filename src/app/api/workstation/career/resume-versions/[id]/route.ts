import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import {
  deleteWorkstationResumeVersion,
  showWorkstationResumeVersion,
  updateWorkstationResumeVersion
} from "@/lib/workstation/career-query";
import { workstationDeleteConfirmationSchema, workstationResumeVersionUpdateSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerDeleteRequest, summarizeCareerUpdateRequest, summarizeShowRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestSummary = summarizeShowRequest(id, "id");
  const auth = await authorizeCareerRequest(request, "resume_versions.show", "resume_version", ["read_career"], requestSummary);
  if (!auth.ok) return auth.response;

  try {
    const result = await showWorkstationResumeVersion(id);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { requestSummary, targetId: result.data.id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume version show error.", status: 500, requestSummary, targetId: id });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeCareerRequest(request, "resume_versions.update", "resume_version", ["manage_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, { ...body.error, targetId: id });
    const requestSummary = summarizeCareerUpdateRequest(id, "resume_version", body.body);
    const parsed = workstationResumeVersionUpdateSchema.safeParse(body.body);
    if (!parsed.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid resume version update payload.", status: 400, requestSummary, targetId: id });
    const result = await updateWorkstationResumeVersion(id, parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { message: "Resume version updated successfully", requestSummary, targetId: result.data.id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume version update error.", status: 500, targetId: id });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeCareerRequest(request, "resume_versions.delete", "resume_version", ["delete_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    const parsed = body.ok ? workstationDeleteConfirmationSchema.safeParse(body.body) : null;
    if (!parsed?.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: "Delete requires an explicit confirm=true payload.", status: 400, targetId: id });
    const requestSummary = summarizeCareerDeleteRequest(id);
    const result = await deleteWorkstationResumeVersion(id);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary, targetId: id });
    return finishWorkstationResponse(auth.context, result.data, { message: "Resume version deleted successfully", requestSummary, targetId: id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume version delete error.", status: 500, targetId: id });
  }
}
