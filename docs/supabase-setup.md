# Supabase Setup

## 目标

Phase 2A 建立 Supabase Auth、数据库 schema、RLS 与本地配置基础。Phase 2B 已完成 Projects、Knowledge Base、Skills Library 的真实 CRUD。Phase 2C 接入 Publications 真实 CRUD、Documents 文件中心与 Supabase Storage 私密上传下载。Phase 2E-A 新增访问申请记录与管理员处理状态。Phase 2E-B 新增 restricted 内容与按邮箱授权的只读访问基础。Phase 2J-A 接入 Profile 真实编辑与公开 About 读取。Phase 2J-B 接入站内 Calendar CRUD 与 Dashboard 近期日程。Phase 2K-A 新增 Resume 履历素材库。Phase 2K-B 新增 Resume 简历版本组合与后台预览。Viewer magic link 登录仍存在已知问题，后续需 Phase 2I 专项修复。附件对外授权下载、Google Calendar、简历导出和外部 API 尚未实现。

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

当前生产 Supabase 项目已按顺序执行：

- `0001_initial_schema.sql`
- `0002_grant_api_table_privileges.sql`
- `0003_publications_documents_storage.sql`
- `0004_access_requests.sql`
- `0005_restricted_content_access.sql`
- `0006_viewer_login_grant_check.sql`
- `0007_profile_public_fields.sql`
- `0008_calendar_events.sql`

Phase 2K-A 合并后还需要执行 `0009_resume_items.sql`。Phase 2K-B 合并后还需要执行 `0010_resume_versions.sql`。已执行过的 migration 不应修改或重跑。执行 0010 后，后续数据库变更应新增 `0011_*`，并继续保持最小权限、RLS 和 private Storage 边界。

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
- `calendar_events` 初始不向匿名访客开放读取；Phase 2J-B 的 0008 仅允许匿名读取 `visibility = 'public'` 的日程。`documents`、`activity_logs` 不向匿名访客开放读取，可保留 `owner_id` 或 `actor_id` 用于后续后台归属和审计。

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

Viewer 登录前授权检查需要继续运行：

```text
supabase/migrations/0006_viewer_login_grant_check.sql
```

`0006` 会：

- 创建 `public.can_request_viewer_login(email text)`。
- 只返回 boolean，不返回任何 grant 数据。
- 用于 `/viewer/login` 在发送 magic link 前检查该邮箱是否存在 active 且未过期的授权。
- 向 `anon` 授予执行该函数的权限。
- 不向 `anon` 开放 `content_access_grants` 的读取权限。

注意：

- 0006 已在当前生产 Supabase 项目执行。
- 0006 只提供登录前授权检查 RPC，不修复全部 Viewer magic link/session 问题。
- 后续如需数据库变更，必须新增新编号 migration，不得修改或重跑已执行过的旧 migration。

Phase 2J-A 新增 Profile 真实编辑。合并对应代码后，新建环境或生产环境需要继续运行：

```text
supabase/migrations/0007_profile_public_fields.sql
```

`0007` 会：

- 为 `public.profiles` 补充 `role_title`、`organization`、`location` 与 `is_public` 字段。
- 将已有 `visibility = 'public'` 的 Profile 同步标记为 `is_public = true`。
- 增加 `profiles_is_public_idx` 索引。

Profile 权限边界：

- 不修改 `profiles` 既有 RLS。
- 公开 About 页面只读取 `visibility = 'public'` 且 `is_public = true` 的 Profile。
- 管理员仍通过 `public.is_admin()` 写入 Profile。
- `contact` 与 `social_links` 只应保存愿意公开展示的信息。
- Profile 不保存或暴露管理员 Auth UUID。

Phase 2J-B 新增站内 Calendar CRUD。合并对应代码后，新建环境或生产环境需要继续运行：

```text
supabase/migrations/0008_calendar_events.sql
```

`0008` 会：

- 为 `public.calendar_events` 补充 `location`、`publication_id`、`knowledge_note_id` 与 `skill_id` 字段。
- 为 `event_type` 增加默认值与允许值约束：`general`、`meeting`、`research`、`deadline`、`review`、`reminder`。
- 增加 publication、knowledge、skill、visibility 与 starts_at 相关索引。
- 向 `anon` 授予 `calendar_events` 的 `select` 表级权限。
- 增加 public 日程读取 policy：只有 `visibility = 'public'` 的日程可被公开读取。

Calendar 权限边界：

- 管理员仍通过 `public.is_admin()` 创建、编辑、删除所有日程。
- 日程默认 `private`，公开页面本阶段不展示 Calendar 数据。
- `private` 日程仍仅管理员可读。
- `public` 日程可被 RLS 允许公开读取，但不会出现在 sitemap 或公开内容列表。
- Calendar 不修改 Documents、Storage、Viewer、restricted grants 或 Profile 主流程。

Phase 2K-A 新增 Resume 履历素材库。合并对应代码后，新建环境或生产环境需要继续运行：

```text
supabase/migrations/0009_resume_items.sql
```

`0009` 会：

- 创建 `public.resume_items` 统一素材表。
- 支持 `basic`、`education`、`experience`、`project`、`research`、`skill`、`certification`、`award`、`language`、`other` 类型。
- 保存标题、机构、角色、地点、开始/结束日期、是否至今、summary、bullets、skills、tags、排序、可见性、featured 和关联对象。
- 默认 `visibility = 'private'`。
- 增加类型、可见性、featured、排序、更新时间和关联对象索引。
- 启用 RLS。
- 允许匿名访客只读取 `visibility = 'public'` 的 Resume 素材，但本阶段不实现公开简历页面。
- 允许 authenticated 角色通过表级权限访问，实际写入继续由 `public.is_admin()` RLS policy 限定管理员。

Resume 权限边界：

- 管理员通过 `/dashboard/resume` 创建、编辑、删除素材。
- Resume 素材默认 `private`。
- 本阶段不创建公开简历页面，不输出 Documents、signed URL 或 Storage 路径。
- 不修改 Viewer、restricted grants、Documents、Storage、Calendar 或 Profile 主流程。
- 后续 Phase 2K-B 才做简历版本组合生成；Phase 2K-C 才做 PDF / Word 导出；Phase 2K-D 才做 AI JD 优化。

Phase 2K-B 新增 Resume 简历版本组合。合并对应代码后，新建环境或生产环境需要继续运行：

```text
supabase/migrations/0010_resume_versions.sql
```

`0010` 会：

- 创建 `public.resume_versions` 简历版本表。
- 创建 `public.resume_version_items` 版本与素材的选择关系表。
- 支持版本标题、目标岗位、摘要、语言、模板标记、权限、启用状态、精选状态和内部备注。
- 支持为每个已选素材保存区块、排序值、当前版本展示开关和备注。
- 通过外键关联 `resume_items`，删除版本时自动删除组合关系，不删除原始素材。
- 增加版本权限、启用、精选、更新时间和组合关系常用索引。
- 启用 RLS。
- 允许 authenticated 角色通过表级权限访问，实际管理继续由 `public.is_admin()` RLS policy 限定管理员。

Resume Version 权限边界：

- 管理员通过 `/dashboard/resume/versions` 创建、编辑、删除简历版本。
- 简历版本默认 `private`。
- 本阶段只提供后台预览，不生成 PDF / Word，不创建公开简历页面，不创建分享链接。
- 不向匿名访客开放简历版本或组合关系读取。
- 不修改 Viewer、restricted grants、Documents、Storage、Calendar、Profile 或现有 Resume 素材 CRUD 主流程。

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
- Viewer login grant check 依赖 0006 migration；未执行 0006 时 `/viewer/login` 的授权检查 RPC 不存在。
- Calendar 后台已由 `/dashboard/calendar` 接入真实 `calendar_events` CRUD；未执行 0008 时，新字段保存会失败，Dashboard 近期日程会降级为空或只读取旧字段。
- Resume 后台由 `/dashboard/resume` 接入真实 `resume_items` CRUD；未执行 0009 时，简历素材库无法完成真实读写，Dashboard 简历素材概览会降级为空。
- Resume Versions 后台由 `/dashboard/resume/versions` 接入真实 `resume_versions` 与 `resume_version_items`；未执行 0010 时，简历版本列表、版本表单、详情与预览无法完成真实读写。
- Storage 上传依赖 0003 migration；当前生产环境已执行，其他环境未执行 0003 时真实上传无法完成。
- Access Requests 依赖 0004 migration；未执行 0004 时公开表单与后台申请列表无法完成真实读写。
- Profile 公开字段依赖 0007 migration；未执行 0007 时后台 Profile 保存新字段会失败，About 页面会使用安全 fallback。
- Calendar 增强字段与 public 读取 policy 依赖 0008 migration；未执行 0008 时后台 Calendar 新建/编辑中的地点、成果/知识/Skill 关联与 event type 约束不可用。
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
- Viewer 登录失败：已知问题，后续 Phase 2I 专项排查。先确认 0005、0006 已执行，Auth callback URL 已配置，再结合 Supabase Auth 日志与 Vercel Function 日志定位。
- 本地构建没有 Supabase 环境变量：这是预期行为，未配置时会保留 mock preview。
