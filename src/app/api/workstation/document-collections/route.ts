import { NextRequest } from "next/server";
import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { workstationError, workstationSuccess } from "@/lib/workstation/api-response";
import {
  listWorkstationDocumentCollections,
  parseWorkstationListParams
} from "@/lib/workstation/query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = authenticateWorkstationRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const forbidden = requireWorkstationCapability(auth, "read_assets");

  if (forbidden) {
    return forbidden;
  }

  const params = parseWorkstationListParams(request.nextUrl.searchParams);

  if (!params.ok) {
    return workstationError(params.error.code, params.error.message, params.error.status);
  }

  const result = await listWorkstationDocumentCollections(params.data);

  if (!result.ok) {
    return workstationError(result.error.code, result.error.message, result.error.status);
  }

  return workstationSuccess(result.data);
}
