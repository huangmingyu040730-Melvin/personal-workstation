import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SkillCard } from "@/components/skill-card";
import { skills } from "@/lib/mock-data";

export default function SkillsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Skills Library"
        title="Skill 库"
        description="管理面向研究、客户沟通和自动化生产的 AI Skill。第一阶段使用 mock data，后续可接入运行日志、版本和权限。"
      />
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </AppShell>
  );
}
