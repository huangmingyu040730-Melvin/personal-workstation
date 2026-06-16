import { Bot } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function AutomationsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Automation"
        title="自动化（已暂停）"
        description="Agent CEO / 自动化扩张线已暂停。本页是早期占位，不作为当前产品入口维护。"
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <Bot className="text-blue-700" size={26} />
          <CardHeader
            title="当前处理方式"
            description="可复用流程、Prompt、操作手册和能力包继续沉淀到 Skill 库。"
          />
        </Card>
        <Card>
          <CardHeader
            title="本阶段不做"
            description="不新增自动化中心、任务中心、runner、通知流或外部集成主线。"
          />
        </Card>
        <Card>
          <CardHeader
            title="维护边界"
            description="后续只做既有资产模块的 bugfix、明显 UX polish 和文档同步。"
          />
        </Card>
      </div>
    </AppShell>
  );
}
