import { Bot } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { skills } from "@/lib/mock-data";

export default function AutomationsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Automation"
        title="自动化"
        description="AI 工作空间中的自动化占位页面，后续可连接 GitHub Actions、定时任务和通知流。"
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {skills.map((skill) => (
          <Card key={skill.id}>
            <Bot className="text-blue-700" size={26} />
            <h2 className="mt-5 text-lg font-semibold text-slate-950">{skill.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{skill.description}</p>
            <p className="mt-5 text-xs font-medium text-slate-500">自动化状态：{skill.status}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
