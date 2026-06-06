# 黄铭语个人数字工作站

黄铭语的公开研究工作站与私密数字资产后台。

项目长期定位：

- 对外展示公开研究项目、学术成果、知识文章与 AI Skill。
- 对内管理全部项目、知识、成果、文件、日历与自动化。
- 未来支持经管理员审核后，按具体内容授权外部用户访问受限材料。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase Auth、Database、RLS
- Projects、Knowledge Base、Skills Library、Publications 真实 CRUD
- Supabase Storage 私密文件上传与下载

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
4. 运行 `supabase/migrations/0002_grant_api_table_privileges.sql`。
5. 在 Auth 中创建管理员用户。
6. 将该用户的 UUID 插入 `public.admin_users`：

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

请将示例 UUID 替换为真实 Auth 用户 ID。

Phase 2C 已在生产 Supabase 项目执行 `supabase/migrations/0003_publications_documents_storage.sql`，用于创建私密 `workspace-files` Storage bucket 与管理员专属 Storage policies。Phase 2E-A 新增 `supabase/migrations/0004_access_requests.sql`，用于创建公开访问申请表与最小 RLS/GRANT。Phase 2E-B 新增 `supabase/migrations/0005_restricted_content_access.sql`，用于扩展 `restricted` 可见性、创建内容授权表和受限内容读取 policy。新建环境仍需按顺序执行 0001、0002、0003、0004、0005。更完整的配置步骤见 `docs/supabase-setup.md`。

## 页面

公开浏览路由：

- `/` 公开研究工作站首页
- `/about` 关于我与公开工作站说明
- `/projects` 公开研究项目列表
- `/projects/[slug]` 公开研究项目详情
- `/publications` 公开学术成果列表
- `/publications/[slug]` 公开学术成果详情
- `/knowledge` 公开知识文章列表
- `/knowledge/[slug]` 公开知识文章详情
- `/skills` 公开 Skill 列表
- `/skills/[slug]` 公开 Skill 详情
- `/access-request` 访问申请表单
- `/viewer/login` 外部授权访问邮箱登录
- `/login` 管理员登录

后台管理路由：

- `/dashboard` 管理员工作台
- `/dashboard/projects` 研究项目管理
- `/dashboard/publications` 学术成果管理
- `/dashboard/knowledge` 知识库管理
- `/dashboard/skills` Skill 库管理
- `/dashboard/documents` 文件中心管理
- `/dashboard/access-requests` 访问申请管理
- `/dashboard/access-grants` 访问授权管理
- `/calendar` 日历占位
- `/profile` 个人信息占位
- `/settings` 设置
- `/automations` 自动化占位

旧 `/documents` 路径仍受管理员保护，并兼容重定向到 `/dashboard/documents`。

## 产品路线图

当前产品方向已升级为“公开研究工作站 + 私密管理后台 + 未来受限访问体系”。详细路线图见 `docs/roadmap.md`。

长期访问层级：

- `public`：所有访客可浏览，可出现在公开首页、公开列表和公开详情页。
- `unlisted`：不公开列出，未来可通过链接访问。
- `restricted`：仅允许管理员或经邮箱授权的登录用户只读访问对应详情页。
- `private`：仅管理员本人在后台查看和管理。

下一阶段优先级：

- Phase 2C 已完成 Publications、Documents 与 private Storage 的生产真实验收。
- Phase 2D-A 已完成公开项目、成果、Skill、知识文章列表与详情页，并将现有后台管理能力迁移到 `/dashboard/...`。
- Phase 2D-B 继续优化公开研究工作站体验，包括统一公开导航、About 页面、公开详情关联浏览、SEO metadata 和移动端可读性。
- Phase 2D-C 继续提升公开内容展示质量，包括统一公开卡片、列表结果提示、详情页空字段处理和后台公开内容运营提示。
- Phase 2E-A 建立访问申请记录与后台处理状态；Phase 2E-B 建立 restricted 内容、邮箱魔法链接登录、按内容授权和撤销的最小闭环。附件单独下载权限仍属后续阶段。
- Calendar、Profile、Notion、Google Calendar 与自动化任务在公开浏览和授权体系稳定后继续推进。

## 权限与数据状态

- 未配置 Supabase 时，后台页面保持 mock data 开发预览，便于本地构建和视觉检查。
- 配置 Supabase 后，后台页面会要求登录，并通过 `public.admin_users` + `public.is_admin()` 判断管理员权限。
- 登录成功后的 `next` 跳转会经过内部后台路径白名单校验，不允许跳到外部 URL。
- 公开首页与公开列表/详情页只读取 `visibility = "public"` 的项目、成果、知识文章与 Skill；private / unlisted 不在公开页面返回或展示。
- 公开访客可以在 `/access-request` 提交访问申请；管理员可在后台将指定 restricted 内容授权给指定邮箱。外部用户通过 `/viewer/login` 邮箱魔法链接登录后，只能查看被授权的内容详情，不能进入后台。
- 公开 About 页面不硬编码管理员邮箱、Supabase 配置、Auth UUID 或其他敏感联系信息。
- 后台 Projects、Publications、Skills、Knowledge 列表页提供轻量公开运营提示，帮助维护 public / featured 内容质量。
- 公开可读取内容表不存储管理员 Supabase Auth UUID；管理员身份只保存在私密的 `admin_users` 表中。
- 公开访问通过 `visibility = "public"` 控制；restricted 内容通过 `content_access_grants` 与登录用户邮箱匹配控制；后台写入、更新、删除权限通过 `public.is_admin()` 控制。
- 当前 Projects、Knowledge Base、Skills Library、Publications 已接入真实 CRUD，并通过 Supabase RLS 与管理员身份保护写入。
- Documents 已接入真实文件记录、私密 Storage 上传、短时 signed URL 下载和删除流程；生产环境已执行 0003 migration 并通过真实上传、下载、关联、删除保护和清理验收。
- Access Requests 使用真实 Supabase 表记录访问申请；匿名访客只能提交，管理员可查看并更新 pending / approved / rejected 状态与备注。
- Dashboard 已读取真实项目、笔记、Skill、Publications 与 Activity Logs。
- Calendar、Profile 仍为 mock 或占位展示，真实 CRUD 和外部 API 尚未实现。
- `profiles.contact` 与 `profiles.social_links` 仅应保存希望公开展示的联系方式；若 profile 记录设置为 public，其中公开字段会被访客读取。
- 文件附件默认比正文内容更严格；即使 Publication 设置为 public，关联 Documents 仍保持 private，本阶段不会在公开页面提供下载入口。
- Notion 的长期定位是草稿、临时研究笔记、日常记录和协作辅助，不替代个人网站的正式公开门户、权限系统与私密资产库。

## 初始数据结构

`supabase/migrations/0001_initial_schema.sql` 已为 Phase 2B 真实 CRUD 预留主要字段：

- `profiles`：独立内容 ID、个人展示、邮箱、简历链接、联系方式、社交链接、研究兴趣与技能标签，不引用 Auth 用户 ID。
- `projects`：使用 `title`、`slug`、背景、研究问题、方法论、进度、状态、精选标记与开始日期。
- `publications`：成果标题、slug、摘要、封面、精选标记、附件路径与关联项目。
- `knowledge_notes`：笔记标题、slug、分类、正文、精选标记与关联项目。
- `skills`：Skill 名称、slug、说明、输入输出描述、使用指南、Skill.md 内容、仓库链接、版本、状态与精选标记。
- `calendar_events`：日程时间、类型、可见性与关联项目。
- `documents`：文件存储路径、分类、关联实体类型与关联 ID。
- `activity_logs` 与 `skill_versions`：后续审计与 Skill 版本记录基础。
- `access_requests`：Phase 2E-A 访问申请记录，包括申请人姓名、邮箱、机构、申请内容、理由、处理状态与管理员备注。
- `content_access_grants`：Phase 2E-B 受限内容授权记录，包括被授权邮箱、内容类型、内容 ID、状态、有效期与管理员备注。

公开可读表 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills` 不保存管理员 Auth UUID。私密后台表 `calendar_events`、`documents`、`activity_logs` 可保留 `owner_id` 或 `actor_id` 用于后续审计。

## 存储与文件安全

Phase 2C 使用 Supabase Storage bucket：

- `workspace-files`

安全边界：

- bucket 必须为 private。
- 匿名访客不能读取、上传、更新或删除文件。
- 普通非管理员登录用户不能读取或修改文件。
- 管理员通过 `public.is_admin()` 和 Storage policy 操作文件。
- 上传采用两阶段流程：Server Actions 只验证管理员、校验 metadata、生成安全路径并最终写入数据库；文件二进制由浏览器直接上传到 Supabase Storage，不经过 Vercel Function。
- 下载使用 60 秒短时 signed URL，不保存到数据库，也不在公开页面输出。
- 文件上传限制为 20 MB，并同时校验扩展名与 MIME type。
- 即使文件关联到 public Publication，附件本轮仍保持私密，仅管理员可下载。
- 即使用户被授权查看 restricted Publication，关联 Documents 仍保持私密，本阶段不生成外部 signed URL，也不开放附件下载。
