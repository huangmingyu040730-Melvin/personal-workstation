import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BrainCircuit, Database, GraduationCap, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicSectionHeader, PublicShell } from "@/components/public/public-shell";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "关于我 | 黄铭语",
  description: "了解黄铭语的研究方向、公开研究工作站定位，以及公开内容和私密后台的边界。",
  path: "/about"
});

const researchDirections = [
  "投资研究与私募基金观察",
  "量化策略与数据分析",
  "AI 工具与自动化工作流",
  "知识管理与研究方法",
  "学术阅读、报告写作与长期沉淀"
];

const publicEntrances = [
  { title: "研究项目", description: "公开研究主题、研究问题、方法框架与阶段性进展。", href: "/projects" },
  { title: "学术成果", description: "公开研究报告、策略分析、论文草稿和阅读综述。", href: "/publications" },
  { title: "Skill 库", description: "面向研究、写作、数据和知识管理的公开 AI Skill。", href: "/skills" },
  { title: "知识文章", description: "公开笔记、方法整理、工具使用和阅读沉淀。", href: "/knowledge" }
];

export default function AboutPage() {
  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="About"
        title="关于黄铭语"
        description="学生，关注投资研究、量化策略、AI 辅助研究流程和个人知识系统。这个网站是我的公开研究工作站，也是私密数字资产后台的外部窗口。"
      />

      <section className="mx-auto grid max-w-[1536px] gap-6 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 xl:px-12">
        <Card className="finance-card-pattern border-earth-100 bg-white/[.86] shadow-soft">
          <CardHeader title="个人定位" />
          <div className="space-y-4 text-sm leading-7 text-stone-600">
            <p>
              我关注资产管理、量化投资，以及人工智能在研究与知识工作流中的应用。公开站点会逐步沉淀适合对外分享的项目、成果、文章和 Skill。
            </p>
            <p>
              如果希望沟通某条研究内容、申请查看受限材料，或了解工作站后续开放计划，可以通过访问申请表单留下必要信息。当前页面不编造或硬编码额外联系方式。
            </p>
          </div>
        </Card>

        <Card className="finance-card-pattern border-earth-100 bg-white/[.86] shadow-soft">
          <CardHeader title="这个网站是什么" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: GraduationCap, title: "公开研究工作站", description: "对外展示公开项目、成果、知识文章和 Skill。", tone: "bg-earth-50 text-earth-700" },
              { icon: Database, title: "私密数字资产后台", description: "管理员后台管理全部内容、文件和后续自动化。", tone: "bg-sage-50 text-sage-700" },
              { icon: ShieldCheck, title: "清晰权限边界", description: "私密内容、文件入口与短时下载链接不进入公开页面。", tone: "bg-stone-100 text-stone-700" },
              { icon: BrainCircuit, title: "受限访问规划", description: "部分内容会以申请和授权方式逐步开放，但不会开放私密文件和后台能力。", tone: "bg-earth-100 text-earth-800" }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-earth-100 bg-paper-50 p-4 transition hover:border-earth-300">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon size={20} />
                </div>
                <p className="mt-3 font-semibold text-earth-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 pb-10 lg:px-10 xl:px-12">
        <PublicSectionHeader
          eyebrow="Research Focus"
          title="研究方向"
          description="这些方向会逐步映射到公开项目、成果、知识文章和可复用 Skill。"
        />
        <div className="grid gap-3 md:grid-cols-5">
          {researchDirections.map((direction) => (
            <div key={direction} className="finance-card-pattern rounded-3xl border border-earth-100 bg-white/[.86] p-4 text-sm font-medium leading-6 text-stone-700 shadow-soft transition hover:-translate-y-0.5 hover:border-earth-300">
              {direction}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 pb-14 lg:px-10 xl:px-12">
        <PublicSectionHeader eyebrow="Explore" title="当前公开内容入口" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {publicEntrances.map((item) => (
            <Link key={item.href} href={item.href} className="finance-card-pattern group rounded-3xl border border-earth-100 bg-white/[.86] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-earth-300 hover:shadow-warm">
              <p className="font-semibold text-earth-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-earth-800">
                进入浏览 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
