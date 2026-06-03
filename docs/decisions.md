# Decisions

## 2026-05-31 - Use Chinese As Default Website Language

类型：decision

决策：

- 网站默认语言为中文。

原因：

- 项目服务于“黄铭语个人数字工作站”，核心内容、导航和工作流说明均面向中文使用场景。

影响：

- 页面文案、导航、mock data 和项目文档默认使用中文。
- 代码标识、命令、依赖名和外部 API 名称按技术语境保留英文。

## 2026-05-31 - Build Phase 1 With Mock Data First

类型：decision

决策：

- 第一阶段实现本地可运行的 Next.js 前端原型。
- 使用 App Router、TypeScript、Tailwind CSS 和 Lucide React。
- 示例内容集中放在 `src/lib/mock-data.ts`，类型放在 `src/lib/types.ts`。
- 所有核心实体预留 `visibility` 字段。
- 本阶段不接入真实登录、数据库、文件上传或外部 API。

原因：

- 第一阶段目标是先完成视觉完整、主要页面可浏览的网站前端原型。
- mock data first 可以先稳定信息架构、页面布局和组件结构，方便第二阶段接入真实数据。

影响：

- 页面应优先组合复用组件。
- 新增示例内容时优先更新 `src/lib/mock-data.ts`。
- 未来接入 Supabase 时应保持页面组件和数据访问层分离。

## 2026-06-01 - Add Supabase Auth And RLS Foundation In Phase 2A

类型：decision

决策：

- Phase 2A 接入 Supabase SSR/Auth 基础能力和数据库 RLS 权限框架。
- 后台页面在 Supabase 配置后需要登录，并通过管理员白名单判断访问权限。
- 未配置 Supabase 时保留 mock/development preview，避免本地构建被环境变量阻塞。

原因：

- 项目需要先建立权限边界，再逐步接入真实数据写入。
- Auth、RLS 和数据库 schema 是后续 CRUD、文件上传和 Skill 自动化记录的共同基础。

影响：

- 新增 `.env.example`、Supabase helper、登录页、路由保护和 SQL migration。
- 页面展示仍读取 mock data，不在 Phase 2A 改成真实 CRUD。

## 2026-06-01 - Use admin_users For Admin Access

类型：decision

决策：

- 使用 `public.admin_users` 表保存管理员用户 ID。
- 使用 `public.is_admin()` 函数集中判断管理员权限。
- 不在代码中硬编码管理员邮箱、UUID、密码或其他身份信息。

原因：

- 管理员权限应由数据库控制，方便后续调整和审计。
- 避免在前端仓库中暴露私人身份信息或敏感配置。

影响：

- Supabase Auth 创建用户后，需要手动将该用户 UUID 插入 `admin_users`。
- RLS policy 使用 `public.is_admin()` 区分公开读取和管理员管理权限。

## 2026-06-01 - Do Not Use service_role In Normal App Runtime

类型：decision

决策：

- 普通 Next.js 应用运行时只使用 Supabase publishable key。
- 不在 `.env.example`、README 或前端代码中引入 `service_role` key。

原因：

- `service_role` 会绕过 RLS，不适合暴露给浏览器或普通 SSR 运行时。
- 当前阶段目标是验证 Auth 与 RLS 权限基础，而不是使用高权限密钥绕过策略。

影响：

- 数据访问必须符合 RLS policy。
- 管理性操作通过已登录管理员身份执行，或在 Supabase Dashboard 手动完成初始化。

## 2026-06-01 - Defer Real CRUD To Phase 2B

类型：decision

决策：

- Phase 2A 不把现有页面改成真实数据库 CRUD。
- Phase 2B 再逐步接入 projects、publications、knowledge_notes、skills、documents 等模块的数据读写。

原因：

- 先稳定 Auth、schema 和 RLS 能降低后续 CRUD 接入时的权限风险。
- 保持当前页面视觉和 mock 体验不被后端配置影响。

影响：

- 当前页面仍以 `src/lib/mock-data.ts` 为展示来源。
- 后续需要补数据访问层、表单保存、错误状态和加载状态。

## 2026-06-01 - Whitelist Post Login Redirects

类型：decision

决策：

- 登录后的 `next` 参数必须通过内部后台路径白名单校验。
- 页面层和 Server Action 均使用同一套校验逻辑，Server Action 作为最终安全边界。
- 非法路径、外部 URL、协议形式或 `//example.com` 统一回退到 `/dashboard`。

原因：

- 隐藏表单字段不能被信任。
- 登录完成后的跳转不能成为站外跳转入口。

影响：

- 只允许跳转到 dashboard、projects、publications、knowledge、skills、calendar、documents、profile、settings、automations 及其子路径。

## 2026-06-01 - Enrich Initial Schema Before Merge

类型：decision

决策：

- 在 PR #3 合并前完善初始 Supabase migration，而不是等 Phase 2B 再大量补字段。
- `projects` 使用 `title` 与唯一 `slug`，并补充研究背景、问题、方法论、精选标记和开始日期。
- 其他核心表补充 slug、精选标记、项目关联、Skill 内容字段、文件关联字段和常用索引。

原因：

- migration 尚未合并，直接完善初始结构比后续追加大量修正 migration 更清晰。
- Phase 2B 真实 CRUD 需要稳定的字段基础。

影响：

- 当前页面仍不接入真实 CRUD。
- 后续 CRUD 实现应优先复用当前 schema，而不是重新定义实体字段。

## 2026-06-01 - Keep Auth UUID Out Of Public Content Tables

类型：decision

决策：

- 公开可读取内容表不保存管理员 Supabase Auth UUID。
- `profiles` 使用独立内容 ID，不引用 `auth.users(id)`。
- `projects`、`publications`、`knowledge_notes`、`skills` 不保存 `owner_id`。
- 管理员身份只在私密的 `admin_users` 表中管理。

原因：

- RLS 控制行可见性，不会自动隐藏列。
- 当记录 `visibility = 'public'` 时，匿名访客可能读取该行的所有公开字段。
- 单管理员个人工作站不需要在公开内容中携带后台登录身份标识。

影响：

- 公开访问继续通过 `visibility = 'public'` 控制。
- 后台写入、更新和删除继续通过 `public.is_admin()` 控制。
- `calendar_events`、`documents`、`activity_logs` 等私密后台表可保留 `owner_id` 或 `actor_id` 用于审计。

## 2026-06-03 - Implement Core Content CRUD Before Storage

类型：decision

决策：

- Phase 2B 优先实现 `projects`、`knowledge_notes`、`skills` 和 `skill_versions` 的真实 CRUD。
- Dashboard 先接入真实项目、笔记、Skill 和 Activity Logs。
- 公开首页先接入真实 public + featured 项目和 Skill。
- Publications、Calendar、Documents、Storage、Notion、AI 自动化和多用户协作继续后延。

原因：

- 核心内容管理能力是个人工作站第一次真正可用的后台基础。
- 先验证 Auth + RLS + Server Actions 的最小闭环，再扩展文件上传和外部集成，风险更低。

影响：

- 查询集中在 `src/lib/queries/`。
- 表单校验集中在 `src/lib/validations/`。
- 写入集中在 `src/actions/`，每个写操作都在服务端验证管理员身份并依赖 RLS 兜底。
- Markdown 展示使用安全的 React 文本渲染，不允许原始 HTML 注入。

## 2026-06-03 - Add Explicit Supabase API Table Grants

类型：decision

决策：

- 在 `0001_initial_schema.sql` 已执行的基础上，新增 `0002_grant_api_table_privileges.sql`。
- `anon` 只获得公开内容表的 `select` 表级权限。
- `authenticated` 获得后台业务表的 `select`、`insert`、`update`、`delete` 表级权限。
- 不向 `anon` 或 `authenticated` 授予 `admin_users` 表权限。

原因：

- Supabase RLS policy 不能替代表级 GRANT。
- 生产站点在进入 `/projects/new`、`/knowledge/new` 等页面时已出现 `permission denied for table ...`，说明 API 角色缺少表级访问入口。
- 最小 GRANT 配合现有 RLS，才能同时允许管理员 CRUD 和限制普通访客/非管理员。

影响：

- 该迁移只修复数据库授权，不新增页面、业务能力、schema 字段或 Storage 配置。
- `visibility = 'public'` 继续控制公开读取行。
- `public.is_admin()` 继续控制后台管理写权限。
- 真实 Supabase 项目需要在 PR 合并后执行 `0002_grant_api_table_privileges.sql`，然后重新验证后台 CRUD。
