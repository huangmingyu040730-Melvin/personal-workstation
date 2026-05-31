import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="设置"
        description="展示权限选项、主题设置和未来集成占位，不写入任何真实密钥或环境变量。"
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="权限选项" />
          {["公开内容默认需确认", "私密项目仅本人可见", "链接可见内容可分享"].map((item) => (
            <label key={item} className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4 last:mb-0">
              <span className="text-sm font-medium text-slate-700">{item}</span>
              <input type="checkbox" className="h-5 w-5 accent-blue-600" defaultChecked />
            </label>
          ))}
        </Card>
        <Card>
          <CardHeader title="主题设置" />
          <div className="grid gap-3">
            {["浅色专业", "深蓝工作台", "系统跟随"].map((theme, index) => (
              <button key={theme} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700">
                {index === 0 ? "✓ " : ""}{theme}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="未来集成" />
          <div className="space-y-3">
            {["Supabase 数据库", "GitHub Actions 自动化", "Notion 知识同步", "文件对象存储"].map((item) => (
              <div key={item} className="rounded-2xl bg-blue-50 p-4 text-sm font-medium text-blue-800">{item}</div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
