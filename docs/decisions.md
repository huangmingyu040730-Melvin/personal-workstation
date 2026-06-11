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

## 2026-06-03 - Use Private Workspace Storage For Documents

类型：decision

决策：

- Phase 2C 使用单一私密 Supabase Storage bucket：`workspace-files`。
- 文件上传、读取、更新和删除均通过 Storage policy 限定 `bucket_id = 'workspace-files'` 且 `public.is_admin()`。
- 管理员下载文件时按需生成 60 秒 signed URL，不保存到数据库，不输出到公开页面。
- 即使文件关联到 public Publication，附件本轮仍保持私密，仅管理员可下载。

## 2026-06-09 - Store Resume Versions Separately From Resume Items

类型：decision

决策：

- Phase 2K-B 使用 `resume_versions` 保存简历版本元数据。
- 使用 `resume_version_items` 保存每个版本选择了哪些 `resume_items`、归属哪个区块、排序值、当前版本是否展示和备注。
- 删除版本时只删除组合关系，不删除原始简历素材。
- 本阶段只做后台组合与预览，不做 PDF / Word 导出、公开简历页、分享链接或 AI JD 优化。

原因：

- 简历素材需要复用于多个申请场景，不能把素材内容直接复制进每一份版本。
- 版本与素材关系分离后，后续可以在不改原始素材的情况下调整区块、排序和展示开关。
- 导出与 AI 优化属于后续能力，先稳定数据结构和后台预览闭环更安全。

影响：

- 需要执行 `supabase/migrations/0010_resume_versions.sql`。
- 管理入口为 `/dashboard/resume/versions`。
- Dashboard 可显示简历版本统计和最近版本。
- 版本数据继续仅管理员管理，不向匿名访客开放读取。

## 2026-06-09 - Use Browser Print For First Resume PDF Export

类型：decision

决策：

- Phase 2K-C 先把 `/dashboard/resume/versions/[id]/preview` 优化为 A4 中文简历模板预览。
- 使用浏览器 `window.print()` 支持管理员手动打印或另存为 PDF。
- 打印 CSS 隐藏后台 Sidebar、Topbar、操作按钮和说明，只保留简历纸张内容。
- 本阶段不引入 Puppeteer、PDFKit、LibreOffice、docx、LaTeX 或第三方导出服务。

原因：

- 当前目标是快速获得接近传统中文金融简历的可交付 PDF，而不是建立复杂文档生成系统。
- 浏览器打印能复用现有 React 预览和 CSS，减少后端依赖、部署风险和文件存储风险。
- 后端 PDF、Word 导出和 AI JD 优化应在简历内容结构稳定后再单独实现。

影响：

- 管理员在预览页点击“打印 / 导出 PDF”，再使用浏览器打印对话框保存 PDF。
- PDF 质量依赖浏览器打印设置和 CSS print media。
- 不创建公开简历页面、分享链接、后端 PDF 文件或新的数据库表。

原因：

- 文件中心管理的是研究资料、报告成稿、会议资料等默认私密内容。
- 公开成果与私密附件需要分离，避免因为成果公开而意外公开内部文件。
- 使用短时 signed URL 能减少长期链接泄露风险，同时保持实现简单。

影响：

- 新增 `supabase/migrations/0003_publications_documents_storage.sql` 创建 bucket 与 Storage policies。
- 合并 PR 后必须由用户确认并执行 0003，真实上传/下载能力才会在生产 Supabase 项目生效。
- 普通运行时继续使用 publishable key 和管理员登录身份，不使用 `service_role`。

## 2026-06-03 - Prevent Publication Deletion While Attachments Exist

类型：decision

决策：

- 删除 Publication 前先检查是否仍有关联 `documents.related_type = 'publication'` 且 `related_id = publication.id` 的附件。
- 如果存在关联附件，阻止删除并显示中文提示，要求管理员先删除或解除关联附件。

原因：

- 真实文件删除不可轻易回滚。
- 自动级联删除成果附件容易造成误删 Storage 对象。
- Phase 2C 不实现复杂附件版本管理或批量迁移，保守策略更安全。

影响：

- Publication 删除 action 会查询 documents 表。
- 管理员需要先在文件中心处理附件，再删除成果。

## 2026-06-03 - Upload Documents Directly From Browser To Supabase Storage

类型：decision

决策：

- Documents 上传不通过 Server Action 或 Route Handler 传输文件二进制。
- 采用两阶段流程：Server Action 准备上传 metadata 和安全路径，浏览器使用当前管理员 Supabase Auth 会话直接上传到 private bucket，Server Action 再最终确认并写入 documents 记录。
- 文件上传仍使用 `upsert: false`，并继续依赖 Storage policy 中的 `public.is_admin()`。

原因：

- Next.js Server Actions 默认请求体限制约 1 MB。
- Vercel Function request/response payload 限制无法可靠承载 20 MB 文件。
- 浏览器直传 Supabase Storage 可以绕开 Vercel Function payload 限制，同时保持 Auth + RLS + Storage policy 的权限边界。

影响：

- Server Actions 只接收文件名、MIME type、大小和业务 metadata，不接收完整 File。
- 20 MB 上限由客户端预检、服务端 metadata 校验、bucket 文件大小限制和 Storage policy 共同保障。
- finalize 失败时会尽力删除刚上传的 Storage 对象，减少未登记对象残留。

## 2026-06-04 - Reposition As Public Research Workstation And Private Admin Backend

类型：decision

决策：

- 项目长期定位升级为“公开研究工作站 + 私密管理后台 + 未来受限访问体系”。
- 公开研究工作站面向所有访客展示 public 项目、成果、知识文章、Skill、个人介绍、精选内容和公开统计。
- 私密管理后台仅管理员可进入，用于管理全部 public / unlisted / restricted / private 内容、文件、日历、自动化和访问申请。
- 未来受限访问体系只按具体内容授权外部用户只读访问，不授予后台管理权限。

原因：

- 个人网站不仅是后台工具，也应成为外部可浏览的正式研究门户。
- 公开展示、私密管理和未来审批访问的权限边界不同，必须在产品定位层先分清。
- 后续路由、RLS、查询和页面体验都需要围绕这三层访问模型演进。

影响：

- 公开页面不得展示 private / restricted 内容、后台操作、私密文件入口、Activity Logs、signed URL 或 Storage 内部路径。
- 管理员后台继续保留完整 CRUD 和文件管理能力。
- Notion 仅作为草稿、临时记录和协作辅助工具，不替代正式网站。

## 2026-06-04 - Plan Visibility Model Expansion

类型：decision

决策：

- 当前生产继续使用 `public`、`unlisted`、`private`。
- 长期权限模型规划增加 `restricted`。
- `public` 对所有访客公开并可进入公开列表。
- `unlisted` 不公开列出，未来可通过链接访问。
- `restricted` 未来要求登录并经过管理员对具体内容审批授权。
- `private` 仅管理员本人可查看。
- 文件附件默认比正文内容更严格，即使正文 public，附件默认仍保持 private。

原因：

- 外部用户可能只应查看某一份成果、项目或材料，而不是整个后台。
- 附件往往包含更敏感的研究资料和原始文件，需要独立于正文控制。

影响：

- Phase 2E 前不要在 UI 中假装 restricted 已可用。
- 未来 schema、RLS 和 Server Actions 需要围绕“指定内容授权、只读、可撤回、可过期”设计。
- 附件下载权限需要独立审批，不能因为内容公开而自动公开。

## 2026-06-04 - Prioritize Public Browsing System In Phase 2D

类型：decision

决策：

- Phase 2C 完成后，不立即进入 Calendar。
- Phase 2D 优先建立公开研究工作站体系：公开项目、成果、Skill、知识文章列表与 slug 详情页，以及升级公开首页。
- 后台管理路由应逐步迁移到 `/dashboard/...`，公开只读路由保留在 `/projects`、`/publications`、`/skills`、`/knowledge` 等路径。

原因：

- 当前后台管理页面占用了未来公开浏览路径。
- 如果不先拆分公开页面与后台页面，后续 unlisted / restricted / 公开详情能力会与现有后台路由冲突。
- 公开研究门户是新产品定位下的最高优先级基础设施。

影响：

- Phase 2D 初期可以先新增公开页面和兼容策略，不必一次性迁移全部后台路径。
- 迁移必须保护现有生产后台能力，必要时使用受保护 redirect 或过渡路径。
- Phase 2E 受限访问审批应等公开浏览体系稳定后再实现。

## 2026-06-06 - Public Detail Relations Must Also Be Public

类型：decision

决策：

- 公开详情页展示关联项目、成果或知识文章时，关联对象本身也必须通过 `visibility = "public"` 查询。
- 不依赖嵌套关系查询在所有登录状态下自动隐藏私密关联。
- 如果关联对象不是 public，公开页面统一显示为未公开关联或不展示该关联卡片。

原因：

- 管理员登录状态下访问公开页面时，RLS 可能允许读取 private / unlisted 关联对象。
- 公开页面的安全边界不应随访问者是否为管理员而变化。
- 访客视角页面不应泄露私密关联内容的标题、slug、ID 或存在状态。

影响：

- 公开 Project 详情只展示 public Publications 与 public Knowledge。
- 公开 Publication 与 Knowledge 详情只链接 public Project。
- Documents、signed URL、Storage 路径和 Activity Logs 继续完全不进入公开页面。

## 2026-06-06 - Use Public Content Quality Guidance Instead Of New Workflow Features

类型：decision

决策：

- Phase 2D-C 只增加公开展示质量和后台运营提示，不新增数据字段、migration、审批、AI 或自动化能力。
- 后台通过轻量提示说明 public / featured 对公开站点的影响。
- Dashboard 只展示公开内容数量和维护建议，不做复杂质量评分系统。

原因：

- 当前阶段目标是把公开研究工作站打磨到适合分享，而不是扩展权限或工作流系统。
- public 内容质量可以先通过文案、卡片、筛选和空状态引导提升，不需要新 schema。

影响：

- 后续如需要自动质量检查、缺字段提醒或发布流程，应另起阶段设计。
- 本阶段不修改 RLS、Storage policies 或 Supabase migrations。

## 2026-06-06 - Implement Access Requests As Records Before Real Authorization

类型：decision

决策：

- Phase 2E-A 只实现公开访问申请表单、后台申请列表/详情、处理状态和管理员备注。
- 新增 `access_requests` 表和 `0004_access_requests.sql` 增量 migration。
- 匿名访客只能提交申请，不能读取、更新或删除申请记录。
- 管理员通过 `public.is_admin()` 查看申请并更新 `pending`、`approved`、`rejected` 状态。
- 本阶段不创建外部账号，不开放 restricted 内容，不生成邀请链接，不实现授权有效期、撤销或附件下载权限。

原因：

- 在真正开放受限内容前，先收集外部访客需求和管理员处理记录，可以降低权限模型一次性上线的风险。
- 申请内容可能包含联系方式和理由，必须避免被匿名访客读取。
- approved/rejected 当前只代表内部处理状态，不应被误解为已经授予访问权限。

影响：

- 公开站点新增 `/access-request` 入口。
- 后台新增 `/dashboard/access-requests` 管理页面。
- 生产环境合并后必须执行 `0004_access_requests.sql`，否则公开表单和后台申请管理无法真实读写。
- 后续 Phase 2E-B 如要实现真实受限访问，需要另行设计外部用户、内容授权、过期与撤销机制。

## 2026-06-06 - Add Email Scoped Restricted Content Grants

类型：decision

决策：

- Phase 2E-B 使用 `restricted` visibility 表示需要授权查看的内容。
- 受限访问通过 `content_access_grants` 按邮箱、内容类型和内容 ID 授权。
- 外部用户使用 Supabase 邮箱 OTP / magic link 登录，只获得普通 authenticated session。
- 内容表 RLS 通过 `public.has_content_access()` 判断当前登录邮箱是否拥有 active 且未过期授权。
- Documents 与 Storage 不随内容授权开放；附件对外下载继续后延。

原因：

- 访问申请 approved 只是审批状态，必须有独立授权记录才能形成可撤销、可过期、可审计的访问边界。
- 邮箱级授权是单管理员个人工作站的最小可用模型，避免引入团队、组织和复杂角色系统。
- 继续依赖 Supabase Auth、RLS 和 publishable key，避免使用 service_role 绕过策略。

影响：

- 需要新增 `0005_restricted_content_access.sql` 并在生产合并后手动执行。
- Projects、Publications、Knowledge、Skills 表单增加 `restricted` 选项。
- 后台新增访问授权列表和创建/撤销能力。
- 公开详情页在无权限时显示授权申请入口，不展示正文、附件、Storage 路径或 signed URL。

## 2026-06-06 - Phase 2F Focuses On Public SEO Without Expanding Viewer Access

类型：decision

决策：

- Phase 2F 只完善公开站点运营体验、sitemap、robots、metadata、内容发现和 About 页面。
- `/sitemap.xml` 只包含 public 页面和 `visibility = "public"` 的 Projects、Publications、Skills、Knowledge 详情页。
- `/robots.txt` 允许公开页面抓取，禁止后台、登录、Documents、Viewer 和访问申请表单被抓取，并指向正式 sitemap。
- Viewer magic link 登录仍作为已知问题记录，Phase 2F 不继续修改 Viewer login、viewer callback、restricted grants、RLS、Supabase Auth、Storage 或 migration。

原因：

- 当前公开站点已经具备真实 public 内容展示能力，适合先补齐可发现性、搜索引擎入口和个人主页运营体验。
- Viewer 登录问题需要单独结合 Supabase Auth 和 Vercel Function 日志排查，不应阻塞 public-only SEO 工作。
- sitemap 和 metadata 必须与公开隐私边界一致，避免 private、restricted、unlisted、dashboard、documents、viewer 或 Storage 路径被索引。

影响：

- public 内容更容易被搜索引擎发现，公开列表和详情页拥有更清晰的 canonical 与 Open Graph metadata。
- restricted 内容仍可保留基础代码，但不会进入 sitemap，也不会生成可索引的具体 metadata。
- 后续如继续修复 Viewer 登录，应另开 Hotfix，不与 Phase 2F 混合。

## 2026-06-09 - Treat Restricted Access As Foundation With Viewer Login Known Issue

类型：decision

决策：

- Phase 2E-B 的 restricted 授权基础能力保留为当前代码基础。
- `restricted` visibility、`content_access_grants`、`has_content_access()`、Access Grants、viewer login 和 viewer callback 已进入项目。
- Viewer magic link 登录仍不稳定，当前冻结继续排查。
- 后续以 Phase 2I 单独修复 Viewer 登录与 restricted 只读访问稳定性。

原因：

- restricted 权限模型已经具备数据库和页面基础，但真实 viewer 登录链路尚未通过稳定验收。
- 继续在普通 UI/SEO/文档阶段扩展 viewer 能力会混淆已完成能力和已知问题。

影响：

- public 内容、管理员后台、Documents、访问申请与 SEO 不依赖 Viewer 登录。
- 当前文档必须明确 restricted 基础代码已存在，但 viewer 体验仍是 known issue。
- 后续如需数据库变更，应使用当前最新编号之后的新 migration，不得修改已执行过的旧 migration。

替代说明：

- 本决策替代早期“restricted 仍属纯后续规划”的描述。

## 2026-06-09 - Keep Documents Private Across Public And Restricted Views

类型：decision

决策：

- Documents 和 Storage 附件不随 public 或 restricted 正文开放。
- 文件下载只通过管理员后台流程生成短时 signed URL。
- 公开页面、viewer 页面、sitemap 和 robots 不得输出 Storage 路径、signed URL 或附件下载入口。

原因：

- 文件往往比正文包含更多敏感资料。
- restricted 正文只读授权不等同于附件授权。

影响：

- 即使 Publication 是 public，关联 Documents 仍保持 private。
- 即使未来 Viewer 可以访问 restricted 正文，也不自动获得 Documents 权限。

## 2026-06-09 - Complete Public And Admin UI Polish Before Next Functional Phase

类型：decision

决策：

- Phase 2G-A 完成公开站点 UI 优化。
- Phase 2G-B 完成管理后台 UI 优化。
- 后台新建 / 编辑 / 上传 / 授权页采用更平衡的工作台式布局。

原因：

- 项目已具备核心内容和文件能力，需要在进入下一轮功能前先提升公开展示和后台操作体验。
- UI polish 不应混入 Auth、RLS、Storage、migration 或 Viewer 登录修复。

影响：

- 后续功能开发应复用已抽取的后台 UI 组件和公开页视觉方向。
- Phase 2H 只做文档收口，不继续修改业务代码。

## 2026-06-09 - Use Current Status Documents As Handoff Source

类型：decision

决策：

- 新增 `docs/current-status.md` 作为当前项目状态的主要交接文档。
- `README.md`、`docs/memory.md`、`docs/roadmap.md`、`docs/known-issues.md` 和 `docs/supabase-setup.md` 应与该状态保持一致。

原因：

- 项目已经经历多个阶段，旧文档中存在“后续规划”和“已完成能力”混杂的问题。
- 后续 Codex 接续开发需要快速区分已完成、已冻结、下一步和安全边界。

影响：

- Phase 2H 只更新文档，不修改业务代码、migration、Auth、RLS、Storage 或 Viewer login。
- 后续阶段开始前应先阅读 `docs/current-status.md`、`docs/known-issues.md` 和 `docs/roadmap.md`。

## 2026-06-09 - Reuse Calendar Events For Site-Local CRUD

类型：decision

决策：

- Phase 2J-B 复用 0001 中已存在的 `public.calendar_events` 表作为站内日程 CRUD 的基础。
- 新增 `0008_calendar_events.sql` 只补足缺失字段、索引、event type 约束与 public 日程读取 policy。
- 后台真实日程管理入口为 `/dashboard/calendar`，公开 `/calendar` 仍保留占位页面。
- Dashboard 读取真实 `calendar_events` 展示近期日程。

原因：

- 既有 schema 已包含 `calendar_events`、管理员 RLS policy 与 0002 authenticated 表级 CRUD 权限，不需要重建表。
- 当前目标是站内 Calendar，不接入 Google Calendar、不做提醒系统，也不公开展示私密日程。
- 最小增量 migration 可以避免修改已执行过的 0001-0007，并保持权限边界清晰。

影响：

- 管理员可创建、编辑、删除日程；日程默认 `private`。
- public 日程可被 RLS 允许公开读取，但本阶段不会进入公开列表、sitemap 或首页。
- private 日程仍仅管理员可读。
- 后续如接入 Google Calendar、提醒系统或公开日历展示，应另开阶段并新增 migration。

## 2026-06-09 - Model Resume As A Reusable Item Library

类型：decision

决策：

- Phase 2K-A 新增 `public.resume_items` 统一素材表。
- 使用 `item_type` 区分 basic、education、experience、project、research、skill、certification、award、language 和 other。
- 后台管理入口为 `/dashboard/resume`，并提供新建、详情、编辑、删除能力。
- Resume 素材默认 `private`，本阶段不创建公开简历页面。

原因：

- Resume 模块应是个人履历数据库，不是单份静态简历。
- 统一表能支持后续按岗位选择、组合和排序素材，避免早期拆多表带来过度复杂度。
- 当前阶段只为后续简历版本组合、模板预览、浏览器打印、规则化质量检查和 AI JD 优化打基础。

影响：

- 合并后生产 Supabase 需要执行 `0009_resume_items.sql`。
- Dashboard 可展示简历素材概览和最近更新素材。
- 后续 Phase 2K-B 才做简历版本组合生成；Phase 2K-C 做分区式模板预览与浏览器打印；Phase 2K-D 已调整为规则化质量检查，AI JD 优化后移到后续阶段。
- 不修改 Viewer、restricted grants、Documents、Storage、Calendar 或 Profile 主流程。

## 2026-06-09 - Keep Resume Template Rendering In Browser

类型：decision

决策：

- Phase 2K-C 不引入后端 PDF、Word、LaTeX、Puppeteer、PDFKit 或外部导出服务。
- 在既有 `resume_items`、`resume_versions`、`resume_version_items` 结构上新增 `0011_resume_template_fields.sql`。
- `resume_items.details` 保存教育、实习、项目、技能和个人信息等结构化细节。
- `resume_versions.profile_fields` 控制照片、性别、年龄、电话、邮箱等顶部字段是否进入简历。
- `resume_version_items.visible_fields` 控制单条素材的日期、机构、角色、摘要、bullets、技能、核心课程等是否进入当前版本。
- 预览页采用更贴近上传 PDF 参考的 A4 中文简历模板，并通过浏览器打印 / 另存为 PDF。

原因：

- 当前用户重点是让简历模块先从“混合素材列表”变成“可维护的分区式简历管理”和“贴近 PDF 的预览模板”。
- 浏览器打印能避免后端二进制生成、云函数体积、字体嵌入和文件存储权限的额外复杂度。
- JSON 字段能保留统一素材库的灵活性，同时支持不同简历区块所需的差异字段。

影响：

- 合并后生产 Supabase 需要执行 `0011_resume_template_fields.sql`。
- 简历个人字段不会自动进入公开 About，也不会创建公开简历页面。
- 后续如需 Word 导出、多个严格模板、照片上传或 AI JD 优化，应另开阶段并新增必要 migration。

## 2026-06-09 - Keep Resume Quality Checks Rule-Based

类型：decision

决策：

- Phase 2K-D 为 Resume Version 增加规则化质量检查，而不是 AI 评审。
- 质量报告在页面渲染时根据版本、已选素材、Profile / 个人信息素材和目标岗位即时计算。
- 评分结果不写入数据库，不新增 migration。
- 目标关键词复用 `resume_versions.template_options.target_keywords`，不新增字段。

原因：

- 当前目标是帮助判断简历是否具备投递基础、缺少哪些关键信息，而不是自动生成或改写简历。
- 纯规则检查更稳定、可解释，也不会引入 API key、AI 成本或隐私风险。
- 使用现有 JSON 配置可以避免为了轻量提示增加 schema 复杂度。

影响：

- 版本列表、版本详情和预览页可以展示完整度、状态、风险项和建议项。
- 编辑页突出目标岗位，并允许维护目标关键词。
- 本阶段不修改 Resume 主数据结构、RLS、Storage、Documents、Viewer、restricted、Calendar 或 Profile 主流程。
- 后续 Phase 2K-E 可在此基础上单独设计 AI JD 优化或自动改写能力。

## 2026-06-09 - Keep AI JD Resume Review Advisory Only

类型：decision

决策：

- Phase 2K-E 新增 `/dashboard/resume/versions/[id]/jd-review` 作为 AI JD 简历优化入口。
- AI 输入只包含当前简历版本中已选择展示的素材、版本目标岗位/关键词和管理员粘贴的 JD。
- AI 输出为结构化建议，包括匹配摘要、已匹配关键词、缺失关键词、优势、差距、经历强化建议、bullet 改写建议、风险提示和下一步行动。
- 本阶段不保存 JD 分析历史，不自动写回 Resume Items，不自动覆盖 Resume Versions。
- AI 调用只在 Server Action 中进行，需要服务端 `OPENAI_API_KEY`，可选 `OPENAI_MODEL`。

原因：

- JD 匹配建议适合辅助人工判断，但不应直接替换用户真实经历。
- 金融/投研简历容易涉及量化成果和事实边界，AI 不得编造经历、公司、岗位、证书或数据。
- 不保存分析历史可以避免新增 migration 和额外隐私面，先验证单次分析体验。

影响：

- 管理员可以在版本详情和预览页进入 AI JD 优化页面。
- 未配置 `OPENAI_API_KEY` 时页面仍可打开，并显示配置提示。
- 不发送 Documents、Storage 路径、signed URL、Access Requests、Access Grants、管理员邮箱、Auth UUID 或密钥给 AI。
- 本阶段不修改 RLS、Storage、Documents、Viewer、restricted、Calendar、Profile、Resume 主数据结构或旧 migration。

替代 / 更新：

- 2026-06-10 Phase 2K-H 在验证单次分析体验后，新增后台私密 JD 分析历史和投递状态记录。2K-E 的“不保存分析历史”只适用于当时的首版 AI 建议能力。

## 2026-06-10 - Support Configurable AI Provider For JD Review

类型：decision

决策：

- AI JD 简历优化不再直接读取 `OPENAI_API_KEY` / `OPENAI_MODEL`。
- 新增 `src/lib/ai-provider.ts`，统一解析 AI Provider 配置。
- 优先使用通用环境变量：`AI_PROVIDER`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。
- 继续兼容旧环境变量：`OPENAI_API_KEY`、`OPENAI_MODEL`。
- `AI_PROVIDER=deepseek` 时默认 `AI_BASE_URL=https://api.deepseek.com`，默认 `AI_MODEL=deepseek-v4-flash`。
- `AI_PROVIDER=openai` 或旧 OpenAI 环境变量时，继续使用项目既有 OpenAI 默认模型。
- 未配置任何 API Key 时，页面和 Server Action 显示中文配置提示，不崩溃。
- 本次 hotfix 不新增 migration，不修改 Resume 主数据结构，不影响 JD Review History、Word 导出、Profile、Calendar、Documents 或 Viewer。

原因：

- DeepSeek 等服务支持 OpenAI-compatible 调用，可以通过 `baseURL` 与模型名复用同一套 AI JD 分析流程。
- 将 provider 配置抽到独立 helper，可以避免后续在业务 Server Action 中散落不同厂商的环境变量判断。
- 保留旧 OpenAI 环境变量能保证已部署环境不被破坏。

影响：

- AI JD 分析继续只在 Server Action 中读取 API Key，API Key 不传到客户端、不写进 HTML、不写入日志。
- AI 输入仍只包含当前简历版本已选择展示的素材、目标岗位设置和管理员粘贴的 JD。
- 不发送 Documents、Storage 路径、signed URL、Access Requests、Access Grants、管理员邮箱、Auth UUID 或密钥。
- AI 输出仍是建议和分析，不自动写回 Resume Items 或 Resume Versions。

## 2026-06-10 - Generate Resume Word Files On Demand

类型：decision

决策：

- Phase 2K-F 新增后台 Resume Version 的 Word `.docx` 即时导出。
- 导出通过 `/dashboard/resume/versions/[id]/export/docx` route handler 在管理员请求时生成并返回文件。
- `.docx` 生成逻辑集中在 `src/lib/resume-docx.ts`，使用当前 Resume Version、已选 Resume Items、Profile/basic 信息和字段可见性设置。
- 第一版不导出照片，不创建公开简历页，不保存 Word 文件，不上传 Storage，不生成分享链接。

原因：

- Word 文件需要可编辑性，但不需要作为站内长期资产保存。
- 即时生成可以避免 Storage 权限、signed URL、文件清理和公开泄露风险。
- 复用已有 Resume Version 数据结构即可满足当前投递版本导出需求，不需要新增 migration。

影响：

- 管理员可以在版本详情页和预览页下载 `.docx`。
- 导出内容只包含当前版本已选且展示的素材，并尊重 `profile_fields` 与 `visible_fields`。
- 官方 `resume_items.bullets` 数组会以 Word 原生 bullet list 逐条展示。
- 不读取 Documents、Storage、Access Requests、Access Grants、viewer/restricted 内容或未选择的 Resume Items。

## 2026-06-10 - Use A Shared Resume Template Model For Preview And Word

类型：decision

决策：

- Phase 2K-G 新增 `src/lib/resume-template-model.ts`，将 Resume Version、Profile/basic 信息和已选 Resume Items 转成统一模板模型。
- A4 Preview 和 Word `.docx` 导出都使用这套模型，不再各自维护独立字段拼接逻辑。
- 模板结构对齐 20260523 Word 简历风格：顶部个人信息与照片位置、模块标题视觉符号、左侧时间列、右侧学校/公司/项目内容、正式技能条目。
- 本阶段不提交用户原始 Word 模板、不提交照片或字体文件，不新增 migration。

原因：

- Preview 和 Word 之前分别维护结构，容易出现字体、字段顺序、布局和 bullet 展示不一致。
- 统一模板模型能让后续多模板、照片上传、Word 样式增强或 PDF 导出更容易扩展。
- 只调整模板渲染层可以避免影响 Resume CRUD、质量检查、AI JD 优化、RLS、Storage 或 Viewer。

影响：

- Preview 页面更接近正式中文金融简历，不再偏后台卡片式展示。
- Word 导出补充照片占位、模块视觉符号和左右列经历布局。
- 字段可见性仍由 `resume_versions.profile_fields` 和 `resume_version_items.visible_fields` 控制。
- 相关技能按正式条目展示，不做标签墙。

## 2026-06-10 - Align AI JD Review Content Source With Resume Template Model

类型：decision

决策：

- 新增 `src/lib/resume-ai-input.ts`，为 AI JD 分析提供统一 Resume AI 输入模型。
- AI JD Server Action 不再用独立摘要逻辑拼接 `title`、`summary` 和部分 `bullets`，而是复用 `resume-template-model` 派生出的 Profile、section、entry、detailLines、bullets 和 tokens。
- `/dashboard/resume/versions/[id]/jd-review` 的“版本内容概览”使用与 AI prompt 完全相同的输入上下文，并完整展示所有参与分析的 section 和条目。
- 字段可见性继续由 `resume_versions.profile_fields` 和 `resume_version_items.visible_fields` 控制；例如隐藏 bullets 或核心课程后，页面概览和 AI 输入都不会包含对应内容。
- 本次 hotfix 不新增 migration，不修改 Resume Items、Resume Versions、`resume_jd_reviews` 表结构、RLS、Storage、Documents、Viewer、restricted、Calendar、Profile 主流程、Word 导出、质量检查或投递看板。

原因：

- 旧 AI JD 上下文单独拼接素材摘要，教育经历、技能和结构化 details 容易显示为“暂无摘要”或被漏掉。
- Preview / Word 已经有统一模板模型，AI JD 应复用同一套可见内容解释，避免用户看到的简历内容、AI 实际输入和导出内容不一致。

影响：

- AI JD 分析会看到当前版本已选择且可见的真实教育、实习、项目、研究、技能、证书和奖项字段。
- 页面概览不再截断前 6 条，也不再只提示“还有 x 条素材会参与分析”。
- AI 输入仍不包含 Documents、Storage 路径、signed URL、Access Requests、Access Grants、viewer/restricted 数据、Supabase key、AI API key、Auth UUID 或未选择素材。
- AI JD 输出仍只生成建议，不自动修改 Resume Items 或 Resume Versions；保存到 JD Review History 的流程保持不变。

## 2026-06-10 - Store JD Reviews As Private Application Records

类型：decision

决策：

- Phase 2K-H 新增 `resume_jd_reviews` 表，用于保存某次 JD 分析、目标公司/岗位、AI 结构化建议、关键词缺口、风险、下一步行动和投递状态。
- `/dashboard/resume/jd-reviews` 作为后台私密列表；`/dashboard/resume/jd-reviews/[id]` 作为详情和状态维护页。
- `/dashboard/resume/versions/[id]/jd-review` 在 AI 分析结果后提供保存表单，但保存记录不会自动写回 Resume Items 或 Resume Versions。
- 简历版本详情页展示最近 3 条 JD 分析记录，并链接到完整历史。
- 本阶段新增 `supabase/migrations/0012_resume_jd_reviews.sql`；不修改已执行过的 0001-0011。

原因：

- AI JD 建议如果只停留在当前页面，无法沉淀不同公司、岗位和投递阶段的判断。
- 投递记录属于后台私密运营数据，不应公开展示，也不应进入 sitemap、公开页面或 viewer 链路。
- 将 AI 建议保存为记录而不是直接改写素材，可以保留人工复核边界，避免 AI 自动覆盖真实经历。

影响：

- 管理员可按状态、公司、岗位或简历版本筛选 JD 分析历史。
- 记录保存 JD 原文、AI JSON、匹配/缺失关键词、风险和下一步行动。
- RLS 继续通过 `public.is_admin()` 限定管理员管理；不向 anon、viewer 或普通外部用户开放。
- 不读取 Documents、Storage、signed URL、Access Requests、Access Grants、viewer/restricted 数据或未选择的 Resume Items。

## 2026-06-10 - Build Application Board From JD Review Records

类型：decision

决策：

- Phase 2K-I 新增 `/dashboard/resume/applications` 投递看板。
- 投递看板复用 `resume_jd_reviews` 表，不新增 migration。
- 看板按 `application_status` 分组展示 `draft`、`reviewed`、`ready`、`submitted`、`interview`、`rejected`、`offer`、`archived`。
- 页面同时提供看板视图和列表视图，支持公司 / 岗位搜索、状态筛选、Resume Version 筛选、岗位方向筛选和投递渠道筛选。
- 快速改状态使用下拉选择和提交按钮，不做拖拽。
- `/dashboard/resume` 增加轻量投递状态概览和最近 JD 分析记录入口。

原因：

- `resume_jd_reviews` 已经保存公司、岗位、岗位方向、投递渠道、投递状态、备注、关联简历版本和更新时间，足够支撑第一版求职 pipeline 管理。
- 不新增字段可以避免扩大数据库迁移和生产验收范围。
- 下拉改状态比拖拽看板简单、稳定，更符合当前后台工作台的低复杂度要求。

影响：

- 投递看板仍是私密后台数据，只允许管理员访问。
- 不展示 JD 原文，不公开投递记录，不进入 sitemap。
- 不自动投递，不发送邮件，不做 Notion 同步，不创建日历提醒，不自动生成投递邮件。
- 不修改 Resume Items、Resume Versions、旧 migration、RLS 旧策略、Storage、Documents、Viewer、restricted、Calendar、Profile、AI JD prompt 或 Word 导出逻辑。
- 后续可扩展日历提醒、面试记录、投递邮件草稿、Notion 同步和统计图表。

## 2026-06-10 - Consolidate Career Navigation Into Career Center

类型：decision

决策：

- Phase 2K-J 新增 `/dashboard/career` 求职中心首页。
- 侧边栏不再平铺显示“简历素材”“简历版本”“投递看板”“JD 分析记录”。
- 侧边栏新增一个一级入口“求职中心”，位于“个人发展”分组。
- `/dashboard/career` 展示简历素材数量、简历版本数量、JD 分析记录数量、当前投递记录数量、面试中数量和 Offer 数量。
- `/dashboard/career` 提供四个子模块入口：简历素材、简历版本、投递看板、JD 分析记录。
- `/dashboard/career`、`/dashboard/resume`、`/dashboard/resume/versions`、`/dashboard/resume/applications`、`/dashboard/resume/jd-reviews` 使用统一 Career tabs。
- 原有子模块路径全部保留，不做 redirect，不删除页面。
- 本阶段不新增 migration。

原因：

- Resume / 求职相关功能已经形成完整业务模块，继续平铺在 Sidebar 会让后台导航变长且模块边界不清晰。
- 单一“求职中心”入口更适合后续扩展面试记录、面试复盘、投递提醒、Offer 对比和求职统计。
- 保留原 URL 可以避免破坏现有代码引用、文档链接和用户书签。

影响：

- 求职相关功能仍保持管理员后台私密访问，不进入公开站点或 sitemap。
- 不修改 Resume Items、Resume Versions、`resume_jd_reviews` 表结构、RLS、Storage、Documents、Viewer、restricted、Calendar、Profile、AI JD 分析逻辑、Word 导出逻辑、质量检查规则、投递看板核心逻辑或旧 migration。
- 本阶段不做面试记录、自动提醒、Notion 同步、邮件发送、自动投递、公开求职页或分享链接。

## 2026-06-10 - Add Private Market Briefs Management

类型：decision

决策：

- Phase 2L-A 新增 `supabase/migrations/0013_market_briefs.sql`。
- 新增 `market_briefs` 表，保存 `brief_date`、`title`、`status`、`market`、摘要、市场概览、指数表现、风格表现、行业板块、市场热点、资金流向、政策新闻、风险提示、明日关注、`data_sources`、`tags` 和精选标记。
- `status` 第一版限定为 `draft`、`reviewed`、`published`、`archived`。
- 增加唯一约束 `owner_id + brief_date + market`，避免同一市场同一日期重复录入。
- 新增后台 `/dashboard/market-briefs`、`/dashboard/market-briefs/new`、`/dashboard/market-briefs/[id]`、`/dashboard/market-briefs/[id]/edit`。
- Dashboard 新增“最近市场简报”区域，显示最近 3 条后台记录。

原因：

- 市场简报 / 研究自动化需要先有稳定的手工数据落点，再接自动抓取、AI 生成、邮件发送和 Notion 同步。
- 手工 CRUD 可以先验证字段设计、后台信息架构和 RLS 边界，避免一开始引入外部行情源和自动化复杂度。

影响：

- 市场简报当前仅管理员后台可访问，不进入公开页面或 sitemap。
- RLS 允许管理员或 owner 管理；不授予 anon 读取权限，不允许 viewer/public 访问。
- 本阶段不读取 Documents / Storage，不保存外部 API Key，不发送 AI 请求，不生成邮件，不创建定时任务。
- 本阶段不做本地行情接口、AI 自动生成、Notion 同步、GitHub Actions、n8n、公开市场简报页、PDF/Word 导出、图表、股票推荐或投资建议。
- 不修改 Resume、Career Center、JD Review、投递看板、Word 导出、AI Provider、Calendar、Documents、Viewer、restricted、Profile、Projects、Publications、Knowledge、Skills、Access Requests 或 Access Grants 的核心流程。

## 2026-06-10 - Add Market Brief Artifacts And Markdown Preview

类型：decision

决策：

- Phase 2L-B 新增 `supabase/migrations/0014_market_brief_artifacts.sql`。
- 在 `market_briefs` 上补充 `markdown_content`、`generation_status`、`generated_at`、`generator_name`、`source_snapshot` 和 `artifact_files`。
- Markdown 成为市场简报主内容源：如果 `markdown_content` 存在，预览和下载优先使用它；如果为空，则通过结构化字段按固定章节顺序实时合成 Markdown。
- 新增 `/dashboard/market-briefs/[id]/preview`，用于后台站内预览和浏览器打印 / 保存 PDF。
- 新增 Markdown、HTML、JSON 和 Word `.docx` 即时下载 route；下载只在请求时生成，不写入 Storage，不创建 public download URL。
- 编辑页增加“Markdown 主内容”区域，并提供“从结构化字段生成 Markdown 草稿”按钮，草稿需由管理员保存后才成为主内容。

原因：

- 市场简报需要从“后台表单记录”升级为可预览、可下载、可交付的研究报告 artifact。
- Markdown 作为主内容源便于后续接 Skill 自动生成、人工复核、邮件正文、Notion 同步和多格式导出。
- 本阶段保持手工维护和即时生成，可以先验证报告内容模型和权限边界，避免提前引入行情抓取、AI、邮件或任务编排复杂度。

影响：

- 市场简报仍是私密后台数据，仅管理员可访问，不进入公开站点或 sitemap。
- Download routes 同样进行管理员鉴权。
- HTML / JSON / DOCX 文件为即时响应，不保存到 Documents、Storage 或公开 bucket，不生成 signed URL。
- 本阶段不读取 Documents / Storage，不调用 AI，不保存外部 API key，不做自动抓取、本地行情接口、邮件发送、Notion 同步、GitHub Actions、n8n、定时任务、股票推荐或投资建议。
- 不修改 Resume、Career Center、JD Review、投递看板、AI Provider、简历 Word 导出、Calendar、Documents、Viewer、restricted、Profile、Projects、Publications、Knowledge、Skills、Access Requests 或 Access Grants 的核心流程。

## 2026-06-10 - Add Market Brief Generation Button With Mock Generator

类型：decision

决策：

- Phase 2L-C 在 `/dashboard/market-briefs` 增加“获取今日市场动态”按钮。
- 新增 `src/lib/market-brief-generator.ts`，提供 `generateMarketBriefDraft()` 可替换生成接口。
- 当前默认使用 `manual-skill-mock` 生成器，`MARKET_BRIEF_GENERATOR` 未设置或设置为 `mock` 时都走 mock 生成。
- 新增 `generateTodayMarketBriefAction()`，由管理员点击按钮触发，默认市场为 `A股`，日期为 Asia/Shanghai 今日。
- 生成 action 先按 `owner_id + brief_date + market` 查询已有记录；如果今日同市场简报已存在，则跳转已有预览页并提示，不重复创建。
- 新记录写入 `title`、`summary`、`markdown_content`、`generation_status=generated`、`generated_at`、`generator_name`、`source_snapshot`、`tags` 和 `data_sources`，并跳转到 `/dashboard/market-briefs/[id]/preview`。
- 本阶段不新增 migration，复用 Phase 2L-B 已有 artifact 字段。

原因：

- 先跑通“按钮触发 -> 生成草稿 -> 保存 market_briefs -> 预览/下载”的闭环，可以为后续真实行情源、新闻源或 Skill 调用打好接口边界。
- 使用 mock generator 能在不引入外部 API key、行情依赖、队列或后台 worker 的情况下验证交互、权限和重复生成处理。

影响：

- 市场简报仍为后台私密数据，仅管理员可触发生成和访问预览。
- 不读取 Documents / Storage，不发送 signed URL，不调用 AI，不保存外部 API key。
- 不做真实本地行情接口、新闻爬虫、GitHub Actions、n8n、定时任务、邮件发送、Notion 同步、股票推荐或投资建议。
- 不修改 Resume、Career Center、JD Review、投递看板、AI Provider、简历 Word 导出、Calendar、Documents、Viewer、restricted、Profile、Projects、Publications、Knowledge、Skills、Access Requests 或 Access Grants 的核心流程。

## 2026-06-10 - Add Market Brief Skill Runner Jobs

类型：decision

决策：

- Phase 2L-D-A 新增 `supabase/migrations/0015_market_brief_generation_jobs.sql`。
- 新增 `market_brief_generation_jobs` 表，记录 `owner_id`、`brief_date`、`market`、`status`、`runner_name`、`request_payload`、`source_snapshot`、`result_payload`、关联 `market_brief_id`、错误信息和运行时间线。
- “获取今日市场动态”按钮改为先创建生成任务；如果今日同市场简报已存在则跳转已有预览，如果已有 queued/running 任务则跳转任务详情。
- 当前仍使用 `manual-skill-mock` 本地占位生成器，通过 `src/lib/market-brief-runner.ts` 统一执行 queued -> running -> succeeded，并写入或更新 `market_briefs`。
- `src/lib/market-brief-generator.ts` 的 mock `source_snapshot` 改为稳定结构：`meta`、`indices`、`styles`、`sectors`、`hot_topics`、`capital_flows`、`policy_news` 和 `risk_signals`。
- 新增 `/dashboard/market-briefs/jobs` 与 `/dashboard/market-briefs/jobs/[id]`，后台查看生成任务、payload、数据快照、结果和错误。

原因：

- 市场简报从“按钮直接插入草稿”升级为可追踪任务，后续接真实行情源、新闻源、Skill 或队列时可以保留审计、失败原因和数据快照。
- 先用同步 mock runner 保持本阶段可验收，不引入后台 worker、定时任务或真实外部数据依赖。

影响：

- 新增 migration `0015_market_brief_generation_jobs.sql`；合并后生产环境需要手动执行，不自动执行 SQL。
- 市场简报和生成任务仍为后台私密数据，仅管理员或 owner 可读写，不进入公开页面、viewer、restricted 或 sitemap。
- 普通后台页面继续使用 Supabase Auth、`public.is_admin()` 和 RLS，不得泄露 API key、Supabase key、Auth UUID、Documents、Storage 路径、signed URL、Access Requests 或 Access Grants。
- 本阶段不做真实行情接口、新闻爬虫、AI 自动生成、GitHub Actions、n8n、定时任务、邮件发送、Notion 同步、股票推荐或投资建议。
- 不修改 Resume、Career Center、JD Review、投递看板、AI Provider、简历 Word 导出、Calendar、Documents、Viewer、restricted、Profile、Projects、Publications、Knowledge、Skills、Access Requests 或 Access Grants 的核心流程。

## 2026-06-10 - Add Historical Market Brief Generation And Multi Source Fallback

类型：decision

决策：

- Phase 2L-D-E 不新增 migration，继续复用 `market_brief_generation_jobs.brief_date`、`request_payload`、`source_snapshot` 和已有任务状态。
- `/dashboard/market-briefs` 保留“获取今日市场动态”，并新增“生成指定日期市场简报”表单；两者共用生成 action，创建 job 前会校验管理员权限、日期格式、未来日期和 A 股交易日。
- 新增 `src/data/a-share-trading-days.json` 与 `src/lib/a-share-trading-calendar.ts`，第一版用本地 2025/2026 A 股交易日白名单校验周末、法定节假日和休市日；交易日历未覆盖年份时返回明确错误，不创建 job。
- `request_payload` 写入 `brief_date`、`market`、`triggered_by=dashboard`、`generator_mode` 和 `is_historical`；任务列表和详情页展示“历史补生成”标记。
- `data_quality` 规则调整为：`real` 需要至少两个核心模块且指数不少于 5 个，`partial` 需要至少一个核心模块或指数不少于 3 个，`fallback` 表示没有核心模块可用；partial / fallback 都写入 `generation_status=needs_review`。

原因：

- 市场简报不能在周末、节假日或未来日期创建无效任务，也不能把实时快照误标为历史行情。
- 旧本地行情源存在网络和上游稳定性问题，系统应尽量完成一份可复核 artifact，而不是让任务长期停留在 running 或 failed。
- 本地交易日 JSON 让后台能先有强校验边界，后续可用交易所日历或维护脚本刷新。

影响：

- 不新增 SQL 或 migration；生产环境不需要执行数据库变更。
- 市场简报仍为后台私密数据，不进入公开页面、viewer、restricted 或 sitemap。
- 不读取 Documents、Storage、cookie、signed URL、Access Requests、Access Grants；不保存外部 API key，不打印 secret 或 Supabase key。
- 本阶段不做 AI、新闻爬虫、邮件发送、Notion 同步、GitHub Actions、n8n、定时任务、公开市场简报页、股票推荐或投资建议。

## 2026-06-11 - Switch Market Briefs To AI First Generation

类型：decision

决策：

- Phase 2M-A 不新增 migration，继续复用 `market_briefs` 和 `market_brief_generation_jobs`。
- `MARKET_BRIEF_GENERATOR` 支持 `mock | ai`，未配置时默认 `ai`；`mock` 仅用于本地占位测试。
- Market Brief 主生成链路从本地行情抓取切换为服务端 AI-first：点击“获取今日市场动态”或“生成指定日期市场简报”后，仍先创建 generation job，再调用 OpenAI-compatible AI Provider 生成固定模板 Markdown、structured JSON、`source_snapshot` 和 charts。
- 继续复用 `src/lib/ai-provider.ts`，支持 `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`，并兼容 `OPENAI_API_KEY` / `OPENAI_MODEL`；AI key 只在服务端读取，不进入客户端、HTML、日志或文档。
- 新增 `src/lib/market-brief-ai-prompt.ts` 固定中文金融研究员风格 prompt，要求 JSON 输出、不做投资建议、不推荐个股、不能编造精确涨跌幅、无法确认的数据写 null 或需人工复核。
- AI 输出默认 `generation_status=needs_review`；只有模型明确给出 `ai_verified` 且来源说明足够时才允许标记 `generated`。
- 图表数据保存在 `source_snapshot.charts`，预览页新增图表区域；bar / pie / line 第一版不新增前端依赖，空数据展示“暂无可靠数据，需人工复核”。

原因：

- 免费网页行情接口不稳定且覆盖不完整，继续维护多源抓取的性价比低。
- 市场简报更需要稳定生成、固定结构、来源边界和人工复核，而不是在不稳定免费接口上追求伪完整数据。
- 使用 AI structured output 可以在不新增表结构的情况下同时保存正文、图表配置、数据可信度和来源说明。

影响：

- 不新增 SQL 或 migration；生产环境只需配置 AI Provider 环境变量。
- 如果 AI Provider 没有联网搜索或可靠来源，输出必须标记 `data_quality=ai_unverified` 或 `ai_partial`，并保持 `needs_review`。
- 不做行情接口抓取、新闻爬虫、邮件发送、Notion 同步、定时任务、公开市场简报页、股票推荐或投资建议。
- 不修改 Resume、Career、Calendar、Documents、Profile、Storage、RLS 或旧 migrations。

## 2026-06-11 - Clean Up Legacy Market Data Runner Path

类型：decision

决策：

- Phase 2M-B 不新增 migration，不删除 `market_briefs` 或 `market_brief_generation_jobs`，继续复用现有任务表、状态流转、取消 / 重排能力、今日生成和历史交易日生成。
- 后台 `/dashboard/market-briefs`、任务列表和任务详情的主文案全面收口为 AI-first Market Brief Generator，不再把旧外部任务领取、回写接口或 Python 数据源脚本展示为推荐主流程。
- 新建 AI 生成任务的 `request_payload` 写入 `generator_mode=ai` 和 `generator_name=ai-market-brief-generator`，方便后续区分 AI 任务与历史兼容任务。
- `MARKET_BRIEF_GENERATOR` 未配置时继续默认 `ai`。
- README、current-status、roadmap 和 decisions 更新为 AI-first 口径；旧外部 runner / 数据源抓取相关说明只保留在明确历史上下文中。

原因：

- Phase 2M-A 已确认市场简报主路线转向服务端 AI 生成，继续在后台和主文档中展示旧 runner / 数据抓取路线会造成配置和验收混乱。
- 旧数据源路线依赖不稳定外部接口，且已经不再符合当前“固定模板、AI 生成、人工复核”的产品方向。
- 仍保留历史任务表和旧任务只读识别，可以避免破坏已存在任务记录、排查资料和旧 PR 证据。

影响：

- 不新增 SQL 或 migration；生产环境不需要执行数据库变更。
- 不改变 AI 生成、Markdown 预览、图表预览、下载、交易日校验、任务取消 / 重排和历史补生成能力。
- 不读取 Documents、Storage、cookie、signed URL、Access Requests、Access Grants；不保存外部 API key，不打印 AI key、secret 或 Supabase key。
- 不修改 Resume、Career、Calendar、Documents、Profile、Storage、RLS 或旧 migrations。

## 2026-06-11 - Remove Legacy Market Brief Runner Paths

类型：decision

决策：

- Phase 2N-0 删除旧 external / Python / AkShare runner 可执行路径，包括 `scripts/market-brief-runner/`、旧领取 / 失败回写 API 和旧 `skill-result` 成功回写 API。
- `MARKET_BRIEF_GENERATOR` 仅保留 `ai` 与 `mock` 行为；未配置时继续默认 `ai`。
- 保留 `market_briefs`、`market_brief_generation_jobs`、历史 migrations、AI-first generation、web search grounding、生成进度页、timeout / stale / failed / needs_review fallback、preview 和 download。
- 不新增素材包表、不新增 cron、不新增外部依赖、不修改 RLS 或 Storage policy。

原因：

- Market Brief 后续方向改为“每日市场研究素材包 -> AI 固定模板简报 -> 人工编辑确认”，旧 runner 领取 / 回写路径会干扰新任务状态和故障排查。
- 旧 Python 数据源实验依赖不稳定上游，已不适合作为当前或未来主线。

影响：

- README、current-status、roadmap 和 setup 文档不再指导用户运行旧 runner 或配置旧 runner secret。
- 历史 job 的 `runner_name` / `request_payload.generator_mode` 仍可在后台以旧外部生成器形式只读展示。
- Phase 2N-A 素材包应使用独立 schema 和 workflow，不复用旧 runner 回写路径。

## 2026-06-11 - Add Market Brief Material Packages

类型：decision

决策：

- Phase 2N-A 新增 `supabase/migrations/0017_market_brief_material_packages.sql`，创建后台私密 `market_brief_material_packages` 表，用于按 owner、日期和市场沉淀每日公开市场素材包。
- `0016_market_brief_runner_service_role_grants.sql` 是保留的历史 runner 权限 hotfix；本阶段不修改历史 migration，也不复用 `0016` 编号。
- 新表保存 package date、market、status、provider、queries、sources、source snapshot、extracted facts、warnings、source notes、quality score、error message、collected/reviewed timestamps，并通过 `(owner_id, package_date, market)` 保证同一用户同日同市场幂等更新。
- 新增 `createOrUpdateMarketBriefMaterialPackage()`，复用既有 Market Brief search query 与 source normalization 逻辑；搜索成功但来源不足时保存 `partial`，搜索未配置或全部失败时保存 `failed` 和安全错误信息。
- 新增管理员 API `POST /api/market-briefs/material-packages/collect`、素材包列表 `/dashboard/market-briefs/materials` 和详情页 `/dashboard/market-briefs/materials/[id]`。
- 当前 AI generation job、`generate-ai` route、status route、progress UI、preview/download/edit 仍按原路径运行；Phase 2N-A 不让 AI 生成读取素材包，不新增 cron，不新增外部依赖。

原因：

- Market Brief 后续方向是“每日市场研究素材包 -> AI 固定模板简报 -> 人工编辑确认”，需要先把公开来源采集结果沉淀为可复核对象，而不是继续让每次生成直接临时检索。
- 独立素材包表可以把来源质量、warnings、失败状态和人工复核状态从 generation job 中拆出来，为 Phase 2N-B 的 AI 基于素材包生成打基础。
- 延后 AI 链路切换和 cron，可以把 schema / RLS / 后台可视化先验收干净，降低对现有简报生成路径的回归风险。

影响：

- 生产环境合并后需要按顺序执行 `0017_market_brief_material_packages.sql`。
- 新表启用 RLS；管理员或记录 owner 可管理，`anon` 无权限，`authenticated` 只有表级权限且仍受 RLS 限制。
- 素材包采集只读取服务端 `MARKET_BRIEF_SEARCH_PROVIDER` / `MARKET_BRIEF_SEARCH_API_KEY` 配置，不保存 API key、请求头、cookie、Supabase key、Auth UUID、signed URL 或 service role key。
- 不修改 `market_briefs`、`market_brief_generation_jobs`、Storage policy、旧 migrations、Resume、Career、Calendar、Documents、Profile 或公开页面。
- 当前不做行情接口抓取、新闻爬虫、邮件发送、Notion 同步、定时任务、股票推荐、投资建议或自动发布。

## 2026-06-11 - Generate Market Briefs From Material Packages

类型：decision

决策：

- Phase 2N-B 不新增 migration，继续复用 `market_brief_material_packages` 和 `market_brief_generation_jobs.request_payload`。
- 点击“基于素材包生成今日简报”或“基于素材包生成指定日期简报”时，后台先按 owner/date/market 查找 `ready`、`partial` 或 `reviewed` 素材包；找不到时不创建 generation job，并提示先采集素材包。
- 如果表单或旧 job request payload 带有 `material_package_id`，生成前优先按该 id 查询，并校验 owner、date、market 和 status；否则按 owner/date/market 查找最新可用素材包。
- 新建 job 的 `request_payload` 写入 `grounding_mode=material_package`、`material_package_id`、`material_package_status` 和 `material_package_sources_count`。
- `POST /api/market-briefs/jobs/[id]/generate-ai` 在调用 AI 前强制 resolve 可用素材包；找不到时将任务标记为 failed，progress 写入 failed/100%，错误文案为“未找到可用市场素材包，请先采集素材包后重新排队。”。
- AI generator 默认只接受调用方传入的素材包 grounding context，不再默认调用 `searchMarketBriefSources`；搜索只发生在素材包采集阶段。
- 生成结果的 `source_snapshot.meta` 写入 `grounding_mode=material_package`、`material_package_id`、`material_package_status` 和 `material_package_collected_at`；`sources` 来自素材包 sources，`extracted_facts` 优先来自素材包。
- `partial` 素材包允许生成，但输出保持 `needs_review` / `ai_grounded_partial` 语义，并在 warnings/source notes 中标记需要人工复核。

原因：

- Market Brief 主路径需要从“生成时实时搜索”切换为“先沉淀素材包，再基于素材包生成”，以便来源、warnings、复核状态和失败状态可审计。
- 默认实时 Tavily 搜索会让生成结果依赖当次网络状态和搜索配置，也会让无素材包的日期继续消耗 AI/搜索调用。
- 生成前强制素材包存在，可以让缺失资料的失败尽早发生，并引导管理员先完成采集。

影响：

- 生产环境需要先执行 Phase 2N-A 的 `0017_market_brief_material_packages.sql`，但本阶段不新增数据库迁移。
- 生成阶段没有可用素材包时，不调用 Tavily / Serper / custom search，也不调用 DeepSeek 或 OpenAI-compatible Provider。
- Job 列表和详情页会展示 grounding mode 与素材包链接；旧 job 没有 material package id 时继续兼容展示。
- 不恢复 external / Python / AkShare runner，不新增 cron，不新增外部依赖，不修改 Storage/RLS/历史 migration。
- 不影响 Resume、Career、Calendar、Documents、Profile 或公开页面；不做股票推荐、投资建议、邮件、Notion 同步或自动发布。

## 2026-06-11 - Add Official Exchange Summary Collectors

类型：decision

决策：

- Phase 2N-C1 不新增 migration，继续复用 `market_brief_material_packages.source_snapshot`、`sources`、`extracted_facts`、`warnings` 和 `source_notes`。
- 新增 `src/lib/market-brief-official-exchange-collectors.ts`，用 Node `fetch` 采集上交所每日股票情况、深交所市场总貌和深交所日度概况等官方 summary / overview 公开接口。
- 手动素材包采集先运行官方交易所 collectors，再运行现有 `searchMarketBriefSources()` 作为 supplemental search；Tavily / Serper / custom search 只补充新闻、热点和政策线索，不作为行情事实来源。
- 官方 summary sources 以 `source_type=official_exchange_summary` 写入素材包 sources，结构化字段写入 `extracted_facts.exchange_summary`，并在 source snapshot meta 中记录 collector status / latency / source id。
- 素材包详情页新增“交易所总貌”摘要卡片，展示 SSE / SZSE 的日期、turnover、market value、listed count、source id 和 `verification_status=official_direct`；字段缺失时直接显示 warning。
- 新采集素材包最多标记为 `partial`，因为 market breadth、sectors、capital flows 仍缺；后续人工 review 或更多 collector 才能提升完整性。
- AI 生成 normalization 保留 `exchange_summary`，使基于素材包生成后的 `source_snapshot.extracted_facts.exchange_summary` 不被丢弃。

原因：

- Phase 2N-C0 证明官方上交所 / 深交所直连 summary 源对近期交易日和历史交易日的总貌字段更可用；相比 AKShare wrapper 和 Eastmoney fallback，更适合作为下一步素材包核心事实源。
- 当前素材包只靠搜索来源，容易把新闻/网页检索结果误当行情事实；官方 summary 字段可以先补齐交易所总貌的可复核基础。
- C1 仍不具备完整 A 股自动采集能力，必须明确保留 partial 和人工复核边界。

影响：

- 不接 AKShare 生产依赖，不接 Eastmoney 生产依赖，不恢复 external runner / Python runner / skill-result，不新增 cron，不新增 migration。
- `MARKET_BRIEF_SEARCH_PROVIDER` / `MARKET_BRIEF_SEARCH_API_KEY` 只影响 supplemental search；官方 summary 采集不需要 API key 或 secret。
- 生成主链路不变：仍由素材包驱动 AI 生成，缺失素材包时不调用 Tavily / AI。
- 不影响 Resume、Career、Calendar、Documents、Profile 或公开页面；不做股票推荐、投资建议、自动发布、邮件或 Notion 同步。

## 2026-06-11 - Add Web Grounding To AI Market Brief Generation

类型：decision

决策：

- Phase 2M-C 不新增 migration，继续复用 `market_briefs.source_snapshot` 和 `market_brief_generation_jobs.source_snapshot` 保存检索来源、结构化事实和图表数据。
- 新增 `src/lib/market-brief-search.ts`，通过 `MARKET_BRIEF_SEARCH_PROVIDER` 抽象搜索服务，支持 `disabled | tavily | serper | custom`；推荐第一版配置 `MARKET_BRIEF_SEARCH_PROVIDER=tavily` 和 `MARKET_BRIEF_SEARCH_API_KEY`。
- 新增 `src/lib/market-brief-grounding.ts`，在 AI prompt 前生成日期 / 市场相关 queries、去重 sources、warnings 和 source notes。
- AI prompt 改为只允许基于 sources 生成报告；所有精确数字必须能对应到 source id，charts 的每条 data 必须包含 `source_ids`。
- `source_snapshot` 增强为 `{ meta, sources, extracted_facts, charts }` 结构；preview 页展示来源列表，图表卡片展示来源编号。
- 如果搜索服务未配置，生成任务直接 failed，错误信息为“未配置市场简报搜索服务，请配置 MARKET_BRIEF_SEARCH_PROVIDER 和 MARKET_BRIEF_SEARCH_API_KEY。”；不继续生成空模板。
- 如果搜索服务已配置但没有返回 sources，允许生成 `ai_unverified` 草稿，但必须明确说明没有检索到可靠来源。

原因：

- 裸 AI 生成缺少可验证行情、新闻和行业来源，容易产出大量“未能可靠确认”的空模板。
- 市场简报需要来源、结构化事实和图表之间有可追溯关系，后续才能做人工复核、下载和归档。
- 搜索 Provider 抽象能避免把单一服务写死在业务逻辑中，后续可替换为授权数据供应商或更可靠 web search。

影响：

- 生产环境除 AI Provider 外，还需要配置 `MARKET_BRIEF_SEARCH_PROVIDER` 和 `MARKET_BRIEF_SEARCH_API_KEY` 才能生成 grounded 市场简报。
- 不保存搜索 API key、请求头、cookie 或敏感信息；页面只展示来源标题、URL、发布方、摘要和 source id。
- 不接本地行情抓取接口，不恢复 Python runner 主流程，不做股票推荐或投资建议。
- 不修改 Resume、Career、Calendar、Documents、Profile、Storage、RLS 或旧 migrations。

## 2026-06-11 - Add AI Market Brief Generation Progress UX

类型：decision

决策：

- Phase 2M-D 不新增 migration，继续复用 `market_brief_generation_jobs.request_payload`，在其中写入 `progress` 对象记录阶段、百分比、提示文案和更新时间。
- 今日生成和历史生成按钮在 AI-first 模式下只创建 queued job，然后跳转 `/dashboard/market-briefs/jobs/[id]?auto_generate=1`。
- 任务详情页新增客户端进度面板；进入页面后调用 `POST /api/market-briefs/jobs/[id]/generate-ai` 启动 AI 生成，并通过 `GET /api/market-briefs/jobs/[id]/status` 每 1.5 秒轮询状态。
- 进度阶段统一为 queued、validating、preparing、searching、analyzing、writing、charting、saving、succeeded、failed、cancelled；成功后自动跳转生成的市场简报预览页。
- 任务列表页展示当前阶段、百分比和“查看进度”入口；取消和重新排队继续复用现有任务状态流转，并同步更新 progress。

原因：

- AI-first + web grounding 生成可能需要较长时间，按钮点击后直接等待会让后台体验像“卡住”。
- 将生成流程显式拆成任务状态页，可以让管理员看到 AI 正在检索、整理、写作、保存，并能在失败或取消时继续手动处理。

影响：

- 生成 API 和状态 API 均要求管理员登录，不返回 AI key、搜索 key、Supabase key、Auth UUID、request header 或 service role 信息。
- `failed` / `cancelled` 任务不会继续轮询；`succeeded` 任务展示预览跳转。
- 本阶段不改变 `market_briefs` 或 `market_brief_generation_jobs` 表结构，不改 RLS，不恢复旧外部 / Python runner 主流程。
- 不影响 Resume、Career、Calendar、Documents、Profile 或公开页面。

## 2026-06-11 - Prevent AI Market Brief Generation From Stalling

类型：decision

决策：

- 不新增 migration，继续复用 `market_brief_generation_jobs.status`、`error_message` 和 `request_payload.progress`。
- `POST /api/market-briefs/jobs/[id]/generate-ai` 对完整 AI 生成流程增加默认 105 秒主动超时，并支持 `MARKET_BRIEF_AI_TIMEOUT_MS` 在 30000 至 115000 毫秒之间调整；超时或异常会尝试把 job 标记为 failed，并把 progress 更新为 failed / 100%。
- 成功写回 job 只允许覆盖仍处于 running 的任务，避免超时后迟到的生成流程把 failed 又改成 succeeded。
- `GET /api/market-briefs/jobs/[id]/status` 对 running 且 progress 超过 5 分钟未更新的任务返回 `stale=true` 和管理员提示；前端显示 stale 提示，不自动重复触发生成，避免重复扣费。
- 搜索 query 最多 4 条，每条 top 3；去重 sources 最多 8 个，snippet 最多 500 字符；prompt 示例不再重复嵌入完整 sources。
- AI JSON 解析支持去掉 markdown code fence，并从第一个 `{` 到最后一个 `}` 提取 JSON 后再解析；如果仍无法解析，会尽量提取 title / summary / markdown_content 并保存为 `needs_review` 待复核草稿。

原因：

- Vercel 函数可能在 Tavily + DeepSeek + JSON parse + Supabase 保存过程中被 maxDuration 杀掉，导致任务停留在 running / writing 且没有机会落库为 failed。
- 刷新页面后旧逻辑对 running 任务只返回 already_running，用户看不到超时边界，也不能判断是否需要重置。

影响：

- 搜索、AI、解析、保存或未知错误都会尽力落库为 failed；错误信息只保存 safe summary。
- 日志只允许记录 job_id、stage、source_count、prompt_length_estimate、provider 和安全错误摘要；不记录 key、cookies、Authorization、完整 prompt 或完整 AI 原始输出。
- 不改 RLS、Storage、Documents、Resume、Career、Calendar、Profile 或公开页面。
