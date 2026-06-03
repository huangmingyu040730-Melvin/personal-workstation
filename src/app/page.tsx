import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, FolderKanban, Sparkles } from "lucide-react";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { profile } from "@/lib/mock-data";
import { countPublicProjects, getFeaturedPublicProjects } from "@/lib/queries/projects";
import { countPublicPublications, getFeaturedPublicPublications } from "@/lib/queries/publications";
import { countPublicSkills, getFeaturedPublicSkills } from "@/lib/queries/skills";

function EmptyPublicState() {
  return (
    <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
      暂无公开内容。
    </p>
  );
}

export default async function HomePage() {
  const [publicProjectCount, publicPublicationCount, publicSkillCount, featuredProjects, featuredPublications, featuredSkills] = await Promise.all([
    countPublicProjects(),
    countPublicPublications(),
    countPublicSkills(),
    getFeaturedPublicProjects(2),
    getFeaturedPublicPublications(3),
    getFeaturedPublicSkills(3)
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-blue-50 text-blue-700 ring-blue-200">黄铭语个人数字工作站</Badge>
            <h1 className="text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">{profile.name}</h1>
            <p className="mt-4 text-lg font-medium text-blue-700">{profile.role}</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{profile.intro}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  {interest}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800">
                进入工作台
                <ArrowRight size={18} />
              </Link>
              <Link href="/projects" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                查看研究项目
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "公开项目", value: publicProjectCount, icon: FolderKanban },
              { title: "公开成果", value: publicPublicationCount, icon: BookOpen },
              { title: "公开 Skill", value: publicSkillCount, icon: Sparkles },
              { title: "AI 工作流", value: "Codex", icon: BrainCircuit }
            ].map((item) => (
              <Card key={item.title} className="p-5">
                <item.icon className="text-blue-700" size={26} />
                <p className="mt-6 text-3xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.title}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-10 lg:grid-cols-3 lg:px-8">
        <Card>
          <CardHeader title="精选项目" />
          <div className="space-y-4">
            {featuredProjects.length > 0 ? (
              featuredProjects.map((project) => (
                <div key={project.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
                </div>
              ))
            ) : (
              <EmptyPublicState />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="精选学术成果" />
          <div className="space-y-4">
            {featuredPublications.length > 0 ? (
              featuredPublications.map((publication) => (
                <div key={publication.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <p className="font-semibold text-slate-900">{publication.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{getPublicationTypeLabel(publication.publication_type)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{publication.summary}</p>
                </div>
              ))
            ) : (
              <EmptyPublicState />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="精选公开 Skill" />
          <div className="space-y-4">
            {featuredSkills.length > 0 ? (
              featuredSkills.map((skill) => (
                <div key={skill.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">{skill.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{skill.description}</p>
                </div>
              ))
            ) : (
              <EmptyPublicState />
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
