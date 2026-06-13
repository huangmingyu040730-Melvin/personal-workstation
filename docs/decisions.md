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
- Vercel Function request/response payload 限制无法可靠承载大文件。
- 浏览器直传 Supabase Storage 可以绕开 Vercel Function payload 限制，同时保持 Auth + RLS + Storage policy 的权限边界。

影响：

- Server Actions 只接收文件名、MIME type、大小和业务 metadata，不接收完整 File。
- 当时的 20 MB 上限由客户端预检、服务端 metadata 校验、bucket 文件大小限制和 Storage policy 共同保障；Phase 2P-A 通过 0018 将当前单文件上限提升到 50 MB。
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
- Phase 2O-A 后，投递看板与求职中心进入稳定维护状态；不默认扩展日历提醒、面试记录、投递邮件草稿、Notion 同步或统计图表。

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
- 单一“求职中心”入口更适合稳定维护现有 Resume、AI JD 分析记录和投递看板流程。
- 保留原 URL 可以避免破坏现有代码引用、文档链接和用户书签。

影响：

- 求职相关功能仍保持管理员后台私密访问，不进入公开站点或 sitemap。
- 不修改 Resume Items、Resume Versions、`resume_jd_reviews` 表结构、RLS、Storage、Documents、Viewer、restricted、Calendar、Profile、AI JD 分析逻辑、Word 导出逻辑、质量检查规则、投递看板核心逻辑或旧 migration。
- 本阶段不做面试记录、自动提醒、Notion 同步、邮件发送、自动投递、公开求职页或分享链接。

## 2026-06-11 - Remove Market Brief Module

类型：decision

决策：

- Phase 2N-Z 从产品层和代码层移除 Market Brief / 市场简报模块。
- 已删除后台入口、Dashboard 卡片、专用页面、API routes、Server Actions、组件、lib/query 代码、数据源探针脚本和 feasibility 文档。
- 不再推荐配置 `MARKET_BRIEF_*` 环境变量，不再维护 Tavily / 官方交易所 summary / AKShare / Eastmoney / external runner / Python runner / skill-result 等路径。
- 不修改历史 migrations，不在本 PR 中 drop `market_briefs`、`market_brief_generation_jobs` 或 `market_brief_material_packages` 等生产表；这些表暂时作为 unused legacy data 保留。
- 通用 AI Provider 配置继续保留，因为 Resume JD 分析仍依赖 `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` 和旧 `OPENAI_API_KEY` / `OPENAI_MODEL` 兼容路径。

原因：

- 多轮尝试后，搜索源、官方 summary、AKShare 和 Eastmoney 都无法稳定提供符合产品目标的核心事实覆盖。
- 输出质量长期依赖缺失素材和人工补全，实际效率低于直接向 GPT 提问，不值得继续占用主产品维护面。
- 移除产品入口可以避免误用旧生成链路，也降低 Dashboard、API 和文档的维护复杂度。

影响：

- `/dashboard` 和侧边栏不再展示 Market Brief 入口。
- `/dashboard/market-briefs*` 与 `/api/market-briefs*` 路由被删除；直接访问允许 404。
- Resume、Career、Calendar、Documents、Profile、Projects、Knowledge、Skills、Publications、Access Requests 和 Access Grants 不受影响。
- 若未来需要清理历史生产数据，应另开 DB cleanup PR，先备份并新增独立 migration。

## 2026-06-12 - Stabilize Workspace After Market Brief Removal

类型：decision

决策：

- Phase 2O-A 将产品路线收口为“研究资产沉淀 + 公开展示 + 文件 / 知识管理 + 求职闭环维护”。
- Dashboard 继续突出 Projects、Knowledge、Skills、Publications、Documents、Calendar 和 Career。
- 侧边栏不新增入口，Career Center 保持现有结构。
- Market Brief 继续作为已弃用模块，不恢复页面、API、runner、素材包、数据探针或推荐环境变量。
- 求职中心当前体验标记为稳定维护；后续只做 bugfix、文案修正和 broken link 修复。
- 不主动扩展新的求职自动化、cron、migration 或 AI 生成产品线。

原因：

- Market Brief 移除后，需要把工作台从探索性功能扩张切回稳定维护。
- 当前核心价值已集中在公开研究资产、私密文件与知识管理、Calendar、Profile 和求职闭环。
- 求职中心已有 Resume / AI JD / JD 分析记录 / 投递看板闭环，继续扩展自动化会增加维护面。

影响：

- README、current-status、roadmap 和 decisions 均以稳定维护路线为准。
- 通用 AI Provider 配置继续保留给 Resume JD 分析。
- 不推荐任何 `MARKET_BRIEF_*` 环境变量。
- 不修改历史 migrations，不新增 drop table migration，不改变 Supabase RLS 或 Storage 边界。

## 2026-06-12 - Use Documents As Unified Private Attachment Base

类型：decision

决策：

- Phase 2P-A 将 Documents 升级为 Project / Publication / Knowledge / Skill 的统一私密附件底座。
- 新增 `public.document_collections` 表，用于表示一次上传批次、文件夹、附件包或 Skill 包。
- `public.documents` 新增 `collection_id`、`original_name`、`relative_path` 和 `folder_path`，用于保留多文件 / 文件夹上传的目录信息。
- `documents.related_type` 扩展支持 `knowledge`，与 `publication`、`project`、`skill` 保持同级。
- 上传继续采用两阶段浏览器直传 Supabase Storage：Server Action 只负责管理员验证、metadata 校验、安全路径生成和 finalize 写库，文件二进制不经过 Vercel Function。
- `workspace-files` 仍是 private bucket；单文件上限提升到 50 MB，批次限制为 100 个文件 / 200 MB。
- 支持 PDF、Office、Markdown、文本、CSV/TSV、JSON/YAML、Notebook、代码文件、图片和 zip/tar/gz/7z 压缩包。
- 明确不支持 exe、dmg、app、msi、bat、cmd；上传的代码和 Skill 包只作为私密文件存储，不执行、不解析、不安装。

原因：

- Documents 应成为整个个人工作台的统一附件层，避免 Project、Publication、Knowledge 和 Skill 各自重复实现文件系统。
- 研究资料常以文件夹、数据包、Notebook、代码和压缩包形式出现，单文件上传不足以承载真实研究资产。
- 统一 collection 层可以先在文件中心验证批量/文件夹能力，后续再按需把入口嵌入各模块详情页。

影响：

- 新增 `supabase/migrations/0018_document_collections_and_folder_uploads.sql`；不修改历史 migration。
- 本阶段不公开附件，不生成公开下载链接，不做批量 zip 下载、OCR、文件内容索引或 AI 总结。
- 不修改 Resume / Career 业务逻辑，不恢复 Market Brief。
- Documents 和 Storage 继续只允许管理员通过短时 signed URL 下载，即使关联对象本身是 public。

## 2026-06-12 - Embed Private Attachments In Content Detail Pages

类型：decision

决策：

- Phase 2P-B 在 Project、Publication、Knowledge 和 Skill 的后台详情页嵌入关联文件 / 文档包区域。
- 各内容详情页只展示 `documents` 和 `document_collections` 的关联记录，并提供跳转到统一 `/dashboard/documents/upload` 的预填上传入口。
- 上传页支持 `related_type`、`related_id`、`category`、`collection_type` 和 `mode` query params 作为默认值；query params 只用于预填，服务端仍通过 `ensureRelatedRecordExists` 做最终校验。
- Publication 详情页复用统一附件组件，并将删除保护扩展到关联 `document_collections`，避免存在附件包时误删成果。
- Skill 详情页明确提示 Skill 包只作为私密文件存储，不执行、不解析、不安装，也不自动同步到外部环境。

原因：

- Documents 已经是统一附件底座，Project / Publication / Knowledge / Skill 不应重复实现上传流程或文件系统。
- 在内容详情页直接看到关联附件，可以让研究对象与私密资料形成闭环，同时保留统一文件中心作为底层管理面。
- 预填上传入口减少误选关联对象，但不改变服务端权限边界。

影响：

- 本阶段不新增 migration，不修改 Storage policy，不改 Documents 底层上传流程。
- 公开 Projects、Publications、Knowledge 和 Skills 页面仍不展示附件、Storage 路径、signed URL 或下载入口。
- 不做公开下载、批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 业务逻辑，不恢复 Market Brief。

## 2026-06-12 - Use Create And Upload Flow For New Content Attachments

类型：decision

决策：

- Phase 2P-C 在 Project、Publication、Knowledge 和 Skill 新建表单增加 create-and-upload 操作。
- 管理员点击“保存并上传文件 / 文件夹或文档包”后，Server Action 先创建内容对象。
- 创建成功后跳转到统一 `/dashboard/documents/upload`，并用 query params 预填 `related_type`、`related_id`、`mode`、`category` 和 `collection_type`。
- 普通“保存”按钮保持原有详情页跳转行为。
- Skill 包上传入口继续明确：只作为私密文件存储，不执行、不解析、不安装。

原因：

- 新建表单提交前没有稳定对象 ID，不能把文件可靠关联到尚未创建的 Project、Publication、Knowledge 或 Skill。
- create-and-upload 复用 Documents 现有两阶段浏览器直传流程，避免每个内容模块重复实现上传系统。
- 比 pending upload、临时文件 staging 或先传后绑定更保守，也更符合当前私密附件底座的边界。

影响：

- 本阶段不新增 migration，不新增 staging 表，不修改 Storage policy。
- Create action 不接收 File 或文件二进制，文件不经过 Vercel Function。
- 附件仍保持 private，不进入公开页面，不生成公开下载入口或 signed URL。
- 不做自动上传、批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 业务逻辑，不恢复 Market Brief。

## 2026-06-12 - Keep Document Storage Object Keys ASCII Safe

类型：decision

决策：

- Documents 的 `storage_path` 只使用 ASCII-safe object key。
- 最终 Storage 文件名使用 `documentId + extension`，避免中文文件名、空格或特殊字符触发 Supabase Storage `Invalid key`。
- 文件显示名、`original_name`、`relative_path` 和 `folder_path` 仍可保留中文，用于后台展示。
- 中文文件夹名进入 Storage key 时降级为 `folder`、`folder-1` 等安全 segment；不迁移已上传对象。

原因：

- Supabase Storage object key 对字符集更严格，中文文件名或中文目录可能导致 400 `Invalid key`。
- 展示字段和 Storage key 分离可以同时保留后台可读性和上传稳定性。

影响：

- 只影响新上传文件的 Storage path 生成。
- 不新增 migration，不修改 Storage policy，不改 Documents 数据模型。
- 不影响 Project、Publication、Knowledge、Skill、Resume 或 Career 业务逻辑。

## 2026-06-12 - Use Phase 2O / 2P Memory Files As Current Handoff Baseline

类型：decision

决策：

- 项目记忆层以 Phase 2O-A 稳定维护路线和 Phase 2P-A / 2P-B / 2P-C Documents 私密附件底座作为当前交接基准。
- `AGENTS.md` 记录稳定协作规则、安全边界和记忆更新规则。
- `docs/memory.md` 记录当前项目状态、重要上下文、迁移状态、已知问题、下一步和 stale / superseded notes。
- `docs/workflows.md` 记录可重复执行的 memory engineering 和统一私密附件工作流。
- `docs/current-status.md`、`docs/known-issues.md`、`docs/roadmap.md` 和 `docs/supabase-setup.md` 应与上述基准保持一致。
- `docs/memory.md` 不再以 2026-06-09 的 Phase 2K-C 状态作为当前状态。
- 执行 0018 后，后续数据库变更应新增 `0019_*` 或更高编号。

原因：

- 项目已经完成 Market Brief 移除、工作台稳定路线收口和 Documents 统一附件底座扩展。
- 旧记忆文件仍停留在 2026-06-09，会误导后续 Codex 把 Resume Phase 2K-C、Viewer 冻结状态或 0018 迁移编号当作最新边界。
- 统一交接基准可以降低后续开发前重复确认项目状态的成本。

影响：

- 后续新对话接续项目时应先读 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`，涉及阶段状态再读 `docs/current-status.md`、`docs/roadmap.md`、`docs/known-issues.md` 和 `docs/supabase-setup.md`。
- 不修改业务代码、数据库 schema、RLS、Storage policy 或历史 migration。
- 不恢复 Market Brief，不扩展 Career 自动化，不开放 Documents 或 signed URL。

## 2026-06-12 - Keep Document Metadata Editable Without Moving Storage Objects

类型：decision

决策：

- Phase 2P-D 允许管理员在后台编辑文件 metadata：显示名称、分类、关联对象。
- Phase 2P-D 允许管理员在后台编辑文档包 metadata：名称、描述、类型、关联对象。
- 文件级关联和文档包级关联允许不一致。
- 修改文档包关联对象时，不自动批量同步包内 `documents.related_type` / `documents.related_id`。
- 文件 metadata 编辑不允许修改 `storage_bucket`、`storage_path`、`file_size`、`mime_type`、`original_name`、`relative_path`、`folder_path` 或 `collection_id`。
- 文档包 metadata 编辑不允许手动修改 `file_count`、`total_size`、`root_folder_name`、`owner_id`、`visibility`、`created_at` 或 `updated_at`。
- Documents 列表支持按 category、related_type 和 collection 状态筛选，便于长期整理研究资产。

原因：

- Documents 已能上传文件和文档包，但长期维护时常需要修正显示名、分类或关联对象。
- Storage object key 已经采用 ASCII-safe 路径，重命名对象会增加权限、清理和引用一致性风险。
- 文档包表示上传批次或资料包，包级关联不应强制覆盖每个文件的精细关联。

影响：

- 本阶段不新增 migration，继续依赖 `0018_document_collections_and_folder_uploads.sql` 已提供的字段。
- 不修改 Storage policy，不移动、不重命名 Storage object，不修改 `storage_path`。
- 更新写入 `activity_logs`，只记录 metadata 摘要，不记录 signed URL、Storage 内部路径、API key、cookie 或 secret。
- 公开页面、viewer 页面、sitemap 和 robots 仍不展示附件下载入口、Storage 路径或 signed URL。
- 不做批量删除、批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 业务逻辑，不恢复 Market Brief。

## 2026-06-12 - Keep Bulk Document Relation Actions Metadata Only

类型：decision

决策：

- Phase 2P-E-1 允许管理员在 Documents 列表和文档包详情页批量选择文件。
- 批量移动关联对象只更新 `documents.related_type` 和 `documents.related_id`。
- 批量解除关联将 `documents.related_type` 与 `documents.related_id` 置空。
- 文档包详情页批量修改包内文件关联对象时，不修改文档包自身 `related_type` / `related_id`。
- 批量操作不修改文件 `collection_id`，不把文件移出或移入文档包。
- 批量删除、批量 zip 下载、OCR、文件内容索引和 AI 文件总结继续后延。

原因：

- 2P-D 已能维护单个文件和文档包 metadata，但大量文件整理时逐个进入详情页效率较低。
- 批量关联整理属于 metadata 维护，不需要移动 Storage object，也不需要新增数据库字段。
- 文档包代表上传批次或资料包，包级关联和文件级关联继续保持可独立维护。

影响：

- 本阶段不新增 migration，继续依赖 `0018_document_collections_and_folder_uploads.sql` 已提供的字段。
- 不修改 Storage policy，不移动、不重命名、不删除 Storage object，不修改 `storage_path`。
- 不删除 `documents` 或 `document_collections` 记录。
- 更新写入 `activity_logs`，记录文件 ID 列表、文件数量和新关联对象摘要；不记录 signed URL、Storage 内部路径、API key、cookie 或 secret。
- `return_to` 只允许站内 `/dashboard` 路径，避免 open redirect。
- 公开页面、viewer 页面、sitemap 和 robots 仍不展示附件下载入口、Storage 路径或 signed URL。
- 不修改 Resume / Career 业务逻辑，不恢复 Market Brief。

## 2026-06-12 - Group Related Documents By Package Context

类型：decision

决策：

- 文件级关联和文档包级关联继续允许不一致。
- RelatedDocumentsPanel 继续展示当前对象关联的文档包。
- RelatedDocumentsPanel 不再把当前对象文档包内文件作为独立文件重复展示。
- `documents.collection_id is null` 且文件级关联指向当前对象的文件展示为独立文件。
- 文件级关联指向当前对象、但仍属于其他文档包的文件展示为跨文档包文件。
- 跨文档包文件需要单独提示，说明这些文件仍属于其他文档包。
- 自动同步文档包和包内文件关联留到后续阶段，不在 Phase 2P-E-1-B 中实现。

原因：

- 2P-E-1 后，文件可以被批量移动到新的关联对象，而文档包自身关联可以保持原状。
- 这种状态是合法的，但在内容详情页同时显示文档包和包内文件会造成“重复附件”的错觉。
- 通过分组展示可以保留灵活 metadata 模型，同时让管理员理解文件级关联和包级关联的差异。

影响：

- 本阶段只修改后台展示逻辑，不新增 migration，不修改数据模型。
- 不修改 `documents.related_type` / `documents.related_id`。
- 不修改 `document_collections.related_type` / `document_collections.related_id`。
- 不修改 `documents.collection_id`。
- 不修改 Storage policy、bucket、`storage_path`，不移动、不重命名、不删除 Storage object。
- RelatedDocumentsPanel 不生成 signed URL，不展示 Storage path；下载仍走既有后台下载入口。
- 文档包整体迁移 / 同步关联工具可作为 Phase 2P-E-1-C 单独推进。
- 批量删除和批量 zip 下载继续后延。

## 2026-06-12 - Add Explicit Collection Relation Sync Tool

类型：decision

决策：

- 文件级关联和文档包级关联继续允许不一致。
- 当管理员需要整体迁移一个资料包时，应使用文档包整体迁移 / 同步关联工具，而不是分别修改文档包和包内文件。
- 该工具在文档包详情页提供整体迁移和整体解除关联两个操作。
- 整体迁移会同步更新 `document_collections.related_type / related_id` 和该文档包下全部 `documents.related_type / related_id`。
- 整体解除关联会把文档包和包内全部文件的 `related_type / related_id` 一起置空。
- 包内文件列表必须由 Server Action 按 `collection_id` 查询获得，不从前端接收文件 ID 或文件数量。
- 目标关联对象必须在服务端校验存在。
- 当前同步工具仍通过 Server Action 分步更新 Supabase 数据；本 PR 不新增数据库事务或 RPC。更新顺序采用“先包内文件、后文档包自身”，以降低失败时文档包先移动但文件未同步的风险。
- 该工具只修改 metadata，不移动、不重命名、不删除 Storage object，也不修改文件 `collection_id`。

原因：

- 2P-D 和 2P-E-1 保留了文档包级关联与文件级关联的独立性，这对精细整理研究资料是合理的。
- 但当用户想把一个资料包整体迁移到新的 Project、Publication、Knowledge 或 Skill 时，分两步操作容易让文档包和包内文件停留在不同对象上。
- 显式同步工具可以保持数据模型灵活性，同时给“整体迁移资料包”提供清晰入口。

影响：

- 本阶段不新增 migration，继续依赖 `0018_document_collections_and_folder_uploads.sql` 已提供的字段。
- 不修改 RLS、Storage policy、bucket、`storage_path`、文件大小、MIME type、原始文件名、relative_path 或 folder_path。
- 操作完成写入 `activity_logs`，只记录 collection id、服务端计算的文件数量、旧关联和新关联摘要；不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
- 公开页面、viewer 页面、sitemap 和 robots 仍不展示附件下载入口、Storage 路径或 signed URL。
- 单个文件调整继续使用文件详情页；多个文件调整继续使用 Documents 批量移动；整个资料包调整使用文档包整体迁移 / 同步关联工具。
- 批量删除和批量 zip 下载继续后延。

## 2026-06-12 - Add Confirmed Document Deletion Without Database Transaction

类型：decision

决策：

- Phase 2P-E-2 允许管理员在 Documents 列表和文档包详情页批量删除选中文件。
- 批量删除文件会删除所选 `documents` 记录和对应 Supabase Storage object。
- 批量删除文件不会自动删除空文档包，空文档包可继续作为诊断记录或由管理员单独删除。
- 文档包详情页新增“删除整个文档包及文件”危险操作，确认文本必须为 `DELETE` 或 `删除`。
- 删除整个文档包及文件会删除包内文件记录、对应 Storage object 和 `document_collections` 记录。
- 删除流程继续通过 Server Action 分步更新 Supabase 数据；本 PR 不新增数据库事务、RPC、migration、RLS 或 Storage policy。
- 删除顺序采用“先 Storage object、后数据库记录”，以降低数据库记录先消失但私密文件对象残留的风险。
- 如果 Storage 删除失败，不删除数据库记录；如果 Storage 成功但数据库删除失败，向管理员显示安全错误并要求人工复核。
- Activity Log 只记录 document ids、document_count、collection ids 和关联摘要；不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。

原因：

- 2P-E-1 系列已经具备批量整理附件 metadata 的能力，管理员还需要受确认保护的资产清理入口。
- Documents 与 Storage 是两个系统，现阶段没有引入跨系统事务；先删 Storage 再删数据库记录是当前风险更低的保守顺序。
- 批量删除文件和删除整个文档包是破坏性操作，需要显式确认，避免误删研究资料。

影响：

- 本阶段不新增 migration，继续依赖 `0018_document_collections_and_folder_uploads.sql` 已提供的字段。
- 不修改 RLS、Storage policy、bucket、`storage_path` 生成规则、文件大小、MIME type、原始文件名、relative_path 或 folder_path。
- 批量删除文件会重新计算受影响文档包的 `file_count` 和 `total_size`。
- 删除整个文档包不会删除或修改关联的 Project、Publication、Knowledge 或 Skill 对象。
- 公开页面、viewer 页面、sitemap 和 robots 仍不展示附件下载入口、Storage 路径或 signed URL。
- 批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行继续后延。

## 2026-06-12 - Generate Document Zip Downloads On Request Only

类型：decision

决策：

- Phase 2P-E-3 允许管理员在 Documents 列表和文档包详情页勾选多个文件后下载 zip。
- 文档包详情页允许下载整个文档包 zip。
- Project / Publication / Knowledge / Skill 后台详情页的文档包卡片允许下载该文档包 zip。
- zip 由 Route Handler 按请求临时生成，不保存到 Supabase Storage，不创建持久化 zip 记录。
- zip 下载只对管理员后台开放；Route Handler 必须重新校验管理员身份，不能只依赖 `/dashboard` 路径保护。
- zip 内部文件名优先使用 `relative_path`、`original_name`、`name`，允许中文文件名，但必须清理 `..`、开头 `/`、控制字符和 Windows 不兼容字符。
- 为控制 serverless 内存与执行时间风险，单次 zip 限制为最多 50 个文件、总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查。
- 如果超过限制、文件不存在、文档包为空或任一 Storage object 下载失败，整个 zip 下载失败，不部分打包。
- Activity Log 只记录 document ids、document_count、collection id 和 total_size；不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。

原因：

- Documents 已具备整理、迁移和删除能力，但管理员仍需要临时下载多个私密附件做本地备份或交付。
- zip 下载属于临时导出，不应变成新的 Storage 资产或公开分享机制。
- 文件数量和总大小限制可以降低 Vercel / Node serverless 内存与超时风险。

影响：

- 新增 `jszip` 作为直接依赖，用于在 Route Handler 中生成临时 zip。
- 本阶段不新增 migration，继续依赖 `0018_document_collections_and_folder_uploads.sql` 已提供的字段。
- 不修改数据库模型、RLS、Storage policy、bucket、`storage_path` 生成规则、文件大小、MIME type、原始文件名、relative_path 或 folder_path。
- 不移动、不重命名、不删除 Supabase Storage object。
- 公开页面、viewer 页面、sitemap 和 robots 仍不展示附件下载入口、Storage 路径、signed URL 或 zip 下载入口。
- OCR、文件内容索引、AI 文件总结、Skill 包解析或执行继续后延。

## 2026-06-12 - Add Admin Metadata Search Before Content Search

类型：decision

决策：

- Phase 2P-F-1 新增 `/dashboard/search` 作为管理员后台全局搜索入口。
- 当前搜索只查数据库 metadata，范围包括 Projects、Publications、Knowledge、Skills、Documents 和 Document Collections。
- 每类最多返回 8 条结果，不做分页；q trim 后少于 2 个字符时不执行查询。
- 搜索结果按类型分组，并只跳转后台详情页。
- Documents 搜索只查 `name`、`original_name`、`relative_path`、`folder_path`、`category`、`related_type` 等 metadata。
- 当前不解析文件正文，不读取 Supabase Storage object，不解析 PDF / Word / Excel / zip，不做 OCR，不做 AI 摘要，不做向量搜索。
- 当前不新增 migration、数据库索引、RPC、外部搜索服务或向量库。
- 搜索只在管理员后台开放，不新增公开搜索页，不在公开页面展示 Documents 或附件下载入口。

原因：

- Documents 全生命周期能力完成后，后台研究资产分散在多个模块中，管理员需要跨 Projects、Publications、Knowledge、Skills、Documents 和文档包快速定位资产。
- 先做 metadata 搜索可以利用现有字段与 RLS 权限边界，避免过早引入文件解析、全文索引、向量库或外部搜索服务。

影响：

- 新增 `src/lib/queries/search.ts`，搜索逻辑集中在查询层并继续由后台管理员保护。
- 新增 `/dashboard/search` 页面和后台导航入口。
- 不修改数据库模型、RLS、Storage policy、bucket 或 `storage_path`。
- 不生成 signed URL，不输出 Storage path，不记录 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。
- Resume、Career、Calendar、Profile、Market Brief 和公开页面导航不受影响。

## 2026-06-12 - Polish Search Experience Without Expanding Search Scope

类型：decision

决策：

- Phase 2P-F-2 优化 `/dashboard/search` 后台全局搜索体验，但继续只基于数据库 metadata。
- 搜索页支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选。
- 类型筛选 chips 显示全部和每类命中数量；切换类型只过滤当前 metadata 搜索结果，不引入外部搜索服务。
- 结果标题和描述支持关键词高亮；高亮只在 React 展示层用文本切片完成，不保存索引，不使用 HTML 注入。
- 结果卡片显示类型 badge、metadata chips、更新时间和后台详情页入口。
- Documents 结果可以展示文件分类、原始文件名、relative_path、folder_path 和文档包标题等 metadata，但不得展示 `storage_path`。
- Document Collections 结果展示 collection type、file count、total size 和 related type 等 metadata。
- 继续不做 OCR、AI 摘要、向量搜索、文件正文检索、PDF / Word / Excel / zip 解析。
- 不新增 migration、数据库索引、RPC、外部搜索服务或向量库。

原因：

- 2P-F-1 已提供后台全局搜索入口，但管理员还需要按类型快速聚焦结果，并能看到关键词命中位置。
- 当前阶段的目标是提升研究资产定位效率，而不是扩大搜索边界或引入文件内容处理复杂度。
- 前端展示层高亮可以改善可读性，同时避免数据库索引、全文检索、AI 摘要或外部搜索服务带来的权限与维护风险。

影响：

- `/dashboard/search` 的 URL 状态新增 `type` 参数；顶部搜索入口继续提交到后台搜索页。
- 结果组件负责渲染类型筛选、每类数量、选中类型空状态和关键词高亮。
- 查询层继续只选择必要 metadata 字段，不读取 Storage object，不生成 signed URL，不输出 Storage path。
- 公开页面、viewer 页面、sitemap、robots、Resume、Career、Calendar、Profile、Market Brief 和 Storage policy 不受影响。

## 2026-06-13 - Use Project Detail As First Research Asset Hub

类型：decision

决策：

- Phase 2Q-A-1 先优化 `/dashboard/projects/[id]`，将 Project 后台详情页作为单个研究项目的研究中枢。
- Project 详情页集中展示现有 Project 字段：`title`、`summary`、`background`、`research_question`、`methodology`、`status`、`progress`、`is_featured`、`start_date`、`tags`、`milestones`、`visibility`、`created_at` 和 `updated_at`。
- Project 详情页继续复用 RelatedDocumentsPanel 展示私密附件，不重复实现 Documents 上传、下载、删除或文档包分组逻辑。
- 相关研究资产只使用现有显式关系：`knowledge_notes.project_id` 与 `publications.project_id`；每类最多展示 5 条，并链接到对应后台详情页。
- Skills 当前没有显式 Project 关系，本阶段不新增字段或关系表，只提供按项目标题和标签进入后台全局搜索的快捷入口。
- 快捷操作统一进入编辑项目、上传项目文件、上传项目文件夹、项目 Documents 筛选页、后台全局搜索和新建知识笔记。
- 本阶段不新增数据库事务、migration、RPC、索引、关系表或 Storage 行为。

原因：

- Documents 全生命周期和后台全局搜索已经完成后，单个 Project 仍需要一个稳定入口来承接研究问题、研究方法、私密附件和相关资产。
- 先用已有 Project 字段、RelatedDocumentsPanel、`project_id` 显式关系和搜索入口即可改善研究整理效率，避免过早扩展新的跨资产关系模型。
- Skill 与 Project 的显式关系仍未建模，使用搜索入口比临时推断关系更清晰，也更安全。

影响：

- `/dashboard/projects/[id]` 视觉和信息架构变为研究中枢，但保留返回、编辑和删除项目能力。
- 公开 Project 页面、viewer/restricted、Resume、Career、Market Brief、Storage policy、RLS 和 Documents 底层流程不受影响。
- 不读取文件正文，不解析附件，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。

## 2026-06-13 - Use Knowledge Detail As Knowledge Node

类型：decision

决策：

- Phase 2Q-A-2 继 Project 详情页后，第二个 polish 对象选择 `/dashboard/knowledge/[id]`。
- Knowledge 详情页作为知识节点，连接摘要、正文、分类、标签、关联 Project、私密资料、同项目成果和后台搜索入口。
- 关联 Project 只使用现有 `knowledge_notes.project_id`，不新增字段或关系表。
- 相关成果不伪造直接关系；如果 Knowledge 已关联 Project，则展示同项目 `publications.project_id` 成果，最多 5 条。
- 2Q-A-2 当时将 Publication / Skill 与 Knowledge 的直接显式关联留到后续 Phase 2Q-B；该边界已由 2Q-B-1 的 `research_asset_links` 扩展。
- 2Q-A-2 当时没有显式关联字段时，先通过 `/dashboard/search?q=...&type=...` 辅助查找相关 Project / Publication / Skill；当前仍保留搜索入口作为辅助。
- 本 PR 不引入 AI、OCR、文件内容索引、向量搜索、migration、RPC、索引、关系表或 Storage 行为。

原因：

- Project 研究中枢已经建立后，Knowledge 是研究沉淀中最常用的节点，需要比普通 CRUD 详情页更清楚地承接观点、资料、方法和摘录。
- 现有 `knowledge_notes.project_id` 和 `publications.project_id` 已能表达“同项目上下文”，可以先改善后台整理体验。
- 直接的跨资产关系模型需要统一设计，过早给 Knowledge、Publication、Skill 单点加字段容易造成后续关系不一致。

影响：

- `/dashboard/knowledge/[id]` 视觉和信息架构变为知识节点，但保留返回、编辑和删除能力。
- RelatedDocumentsPanel 继续保持既有私密附件分组和上传入口，不读取附件正文，不生成 signed URL，不显示 Storage path。
- 公开 Knowledge 页面、Project / Publication / Skill 详情页、viewer/restricted、Resume、Career、Market Brief、Storage policy 和 RLS 不受影响。
- 不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。

## 2026-06-13 - Use Skill Detail As Capability Package

类型：decision

决策：

- Phase 2Q-A-3 继 Project、Knowledge 之后，第三个 polish 对象选择 `/dashboard/skills/[id]`。
- Skill 详情页作为能力包 / 工作流包，连接用途说明、平台、版本、状态、私密资料、版本记录和后台搜索入口。
- Skill package 仅作为私密资料存储和管理，不安装、不解析、不执行。
- 2Q-A-3 当时 Skill 没有 Project / Knowledge / Publication 显式关联字段，因此不新增资产关系表，不伪造相关资产；该边界已由 2Q-B-1 的 `research_asset_links` 扩展。
- 2Q-A-3 当时没有显式关联字段时，先通过 `/dashboard/search?q=...&type=...` 辅助查找相关 Project / Knowledge / Publication，并可按 platform 搜索全局资产；当前仍保留搜索入口作为辅助。
- 资产之间的显式关联关系已在 Phase 2Q-B-1 建立管理员后台底座。
- 本 PR 不引入 AI、OCR、文件内容索引、向量搜索、migration、RPC、索引、关系表或 Storage 行为。

原因：

- Project 研究中枢和 Knowledge 知识节点已经建立后，Skill 是第三类高频研究资产，需要从普通详情页升级为可复用能力包的整理入口。
- 现有 Skill 字段已经能表达用途、平台、版本、输入输出、使用指南和 `SKILL.md`，可以先通过 UI 重组提升后台维护效率。
- 直接的跨资产关系模型需要统一设计，过早给 Skill 单点加字段容易和后续 Project / Knowledge / Publication 关系模型冲突。

影响：

- `/dashboard/skills/[id]` 视觉和信息架构变为能力包 / 工作流包，但保留返回、编辑、删除和新增版本记录能力。
- RelatedDocumentsPanel 继续保持既有私密附件分组和上传入口，不读取附件正文，不生成 signed URL，不显示 Storage path。
- 公开 Skill 页面、Project / Knowledge / Publication 详情页、viewer/restricted、Resume、Career、Market Brief、Storage policy 和 RLS 不受影响。
- 不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。

## 2026-06-13 - Use Publication Detail As Output Hub

类型：decision

决策：

- Phase 2Q-A-4 继 Project、Knowledge、Skill 之后，第四个 polish 对象选择 `/dashboard/publications/[id]`。
- Publication 详情页作为研究成果中枢，连接 summary、abstract、关联 Project、私密成果材料、同项目 Knowledge 和后台搜索入口。
- 关联 Project 只使用现有 `publications.project_id`，不新增字段或关系表。
- 同项目 Knowledge 只使用现有 `knowledge_notes.project_id`；如果 Publication 未关联 Project，则不展示推断关系，并保留搜索入口。
- 2Q-A-4 当时不新增 Publication 到 Knowledge / Skill 的显式关系，不伪造相关资产；该边界已由 2Q-B-1 的 `research_asset_links` 扩展。
- 资产之间的显式跨关系已在 Phase 2Q-B-1 建立管理员后台底座。
- `file_path` 不在后台详情页展示，也不作为下载入口；`cover_url` 仅作为安全 metadata 状态展示。
- 本 PR 不引入 AI、OCR、文件内容索引、向量搜索、migration、RPC、索引、关系表或 Storage 行为。

原因：

- Project、Knowledge、Skill 详情页已经建立后，Publication 是研究输出的核心节点，需要一个能承接成果摘要、附件、项目上下文和相关知识的后台入口。
- 现有 `publications.project_id` 与 `knowledge_notes.project_id` 已能表达“同项目上下文”，可以先改善成果整理体验。
- 直接跨资产关系模型需要统一设计，过早给 Publication 单点加关系字段容易和后续 Project / Knowledge / Skill 关系模型冲突。
- Publication 表历史上存在 `file_path` 字段，但当前附件系统已经由 Documents 私密底座承接；继续避免把历史文件路径误当作下载能力。

影响：

- `/dashboard/publications/[id]` 视觉和信息架构变为成果中枢，但保留返回、编辑和删除能力。
- RelatedDocumentsPanel 继续保持既有私密附件分组和上传入口，不读取附件正文，不生成 signed URL，不显示 Storage path。
- 公开 Publication 页面、Project / Knowledge / Skill 详情页、viewer/restricted、Resume、Career、Market Brief、Storage policy 和 RLS 不受影响。
- 不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。

## 2026-06-13 - Add Admin-Only Research Asset Links

类型：decision

决策：

- Phase 2Q-B-1 新增 `research_asset_links`，作为 Project / Knowledge / Skill / Publication 之间的显式关系底座。
- 关系先只覆盖四类研究资产：`project`、`knowledge`、`skill`、`publication`。
- relation_type 先支持 `related`、`supports`、`references`、`uses`、`produces`、`derived_from`，作为管理员维护标签，不驱动权限继承或公开展示。
- Documents 暂不纳入此关系表，继续使用现有 `documents.related_type / related_id` 与 `document_collections.related_type / related_id`。
- 现有 `knowledge_notes.project_id` 与 `publications.project_id` 继续保留，不迁移、不删除、不自动转换为 `research_asset_links`。
- 关系只在管理员后台使用，四类后台详情页展示 outbound relationships 与 inbound backlinks，并提供创建和删除能力。
- 本阶段不做 AI 自动关联、关系图谱可视化、拖拽连线、公开页面展示、复杂权限继承、edit link、向量搜索或外部搜索服务。
- 本阶段不新增 RPC，不引入数据库事务；Server Action 分步校验 source / target 存在性后写入或删除关系。

原因：

- 2Q-A 已把四类详情页打磨成研究资产中枢，但跨 Project / Knowledge / Skill / Publication 的语义关系仍分散在 `project_id` 和搜索入口中。
- 用一张管理员后台关系表可以表达“知识支持项目”“Skill 用于项目”“成果引用知识”等明确关系，同时避免给每个资产表新增多组单点字段。
- Documents 已经是独立私密附件底座，贸然纳入关系表会混淆“研究资产关系”和“私密文件归属 / 文档包关系”两个模型。
- 保留 `project_id` 可以避免迁移风险，并让既有同项目展示继续稳定运行。

影响：

- 新增 `supabase/migrations/0019_research_asset_links.sql`，启用 RLS，并通过 `public.is_admin()` 限定管理员 select / insert / update / delete。
- 新增 `src/lib/queries/asset-links.ts`、`src/lib/validations/asset-link.ts`、`src/actions/asset-links.ts` 和通用 AssetLinksPanel 组件。
- `/dashboard/projects/[id]`、`/dashboard/knowledge/[id]`、`/dashboard/skills/[id]`、`/dashboard/publications/[id]` 显示显式关联资产区域。
- 公开页面、viewer/restricted、Documents、Storage policy、Resume、Career、Calendar、Profile 和 Market Brief 不受影响。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path，不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。

## 2026-06-13 - Polish Research Asset Links Management Only

类型：decision

决策：

- Phase 2Q-B-2 只增强 `research_asset_links` 的管理员后台管理体验，不扩展数据模型。
- 关系仍只覆盖 Project / Knowledge / Skill / Publication；Documents 仍不纳入 `research_asset_links`。
- 新增关系表单只在已加载的目标候选内按标题和 metadata 本地筛选，不做异步搜索、外部搜索、文件内容搜索或向量搜索。
- 关系列表新增方向、对方资产类型和 relation_type 筛选；筛选只在客户端当前结果中完成，不写入 URL，不触发服务端重新查询。
- 编辑关系只允许修改 `relation_type` 和 `note`，不允许修改 source / target；如需更换 source / target，应删除后重新创建。
- 本阶段不新增 schema，不修改 `0019_research_asset_links.sql`，不新增 migration、RPC 或数据库事务。
- 暂不做 AI 自动关联、关系图谱可视化、拖拽连线、公开展示、复杂权限继承、批量导入或批量删除。

原因：

- 2Q-B-1 已建立显式关系底座，但日常维护还需要更容易筛选、理解和修正关系。
- source / target 代表关系两端身份，允许编辑会增加审计和语义歧义；删除后重建更清楚，也符合当前轻量后台管理模型。
- 目标资产候选来自数据库 metadata，足以支持手动选择；本阶段不应为关系管理引入文件读取、搜索索引或 AI 推断。
- 已执行的 0019 migration 应保持稳定，体验 polish 不应修改已落库 schema。

影响：

- 新增 update Server Action，写入前继续验证管理员身份和关系存在性，Activity Log 只记录 source / target 类型与 ID、relation_type，不记录备注或敏感字段。
- AssetLinksPanel 增加统计、方向 / 类型筛选、关系句子、编辑关系和更清晰的空状态。
- CreateAssetLinkForm 增加目标资产本地筛选与筛选数量提示。
- 公开页面、viewer/restricted、Documents、Storage policy、Resume、Career、Calendar、Profile 和 Market Brief 不受影响。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path，不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。

## 2026-06-13 - Add Read-Only Research Asset Network View

类型：decision，superseded by `2026-06-13 - Remove Research Asset Network View`

决策：

- Phase 2Q-B-3 新增 `/dashboard/network`，作为管理员后台只读研究资产网络视图 MVP。
- Network View 只展示 Project / Knowledge / Skill / Publication 四类资产，数据来自 `research_asset_links`。
- 页面最多读取最近更新的 200 条显式关系，节点只来自这些关系的 source / target。
- MVP 采用轻量分组列表图谱和全局关系列表，不引入 d3、cytoscape、react-flow 等复杂图谱库。
- 页面提供资产类型、relation_type 和节点标题 / metadata 关键词的前端本地筛选。
- Network View 只读，不提供 create / edit / delete；关系创建、编辑和删除仍在各资产详情页的 AssetLinksPanel 完成。
- Documents 不纳入图谱；Documents 与文档包继续使用 `documents.related_type / related_id` 与 `document_collections.related_type / related_id`。
- 本阶段不新增 schema，不修改 `0019_research_asset_links.sql`，不新增 migration、RPC 或数据库事务。
- 暂不做 AI 自动关联、图谱自动推理、公开展示、复杂权限继承、拖拽连线、图谱编辑、批量导入或批量删除。

原因：

- 2Q-B-1 / 2Q-B-2 已让单个资产详情页可以维护局部显式关系，但当关系变多时需要一个全局视角查看研究资产网络。
- 列表式网络能先满足节点、出入度、关系方向和全局筛选需求，同时保持可维护性，避免过早引入复杂图谱交互和依赖。
- 只读页面可以降低误操作风险；关系写入继续集中在资产详情页现有管理流程中。
- 已执行的 0019 migration 应保持稳定，网络视图只读取既有关系和 metadata。

影响：

- 新增 `src/lib/queries/asset-network.ts`、`src/app/dashboard/network/page.tsx` 和轻量网络视图组件。
- 后台侧边栏新增“关系图谱”入口，AssetLinksPanel 增加“查看关系图谱”快捷入口。
- 公开页面、viewer/restricted、Documents、Storage policy、Resume、Career、Calendar、Profile 和 Market Brief 不受影响。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path，不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。

替代说明：

- 该全局视图已在 Phase 2Q-B-4 中移除；当前只保留四类资产详情页中的显式关系管理。

## 2026-06-13 - Remove Research Asset Network View

类型：decision

决策：

- Phase 2Q-B-4 移除此前的全局关系可视化页面，不继续推进动态图、蜘蛛网式可视化、3D 图谱、force graph 或 Network View。
- 保留 `research_asset_links` 表、`0019_research_asset_links.sql` migration、Server Actions、查询、校验和四类资产详情页中的 AssetLinksPanel。
- Project / Knowledge / Skill / Publication 详情页继续支持显式关系 create / update / delete、outbound、backlink、relation_type、note、目标资产本地筛选和关系列表筛选。
- 删除后台侧边栏中的全局关系入口，删除 AssetLinksPanel 附近的全局页面入口。
- 不新增替代图谱页面；未来如果重新需要全局可视化，应作为独立新阶段重新设计。

原因：

- 用户判断全局关系可视化模块对实际工作效率帮助有限，继续投入动态图、蜘蛛网或复杂网络可视化不符合当前稳定维护路线。
- 单个资产详情页中的显式关系管理仍然有价值：它能清楚记录某个 Project / Knowledge / Skill / Publication 的人工确认关系和 backlinks。
- 保留 `research_asset_links` 数据模型可以继续支持明确关系管理，同时避免维护一个低收益的大型全局可视化页面。

影响：

- 删除 `src/app/dashboard/network/page.tsx`、`src/lib/queries/asset-network.ts` 和 `src/components/asset-network/` 下的全局视图组件。
- `src/components/asset-links/asset-links-panel.tsx` 保留，但移除全局页面跳转入口。
- `src/lib/mock-data.ts` 不再提供全局关系入口。
- 不新增 migration，不修改 `0019_research_asset_links.sql`，不修改 RLS、Storage policy、Documents、Resume / Career、viewer/restricted 或 Market Brief。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path，不记录或输出 API key、Supabase key、Authorization header、cookie、token、signed URL 或 secret。
