import { NextRequest } from "next/server";
import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import {
  createWorkstationResumeVersion,
  listWorkstationResumeVersions,
  parseWorkstationCareerListParams
} from "@/lib/workstation/career-query";
import { workstationResumeVersionCreateSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerCreateRequest, summarizeCareerListRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authorizeCareerRequest(request, "resume_versions.list", "resume_version", ["read_career"]);
  if (!auth.ok) return auth.response;

  try {
    const params = parseWorkstationCareerListParams(request.nextUrl.searchParams);
    if (!params.ok) return finishWorkstationError(auth.context, params.error);
    const requestSummary = summarizeCareerListRequest(params.data);
    const result = await listWorkstationResumeVersions(params.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    return finishWorkstationResponse(auth.context, result.data, { requestSummary });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume version list error.", status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeCareerRequest(request, "resume_versions.create", "resume_version", ["manage_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, body.error);
    const requestSummary = summarizeCareerCreateRequest("resume_version", body.body);
    const parsed = workstationResumeVersionCreateSchema.safeParse(body.body);
    if (!parsed.success) return finishWorkstationError(auth.context, { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid resume version payload.", status: 400, requestSummary });
    const result = await createWorkstationResumeVersion(parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    return finishWorkstationResponse(auth.context, result.data, { message: "Resume version created successfully", status: 201, targetId: result.data.id, requestSummary });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume version create error.", status: 500 });
  }
}
