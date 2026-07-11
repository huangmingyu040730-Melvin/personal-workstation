import { NextRequest } from "next/server";
import { authorizeCareerRequest, readCareerJsonBody } from "@/lib/workstation/career-route";
import {
  createWorkstationResumeItem,
  listWorkstationResumeItems,
  parseWorkstationCareerListParams
} from "@/lib/workstation/career-query";
import { workstationResumeItemCreateSchema } from "@/lib/workstation/career-schemas";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeCareerCreateRequest, summarizeCareerListRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authorizeCareerRequest(request, "resume_items.list", "resume_item", ["read_career"]);
  if (!auth.ok) return auth.response;

  try {
    const params = parseWorkstationCareerListParams(request.nextUrl.searchParams);
    if (!params.ok) return finishWorkstationError(auth.context, params.error);
    const requestSummary = summarizeCareerListRequest(params.data);
    const result = await listWorkstationResumeItems(params.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    return finishWorkstationResponse(auth.context, result.data, { requestSummary });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume item list error.", status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeCareerRequest(request, "resume_items.create", "resume_item", ["manage_career"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await readCareerJsonBody(request);
    if (!body.ok) return finishWorkstationError(auth.context, body.error);
    const requestSummary = summarizeCareerCreateRequest("resume_item", body.body);
    const parsed = workstationResumeItemCreateSchema.safeParse(body.body);
    if (!parsed.success) {
      return finishWorkstationError(auth.context, {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid resume item payload.",
        status: 400,
        requestSummary
      });
    }
    const result = await createWorkstationResumeItem(parsed.data);
    if (!result.ok) return finishWorkstationError(auth.context, { ...result.error, requestSummary });
    return finishWorkstationResponse(auth.context, result.data, {
      message: "Resume item created successfully",
      status: 201,
      targetId: result.data.id,
      requestSummary
    });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume item create error.", status: 500 });
  }
}
