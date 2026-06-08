import Link from "next/link";
import { ArrowRight, BookOpen, Bot, FileText, Layers3 } from "lucide-react";
import { StatusBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { Progress } from "@/components/progress";
import type { KnowledgeNoteRecord, ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDate, formatRelative } from "@/lib/format";

function FeaturedPill() {
  return <span className="rounded-full bg-earth-100 px-2.5 py-1 text-xs font-medium text-earth-800">精选</span>;
}

function TagList({ tags, tone = "slate", limit = 4 }: { tags: string[]; tone?: "slate" | "earth" | "sage"; limit?: number }) {
  const visibleTags = tags.slice(0, limit);
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);
  const toneClass = tone === "earth" ? "bg-earth-50 text-earth-800" : tone === "sage" ? "bg-sage-50 text-sage-700" : "bg-stone-100 text-stone-600";

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {visibleTags.map((tag) => (
        <span key={tag} className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs ${toneClass}`}>
          {tag}
        </span>
      ))}
      {hiddenCount > 0 ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">+{hiddenCount}</span> : null}
    </div>
  );
}

export function PublicProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block h-full">
      <Card className="finance-card-pattern public-reveal flex h-full flex-col border-earth-100 bg-white/[.88] shadow-soft transition duration-300 hover:-translate-y-1 hover:border-earth-300 hover:shadow-warm">
        <div className="mb-3 flex flex-wrap gap-2">
          {project.is_featured ? <FeaturedPill /> : null}
          <StatusBadge status={project.status} />
        </div>
        <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-earth-950">{project.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{project.summary}</p>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-stone-500">公开进度</span>
            <span className="font-semibold text-earth-950">{project.progress}%</span>
          </div>
          <Progress value={project.progress} tone="earth" />
        </div>
        <TagList tags={project.tags} tone="earth" />
        <div className="mt-auto flex items-center justify-between border-t border-earth-100 pt-4">
          <span className="text-xs text-stone-500">更新于 {formatRelative(project.updated_at)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-earth-800">详情 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

export function PublicPublicationCard({ publication }: { publication: PublicationRecord }) {
  return (
    <Link href={`/publications/${publication.slug}`} className="group block h-full">
      <Card className="finance-card-pattern public-reveal flex h-full flex-col border-earth-100 bg-white/[.88] shadow-soft transition duration-300 hover:-translate-y-1 hover:border-earth-300 hover:shadow-warm">
        <div className="mb-3 flex flex-wrap gap-2">
          {publication.is_featured ? <FeaturedPill /> : null}
          <span className="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">{getPublicationTypeLabel(publication.publication_type)}</span>
        </div>
        <div className="flex gap-3">
          <FileText className="mt-1 shrink-0 text-earth-700" size={18} />
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-earth-950">{publication.title}</h2>
            <p className="mt-1 text-sm text-stone-500">{formatDate(publication.published_on)} · 更新于 {formatRelative(publication.updated_at)}</p>
          </div>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{publication.summary}</p>
        <TagList tags={publication.tags} tone="earth" />
        <div className="mt-auto flex items-center justify-end border-t border-earth-100 pt-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-earth-800">查看成果 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

export function PublicSkillCard({ skill }: { skill: SkillRecord }) {
  return (
    <Link href={`/skills/${skill.slug}`} className="group block h-full">
      <Card className="finance-card-pattern public-reveal relative flex h-full flex-col overflow-hidden border-earth-100 bg-white/[.88] shadow-soft transition duration-300 hover:-translate-y-1 hover:border-sage-600/40 hover:shadow-warm">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-sage-100/70" />
        <div className="relative">
          <div className="mb-4 flex flex-wrap gap-2">
            {skill.is_featured ? <FeaturedPill /> : null}
            <StatusBadge status={skill.status} />
          </div>
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-earth-900 text-paper-50">
              <Bot size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-earth-950">{skill.name}</h2>
              <p className="mt-1 text-sm text-stone-500">{skill.category}</p>
            </div>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{skill.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {skill.platforms.slice(0, 4).map((platform) => (
              <span key={platform} className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">
                <Layers3 size={12} />
                {platform}
              </span>
            ))}
            {skill.platforms.length > 4 ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">+{skill.platforms.length - 4}</span> : null}
          </div>
        </div>
        <div className="relative mt-auto flex items-center justify-between border-t border-earth-100 pt-4">
          <span className="text-xs text-stone-500">{skill.current_version ?? "未设版本"} · {formatRelative(skill.updated_at)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-earth-800">详情 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

export function PublicKnowledgeCard({ note }: { note: KnowledgeNoteRecord }) {
  return (
    <Link href={`/knowledge/${note.slug}`} className="group block h-full">
      <Card className="finance-card-pattern public-reveal flex h-full flex-col border-earth-100 bg-white/[.88] shadow-soft transition duration-300 hover:-translate-y-1 hover:border-sage-600/40 hover:shadow-warm">
        <div className="flex gap-3">
          <BookOpen className="mt-1 shrink-0 text-sage-700" size={18} />
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-earth-950">{note.title}</h2>
            <p className="mt-1 text-sm text-stone-500">{note.category} · 更新于 {formatRelative(note.updated_at)}</p>
          </div>
        </div>
        {note.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{note.excerpt}</p> : null}
        <TagList tags={note.tags} tone="sage" />
        <div className="mt-auto flex items-center justify-end border-t border-earth-100 pt-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-sage-700">阅读 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}
