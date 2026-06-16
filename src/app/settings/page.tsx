import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="设置（占位已暂停）"
        description="当前没有独立 dashboard settings 模块。本页是早期占位，不作为主导航入口维护。"
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="当前真实入口"
            description="公开资料在 Profile 维护，文件边界在 Documents 维护，站点 URL 和 AI Provider 通过环境变量配置。"
          />
        </Card>
        <Card>
          <CardHeader
            title="本阶段不做"
            description="不新增主题切换系统、通知系统、外部集成配置面板或自动化配置中心。"
          />
        </Card>
        <Card>
          <CardHeader
            title="维护边界"
            description="v1.1 后默认只做 bugfix、明显 UX polish、文档同步和安全边界复查。"
          />
        </Card>
      </div>
    </AppShell>
  );
}
