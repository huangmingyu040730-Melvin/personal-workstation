# 黄铭语个人数字工作站

黄铭语的公开研究工作站与私密数字资产后台。

项目长期定位：

- 对外展示公开研究项目、学术成果、知识文章与 AI Skill。
- 对内管理全部项目、知识、成果、文件、日历与自动化。
- 未来支持经管理员审核后，按具体内容授权外部用户访问受限材料。

当前项目状态详见 `docs/current-status.md`，后续阶段规划详见 `docs/roadmap.md`，已知问题详见 `docs/known-issues.md`。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase Auth、Database、RLS
- Projects、Knowledge Base、Skills Library、Publications 真实 CRUD
- Access Requests 与 Access Grants 基础能力
- Resume 履历素材库基础能力
- Resume 简历版本组合与后台预览
- Resume 分区式素材管理、A4 中文模板化预览与浏览器打印 PDF
- Resume 简历质量检查与投递版本完整度提示
- Resume AI JD 简历优化建议，支持 OpenAI-compatible Provider 与 DeepSeek
- Resume JD 分析历史与投递记录
- Resume 投递看板与求职 Pipeline 管理
- Career Center / 求职中心导航整合
- Resume Word `.docx` 即时导出
- Resume Preview 与 Word 导出共用 20260523 风格模板
- Supabase Storage 私密文件上传与下载
- Market Briefs 市场简报后台手工 CRUD、Markdown 主内容、站内预览、多格式下载、mock / external runner 生成模式、AkShare Python runner 与生成任务记录

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

如需启用市场简报外部 Skill Runner 回写接口，只在服务端环境配置：

```text
MARKET_BRIEF_GENERATOR=mock
MARKET_BRIEF_RUNNER_SECRET=your_runner_secret
SUPABASE_SERVICE_ROLE_KEY=server_only_service_role_key
```

`MARKET_BRIEF_GENERATOR` 未配置时默认 `mock`；设置为 `external` 后，“获取今日市场动态”只创建 queued job 并跳转任务详情，等待外部 runner 通过 `/api/market-briefs/skill-jobs/claim` 领取，再通过 `/api/market-briefs/skill-result` 或 `/api/market-briefs/skill-jobs/fail` 回写。`MARKET_BRIEF_RUNNER_SECRET` 用于这些私有 runner API 鉴权；`SUPABASE_SERVICE_ROLE_KEY` 仅用于无用户会话的服务端回调写入，不得暴露到客户端、日志或仓库。普通后台页面仍使用登录管理员身份与 RLS。

如需使用 AI JD 简历优化助手，推荐只在服务端环境配置通用 AI Provider：

```text
AI_PROVIDER=deepseek
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
```

AI 调用兼容 OpenAI-compatible Provider。`AI_PROVIDER=deepseek` 时默认使用 `AI_BASE_URL=https://api.deepseek.com` 和 `AI_MODEL=deepseek-v4-flash`。旧配置仍可继续使用：

```text
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=optional_model_name
```

`AI_API_KEY` 和 `OPENAI_API_KEY` 不得暴露到客户端。未配置时，JD 优化页面仍可打开，但会提示尚未配置 AI 能力。

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

Phase 2C 已在生产 Supabase 项目执行 `supabase/migrations/0003_publications_documents_storage.sql`，用于创建私密 `workspace-files` Storage bucket 与管理员专属 Storage policies。Phase 2E-A 新增 `supabase/migrations/0004_access_requests.sql`，用于创建公开访问申请表与最小 RLS/GRANT。Phase 2E-B 新增 `supabase/migrations/0005_restricted_content_access.sql`，用于扩展 `restricted` 可见性、创建内容授权表和受限内容读取 policy。Viewer 登录前授权检查使用 `supabase/migrations/0006_viewer_login_grant_check.sql`。Phase 2J-A 新增 `supabase/migrations/0007_profile_public_fields.sql`，用于补充公开 Profile 编辑字段。Phase 2J-B 新增 `supabase/migrations/0008_calendar_events.sql`，用于补充站内日程字段、索引与 public 日程读取 policy。Phase 2K-A 新增 `supabase/migrations/0009_resume_items.sql`，用于创建 Resume 履历素材库。Phase 2K-B 新增 `supabase/migrations/0010_resume_versions.sql`，用于创建简历版本和素材选择关系。Phase 2K-C 新增 `supabase/migrations/0011_resume_template_fields.sql`，用于补充履历素材结构化 `details`、版本顶部个人字段开关、区块顺序和逐条素材可见字段控制。Phase 2K-H 新增 `supabase/migrations/0012_resume_jd_reviews.sql`，用于保存 JD 分析历史、AI 建议和投递状态。Phase 2L-A 新增 `supabase/migrations/0013_market_briefs.sql`，用于创建后台私密市场简报表。Phase 2L-B 新增 `supabase/migrations/0014_market_brief_artifacts.sql`，用于补充市场简报 Markdown 主内容、生成状态和 artifact 元数据字段。Phase 2L-D-A 新增 `supabase/migrations/0015_market_brief_generation_jobs.sql`，用于记录市场简报生成任务、runner 输入、数据快照和结果 payload。新建环境仍需按顺序执行 0001 至 0015。更完整的配置步骤见 `docs/supabase-setup.md`。

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
- `/dashboard/profile` 个人信息管理
- `/dashboard/calendar` 站内日程管理
- `/dashboard/market-briefs` 市场简报后台管理
- `/dashboard/market-briefs/jobs` 市场简报生成任务
- `/dashboard/market-briefs/[id]/preview` 市场简报 Markdown 站内预览与打印
- `/dashboard/career` 求职中心
- `/dashboard/resume` 简历素材库
- `/dashboard/resume/versions` 简历版本管理
- `/dashboard/resume/applications` 投递看板
- `/dashboard/resume/versions/[id]/jd-review` AI JD 简历优化建议
- `/dashboard/resume/jd-reviews` JD 分析历史与投递记录
- `/dashboard/resume/versions/[id]/export/docx` 简历 Word 导出
- `/calendar` 公开日历占位
- `/profile` 兼容跳转到 `/dashboard/profile`
- `/settings` 设置
- `/automations` 自动化占位

旧 `/documents` 路径仍受管理员保护，并兼容重定向到 `/dashboard/documents`。

## 产品路线图

当前产品方向为“黄铭语的公开研究工作站与私密数字资产后台”。详细状态见 `docs/current-status.md`，路线图见 `docs/roadmap.md`。

长期访问层级：

- `public`：所有访客可浏览，可出现在公开首页、公开列表和公开详情页。
- `unlisted`：不公开列出，未来可通过链接访问。
- `restricted`：仅允许管理员或经邮箱授权的登录用户只读访问对应详情页。
- `private`：仅管理员本人在后台查看和管理。

下一阶段优先级：

- Phase 2I：Viewer 登录与 restricted 访问专项修复。
- Phase 2J：Profile 与站内 Calendar 基础能力。
- Phase 2K：Resume 简历素材库、简历版本组合、模板化预览、质量检查、AI JD 优化建议与 Word 导出。
- Phase 2L：Notion / Google Calendar / AI 辅助研究。

## 权限与数据状态

- 未配置 Supabase 时，后台页面保持 mock data 开发预览，便于本地构建和视觉检查。
- 配置 Supabase 后，后台页面会要求登录，并通过 `public.admin_users` + `public.is_admin()` 判断管理员权限。
- 登录成功后的 `next` 跳转会经过内部后台路径白名单校验，不允许跳到外部 URL。
- 公开首页与公开列表/详情页只读取 `visibility = "public"` 的项目、成果、知识文章与 Skill；private / unlisted 不在公开页面返回或展示。
- 公开访客可以在 `/access-request` 提交访问申请；管理员可在后台将指定 restricted 内容授权给指定邮箱。Viewer 登录和 restricted 只读访问基础代码已实现，但 magic link 登录仍存在已知问题，详见 `docs/known-issues.md`。
- 公开 About 页面不硬编码管理员邮箱、Supabase 配置、Auth UUID 或其他敏感联系信息。
- 后台 Projects、Publications、Skills、Knowledge 列表页提供轻量公开运营提示，帮助维护 public / featured 内容质量。
- 公开可读取内容表不存储管理员 Supabase Auth UUID；管理员身份只保存在私密的 `admin_users` 表中。
- 公开访问通过 `visibility = "public"` 控制；restricted 内容通过 `content_access_grants` 与登录用户邮箱匹配控制；后台写入、更新、删除权限通过 `public.is_admin()` 控制。
- 当前 Projects、Knowledge Base、Skills Library、Publications 已接入真实 CRUD，并通过 Supabase RLS 与管理员身份保护写入。
- Documents 已接入真实文件记录、私密 Storage 上传、短时 signed URL 下载和删除流程；生产环境已执行 0003 migration 并通过真实上传、下载、关联、删除保护和清理验收。
- Access Requests 使用真实 Supabase 表记录访问申请；匿名访客只能提交，管理员可查看并更新 pending / approved / rejected 状态与备注。
- Access Grants 已具备后台创建、列表和撤销基础；restricted 访问链路仍需 Phase 2I 稳定 Viewer 登录。
- Profile 已接入真实 Supabase 编辑；公开 About 页面优先读取 `is_public = true` 且 `visibility = "public"` 的 Profile 字段。
- Calendar 已接入站内 `calendar_events` CRUD；管理员可在 `/dashboard/calendar` 新建、编辑、删除日程，Dashboard 会展示近期日程。
- Market Briefs 已接入后台私密 `market_briefs` CRUD；管理员可在 `/dashboard/market-briefs` 手工维护每日市场收评，字段包括日期、标题、市场、状态、标签、数据来源和摘要 / 市场概览 / 指数表现 / 风格表现 / 行业板块 / 热点 / 资金流向 / 政策新闻 / 风险提示 / 明日关注等模块。Phase 2L-B 进一步增加 Markdown 主内容源、`/dashboard/market-briefs/[id]/preview` 站内预览、Markdown / HTML / JSON / Word 即时下载，以及浏览器打印 / 保存 PDF；如果 `markdown_content` 为空，预览和下载会从结构化字段实时合成 Markdown。Phase 2L-C 在列表页新增“获取今日市场动态”按钮，当前使用 `manual-skill-mock` 生成器生成今日 A 股 Markdown 草稿并写入 `market_briefs`，如果今日同市场简报已存在则跳转已有预览页，不重复创建。Phase 2L-D-A 新增 `market_brief_generation_jobs` 和 `/dashboard/market-briefs/jobs`，按钮会先创建生成任务，再由 mock runner 同步写入简报；私有 API `/api/market-briefs/skill-result` 可接收外部 Skill Runner 的 secret-authenticated 结果回写。Phase 2L-D-B 新增 `MARKET_BRIEF_GENERATOR=external` 模式、claim/fail 私有 API 和 `scripts/market-brief-runner/` 外部 runner 骨架，支持“站内创建 queued job -> 外部 runner 领取 -> mock 生成 -> result 回写”的闭环。Phase 2L-D-C 新增 Python AkShare runner，尝试抓取宽基指数、市场宽度、行业板块和热点方向，并生成稳定 `source_snapshot` 与 Markdown；数据源不可用时记录 warning，核心数据完全不可用时标记任务 failed。本阶段不做 AI 生成、新闻爬虫、邮件发送、Notion 同步、定时任务、公开页面、股票推荐或投资建议。
- Resume 已接入履历素材库与版本组合；管理员可在 `/dashboard/career` 进入求职中心，并继续通过 `/dashboard/resume`、`/dashboard/resume/versions`、`/dashboard/resume/applications` 和 `/dashboard/resume/jd-reviews` 使用原有子模块路径。管理员可在 `/dashboard/resume` 按个人信息、教育、实习、在校、项目、研究、技能、证书和奖项等区块维护结构化素材，并在 `/dashboard/resume/versions` 组合不同简历版本。版本编辑页可选择进入简历顶部的个人字段，并为每条素材控制日期、机构、角色、摘要、bullets、技能和核心课程等字段是否展示。版本详情、列表和预览页提供规则化简历质量检查、完整度评分、缺失项和投递方向提示。Phase 2K-E 新增 AI JD 简历优化助手，可基于当前版本已选素材和管理员粘贴的 JD 生成关键词差距、经历强化和 bullet 改写建议；该能力支持 `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` 通用配置，可接入 DeepSeek 等 OpenAI-compatible Provider，并继续兼容 `OPENAI_API_KEY` / `OPENAI_MODEL`。Hotfix 进一步将 AI JD 输入与页面“版本内容概览”统一到 `resume-template-model` 派生的 `resume-ai-input`，确保教育、实习、项目、研究和技能等可见字段与预览 / Word 导出的核心内容一致。AI JD 优化只生成建议，不自动写回 Resume Items 或 Resume Versions。Phase 2K-H 新增 JD 分析历史与投递记录，管理员可保存单次 AI JD 分析、公司/岗位信息、缺失关键词、风险、下一步行动和投递状态；该记录仍为后台私密数据，不公开展示。Phase 2K-I 新增 `/dashboard/resume/applications` 投递看板，基于 `resume_jd_reviews.application_status` 按草稿、已分析、准备投递、已投递、面试中、被拒、Offer 和已归档管理求职 pipeline，并支持列表筛选和快速改状态；本阶段不自动投递、不发送邮件、不公开记录，也不新增 migration。Phase 2K-J 新增 `/dashboard/career` 求职中心首页，将简历素材、简历版本、投递看板和 JD 分析记录收拢到一个侧边栏入口，并在子页面顶部提供统一 Career tabs；原有子模块路径保持不变。版本预览页提供贴近中文金融简历 PDF 的 A4 样式和浏览器打印 / 另存为 PDF 能力；Phase 2K-F 新增 Word `.docx` 即时导出，导出只读取当前版本已选素材、Profile/basic 信息和字段可见性设置，不写入 Storage，不创建公开简历页面或分享链接。Phase 2K-G 将 Preview 与 Word 导出统一到 20260523 风格模板模型，补充照片位置、模块标题视觉符号和左时间 / 右内容的正式简历布局。
- 公共页 UI 已完成蓝白清爽研究工作站风格优化；管理后台 UI 已完成工作台式视觉优化。
- Dashboard 已读取真实项目、笔记、Skill、Publications、Calendar 与 Activity Logs。
- Google Calendar、提醒系统和外部日历同步尚未实现。
- `profiles.contact` 与 `profiles.social_links` 仅应保存希望公开展示的联系方式；若 profile 记录设置为 public，其中公开字段会被访客读取。
- 文件附件默认比正文内容更严格；即使 Publication 设置为 public，关联 Documents 仍保持 private，本阶段不会在公开页面提供下载入口。
- Notion 的长期定位是草稿、临时研究笔记、日常记录和协作辅助，不替代个人网站的正式公开门户、权限系统与私密资产库。

## 已知问题

Viewer magic link 登录仍不稳定。Phase 2E-B 已实现 restricted 授权基础代码，但授权邮箱登录、viewer session 建立和 restricted 内容查看仍需后续 Phase 2I 专项修复。

该问题不影响：

- public 内容浏览；
- 管理员后台；
- Documents 私密文件中心；
- 访问申请提交与审批；
- 公开站点 SEO 和 UI。

## 初始数据结构

`supabase/migrations/0001_initial_schema.sql` 已为 Phase 2B 真实 CRUD 预留主要字段：

- `profiles`：独立内容 ID、个人展示、公开角色、组织、所在地、公开状态、邮箱、简历链接、联系方式、社交链接、研究兴趣与技能标签，不引用 Auth 用户 ID。
- `projects`：使用 `title`、`slug`、背景、研究问题、方法论、进度、状态、精选标记与开始日期。
- `publications`：成果标题、slug、摘要、封面、精选标记、附件路径与关联项目。
- `knowledge_notes`：笔记标题、slug、分类、正文、精选标记与关联项目。
- `skills`：Skill 名称、slug、说明、输入输出描述、使用指南、Skill.md 内容、仓库链接、版本、状态与精选标记。
- `calendar_events`：日程时间、类型、地点、可见性与项目 / 成果 / 知识 / Skill 关联。
- `documents`：文件存储路径、分类、关联实体类型与关联 ID。
- `activity_logs` 与 `skill_versions`：后续审计与 Skill 版本记录基础。
- `access_requests`：Phase 2E-A 访问申请记录，包括申请人姓名、邮箱、机构、申请内容、理由、处理状态与管理员备注。
- `content_access_grants`：Phase 2E-B 受限内容授权记录，包括被授权邮箱、内容类型、内容 ID、状态、有效期与管理员备注。
- `resume_items`：Phase 2K-A 履历素材库记录，包括素材类型、标题、机构、角色、时间、bullet、skills、tags、关联对象、排序、可见性与精选标记。
- `resume_versions` 与 `resume_version_items`：Phase 2K-B 简历版本与素材组合关系，记录版本标题、目标岗位、语言、模板、启用状态、已选素材、区块、排序和展示开关；Phase 2K-C 通过 0011 补充顶部个人字段开关、区块顺序、模板选项和逐条素材可见字段控制。
- `resume_jd_reviews`：Phase 2K-H JD 分析历史与投递记录，保存关联简历版本、JD 原文、AI 结构化建议、关键词缺口、风险、下一步行动、公司/岗位和投递状态；Phase 2K-I 投递看板继续复用该表和 `application_status`，不新增表结构。
- `market_briefs`：Phase 2L-A / 2L-B / 2L-C 市场简报后台记录，保存日期、标题、市场、状态、摘要、模块化正文、数据来源、标签、精选标记、Markdown 主内容、生成状态、生成时间、生成方式、source snapshot 和 artifact 文件元数据；当前仅管理员后台手工维护、mock 生成、站内预览和即时下载，不公开展示。
- `market_brief_generation_jobs`：Phase 2L-D-A 市场简报生成任务记录，保存 owner、日期、市场、任务状态、runner 名称、request payload、source snapshot、result payload、关联 `market_brief_id`、错误信息和运行时间线；仅管理员或 owner 可通过后台读取管理，anon/viewer/public 不可访问。

公开可读表 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills` 不保存管理员 Auth UUID。私密后台表 `calendar_events`、`documents`、`activity_logs`、`market_briefs` 可保留 `owner_id` 或 `actor_id` 用于后续审计。

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
