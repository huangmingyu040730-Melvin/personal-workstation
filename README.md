# 黄铭语个人数字工作站

个人数字工作站网站，用于个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase Auth、Database、RLS 基础结构
- Mock data first，真实 CRUD 与文件上传将在后续阶段接入

## 本地启动

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

检查与构建：

```bash
npm run lint
npm run build
```

## Supabase 配置

复制环境变量示例：

```bash
cp .env.example .env.local
```

填写 Supabase 项目的公开配置：

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

不要提交 `.env.local`，不要在前端项目中放入 `service_role` key。

初始化数据库：

1. 在 Supabase Dashboard 创建项目。
2. 启用 Email + Password Auth。
3. 运行 `supabase/migrations/0001_initial_schema.sql`。
4. 在 Auth 中创建管理员用户。
5. 将该用户的 UUID 插入 `public.admin_users`：

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

请将示例 UUID 替换为真实 Auth 用户 ID。

更完整的配置步骤见 `docs/supabase-setup.md`。

## 页面

- `/` 公开首页
- `/login` 管理员登录
- `/dashboard` 工作台
- `/projects` 研究项目
- `/publications` 学术成果
- `/knowledge` 知识库
- `/skills` Skill 库
- `/calendar` 日历
- `/documents` 文件中心
- `/profile` 个人信息
- `/settings` 设置
- `/automations` 自动化占位

## 权限与数据状态

- 未配置 Supabase 时，后台页面保持 mock data 开发预览，便于本地构建和视觉检查。
- 配置 Supabase 后，后台页面会要求登录，并通过 `public.admin_users` + `public.is_admin()` 判断管理员权限。
- 公开首页只展示 `visibility = "public"` 的 mock 内容。
- 当前页面仍使用 `src/lib/mock-data.ts`，尚未接入真实 CRUD、真实文件上传、真实登录后的数据写入或外部 API。

## 存储规划

后续 Supabase Storage 计划使用以下 bucket：

- `documents`
- `publication-files`
- `skill-files`
- `avatars`

这些 bucket 不应默认公开，后续需要配合 RLS、签名 URL 或受控下载接口实现权限。
