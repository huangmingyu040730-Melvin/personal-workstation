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
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems, getResumeVersionWithItems } from "@/lib/queries/resume";
import { buildResumeAiInputContext, pickResumeBasicItem, type ResumeAiInputEntry } from "@/lib/resume-ai-input";
import { getTargetKeywords } from "@/lib/resume-quality";

export default async function ResumeVersionJdReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [version, publicProfile, basicItems] = await Promise.all([
    getResumeVersionWithItems(id),
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);

  if (!version) {
    notFound();
  }

  const targetKeywords = getTargetKeywords(version);
  const profile = publicProfile ?? getProfileFallback();
  const basicItem = pickResumeBasicItem(version, basicItems);
  const reviewContext = buildResumeAiInputContext({ version, profile, basicItem, targetKeywords });
  const visibleItemCount = reviewContext.sections.reduce((count, section) => count + section.entries.length, 0);
  const profileRows = Object.entries(reviewContext.profile);
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
                <InfoRow label="已选素材" value={`${visibleItemCount} 条`} />
                <InfoRow label="目标关键词" value={targetKeywords.length > 0 ? targetKeywords.join("、") : "未设置"} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="版本内容概览" description="这里完整展示送入 AI 的同源内容，不包含附件或后台数据。" action={<ShieldCheck size={18} className="text-emerald-700" />} />
              {visibleItemCount > 0 || profileRows.length > 0 ? (
                <div className="space-y-4">
                  {profileRows.length > 0 ? (
                    <section className="rounded-2xl bg-slate-50 p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="bg-white text-slate-600 ring-slate-200">profile</Badge>
                        <p className="font-semibold text-slate-950">顶部个人信息</p>
                      </div>
                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        {profileRows.map(([key, value]) => (
                          <div key={key} className="rounded-xl bg-white px-3 py-2">
                            <dt className="text-xs text-slate-400">{getProfileFieldLabel(key)}</dt>
                            <dd className="mt-1 leading-6 text-slate-700">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ) : null}

                  {reviewContext.sections.map((section) => (
                    <section key={section.key} className="rounded-2xl bg-slate-50 p-3">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge className="bg-white text-slate-600 ring-slate-200">{section.key}</Badge>
                        <h2 className="text-sm font-semibold text-slate-950">{section.label}</h2>
                        <span className="text-xs text-slate-500">{section.entries.length} 条</span>
                      </div>
                      <div className="space-y-3">
                        {section.entries.map((entry) => (
                          <ResumeAiInputEntryCard key={entry.id} entry={entry} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">当前版本还没有展示中的正文素材。建议先返回编辑页选择素材。</p>
              )}
            </Card>
          </div>

          <ResumeJdReviewForm versionId={version.id} targetRole={version.target_role} targetKeywords={targetKeywords} visibleItemCount={visibleItemCount} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeAiInputEntryCard({ entry }: { entry: ResumeAiInputEntry }) {
  const meta = [entry.date, entry.subtitle].filter(Boolean).join(" · ");

  return (
    <article className="rounded-2xl bg-white p-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-950">{entry.title || "未命名素材"}</h3>
        {meta ? <p className="text-xs leading-5 text-slate-500">{meta}</p> : null}
      </div>
      {entry.summary ? <p className="mt-2 text-sm leading-6 text-slate-700">{entry.summary}</p> : null}
      {entry.detailLines.length > 0 ? (
        <div className="mt-2 space-y-1">
          {entry.detailLines.map((line) => (
            <p key={line} className="text-sm leading-6 text-slate-700">{line}</p>
          ))}
        </div>
      ) : null}
      {entry.bullets.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {entry.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {entry.tokens ? <p className="mt-2 text-xs leading-5 text-slate-500">工具 / 方法：{entry.tokens}</p> : null}
    </article>
  );
}

function getProfileFieldLabel(key: string) {
  const labels: Record<string, string> = {
    name: "姓名",
    headline: "一句话定位",
    gender: "性别",
    age: "年龄",
    phone: "电话",
    email: "邮箱",
    location: "所在地",
    website: "个人网站",
    socialLinks: "社交链接"
  };

  return labels[key] ?? key;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
