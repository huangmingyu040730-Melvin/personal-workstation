# Project Memory

## Current State

日期：2026-06-06

Phase 2E-A 分支正在实现访问申请记录流程。Phase 2D-A 已合并：公开 Projects、Publications、Knowledge、Skills 列表与 slug 详情页已经建立，后台管理页面已迁移到 `/dashboard/...`。Phase 2D-B 已合并：公开首页、统一公开导航、`/about`、metadata 和公开关联浏览已经建立。Phase 2D-C 已合并：公开内容展示质量和后台公开内容运营提示已经提升。Phase 1 前端 MVP、Phase 2A Supabase Auth/RLS 基础、Phase 2B 核心内容 CRUD 与 Supabase API GRANT hotfix、Phase 2C Publications / Documents / private Storage 均已合并并在生产环境完成关键链路验证。

项目长期定位已更新为：黄铭语的公开研究工作站与私密数字资产后台。网站既要对外展示公开研究项目、学术成果、知识文章和 AI Skill，也要对内管理全部项目、知识、成果、文件、日历与自动化；未来还要支持经管理员审核后，按具体内容授权外部用户访问受限材料。

已实现页面：

- 公开研究工作站首页 `/`
- 关于我 `/about`
- 登录页 `/login`
- 工作台 `/dashboard`
- 公开研究项目 `/projects`、`/projects/[slug]`
- 公开学术成果 `/publications`、`/publications/[slug]`
- 公开知识文章 `/knowledge`、`/knowledge/[slug]`
- 公开 Skill `/skills`、`/skills/[slug]`
- 后台研究项目 `/dashboard/projects`
- 后台学术成果 `/dashboard/publications`
- 后台知识库 `/dashboard/knowledge`
- 后台 Skill 库 `/dashboard/skills`
- 后台文件中心 `/dashboard/documents`
- 访问申请 `/access-request`
- 后台访问申请 `/dashboard/access-requests`
- 日历 `/calendar`
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

- Projects、Knowledge Base、Skills Library 已实现真实 Supabase 查询、创建、编辑、删除和详情页，并通过生产验收。
- Publications 已实现真实查询、创建、编辑、删除和详情页，并通过生产验收。
- Documents 已实现真实列表、详情、上传、下载和删除流程，文件存储在私密 `workspace-files` bucket，并通过生产验收。
- 文件上传架构已按 PR review 修正为浏览器直传 Supabase Storage：Server Actions 只负责 prepare/finalize，不承载文件二进制，避免 Vercel Function 4.5 MB payload 限制与 20 MB 上传目标冲突。
- 中文或其他非 ASCII 原文件名会被转换为 ASCII-safe Storage object key，数据库中的文件显示名称仍可保留中文。
- Dashboard 已开始读取真实 projects、knowledge_notes、skills、publications 与 activity_logs。
- 公开首页已升级为只读版研究工作站，读取真实 public projects、publications、skills 与 knowledge_notes。
- 公开 Projects、Publications、Knowledge、Skills 列表与 slug 详情页只读取 `visibility = "public"` 内容。
- Phase 2D-B 增加统一公开导航、About 页面、公开页面 metadata、公开详情关联浏览和移动端可读性优化；不新增 migration，不实现 restricted、外部用户登录、Calendar、Notion 或自动化。
- 公开详情页的关联内容也必须限定为 public，避免管理员登录状态下浏览公开页时误展示 private / unlisted 关联标题。
- Phase 2D-C 增加统一公开内容卡片、公开列表结果数量与清空筛选入口、详情页空字段隐藏、Dashboard 公开内容质量卡片，以及后台内容列表页的 public / featured 运营提示。
- Phase 2E-A 新增公开访问申请表单和后台访问申请列表/详情。该阶段只记录申请、状态和管理员备注，不创建外部账号，不自动开放受限内容，不实现授权有效期、撤销或附件权限。
- 后台 CRUD 页面已迁移到 `/dashboard/projects`、`/dashboard/publications`、`/dashboard/knowledge`、`/dashboard/skills`、`/dashboard/documents`，旧 `/documents` 作为受保护兼容路径重定向到后台文件中心。
- mock data 集中在 `src/lib/mock-data.ts`，仅用于尚未接入真实数据的 Calendar、Profile 等页面和未配置 Supabase 的开发预览。
- 类型定义集中在 `src/lib/types.ts`。
- 核心实体保留 `visibility` 字段，当前生产取值为 `public`、`private` 或 `unlisted`；长期规划会扩展 `restricted`。
- 公开首页与公开详情页只展示数据库中 `visibility = "public"` 且符合展示条件的公开内容。
- Supabase 初始 schema 已补充 slug、精选标记、项目关联、Skill 详情字段、文件关联字段和常用索引，为 Phase 2B CRUD 做准备。
- Supabase 增量 migration `0002_grant_api_table_privileges.sql` 补充 API 角色的最小表级 privileges，让 RLS policies 能在 Supabase API 请求中实际生效；该 migration 已在生产 Supabase 执行并通过 Phase 2B 验收。
- Phase 2C 新增 `0003_publications_documents_storage.sql`，创建私密 `workspace-files` bucket 并配置仅管理员可操作的 Storage policies；该 migration 已在生产 Supabase 执行并通过真实上传、下载、关联、删除保护和清理验收。
- Phase 2E-A 新增 `0004_access_requests.sql`，创建 `access_requests` 表；`anon` 只能 insert，不能读取或修改申请；管理员通过 `public.is_admin()` 读取和更新申请状态。
- 登录完成后的 `next` 参数使用内部后台路径白名单校验，Server Action 是最终校验边界。
- 公开可读取内容表不存储或暴露管理员 Supabase Auth UUID；管理员身份只保存在私密的 `admin_users` 表中。

尚未接入：

- Calendar CRUD
- Profile 真实编辑
- restricted 受限访问与审批体系
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
- 公开页面和后台页面在 Phase 2D-A 中开始分离：公开只读路由使用 `/projects`、`/publications`、`/skills`、`/knowledge` 及 slug 详情；后台管理路由使用 `/dashboard/...`。
- 文件附件默认比正文内容更严格：即使 Publication 公开，关联 Documents 默认仍保持私密，不在公开页面提供下载入口。
- Notion 仅作为草稿、临时研究笔记、日常记录和协作辅助工具，不替代个人网站的正式公开门户、权限系统与私密资产库。

## Recent Decisions

- 第一阶段采用 mock data first 的 Next.js 前端原型。
- Hotfix 修复了公开首页 private Skill 暴露风险和日历不存在日期问题。
- Phase 2A 只建立 Supabase Auth、数据库 schema、RLS 与文档基础，不做真实 CRUD 或上传。
- 管理员权限由 `public.admin_users` 与 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。
- `projects` 表采用 `title` 作为项目标题字段，配合唯一 `slug` 支撑后续 CRUD 与公开 URL。
- 单管理员个人工作站不在公开内容表保存 Auth 用户归属字段；私密后台表可保留 `owner_id` 或 `actor_id` 用于审计。
- 已新增 `0002_grant_api_table_privileges.sql` 修复 Supabase API 表级授权缺失；该迁移只补 GRANT，不新增业务能力。
- Phase 2C 采用单一 private bucket `workspace-files`，不为公开页面提供附件下载入口。
- Publication 删除采取保守策略：仍有关联 documents 时阻止删除，要求管理员先处理附件。
- Document 下载采用 60 秒 signed URL，不保存到数据库，不输出到公开页面。
- Document 上传采用两阶段流程：管理员 prepare -> 浏览器 direct upload -> 管理员 finalize；finalize 失败会尽力删除刚上传的对象。
- Phase 2C 生产验收通过后，下一阶段优先级从 Calendar 调整为 Phase 2D：公开研究工作站体系升级。
- Phase 2E 再实现 restricted 可见性、外部用户申请、管理员审批、按具体内容授权、有效期与撤销。
- Phase 2D-A 不新增 migration，不实现 restricted、外部登录、访问申请、Calendar CRUD、Profile 编辑或自动化。

## Known Issues

- Calendar、Profile 仍为 mock 或占位页面，不具备真实持久化能力。
- `restricted` 可见性尚未进入 schema、RLS 和 UI；当前只能作为长期规划记录，不能在生产功能中假装可用。
- Phase 2E-A 的 approved/rejected 只表示管理员处理状态，不代表外部用户已获得访问权限。
- 日历为静态月历，不支持新增、编辑或提醒。
- 个人信息页面只有前端编辑样式，不保存修改。
- Phase 2D-A 的生产后台 CRUD、Documents 上传下载与路由迁移验收需要用户本人输入账号密码完成，Codex 不读取或记录密码。

## Next Steps

- Phase 2D-A PR 审核后，由用户在生产环境验证新的后台 Projects、Publications、Knowledge、Skills、Documents 路由和原有 CRUD/文件能力。
- Phase 2D 后续可继续优化公开详情内容、公开关联内容和路由兼容体验。
- Phase 2E-A：合并后需要在生产 Supabase 执行 `0004_access_requests.sql`，再验证公开申请提交、后台查看和状态更新。
- Phase 2E 后续：实现 `restricted` 可见性、外部用户登录、按具体内容只读授权、有效期、撤销与附件单独授权。
- 后续再推进 Profile 真实编辑、Calendar CRUD、Google Calendar、Notion 辅助同步和自动化任务。

## Stale Or Superseded Notes

- “第一阶段尚未接入 Supabase”已被 Phase 2A 的 Supabase 基础设施取代。
- “页面数据仍保持 mock data 预览”已被 Phase 2B 的 Projects、Knowledge、Skills 真实 CRUD 和 Phase 2C 的 Publications/Documents 接入取代；Calendar、Profile 仍有 mock 或占位部分。
