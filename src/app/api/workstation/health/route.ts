import { authenticateWorkstationRequest } from "@/lib/workstation/auth";
import { WORKSTATION_API_VERSION, workstationSuccess } from "@/lib/workstation/api-response";
import { getWorkstationDataAccessDiagnostics } from "@/lib/workstation/diagnostics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authenticateWorkstationRequest(request);

  if (!auth.ok) {
    return auth.response;
  }
  const dataAccess = await getWorkstationDataAccessDiagnostics();

  return workstationSuccess({
    apiVersion: WORKSTATION_API_VERSION,
    auth: "ok",
    capabilities: auth.capabilities,
    status: "ok",
    dataAccess
  }, "Workstation API is available");
}
