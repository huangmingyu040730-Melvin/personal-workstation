import Link from "next/link";
import { ArrowRight, BookOpen, Bot, CalendarDays, FileText, FolderKanban, Layers3 } from "lucide-react";
import { StatusBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { Progress } from "@/components/progress";
import type { KnowledgeNoteRecord, ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDate, formatRelative } from "@/lib/format";

function FeaturedPill() {
  return <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-100">精选</span>;
}

function TagList({ tags, tone = "slate", limit = 4 }: { tags: string[]; tone?: "slate" | "blue" | "green"; limit?: number }) {
  const visibleTags = tags.slice(0, limit);
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);
  const toneClass = tone === "blue" ? "bg-blue-50 text-blue-700 ring-blue-100" : tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-slate-200";

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {visibleTags.map((tag) => (
        <span key={tag} className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${toneClass}`}>
          {tag}
        </span>
      ))}
      {hiddenCount > 0 ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">+{hiddenCount}</span> : null}
    </div>
  );
}

export function PublicProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block h-full">
      <Card className="public-card-motion public-reveal relative flex h-full min-h-[340px] flex-col overflow-hidden border-slate-200 bg-white/96 p-5 shadow-[0_14px_42px_rgba(15,42,88,0.06)] hover:border-blue-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sage-600 to-transparent opacity-70" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {project.is_featured ? <FeaturedPill /> : null}
            <StatusBadge status={project.status} />
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
            <FolderKanban size={18} />
          </div>
        </div>
        <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-navy-950">{project.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.summary}</p>
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="mb-2 flex justify-between text-sm leading-6">
            <span className="text-slate-500">公开进度</span>
            <span className="font-semibold text-navy-950">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>
        <TagList tags={project.tags} tone="blue" />
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">更新于 {formatRelative(project.updated_at)}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700">查看详情 <ArrowRight className="transition group-hover:translate-x-1" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

export function PublicPublicationCard({ publication }: { publication: PublicationRecord }) {
  return (
    <Link href={`/publications/${publication.slug}`} className="group block h-full">
      <Card className="public-card-motion public-reveal flex h-full min-h-[320px] flex-col border-slate-200 bg-white/96 p-5 shadow-[0_14px_42px_rgba(15,42,88,0.06)] hover:border-blue-200">
        <div className="mb-4 flex flex-wrap gap-2">
          {publication.is_featured ? <FeaturedPill /> : null}
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">{getPublicationTypeLabel(publication.publication_type)}</span>
        </div>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-navy-950">{publication.title}</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
              <CalendarDays size={14} />
              {formatDate(publication.published_on)} · 更新于 {formatRelative(publication.updated_at)}
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{publication.summary}</p>
        {publication.abstract ? <p className="mt-2 line-clamp-2 border-l-2 border-blue-100 pl-3 text-sm leading-6 text-slate-500">{publication.abstract}</p> : null}
        <TagList tags={publication.tags} tone="blue" />
        <div className="mt-auto flex items-center justify-end border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">查看成果 <ArrowRight className="transition group-hover:translate-x-1" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

export function PublicSkillCard({ skill }: { skill: SkillRecord }) {
  return (
    <Link href={`/skills/${skill.slug}`} className="group block h-full">
      <Card className="public-card-motion public-reveal relative flex h-full min-h-[330px] flex-col overflow-hidden border-slate-200 bg-white/96 p-5 shadow-[0_14px_42px_rgba(15,42,88,0.06)] hover:border-blue-200">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue-100/60 transition duration-300 group-hover:scale-125" />
        <div className="relative">
          <div className="mb-4 flex flex-wrap gap-2">
            {skill.is_featured ? <FeaturedPill /> : null}
            <StatusBadge status={skill.status} />
          </div>
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-950 text-white">
              <Bot size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-navy-950">{skill.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{skill.category}</p>
            </div>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{skill.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {skill.platforms.slice(0, 4).map((platform) => (
              <span key={platform} className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Layers3 size={12} />
                {platform}
              </span>
            ))}
            {skill.platforms.length > 4 ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">+{skill.platforms.length - 4}</span> : null}
          </div>
        </div>
        <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="truncate text-xs text-slate-500">{skill.current_version ?? "未设版本"} · {formatRelative(skill.updated_at)}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700">详情 <ArrowRight className="transition group-hover:translate-x-1" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

export function PublicKnowledgeCard({ note }: { note: KnowledgeNoteRecord }) {
  return (
    <Link href={`/knowledge/${note.slug}`} className="group block h-full">
      <Card className="public-card-motion public-reveal flex h-full min-h-[270px] flex-col border-slate-200 bg-white/96 p-5 shadow-[0_14px_42px_rgba(15,42,88,0.06)] hover:border-blue-200">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-navy-950">{note.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{note.category} · 更新于 {formatRelative(note.updated_at)}</p>
          </div>
        </div>
        {note.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{note.excerpt}</p> : null}
        <TagList tags={note.tags} tone="blue" />
        <div className="mt-auto flex items-center justify-end border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">阅读 <ArrowRight className="transition group-hover:translate-x-1" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}
