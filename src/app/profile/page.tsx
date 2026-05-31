import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { profile } from "@/lib/mock-data";

export default function ProfilePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Profile"
        title="个人信息"
        description="个人展示信息的前端编辑样式，后续可接入认证、数据库和头像上传。"
      />
      <div className="grid gap-5 xl:grid-cols-[0.45fr_1fr]">
        <Card className="text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-4xl font-semibold text-white">
            {profile.avatarInitials}
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">{profile.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{profile.role}</p>
        </Card>
        <Card>
          <CardHeader title="编辑资料" />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["姓名", profile.name],
              ["简介", profile.intro],
              ["教育背景", profile.education],
              ["邮箱", profile.contact.email],
              ["地区", profile.contact.location]
            ].map(([label, value]) => (
              <label key={label} className={label === "简介" || label === "教育背景" ? "md:col-span-2" : ""}>
                <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
                <textarea
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  defaultValue={value}
                  rows={label === "简介" || label === "教育背景" ? 3 : 1}
                />
              </label>
            ))}
          </div>
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-slate-700">研究兴趣</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((item) => (
                <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700">{item}</span>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-700">技能标签</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((item) => (
                <span key={item} className="rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-700">{item}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
