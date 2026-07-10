import { pickResumeBasicItem } from "@/lib/resume-ai-input";
import { analyzeResumeVersionQuality } from "@/lib/resume-quality";
import { authorizeCareerRequest } from "@/lib/workstation/career-route";
import {
  getWorkstationBasicResumeItems,
  getWorkstationCareerProfile,
  showWorkstationResumeVersion
} from "@/lib/workstation/career-query";
import { finishWorkstationError, finishWorkstationResponse } from "@/lib/workstation/request-context";
import { summarizeShowRequest } from "@/lib/workstation/request-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestSummary = summarizeShowRequest(id, "id");
  const auth = await authorizeCareerRequest(request, "resume_versions.quality", "resume_version", ["read_career"], requestSummary);
  if (!auth.ok) return auth.response;

  try {
    const versionResult = await showWorkstationResumeVersion(id);
    if (!versionResult.ok) return finishWorkstationError(auth.context, { ...versionResult.error, requestSummary, targetId: id });
    const [profile, basicItems] = await Promise.all([getWorkstationCareerProfile(), getWorkstationBasicResumeItems()]);
    const version = versionResult.data;
    const report = analyzeResumeVersionQuality({
      version,
      versionItems: version.resume_version_items,
      profile,
      basicItem: pickResumeBasicItem(version, basicItems)
    });
    return finishWorkstationResponse(auth.context, report, { requestSummary, targetId: id });
  } catch {
    return finishWorkstationError(auth.context, { code: "INTERNAL_ERROR", message: "Unexpected resume quality analysis error.", status: 500, requestSummary, targetId: id });
  }
}
