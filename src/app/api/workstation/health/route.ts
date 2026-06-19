import { authenticateWorkstationRequest, workstationCapabilities } from "@/lib/workstation/auth";
import { WORKSTATION_API_VERSION, workstationSuccess } from "@/lib/workstation/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authenticateWorkstationRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  return workstationSuccess({
    apiVersion: WORKSTATION_API_VERSION,
    capabilities: workstationCapabilities,
    status: "ok"
  }, "Workstation API is available");
}
