# Project Memory

## Current State

日期：2026-06-03

Phase 2B 正在接入核心内容真实 CRUD。Phase 1 前端 MVP、Phase 2A Supabase Auth/RLS 基础和线上后台路由保护 hotfix 均已合并到 `main`。

已实现页面：

- 公开首页 `/`
- 登录页 `/login`
- 工作台 `/dashboard`
- 研究项目 `/projects`
- 学术成果 `/publications`
- 知识库 `/knowledge`
- Skill 库 `/skills`
- 日历 `/calendar`
- 文件中心 `/documents`
- 个人信息 `/profile`
- 设置 `/settings`
- 自动化占位页 `/automations`

当前技术栈：

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase SSR/Auth/RLS 基础设施

当前数据状态：

- Projects、Knowledge Base、Skills Library 已实现真实 Supabase 查询、创建、编辑、删除和详情页。
- Dashboard 已开始读取真实 projects、knowledge_notes、skills 与 activity_logs。
- 公开首页已开始读取真实 public + featured projects 与 skills。
- mock data 集中在 `src/lib/mock-data.ts`，仅用于尚未接入真实数据的 Publications、Calendar、Documents、Profile 等页面和未配置 Supabase 的开发预览。
- 类型定义集中在 `src/lib/types.ts`。
- 核心实体保留 `visibility` 字段，取值为 `public`、`private` 或 `unlisted`。
- 公开首页只展示数据库中 `visibility = "public"` 且符合展示条件的公开内容。
- Supabase 初始 schema 已补充 slug、精选标记、项目关联、Skill 详情字段、文件关联字段和常用索引，为 Phase 2B CRUD 做准备。
- Supabase 增量 migration `0002_grant_api_table_privileges.sql` 补充 API 角色的最小表级 privileges，让 RLS policies 能在 Supabase API 请求中实际生效。
- 登录完成后的 `next` 参数使用内部后台路径白名单校验，Server Action 是最终校验边界。
- 公开可读取内容表不存储或暴露管理员 Supabase Auth UUID；管理员身份只保存在私密的 `admin_users` 表中。

尚未接入：

- Supabase Storage 文件上传
- Publications CRUD
- Calendar CRUD
- Documents 上传
- 外部 API
- Skill 自动化执行

## Important Context

- 网站默认语言为中文。
- 项目风格参考 `docs/mockups/dashboard-reference.png`。
- 视觉方向为浅色背景、深蓝侧边栏、卡片化工作区、蓝紫强调色、专业克制的研究与 AI 工作台气质。
- Supabase 未配置时，后台页面保持 mock/development preview，确保本地 lint/build 不因缺少环境变量阻塞。
- Supabase 配置后，后台页面应通过 Auth 登录和 `admin_users` 管理员白名单保护。
- profile 中的 `contact`、`social_links` 等联系方式只有在确实希望公开展示时才应放入 public profile 数据。
- 公开访问通过 `visibility = "public"` 控制，后台写权限通过 `public.is_admin()` 控制。
- 数据库权限分两层：GRANT 决定 `anon` / `authenticated` 是否能访问表，RLS 决定能访问哪些记录以及能否写入。

## Recent Decisions

- 第一阶段采用 mock data first 的 Next.js 前端原型。
- Hotfix 修复了公开首页 private Skill 暴露风险和日历不存在日期问题。
- Phase 2A 只建立 Supabase Auth、数据库 schema、RLS 与文档基础，不做真实 CRUD 或上传。
- 管理员权限由 `public.admin_users` 与 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。
- `projects` 表采用 `title` 作为项目标题字段，配合唯一 `slug` 支撑后续 CRUD 与公开 URL。
- 单管理员个人工作站不在公开内容表保存 Auth 用户归属字段；私密后台表可保留 `owner_id` 或 `actor_id` 用于审计。
- 已新增 `0002_grant_api_table_privileges.sql` 修复 Supabase API 表级授权缺失；该迁移只补 GRANT，不新增业务能力。

## Known Issues

- Publications、Calendar、Documents、Profile 仍为 mock 或占位页面，不具备真实持久化能力。
- 文件中心只有列表和上传按钮样式，不支持真实上传。
- 日历为静态月历，不支持新增、编辑或提醒。
- 个人信息页面只有前端编辑样式，不保存修改。
- 管理员真实 CRUD 端到端验证需要用户本人输入账号密码完成，Codex 不读取或记录密码。
- 生产 Supabase 项目需要在 PR 合并后执行 `0002_grant_api_table_privileges.sql`，否则后台 CRUD 页面可能继续出现 `permission denied for table ...`。

## Next Steps

- 合并并执行 `0002_grant_api_table_privileges.sql` 后，用户手动重新验证 `/projects/new`、`/knowledge/new`、`/skills/new` 不再出现表级 permission denied。
- 用户手动验证管理员登录、新建 private/public featured 项目与 Skill、新建知识笔记、退出登录和公开首页过滤。
- 后续接入 Publications CRUD。
- 接入 Supabase Storage，用于文件上传、成果附件、Skill 附件和头像。
- 完善 `public`、`private`、`unlisted` 对应的权限模型和前端提示。
- 为 Skill 增加运行日志、版本记录、平台链接和自动化状态。

## Stale Or Superseded Notes

- “第一阶段尚未接入 Supabase”已被 Phase 2A 的 Supabase 基础设施取代。
- “页面数据仍保持 mock data 预览”已被 Phase 2B 的 Projects、Knowledge、Skills 真实 CRUD 取代；Publications、Calendar、Documents、Profile 仍有 mock 或占位部分。
