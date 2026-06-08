import { updateProfileAction } from "@/actions/profile";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/forms/profile-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getEditableProfile } from "@/lib/queries/profile";

export default async function DashboardProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, profile] = await Promise.all([searchParams, getEditableProfile()]);
  const saved = params.saved === "1";

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Profile"
          title="个人信息"
          description="维护公开 About 页面和个人研究工作站中展示的基础信息。"
        />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="公开资料边界"
                description="这些信息会影响公开 About 页面。请只填写愿意对外展示的内容。"
                items={[
                  "contact 和 social_links 只填写可公开信息。",
                  "不要填写私人手机号、私人住址、密钥或内部账号。",
                  "后台管理员资料不等于 Supabase Auth 账号信息。"
                ]}
              />
              <AdminFormHelpCard
                title="展示建议"
                tone="slate"
                items={[
                  "headline 保持一句话定位即可。",
                  "研究方向和技能标签用逗号或换行分隔。",
                  "关闭公开展示后，About 页面会使用安全 fallback 文案。"
                ]}
              />
            </>
          }
        >
          <ProfileForm action={updateProfileAction} profile={profile} error={getFormError(params)} saved={saved} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
