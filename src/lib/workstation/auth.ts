import { timingSafeEqual } from "crypto";
import { workstationError } from "./api-response";

export const workstationCapabilities = [
  "read_assets",
  "create_assets",
  "update_assets",
  "upload_documents",
  "read_career",
  "manage_career",
  "analyze_career",
  "export_career",
  "delete_career"
] as const;

export type WorkstationCapability = typeof workstationCapabilities[number];

type WorkstationAuthResult =
  | { ok: true; capabilities: WorkstationCapability[] }
  | { ok: false; response: ReturnType<typeof workstationError> };

type WorkstationAuthOptions = {
  requestId?: string;
};

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function authenticateWorkstationRequest(request: Request, options: WorkstationAuthOptions = {}): WorkstationAuthResult {
  const configuredToken = process.env.WORKSTATION_API_TOKEN?.trim();
  const providedToken = extractBearerToken(request);

  if (!configuredToken || !providedToken || !constantTimeEqual(providedToken, configuredToken)) {
    return {
      ok: false,
      response: workstationError("UNAUTHORIZED", "Missing or invalid Workstation API token.", 401, {
        requestId: options.requestId
      })
    };
  }

  return {
    ok: true,
    capabilities: [...workstationCapabilities]
  };
}

export function requireWorkstationCapability(
  auth: Extract<WorkstationAuthResult, { ok: true }>,
  capability: WorkstationCapability,
  options: WorkstationAuthOptions = {}
) {
  if (!auth.capabilities.includes(capability)) {
    return workstationError("FORBIDDEN", "The Workstation API token does not allow this operation.", 403, {
      requestId: options.requestId
    });
  }

  return null;
}

export function requireAnyWorkstationCapability(
  auth: Extract<WorkstationAuthResult, { ok: true }>,
  capabilities: WorkstationCapability[],
  options: WorkstationAuthOptions = {}
) {
  if (!capabilities.some((capability) => auth.capabilities.includes(capability))) {
    return workstationError("FORBIDDEN", "The Workstation API token does not allow this operation.", 403, {
      requestId: options.requestId
    });
  }

  return null;
}
