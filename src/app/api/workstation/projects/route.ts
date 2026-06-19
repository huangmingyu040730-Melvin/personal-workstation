import { NextRequest } from "next/server";
import { authenticateWorkstationRequest, requireWorkstationCapability } from "@/lib/workstation/auth";
import { workstationError, workstationSuccess } from "@/lib/workstation/api-response";
import {
  createWorkstationProject,
  listWorkstationProjects,
  parseWorkstationListParams
} from "@/lib/workstation/query";
import { workstationProjectCreateSchema } from "@/lib/workstation/schemas";

export const dynamic = "force-dynamic";

async function readJsonBody(request: Request) {
  try {
    const body = await request.json();
    return { ok: true as const, body };
  } catch {
    return {
      ok: false as const,
      response: workstationError("VALIDATION_ERROR", "Request body must be valid JSON.", 400)
    };
  }
}

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

  const result = await listWorkstationProjects(params.data);

  if (!result.ok) {
    return workstationError(result.error.code, result.error.message, result.error.status);
  }

  return workstationSuccess(result.data);
}

export async function POST(request: Request) {
  const auth = authenticateWorkstationRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const forbidden = requireWorkstationCapability(auth, "create_assets");

  if (forbidden) {
    return forbidden;
  }

  const bodyResult = await readJsonBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parsed = workstationProjectCreateSchema.safeParse(bodyResult.body);

  if (!parsed.success) {
    return workstationError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid project payload.", 400);
  }

  const result = await createWorkstationProject(parsed.data);

  if (!result.ok) {
    return workstationError(result.error.code, result.error.message, result.error.status);
  }

  return workstationSuccess(result.data, "Project created successfully", 201);
}
