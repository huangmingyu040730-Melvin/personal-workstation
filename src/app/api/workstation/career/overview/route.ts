import { authorizeCareerRequest } from "@/lib/workstation/career-route";
import { getWorkstationCareerOverview } from "@/lib/workstation/career-query";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeCareerRequest(request, "career.overview", "career", ["read_career"]);
  if (!auth.ok) return auth.response;

  try {
    const result = await getWorkstationCareerOverview();
    if (!result.ok) return finishWorkstationError(auth.context, result.error);
    return finishWorkstationResponse(auth.context, result.data);
  } catch {
    return finishWorkstationError(auth.context, {
      code: "INTERNAL_ERROR",
      message: "Unexpected Workstation Career API error.",
      status: 500
    });
  }
}
