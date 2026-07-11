import { buildResumeDocx, getExportableResumeItems, getResumeDocxFilename } from "@/lib/resume-docx";
import { pickResumeBasicItem } from "@/lib/resume-ai-input";
import { authorizeCareerRequest } from "@/lib/workstation/career-route";
import {
  getWorkstationBasicResumeItems,
  getWorkstationCareerProfile,
  showWorkstationResumeVersion
} from "@/lib/workstation/career-query";
import { finishWorkstationError, finishWorkstationRawResponse } from "@/lib/workstation/request-context";
import { summarizeShowRequest } from "@/lib/workstation/request-summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestSummary = summarizeShowRequest(id, "id");
  const auth = await authorizeCareerRequest(request, "resume_versions.export", "resume_version", ["export_career"], requestSummary);
  if (!auth.ok) return auth.response;

  try {
    const versionResult = await showWorkstationResumeVersion(id);
    if (!versionResult.ok) return finishWorkstationError(auth.context, { ...versionResult.error, requestSummary, targetId: id });
    const version = versionResult.data;
    if (getExportableResumeItems(version).length === 0) {
      return finishWorkstationError(auth.context, {
        code: "VALIDATION_ERROR",
        message: "The resume version has no exportable items.",
        status: 400,
        requestSummary,
        targetId: id
      });
    }

    const [profile, basicItems] = await Promise.all([getWorkstationCareerProfile(), getWorkstationBasicResumeItems()]);
    const basicItem = pickResumeBasicItem(version, basicItems);
    const filename = getResumeDocxFilename({ version, profile, basicItem });
    const buffer = await buildResumeDocx({ version, profile, basicItem });
    const response = new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${encodeAsciiFilename(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "cache-control": "private, no-store"
      }
    });
    return finishWorkstationRawResponse(auth.context, response, { requestSummary, targetId: id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unable to export the resume version.", status: 500, requestSummary, targetId: id });
  }
}

function encodeAsciiFilename(filename: string) {
  return filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
}
