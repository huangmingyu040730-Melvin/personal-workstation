import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicSkillCard } from "@/components/public/public-content-cards";
import { buildPublicListingHref, PublicFilterChipGroup, PublicListingControls, PublicListingEmptyState, PublicListingHero } from "@/components/public/public-listing-shell";
import { PublicShell } from "@/components/public/public-shell";
import type { SkillRecord } from "@/lib/content-types";
import { skillCategories, skillStatuses } from "@/lib/content-options";
import { getPublicSkills } from "@/lib/queries/skills";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Skill 库",
  description: "浏览公开 AI Skill、研究工作流、写作流程和数据分析能力说明。",
  path: "/skills"
});

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesSkillKeyword(skill: SkillRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  return [skill.name, skill.description, skill.content, skill.category, skill.status, skill.current_version, ...(skill.platforms ?? [])]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN")
    .includes(keyword);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export default async function PublicSkillsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = params.status ?? "all";
  const category = params.category ?? "all";
  const platform = params.platform ?? "all";
  const currentFilters = { q, status, category, platform };
  const allSkills = await getPublicSkills();
  const categories = uniqueSorted([...skillCategories, ...allSkills.map((skill) => skill.category)]);
  const platforms = uniqueSorted(allSkills.flatMap((skill) => skill.platforms ?? []));
  const skills = allSkills
    .filter((skill) => status === "all" || skill.status === status)
    .filter((skill) => category === "all" || skill.category === category)
    .filter((skill) => platform === "all" || skill.platforms.includes(platform))
    .filter((skill) => matchesSkillKeyword(skill, q));
  const hasActiveFilters = Boolean(q.trim()) || status !== "all" || category !== "all" || platform !== "all";

  return (
    <PublicShell>
      <PublicListingHero
        eyebrow="AI Skills"
        title="公开 Skill 库"
        description="公开展示适合分享的 AI 辅助研究、写作、数据分析和知识管理工作流说明。这里不是下载入口，不展示私密附件或 Skill package。"
        stats={[
          { label: "公开 Skill", value: allSkills.length },
          { label: "能力分类", value: categories.length },
          { label: "筛选结果", value: skills.length },
          { label: "平台维度", value: platforms.length }
        ]}
      />
      <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
        <PublicListingControls count={skills.length} active={hasActiveFilters} clearHref="/skills" label="公开 Skill">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
            {platform !== "all" ? <input type="hidden" name="platform" value={platform} /> : null}
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
              <input name="q" defaultValue={q} placeholder="搜索 Skill 名称、说明、平台..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-blue-300" />
            </label>
            <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="all">全部状态</option>
              {skillStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select name="category" defaultValue={category} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="all">全部分类</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className="h-10 rounded-2xl bg-navy-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-800">浏览</button>
          </form>
          <PublicFilterChipGroup
            label="按平台浏览"
            options={[
              { label: "全部平台", href: buildPublicListingHref("/skills", currentFilters, { platform: "all" }), active: platform === "all" },
              ...platforms.map((item) => ({ label: item, href: buildPublicListingHref("/skills", currentFilters, { platform: item }), active: platform === item }))
            ]}
          />
          <PublicFilterChipGroup
            label="能力分类"
            options={[
              { label: "全部分类", href: buildPublicListingHref("/skills", currentFilters, { category: "all" }), active: category === "all" },
              ...categories.map((item) => ({ label: item, href: buildPublicListingHref("/skills", currentFilters, { category: item }), active: category === item }))
            ]}
          />
        </PublicListingControls>

        {skills.length === 0 ? (
          <PublicListingEmptyState title="暂无符合条件的公开 Skill" description="当前筛选没有匹配的 public Skill。可以清空筛选，或返回列表查看全部公开 Skill。" actionHref="/skills" actionLabel="清空筛选" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {skills.map((skill) => (
              <PublicSkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
