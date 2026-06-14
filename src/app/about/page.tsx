import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BrainCircuit, Database, GraduationCap, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicSectionHeader, PublicShell } from "@/components/public/public-shell";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "关于我 | 黄铭语",
  description: "了解黄铭语的研究方向、公开研究工作站定位，以及公开内容和私密后台的边界。",
  path: "/about"
});

const publicEntrances = [
  { title: "研究项目", description: "公开研究主题、研究问题、方法框架与阶段性进展。", href: "/projects" },
  { title: "学术成果", description: "公开研究报告、策略分析、论文草稿和阅读综述。", href: "/publications" },
  { title: "Skill 库", description: "面向研究、写作、数据和知识管理的公开 AI Skill。", href: "/skills" },
  { title: "知识文章", description: "公开笔记、方法整理、工具使用和阅读沉淀。", href: "/knowledge" }
];

export default async function AboutPage() {
  const publicProfile = await getPublicProfile();
  const fallbackProfile = getProfileFallback();
  const profile = publicProfile ?? fallbackProfile;
  const hasPublicProfile = Boolean(publicProfile);
  const researchDirections = profile.research_interests.length > 0 ? profile.research_interests : fallbackProfile.research_interests;
  const skillTags = profile.skill_tags.length > 0 ? profile.skill_tags : fallbackProfile.skill_tags;
  const contactEntries = hasPublicProfile ? Object.entries(profile.contact ?? {}) : [];
  const socialEntries = hasPublicProfile ? Object.entries(profile.social_links ?? {}) : [];

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="About"
        title={`关于${profile.display_name}`}
        description={profile.headline ?? profile.role_title ?? "关注投资研究、量化策略、AI 辅助研究流程和个人知识系统。这个网站是我的公开研究工作站，也是私密数字资产后台的外部窗口。"}
      />

      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 2xl:px-16">
        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="个人定位" />
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>{profile.bio ?? "我关注资产管理、量化投资，以及人工智能在研究与知识工作流中的应用。公开站点会逐步沉淀适合对外分享的项目、成果、文章和 Skill。"}</p>
            {profile.role_title || profile.organization || profile.location ? (
              <dl className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
                {profile.role_title ? <div><dt className="text-xs font-semibold text-slate-400">当前角色</dt><dd className="mt-1 font-medium text-slate-800">{profile.role_title}</dd></div> : null}
                {profile.organization ? <div><dt className="text-xs font-semibold text-slate-400">组织 / 机构</dt><dd className="mt-1 font-medium text-slate-800">{profile.organization}</dd></div> : null}
                {profile.location ? <div><dt className="text-xs font-semibold text-slate-400">所在地</dt><dd className="mt-1 font-medium text-slate-800">{profile.location}</dd></div> : null}
              </dl>
            ) : null}
            {profile.education ? <p>{profile.education}</p> : null}
            <p>
              公开站点只展示已经整理并明确设为 public 的内容。未公开材料继续留在管理员后台，不通过公开页面确认是否存在。
            </p>
          </div>
        </Card>

        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="这个网站是什么" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: GraduationCap, title: "公开研究工作站", description: "对外展示公开项目、成果、知识文章和 Skill。", tone: "bg-blue-50 text-blue-700" },
              { icon: Database, title: "私密数字资产后台", description: "管理员后台管理全部内容、文件和后续自动化。", tone: "bg-violet-50 text-violet-700" },
              { icon: ShieldCheck, title: "清晰权限边界", description: "私密内容、文件入口与短时下载链接不进入公开页面。", tone: "bg-slate-100 text-slate-700" },
              { icon: BrainCircuit, title: "公开内容运营", description: "只把适合展示的研究项目、成果、知识文章和 Skill 设为 public。", tone: "bg-blue-100 text-blue-800" }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon size={20} />
                </div>
                <p className="mt-3 font-semibold text-navy-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 pb-10 lg:px-12 2xl:px-16">
        <PublicSectionHeader
          eyebrow="Research Focus"
          title="研究方向"
          description="这些方向会逐步映射到公开项目、成果、知识文章和可复用 Skill。"
        />
        <div className="grid gap-3 md:grid-cols-5">
          {researchDirections.map((direction) => (
            <div key={direction} className="public-card-motion rounded-3xl border border-slate-200 bg-white p-4 text-sm font-medium leading-6 text-slate-700 shadow-soft hover:border-blue-200">
              {direction}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 pb-10 lg:grid-cols-2 lg:px-12 2xl:px-16">
        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="技能标签" description="公开 Profile 中维护的能力关键词。" />
          <div className="flex flex-wrap gap-2">
            {skillTags.map((tag) => (
              <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">{tag}</span>
            ))}
          </div>
        </Card>
        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="公开联系与链接" description="只展示管理员明确设置为公开的联系方式和社交链接。" />
          {contactEntries.length > 0 || socialEntries.length > 0 ? (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {[...contactEntries, ...socialEntries].map(([label, value]) => (
                <div key={`${label}-${value}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="mt-1 break-words font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-slate-600">当前未公开展示联系方式。公开页面不会提供外部授权入口。</p>
          )}
        </Card>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 pb-14 lg:px-12 2xl:px-16">
        <PublicSectionHeader eyebrow="Explore" title="当前公开内容入口" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {publicEntrances.map((item) => (
            <Link key={item.href} href={item.href} className="public-card-motion group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft hover:border-blue-200">
              <p className="font-semibold text-navy-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                进入浏览 <ArrowRight className="transition group-hover:translate-x-1" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
