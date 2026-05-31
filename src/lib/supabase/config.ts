const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function hasUsableValue(value: string | undefined, placeholder: string) {
  return Boolean(value && value.trim() && value !== placeholder);
}

export const supabaseConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey
};

export const isSupabaseConfigured =
  hasUsableValue(supabaseUrl, "your_supabase_project_url") &&
  hasUsableValue(supabasePublishableKey, "your_supabase_publishable_key");

export const missingSupabaseConfigMessage =
  "当前尚未配置 Supabase 环境变量。本地仍可预览 mock data 页面，登录和权限验证需要配置 .env.local 后启用。";
