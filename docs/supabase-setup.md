# Supabase Setup

## 目标

Phase 2A 建立 Supabase Auth、数据库 schema、RLS 与本地配置基础。Phase 2B 已完成 Projects、Knowledge Base、Skills Library 的真实 CRUD。Phase 2C 接入 Publications 真实 CRUD、Documents 文件中心与 Supabase Storage 私密上传下载。Phase 2E-A 新增访问申请记录与管理员处理状态。Phase 2E-B 新增 restricted 内容与按邮箱授权的只读访问最小闭环。Calendar CRUD、Profile 真实编辑、附件对外授权下载和外部 API 尚未实现。

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
6. 如需使用外部授权访问登录，在 Supabase Auth URL Configuration 中允许生产域名的 `/viewer/callback` 回调地址。

## 数据库迁移

先运行或复制执行：

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

- `profiles`：独立内容 ID、`email`、`resume_url`、`contact`、`social_links`、研究兴趣、技能标签与头像链接。只有希望公开展示的联系方式才应进入 public profile 记录。
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
- `slug`、`project_id`、`is_featured`、`updated_at`、`status` 等常用索引；私密后台表保留 `owner_id` 或 `actor_id` 索引用于后续审计
- RLS policies

隐私边界：

- 公开可读取内容表 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills` 不保存管理员 Supabase Auth UUID。
- 管理员身份只在私密的 `admin_users` 表中管理。
- 公开访问通过 `visibility = 'public'` 控制。
- 管理写权限通过 `public.is_admin()` 控制。
- `calendar_events`、`documents`、`activity_logs` 不向匿名访客开放读取，可保留 `owner_id` 或 `actor_id` 用于后续后台归属和审计。

再运行或复制执行：

```text
supabase/migrations/0002_grant_api_table_privileges.sql
```

`0002` 会为 Supabase API 使用的角色补充最小表级 privileges：

- `anon` 仅获得 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills` 的 `select` 权限。
- `authenticated` 获得 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills`、`skill_versions`、`calendar_events`、`documents`、`activity_logs` 的 `select`、`insert`、`update`、`delete` 权限。
- 不向 `anon` 或 `authenticated` 授予 `admin_users` 的读取或写入权限。

GRANT 与 RLS 是两层权限控制：

- GRANT 决定 API 角色是否有资格访问某张表。
- RLS policy 决定该角色能访问哪些记录、能否写入对应记录。
- `0002` 只打开表级入口，不绕过 `visibility = 'public'` 或 `public.is_admin()`。
- 普通已登录用户即使属于 `authenticated`，仍不能通过 RLS 写入后台内容。

生产 Supabase 项目已在 Phase 2C 验收中执行 0003。新建环境、重建环境或 Preview 环境如需真实文件能力，需要再运行或复制执行：

```text
supabase/migrations/0003_publications_documents_storage.sql
```

`0003` 会创建或更新私密 Storage bucket：

- bucket id/name：`workspace-files`
- `public = false`
- 文件大小限制：20 MB
- 允许 MIME type：PDF、Word、Excel、PowerPoint、Markdown、文本、CSV、PNG、JPEG、WebP

并为 `storage.objects` 创建限定 `bucket_id = 'workspace-files'` 的管理员 policies：

- 管理员可读取 workspace-files 对象；
- 管理员可上传 workspace-files 对象；
- 管理员可更新 workspace-files 对象；
- 管理员可删除 workspace-files 对象；
- 匿名访客与非管理员登录用户不能读取或修改该 bucket。

注意：

- 0003 已在当前生产 Supabase 项目执行并通过真实上传、下载、关联、删除保护和清理验收。
- 其他环境未执行 0003 前，Documents 页面可以构建和打开，但真实上传、下载、删除 Storage 对象会失败。
- 0003 不向 `anon` 或 `authenticated` 授予 `admin_users` 权限。
- 普通网页运行继续使用 publishable key 和登录管理员身份，不使用 `service_role`。

Phase 2E-A 新增访问申请流程。合并对应代码后，新建环境或生产环境需要继续运行：

```text
supabase/migrations/0004_access_requests.sql
```

`0004` 会创建：

- `public.access_requests`
- 状态字段 `pending`、`approved`、`rejected`
- `created_at`、`updated_at`、`reviewed_at`
- 按 `status`、`created_at`、`reviewed_at` 的常用索引
- `updated_at` trigger
- RLS policies 与最小 GRANT

访问申请权限边界：

- `anon` 仅获得 `insert` 表级权限，用于公开 `/access-request` 表单提交。
- `anon` 不获得 `select`、`update`、`delete`，不能读取或修改已提交申请。
- `authenticated` 仅获得 `select`、`update` 表级权限。
- 管理员读取和更新申请仍由 RLS 中的 `public.is_admin()` 控制。
- 不向 `anon` 或 `authenticated` 授予 `admin_users` 权限。
- Phase 2E-A 只记录申请与后台处理状态，不自动开放受限内容，不生成邀请链接。

Phase 2E-B 新增受限内容授权。合并对应代码后，新建环境或生产环境需要继续运行：

```text
supabase/migrations/0005_restricted_content_access.sql
```

`0005` 会：

- 将 `projects`、`publications`、`knowledge_notes`、`skills` 的 visibility check 扩展为 `public`、`unlisted`、`restricted`、`private`。
- 创建 `public.content_access_grants`，记录被授权邮箱、内容类型、内容 ID、状态、可选有效期和管理员备注。
- 创建 `public.has_content_access(content_type, content_id)`，由 RLS 判断当前登录邮箱是否拥有 active 且未过期的授权。
- 允许管理员管理授权记录。
- 允许 authenticated 用户只读取属于自己邮箱的 active grants。
- 不向 anon 开放授权记录读取或写入。
- 更新四类内容表的 select policy：public 对所有访客可读；restricted 仅管理员或匹配授权的登录邮箱可读；private 仍仅管理员可读；unlisted 本阶段不扩展公开访问。

权限边界：

- 0005 不向 `anon` 或 `authenticated` 授予 `admin_users` 权限。
- 0005 不开放 Documents、Storage、附件下载或 signed URL。
- 外部用户登录使用 Supabase 邮箱 OTP / magic link，只获得普通 authenticated session；后台 `/dashboard` 仍要求 `public.is_admin()`。
- 普通未授权登录用户不能读取任意 restricted 内容，也不能新增、编辑、删除业务表。

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
- 可以向 `access_requests` 提交访问申请。
- 不能读取 `calendar_events`、`documents`、`activity_logs`、`skill_versions`、`admin_users`。
- 不能读取、更新或删除访问申请记录；除访问申请提交外，不能写入任何业务表。
- 公开可读记录不会携带管理员 Auth 用户 UUID 字段。
- 表级访问需要执行 `0002_grant_api_table_privileges.sql`，RLS 才能在 API 请求中继续判断行级权限。

普通已登录用户：

- 不会自动获得后台权限。
- 不能读取 private/unlisted 内容。
- 只有邮箱匹配 active 且未过期授权时，才能读取对应 restricted 内容详情。
- 不能写入业务表。

管理员：

- 必须存在于 `public.admin_users`。
- 可以读取 private/unlisted 内容。
- 可以读取和管理 restricted 内容与访问授权。
- 可以插入、更新、删除业务表数据。
- 可以查看访问申请，并更新处理状态和管理员备注。

## Storage 与文件安全

Phase 2C 使用：

- `workspace-files`

安全规则：

- bucket 不公开。
- 上传前 Server Action 必须验证登录与管理员权限。
- 文件二进制不经过 Server Action 或 Vercel Function；浏览器使用当前管理员 Supabase Auth 会话直接上传到 private bucket。
- Server Actions 只负责 prepare/finalize：校验 metadata、生成 UUID 路径、确认对象存在、写入 documents 与 activity_logs。
- Storage policy 继续以 `public.is_admin()` 作为最终防线。
- 文件路径由服务端生成，使用 document UUID 和清理后的文件名，避免路径穿越与同名覆盖。
- 上传使用 `upsert: false`。
- 服务端同时校验扩展名、MIME type 和 20 MB 大小限制。
- 管理员下载通过 60 秒 signed URL，不保存 signed URL，不在公开页面输出。
- 附件即使关联到 public Publication，本轮仍保持私密。
- 删除文件时先删除 Storage 对象，再删除 documents 记录；失败时向管理员显示中文提示。

## Phase 2B / 2C 真实 CRUD

- `projects`、`knowledge_notes`、`skills` 和 `skill_versions` 使用现有 `0001_initial_schema.sql` 字段实现 CRUD。
- `publications` 使用现有 `0001_initial_schema.sql` 字段实现 CRUD，不新增复杂中间表。
- `documents.related_type` + `documents.related_id` 用于关联 Publication、Project 或 Skill。
- Publication 详情页展示关联附件；如果仍有关联附件，Publication 删除会被阻止。
- `activity_logs` 记录创建、更新、删除和 Skill 版本新增等核心操作。
- Phase 2C 新增记录 Publication 创建/更新/删除、Document 上传/下载/删除等后台摘要日志。
- 真实 Supabase 项目已执行过 `0001_initial_schema.sql`；`0002_grant_api_table_privileges.sql` 只补充 API 角色表级 GRANT，不新增业务字段或能力。
- `0003_publications_documents_storage.sql` 只补充 private Storage bucket 与 Storage policies。
- Server Actions 使用登录管理员身份写入，不使用 `service_role`。
- RLS 继续作为最终权限边界。
- Markdown 内容以安全文本方式渲染，不允许原始 HTML 注入。

## 本地开发行为

- 未配置 Supabase 时，已接入页面保留 mock/development preview。
- 配置 Supabase 后，访问后台页面会跳转到 `/login`。
- 登录完成后的 `next` 参数使用内部后台路径白名单校验；非法路径、外部 URL、协议形式或 `//example.com` 都会回退到 `/dashboard`。
- 登录用户若不在 `admin_users` 中，会进入无权限状态。
- 公开首页 `/` 始终可访问，并只展示公开内容。
- Projects、Knowledge Base、Skills Library、Publications 已接入真实 CRUD。
- Documents 已接入真实文件记录、私密上传、短时签名下载和删除流程。
- Access Requests 已接入真实提交、列表、详情与处理状态更新流程。
- Restricted Access 依赖 0005 migration；未执行 0005 时无法保存 `restricted` visibility，也无法创建或读取访问授权。
- Calendar、Profile 仍从 `src/lib/mock-data.ts` 或静态占位渲染。
- Storage 上传依赖 0003 migration；当前生产环境已执行，其他环境未执行 0003 时真实上传无法完成。
- Access Requests 依赖 0004 migration；未执行 0004 时公开表单与后台申请列表无法完成真实读写。
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
- 文件上传失败：确认生产 Supabase 已执行 `0003_publications_documents_storage.sql`，bucket 为 private，且当前用户在 `admin_users` 中。
- 文件类型被拒绝：确认扩展名和 MIME type 都在白名单中，且文件不超过 20 MB。
- 本地构建没有 Supabase 环境变量：这是预期行为，未配置时会保留 mock preview。
