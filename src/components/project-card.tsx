import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { StatusBadge, VisibilityBadge } from "./badge";
import { Card } from "./card";
import { Progress } from "./progress";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{project.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-500">项目进度</span>
          <span className="font-semibold text-slate-900">{project.progress}%</span>
        </div>
        <Progress value={project.progress} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="text-xs text-slate-500">更新于 {formatDate(project.updatedAt)}</span>
        <VisibilityBadge visibility={project.visibility} />
      </div>
    </Card>
  );
}
