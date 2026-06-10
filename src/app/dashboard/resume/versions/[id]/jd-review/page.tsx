import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { ResumeJdReviewForm } from "@/components/forms/resume-jd-review-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderPublicInfo } from "@/lib/ai-provider";
import { getResumeVersionWithItems } from "@/lib/queries/resume";
import { buildResumeJdReviewContext } from "@/lib/resume-jd-review";
import { getTargetKeywords } from "@/lib/resume-quality";

export default async function ResumeVersionJdReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const version = await getResumeVersionWithItems(id);

  if (!version) {
    notFound();
  }

  const reviewContext = buildResumeJdReviewContext(version, version.resume_version_items);
  const targetKeywords = getTargetKeywords(version);
  const aiProvider = getAiProviderPublicInfo();

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="AI JD Review"
          title="AI JD 简历优化"
          description="粘贴目标岗位 JD，系统将基于当前简历版本分析匹配度、关键词缺口和可优化经历。AI 只生成建议，不会自动覆盖简历内容。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/resume/versions/${version.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回详情
              </Link>
              <Link href={`/dashboard/resume/versions/${version.id}/preview`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Eye size={16} />
                预览简历
              </Link>
              <Link href={`/dashboard/resume/jd-reviews?versionId=${version.id}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                历史记录
              </Link>
            </div>
          }
        />

        <AdminSecurityNote>
          AI 输入只包含当前简历版本中已选择展示的素材、目标岗位设置和你粘贴的 JD；不会发送 Documents、Storage 路径、signed URL、Access Requests、Access Grants、管理员邮箱、Auth UUID 或任何密钥。
        </AdminSecurityNote>

        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="使用边界"
                description="这是投递前的辅助检查，不是自动改写系统。"
                items={[
                  "AI 只生成建议，不会自动写回 Resume Items。",
                  "不要粘贴包含客户隐私、内部文件或未公开敏感信息的 JD 附件内容。",
                  "建议人工复核所有 bullet，尤其是数字、范围和成果表达。",
                  "如果缺少事实或数据，AI 应提示补充，而不是替你编造。"
                ]}
              />
              <AdminFormHelpCard
                title="配置提示"
                tone="slate"
                description={`生产环境需要在 Vercel 中配置 AI_API_KEY，或继续使用 OPENAI_API_KEY。当前 AI Provider：${aiProvider.providerLabel}；当前模型：${aiProvider.model}。未配置 API Key 时页面仍可打开，但不能提交分析。`}
              />
            </>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
            <Card>
              <CardHeader title="当前简历版本" description="AI 将仅基于当前版本已选素材做分析。" action={<Sparkles size={18} className="text-blue-700" />} />
              <dl className="space-y-3 text-sm">
                <InfoRow label="版本名称" value={version.title} />
                <InfoRow label="目标岗位" value={version.target_role || "未设置"} />
                <InfoRow label="已选素材" value={`${reviewContext.items.length} 条`} />
                <InfoRow label="目标关键词" value={targetKeywords.length > 0 ? targetKeywords.join("、") : "未设置"} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="版本内容概览" description="这里只展示送入 AI 的摘要级内容，不包含附件或后台数据。" action={<ShieldCheck size={18} className="text-emerald-700" />} />
              {reviewContext.items.length > 0 ? (
                <div className="space-y-3">
                  {reviewContext.items.slice(0, 6).map((item) => (
                    <div key={`${item.section}-${item.title}`} className="rounded-2xl bg-slate-50 p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge className="bg-white text-slate-600 ring-slate-200">{item.section}</Badge>
                        <p className="font-semibold text-slate-950">{item.title}</p>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">{[item.organization, item.roleTitle, item.summary, item.bullets[0]].filter(Boolean).join(" · ") || "暂无摘要。"}</p>
                    </div>
                  ))}
                  {reviewContext.items.length > 6 ? <p className="text-xs text-slate-500">还有 {reviewContext.items.length - 6} 条素材会参与分析。</p> : null}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">当前版本还没有展示中的正文素材。建议先返回编辑页选择素材。</p>
              )}
            </Card>
          </div>

          <ResumeJdReviewForm versionId={version.id} targetRole={version.target_role} targetKeywords={targetKeywords} visibleItemCount={reviewContext.items.length} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
