# Supabase Setup

## 目标

Phase 2A 只建立 Supabase Auth、数据库 schema、RLS 与本地配置基础。当前页面仍使用 mock data，真实 CRUD、文件上传和外部 API 不在本阶段实现。

## 环境变量

复制示例文件：

```bash
cp .env.example .env.local
```

填写：

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

注意：

- 不要提交 `.env.local`。
- 不要把 `service_role` key 放入本仓库或前端运行时。
- publishable key 会配合 RLS 使用，不能绕过数据库策略。

## Auth 设置

1. 在 Supabase Dashboard 创建项目。
2. 打开 Authentication。
3. 启用 Email + Password。
4. 创建一个管理员用户。
5. 复制该用户的 Auth UUID。

## 数据库迁移

运行或复制执行：

```text
supabase/migrations/0001_initial_schema.sql
```

迁移会创建：

- `admin_users`
- `profiles`
- `projects`
- `publications`
- `knowledge_notes`
- `skills`
- `skill_versions`
- `calendar_events`
- `documents`
- `activity_logs`

主要字段包括：

- `profiles`：`email`、`resume_url`、`contact`、`social_links`、研究兴趣、技能标签与头像链接。只有希望公开展示的联系方式才应进入 public profile 记录。
- `projects`：`title`、`slug`、`background`、`research_question`、`methodology`、`status`、`progress`、`is_featured`、`start_date`、标签与里程碑。
- `publications`：`slug`、`abstract`、`cover_url`、`is_featured`、`project_id` 与附件路径。
- `knowledge_notes`：`slug`、`content`、`is_featured`、`project_id` 与标签。
- `skills`：`slug`、`content`、`input_description`、`output_description`、`usage_guide`、`skill_md_content`、`repository_url`、`is_featured` 与平台列表。
- `calendar_events`：开始结束时间、事件类型、`project_id` 与可见性。
- `documents`：Storage 路径、文件信息、`related_type` 与 `related_id`。

同时会创建：

- `public.is_admin()` 管理员判断函数
- `public.set_updated_at()` 更新时间 trigger
- `visibility` 约束
- `projects.progress` 范围约束
- `slug`、`project_id`、`is_featured`、`owner_id`、`updated_at`、`status` 等常用索引
- RLS policies

## 创建管理员

在 Supabase SQL Editor 中插入管理员 UUID：

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

将示例 UUID 替换为真实 Auth 用户 ID。

## RLS 规则

公开访客：

- 只能读取 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills` 中 `visibility = 'public'` 的记录。
- 不能读取 `calendar_events`、`documents`、`activity_logs`、`skill_versions`、`admin_users`。
- 不能写入任何业务表。

普通已登录用户：

- 不会自动获得后台权限。
- 不能读取 private/unlisted 内容。
- 不能写入业务表。

管理员：

- 必须存在于 `public.admin_users`。
- 可以读取 private/unlisted 内容。
- 可以插入、更新、删除业务表数据。

## Storage 规划

后续计划创建以下 bucket：

- `documents`
- `publication-files`
- `skill-files`
- `avatars`

建议：

- bucket 不默认公开。
- 私有文件通过 RLS、签名 URL 或受控下载接口访问。
- 上传逻辑应校验当前用户是否为管理员。

## 本地开发行为

- 未配置 Supabase 时，后台页面保持 mock/development preview。
- 配置 Supabase 后，访问后台页面会跳转到 `/login`。
- 登录完成后的 `next` 参数使用内部后台路径白名单校验；非法路径、外部 URL、协议形式或 `//example.com` 都会回退到 `/dashboard`。
- 登录用户若不在 `admin_users` 中，会进入无权限状态。
- 公开首页 `/` 始终可访问，并只展示公开内容。
- 当前真实 CRUD 仍未实现，页面仍从 `src/lib/mock-data.ts` 渲染。
- Supabase 真实端到端登录验证需要配置项目 URL、publishable key、执行迁移并创建管理员后再进行。

## 验证命令

```bash
npm run lint
npm run build
```

## Troubleshooting

- 登录后仍无权限：确认 Auth 用户 UUID 已插入 `public.admin_users`。
- 后台一直跳回登录页：确认 `.env.local` 中 URL 和 publishable key 正确。
- 查询不到 private 数据：确认当前登录用户是管理员，并确认 RLS migration 已执行。
- 本地构建没有 Supabase 环境变量：这是预期行为，未配置时会保留 mock preview。
