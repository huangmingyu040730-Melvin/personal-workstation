import { Bot, Layers3 } from "lucide-react";
import type { Skill } from "@/lib/types";
import { StatusBadge, VisibilityBadge } from "./badge";
import { Card } from "./card";

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-blue-100 to-violet-100" />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{skill.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{skill.category}</p>
            </div>
          </div>
          <StatusBadge status={skill.status} />
        </div>
        <p className="text-sm leading-6 text-slate-600">{skill.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {skill.platforms.map((platform) => (
            <span key={platform} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <Layers3 size={12} />
              {platform}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{skill.version}</span>
            <span className="mx-2">·</span>
            {skill.updatedAt}
          </div>
          <VisibilityBadge visibility={skill.visibility} />
        </div>
      </div>
    </Card>
  );
}
