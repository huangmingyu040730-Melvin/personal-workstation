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
- 当前阶段只为后续一键生成简历、PDF / Word 导出和 AI JD 优化打基础。

影响：

- 合并后生产 Supabase 需要执行 `0009_resume_items.sql`。
- Dashboard 可展示简历素材概览和最近更新素材。
- 后续 Phase 2K-B 才做简历版本组合生成；Phase 2K-C 才做 PDF / Word 导出；Phase 2K-D 才做 AI JD 优化。
- 不修改 Viewer、restricted grants、Documents、Storage、Calendar 或 Profile 主流程。
