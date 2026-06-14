# Workflows

## Local Development

日期：2026-05-31

类型：workflow

用途：

- 本地运行、检查和构建个人数字工作站前端。

步骤：

1. 安装依赖：

```bash
npm install
```

2. 启动本地开发服务器：

```bash
npm run dev
```

3. 访问：

```text
http://localhost:3000
```

4. 修改完成后运行：

```bash
npm run lint
npm run build
```

验证要求：

- 每轮代码修改后运行 lint 和 build。
- 如涉及视觉布局，至少打开首页和对应工作台页面确认可渲染。

## Mock Data Update

日期：2026-05-31

类型：workflow

用途：

- 更新第一阶段页面展示内容。

步骤：

1. 在 `src/lib/types.ts` 中确认或补充类型。
2. 在 `src/lib/mock-data.ts` 中更新示例数据。
3. 页面组件从 mock data 引用数据，不在页面中散落大量示例内容。
4. 保留 `visibility` 字段，值为 `public`、`private` 或 `unlisted`。

验证要求：

- 更新后运行 `npm run lint` 和 `npm run build`。

## Supabase Foundation Update

日期：2026-06-01

类型：workflow

用途：

- 维护 Phase 2A 的 Supabase Auth、RLS 和 schema 基础。

步骤：

1. 前端运行时只使用 publishable key，不引入 `service_role`。
2. 环境变量只提交 `.env.example` 占位，不提交 `.env.local`。
3. 数据库结构变更放入 `supabase/migrations/`。
4. 后台权限通过 Supabase Auth、`admin_users` 和 `public.is_admin()` 控制。
5. 页面数据接入真实 CRUD 前，保留 `src/lib/mock-data.ts` 作为展示来源。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 检查没有 `.env`、密钥、`node_modules` 或 `.next` 被加入提交。

## Core Content CRUD Update

日期：2026-06-03

类型：workflow

用途：

- 维护 Projects、Knowledge Base、Skills Library 的真实 Supabase CRUD。

步骤：

1. 查询逻辑放在 `src/lib/queries/`。
2. 表单校验放在 `src/lib/validations/`，使用 Zod 和中文错误提示。
3. 写入、更新、删除放在 `src/actions/`，使用 Server Actions。
4. 每个 Server Action 必须创建 Supabase server client、验证登录、验证 `public.is_admin()`，再执行写入。
5. mutation 后使用 `revalidatePath()` 刷新相关列表、详情、Dashboard 和公开首页。
6. 核心操作写入 `activity_logs`，只记录标题、slug、版本等后台摘要，不记录密码、密钥或完整敏感正文。
7. Markdown 详情页使用安全文本渲染，不使用未经清理的原始 HTML。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 无密码验证公开首页可访问、后台路由未登录跳 `/login`。
- 管理员 CRUD 验证需要用户本人输入账号密码完成。

## Publications And Documents Storage Update

日期：2026-06-03

类型：workflow

用途：

- 维护 Publications 真实 CRUD、Documents 文件中心与 Supabase Storage 私密文件能力。

步骤：

1. 查询逻辑放在 `src/lib/queries/publications.ts` 和 `src/lib/queries/documents.ts`。
2. 表单校验放在 `src/lib/validations/publication.ts` 和 `src/lib/validations/document.ts`。
3. 写入、更新、删除、上传放在 `src/actions/`，每个 Server Action 都必须验证登录与管理员权限。
4. 文件类型、大小、文件名清理、Storage path 和 signed URL 配置集中在 `src/lib/storage/documents.ts`。
5. Storage 变更必须新增 migration，不修改已在生产执行过的 0001/0002。
6. 本轮使用 private bucket `workspace-files`，不创建 public bucket。
7. 文件上传使用两阶段流程：Server Action 准备 metadata 和路径，浏览器直接上传到 Supabase Storage，Server Action 最终确认并写入数据库。
8. 文件上传必须使用服务端生成路径和 `upsert: false`，失败时尽力清理已上传对象或异常记录。
9. 文件上传默认 private；管理员下载和 public 下载 route 都只按需生成 60 秒 signed URL，不保存 signed URL，也不写入页面 HTML。
10. Publication 删除前检查关联 documents；存在附件时阻止删除。
11. Activity Logs 只记录后台摘要，不记录文件内容、signed URL、完整 Storage 路径、密码、密钥或 Auth UUID。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 检查 0003 migration 只包含 private bucket 和最小 Storage policies。
- 检查公开首页不展示 private/unlisted Publications，也不展示 Storage 路径、signed URL 或 raw 文件关系；公开附件只允许后续 public route 按规则展示。
- 新建环境或 Preview 环境执行 0003 前，不对对应 Supabase 项目做 Storage 写入测试。
- 管理员真实上传、下载、关联和删除验收需要用户本人登录完成。

## Access Request Workflow Update

日期：2026-06-06

类型：workflow

用途：

- 维护 Phase 2E-A 的访问申请提交与后台处理状态。

步骤：

1. 数据库变更必须新增增量 migration，不修改已在生产执行过的 0001/0002/0003。
2. `access_requests` 表的公开写入只允许匿名访客 insert，不允许 anon select/update/delete。
3. 后台读取和更新必须由管理员登录后通过 `public.is_admin()` 保护。
4. Server Action 需要使用 Zod 校验姓名、邮箱、机构、申请内容和理由，并显示中文错误提示。
5. 管理员处理状态仅包含 `pending`、`approved`、`rejected`，并可填写管理员备注。
6. approved/rejected 当前只代表处理状态，不自动创建外部账号、不开放 restricted 内容、不生成邀请链接。
7. 日志或后台展示不得记录密码、密钥、Auth UUID、Supabase URL/key 或其他敏感凭据。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 未登录可打开 `/access-request`，后台 `/dashboard/access-requests` 未登录应跳转 `/login`。
- 执行 0004 migration 后，验证公开表单可提交、后台可查看详情并更新状态。
- 不执行生产 migration，除非用户明确批准。

## Restricted Content Grant Workflow

日期：2026-06-06

类型：workflow

用途：

- 维护 Phase 2E-B 的 restricted 内容与邮箱授权基础能力。Viewer magic link 登录仍存在已知问题，后续需 Phase 2I 专项修复。

步骤：

1. 数据库变更必须新增增量 migration，不修改已在生产执行过的 0001/0002/0003/0004。
2. `restricted` visibility 只用于 Projects、Publications、Knowledge、Skills 的详情页授权访问。
3. 管理员在后台创建授权前，应先将内容设置为 `restricted`。
4. 授权记录写入 `content_access_grants`，包括邮箱、内容类型、内容 ID、状态、可选有效期和备注。
5. 外部用户通过 `/viewer/login` 使用邮箱魔法链接登录，不使用明文密码，不进入后台；当前该链路仍不稳定，修复工作不得混入其他阶段。
6. 公开详情页读取受 RLS 保护的数据；未授权时只显示申请入口和授权登录入口，不展示正文。
7. 撤销授权只更新授权状态为 `revoked`，RLS 会阻止后续读取。
8. private Documents、Storage、附件下载和 signed URL 不随 restricted 内容授权开放；显式 public 文件仍只按 public 下载 route 规则访问。
9. Viewer 登录前授权检查依赖 `0006_viewer_login_grant_check.sql`，但 0006 只提供 RPC，不代表 viewer 登录链路已稳定。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 合并后在生产 Supabase 手动执行 `0005_restricted_content_access.sql`。
- 验证 public 内容仍所有访客可看，restricted 内容只有管理员或匹配邮箱授权用户可看，private 内容仅管理员可看。
- 验证非管理员登录用户不能进入 `/dashboard`，不能访问 `/dashboard/access-grants` 或 Documents。

## Public Research Workstation Publishing Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-A 的公开研究工作站展示流程，让公开首页、公开导航和四类公开列表只呈现适合外部访客浏览的 public 内容。

步骤：

1. 管理员在后台维护正式内容：Project 使用 `/dashboard/projects`，Publication 使用 `/dashboard/publications`，Knowledge 使用 `/dashboard/knowledge`，Skill 使用 `/dashboard/skills`。
2. 内容仍先在后台补齐标题、摘要、标签、状态、项目关联、正文或说明等公开字段；私密材料继续放在 Documents / 文档包中。
3. 确认内容适合对外展示后，把对应记录的 `visibility` 设置为 `public`。
4. 公开首页 `/` 会展示“黄铭语研究工作站”站点身份，首屏 H1 为“个人研究工作站”，采用左侧个人定位 / 标签 / CTA 与右侧公开统计卡片结构。
5. 首页 hero 可使用轻量 CSS 背景表达金融 / 量化 / 研究 / 学术氛围，并通过系统中文 serif 字体栈增强 H1；不得引入字体文件、外部字体服务、真实行情数据、图表库或动画库。
6. 首页下方继续分区展示研究方向、公开 Project / Publication、Knowledge 预览、Skill 预览和访问申请入口；Knowledge / Skill 首页预览使用紧凑卡片，最多展示 4 条 public 内容。
7. 四个公开列表页 `/projects`、`/publications`、`/knowledge`、`/skills` 使用统一 listing header、公开统计、轻量筛选、公开卡片和友好空状态；筛选只基于已有 public 字段和 URL query params。
8. 四个公开详情页 `/projects/[slug]`、`/publications/[slug]`、`/knowledge/[slug]`、`/skills/[slug]` 使用统一 detail hero、主内容 section、侧栏 metadata、标签、访问申请 CTA 和 related public content。
9. 公开详情页只读取 public 详情查询；private / restricted / unlisted 内容不输出正文或附件，只引导访问申请 / viewer 登录。
10. 公开导航只面向普通访客，保留首页、研究项目、学术成果、知识库、Skill 库、访问申请和轻量“管理员登录”，不放后台菜单、文件中心或全局关系图谱入口。
11. “管理员登录”只链接到登录流程；未登录访客不能直接进入后台，已登录管理员沿用现有 `/login?next=/dashboard` / dashboard 逻辑。
12. 公开列表和详情页只展示 public 内容；restricted 内容通过访问申请和授权流程处理，private 内容不进入公开展示。
13. 需要公开少量附件时，管理员先在文件详情页或文件中心批量工具把文件显式设为 public，并确认文件关联到当前 public Project / Publication；未显式 public 的文件仍只在后台 Documents、RelatedDocumentsPanel 或文档包详情页处理。
14. 公开 Project / Publication 详情页只展示安全附件摘要和 `/public-files/[id]/download` 入口；下载 route 服务端复核文件 public、当前资产 public 和关联存在后，才生成 60 秒短时 signed URL。
15. Knowledge / Skill 公开详情页不展示 Documents；Skill 页面只是公开说明页，不展示 Skill package、私密附件，不执行、不安装、不解析 Skill 文件。
16. Documents raw 多资产关联、relation note、Storage path、Storage bucket、owner_id、显式资产关系和后台搜索只用于管理员整理，不在公开页面展示。
17. 如需要外部访客申请未公开内容，引导其访问 `/access-request`；申请通过不自动开放 private Documents、Storage、私密附件下载或后台入口。
18. Publication 公开页面不得展示历史 `file_path`、Storage 路径、Storage bucket、signed URL 或 raw 附件关系。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认首页首屏 H1 为“个人研究工作站”，左侧定位 / 标签 / CTA 与右侧统计卡片清晰，CTA 能进入研究项目、学术成果、Skill 库和访问申请。
- 确认 hero 背景有克制的金融 / 量化 / 研究抽象元素，H1 字体更专业，并且 390px 宽度下不遮挡文字、不横向溢出。
- 确认 Knowledge / Skill 首页预览更紧凑，并且只展示 public 查询返回的内容。
- 确认 `/projects`、`/publications`、`/knowledge`、`/skills` 是统一公开内容索引体验，筛选可用、空状态友好、移动端不横向溢出。
- 确认 `/projects/[slug]`、`/publications/[slug]`、`/knowledge/[slug]`、`/skills/[slug]` 是统一公开详情体验，主内容和侧栏在 390px 宽度下正确堆叠。
- 确认公开导航显示“管理员登录”，但不显示后台菜单、文件中心、关系图谱或 Documents 入口。
- 确认 private / restricted / unlisted 内容不会出现在公开列表、公开首页或 sitemap。
- 确认公开 Project / Publication 页面只展示符合条件的 public 附件；公开 Knowledge / Skill 不展示 Documents 或 Skill 私密包。
- 确认公开页面不展示 private / unlisted 文件、Storage path、Storage bucket、signed URL、`file_path`、raw `document_asset_links`、relation note 或 `research_asset_links` 管理功能。
- 本流程不新增 migration，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或后台显式关系管理，不引入字体文件、外部字体服务、图表库、动画库、外部搜索服务或向量库。

## Access Request And Restricted Content Experience Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-B-1 的访问申请与未公开内容体验，让公开访客可以从公开内容详情页清楚申请更多研究资料，同时保持申请、授权、Documents 和公开附件下载边界分离。

步骤：

1. `/access-request` 是正式申请入口，标题使用“申请访问研究资料”，metadata 使用“申请访问 | 黄铭语研究工作站”，不把 query 里的 title 或 slug 写入 metadata。
2. Project / Publication / Knowledge / Skill 公开详情页的申请 CTA 使用 `content_type`、slug、当前 public 页面已显示标题和来源 `from` 生成 query。
3. 申请 CTA 不使用 private id；未公开 fallback 只能携带访客正在访问的 slug 和内容类型，不确认 private / restricted 内容是否真实存在。
4. 申请页读取 query 后展示“你正在申请访问”的上下文，并预填既有 `requested_content_type`、`requested_content_title` 和 `requested_content_url` 字段。
5. 若没有 query 上下文，申请页仍可独立填写内容类型、标题、链接和申请理由。
6. 申请理由字段用于填写用途说明；页面必须提示不要填写密码、API key、授权码、私密通信原文或其他敏感信息。
7. 提交访问申请只写入 `access_requests`，状态为 `pending`；提交成功不自动创建 Access Grant，不开放 restricted/private 正文，不开放 Documents，不生成 signed URL。
8. 未公开或需要授权的详情页 fallback 使用专业文案，例如“该内容暂未公开或需要授权访问”，并提供申请访问、viewer 邮箱登录和返回公开列表。
9. fallback 不展示正文、摘要、附件、Storage path、Storage bucket、signed URL、`file_path`、raw `document_asset_links` 或 `research_asset_links` 管理信息。
10. 后台 `/dashboard/access-requests` 列表应展示申请人、邮箱、申请目标、来源、理由摘要、状态和提交时间。
11. 后台详情页应展示内容类型、目标标题、来源、公开路径、原始申请链接、申请理由、状态、处理时间和内部备注。
12. 审批表单只更新 `pending` / `approved` / `rejected` 与内部备注；同意申请后仍需管理员手动创建 Access Grant，并选择具体 restricted 内容。
13. Access Grant 创建页可从申请带入邮箱和内容类型，但仍不自动选择内容、不自动发送邮件、不开放 Documents 或附件下载。
14. 本流程不新增 Supabase migration，不修改 RLS、Storage policy、public 文件下载 route、Documents 上传 / 删除 / zip 下载或邮件服务。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 打开 `/access-request`，确认页面像正式研究资料访问申请入口，表单字段清楚，文案说明申请不会自动授权。
- 从 public Project / Publication / Knowledge / Skill 详情页点击申请访问，确认 query context 正确，申请页显示申请目标并可提交。
- 打开不存在或未公开 slug，确认页面不泄露内容是否真实存在，提供申请访问 CTA、viewer 登录和返回列表。
- 在后台提交或查看一条访问申请，确认能看到来源、目标内容、申请理由和状态，且 approve / reject / pending 可操作。
- 确认申请不会自动开放 Documents、private attachments、Storage path、bucket、signed URL、raw link rows 或 restricted/private 正文。
- 在 390px 宽度下确认 `/access-request` 和 fallback 页面无横向溢出，表单字段可输入，CTA 可点击。

## Access Request Admin Review Workflow

日期：2026-06-15

类型：workflow

用途：

- 维护 Phase 2R-E-1 的后台访问申请人工审核流程，让管理员可以按状态和目标类型处理申请，同时保持申请状态、Access Grants 和 Documents 权限边界分离。

步骤：

1. 进入 `/dashboard/access-requests`。
2. 先查看状态统计，优先处理 `pending`。
3. 使用状态筛选查看全部、待处理、已同意或已拒绝申请。
4. 使用目标类型筛选查看 Project、Publication、Knowledge、Skill 或未知 / 通用申请。
5. 在申请卡片中核对申请人、邮箱、目标标题、内容类型、slug、来源页面、公开路径、提交时间、处理时间、备注状态和理由摘要。
6. 进入详情页 `/dashboard/access-requests/[id]`。
7. 核对申请人信息、目标上下文、公开路径、原始申请链接和完整申请理由。
8. 在人工处理区更新 `pending` / `approved` / `rejected` 与内部备注。
9. 如状态为 approved 且确实需要授权，使用页面上的 Access Grant 引导进入创建页；创建页最多预填邮箱、申请 id 和内容类型。
10. 在 Access Grant 创建页继续手动选择具体 restricted 内容；不要把 slug 或申请目标直接当作 private id 使用。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 如本地服务可用，运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 确认列表筛选不会改变申请数据，只改变展示结果。
- 确认详情页保存状态和内部备注后不会自动创建 Access Grant。
- 确认 approved 申请进入 Access Grant 创建页时不自动选择具体内容。
- 确认没有新增 migration、数据库字段、RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route、Access Grants 核心权限、邮件服务或自动授权。

## Access Grants Admin Management Workflow

日期：2026-06-15

类型：workflow

用途：

- 维护 Phase 2R-E-2 的 Access Grants 后台授权管理流程，让管理员可以手动创建、筛选、复核和撤销 restricted 内容授权，同时保持 Access Request、Documents、public 附件和权限模型边界分离。

步骤：

1. 进入 `/dashboard/access-grants`。
2. 先查看状态统计，确认全部、有效、已过期、已撤销授权数量。
3. 使用状态筛选查看 `all`、`active`、`expired` 或 `revoked` 授权。
4. 使用内容类型筛选查看 Project、Publication、Knowledge 或 Skill 授权。
5. 在授权卡片中核对邮箱、内容类型、目标标题、slug、visibility、创建时间、过期时间、撤销时间线索和备注状态。
6. 进入详情页 `/dashboard/access-grants/[id]`，复核授权对象、目标内容、有效状态、内部备注和安全边界。
7. 如需新建授权，进入 `/dashboard/access-grants/new`，手动选择具体 restricted 内容；不要把申请 slug、申请目标或 private id 自动当作授权对象。
8. 如从 approved Access Request 跳转创建页，只把邮箱、申请 id 和内容类型作为人工上下文，仍需手动选择具体 restricted 内容。
9. 如需撤销授权，在列表或详情页执行撤销；撤销只更新授权状态，不删除申请、内容或 Documents。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 如本地服务可用，运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 确认列表筛选不会改变授权数据，只改变展示结果。
- 确认 expired 状态由 `expires_at` 应用层计算，不新增数据库枚举。
- 确认创建页不会自动选择具体内容，不自动创建 viewer 账号，不自动发送邮件。
- 确认撤销授权不会删除 Access Request、内容、Documents，不改变内容 visibility 或 public attachments 规则。
- 确认没有新增 migration、数据库字段、RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route、Access Grants 核心权限、邮件服务或自动授权。

## Public SEO And Sharing Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-C-1 的公开站点 SEO、分享卡片、sitemap 和 robots，让公开研究工作站可被安全索引和分享。

步骤：

1. 公开页面 metadata 统一通过 `src/lib/site.ts` 维护站点名、站点描述、canonical、Open Graph 和 Twitter card。
2. 页面 `title` 只写页面自身标题，由全局 metadata template 拼接“黄铭语研究工作站”；不要在页面 title 中重复站点名。
3. 首页分享标题使用“个人研究工作站 | 黄铭语研究工作站”，公开列表页分享标题使用“研究项目 / 学术成果 / 知识库 / Skill 库 | 黄铭语研究工作站”。
4. 公开详情页分享标题使用内容标题，description 只使用 public summary、excerpt、description、abstract 等公开字段截断。
5. `/access-request` metadata 固定为申请入口说明，不读取 query 中的 title、slug 或 from。
6. 未公开或不存在 slug 的详情页 metadata 保持 noindex，不确认 private / restricted 内容是否真实存在。
7. OG / Twitter 图片复用公开安全图片，不生成包含私密字段、文件路径或后台数据的动态图片。
8. sitemap 只包含 `/`、`/about`、`/projects`、`/publications`、`/knowledge`、`/skills`、`/access-request` 和 public Project / Publication / Knowledge / Skill 详情。
9. sitemap 查询 public 内容失败时安全降级为基础公开静态页面，不返回 500。
10. sitemap 不包含 dashboard、login、viewer、public file download route、signed URL、Storage path、private Documents、restricted / unlisted / private 内容或后台关系页面。
11. robots 允许公开页面和访问申请入口；阻止 dashboard、login、viewer、api、documents、public-files、admin、storage 和 signed 等路径。
12. robots 和 sitemap 不作为安全边界；公开权限仍由 public 查询、Supabase RLS、Storage policy 和 server-side download route 校验。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 打开 `/sitemap.xml`，确认包含基础公开入口和 public 详情链接，不包含 `/dashboard`、`/login`、`/viewer`、`/public-files`、signed URL 或 Storage path。
- 打开 `/robots.txt`，确认公开页面可索引，dashboard / API / viewer / public-files 等路径被 disallow。
- 检查首页、四个列表页、四类详情页和 `/access-request` 的 `<title>`、canonical、OG/Twitter metadata；确认不重复站点名、不包含 query 上下文或私密字段。
- 在 390px 宽度下抽查首页、一个列表页、一个详情页和 `/access-request` 无横向溢出。

## Public Launch QA And Hardening Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-C-2 的公开发布前 QA，确认公开主链路、SEO、访问申请、公开附件边界和移动端展示可以安全发布。

步骤：

1. 从最新 `main` 开始，确认本轮不新增 migration、不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或 Access Grants 核心权限。
2. 启动本地服务；如只做 mock fallback 巡检，可使用占位 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 让公开页安全降级。
3. 运行 `npm run smoke:public`；如服务不在默认端口，设置 `PUBLIC_SMOKE_BASE_URL`。
4. 确认 smoke 覆盖 `/`、四类公开列表页、`/access-request`、四类 fallback、`/sitemap.xml` 和 `/robots.txt`。
5. 确认 `/access-request` query 中的 title / slug 不进入 metadata。
6. 确认未公开 fallback 保持 noindex，并只提供访问申请 / viewer 登录 / 返回列表，不确认内容是否真实存在。
7. 确认 sitemap 只包含公开静态入口和 public 详情，不包含 `/dashboard`、`/api`、`/viewer`、`/login`、`/public-files`、signed URL、Storage path 或非 public 内容。
8. 确认 robots 允许公开页面和访问申请入口，并 disallow `/dashboard`、`/api`、`/viewer`、`/login`、`/public-files`。
9. 用浏览器在 390px 宽度抽查首页、四类列表页、四类详情或 fallback、`/access-request`，确认无横向溢出，长标题、长文件 metadata 和 CTA 不挤出屏幕。
10. 如果公开文案出现面向内部实现的 Storage / signed URL 术语，应改为访客可理解的边界说明；安全规则仍保留在代码和文档中。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 运行 `npm run smoke:public`。
- 浏览器 390px 冒烟确认公开主链路无横向溢出。
- 确认没有新增 migration，没有修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或 Access Grants 核心权限。

## Public Content Operations Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-D-1 的公开内容运营基础，用后台 public readiness checklist 判断 Project / Publication / Knowledge / Skill 是否适合设为 public。

步骤：

1. 进入对应后台详情页：Project `/dashboard/projects/[id]`、Publication `/dashboard/publications/[id]`、Knowledge `/dashboard/knowledge/[id]`、Skill `/dashboard/skills/[id]`。
2. 查看右侧“公开发布准备度” checklist，确认 visibility、slug、标题 / 名称、摘要 / description / excerpt、标签 / 分类、正文 / 说明和访问申请上下文。
3. Project 重点复核研究问题、背景、方法、进度、相关 Publication / Knowledge / Skill，以及是否需要公开附件。
4. Publication 重点复核成果类型、摘要、abstract、日期、关联 Project，以及是否需要公开论文、报告或补充材料。
5. Knowledge 重点复核分类、摘要、正文和关联 Project；公开页不展示 Documents。
6. Skill 重点复核使用说明、适用场景和公开说明页边界；Skill package 不展示、不下载、不执行、不安装、不解析。
7. 如 Project / Publication 需要公开附件，先确认文件 `visibility = public` 且关联到当前 public 资产；公开下载仍只走 `/public-files/[id]/download`。
8. 人工复核 public 字段，不写入 private / restricted 内容、Storage path、signed URL、`file_path`、owner_id、raw link rows、内部备注或 secret。
9. readiness checklist 只作为运营提示；不得把它改成保存阻塞、自动公开、自动审批或权限授予流程。
10. 需要发布前回归时，继续运行 `npm run lint`、`npm run build`、`git diff --check` 和运行中站点的 `npm run smoke:public`。

验证要求：

- 确认四类后台详情页能显示 public readiness checklist。
- 确认 checklist 不阻止保存，不自动修改 visibility，不自动公开附件。
- 确认没有新增 migration、数据库字段、RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或 Access Grants 核心权限变化。
- 确认公开页面仍只展示 public 内容；Knowledge / Skill 公开详情仍不展示 Documents。

## Project Documentation Wrap-up

日期：2026-06-09

类型：workflow

用途：

- 在功能阶段完成后同步项目文档，避免后续开发混淆已完成能力、已知问题、权限边界和下一阶段规划。

步骤：

1. 从最新 `main` 创建文档分支。
2. 只修改文档文件，不修改业务代码、Server Actions、Auth、RLS、Storage、migration 或 Viewer login。
3. 更新 `docs/current-status.md`，明确产品定位、已完成模块、权限边界、migration 状态和下一阶段。
4. 更新 `docs/known-issues.md`，单独记录仍冻结的问题。
5. 更新 `docs/roadmap.md`，把已完成阶段和下一阶段分开。
6. 更新 `docs/memory.md`，保留后续 Codex 接续所需的事实、决策和边界。
7. 更新 `docs/supabase-setup.md`，确保 migration 顺序和安全规则与生产状态一致。
8. 更新 README，使入口文档指向当前状态和路线图。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认没有新增 migration。
- 确认没有修改业务代码。
- 确认没有提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL、Storage 内部路径或 `service_role`。

## Memory Engineering Update

日期：2026-06-12

类型：workflow

用途：

- 当用户要求“更新记忆”“长期记忆”“沉淀记忆”或“memory engineering”时，按标准 SOP 更新项目记忆层。

步骤：

1. 先读取项目根目录 `AGENTS.md`。
2. 读取 `docs/memory.md`、`docs/decisions.md`、`docs/workflows.md`。
3. 如涉及阶段状态、路线或已知问题，继续读取 `docs/current-status.md`、`docs/roadmap.md`、`docs/known-issues.md` 和 `docs/supabase-setup.md`。
4. 按 SOP 将信息分类为 preference、fact、decision、workflow、failure / blocker、evidence。
5. 把稳定协作规则和安全边界写入 `AGENTS.md`。
6. 把当前状态、重要上下文、已知问题、迁移状态、下一步和 stale / superseded notes 写入 `docs/memory.md`。
7. 把关键产品、权限、数据模型或流程取舍写入 `docs/decisions.md`，不要为一次普通文档同步制造无意义决策。
8. 把可重复操作步骤写入 `docs/workflows.md`。
9. 对被新阶段替代的旧记录标记 stale / superseded，不要静默删除会影响后续判断的历史。

验证要求：

- 不保存密码、API key、token、管理员邮箱、Auth UUID、signed URL、Storage 内部路径或私人通信原文。
- 明确区分已验证事实、当前已知问题和未稳定能力。
- 运行 `npm run lint`。
- 运行 `npm run build`。

## Unified Private Attachment Workflow

日期：2026-06-12

类型：workflow

用途：

- 维护 Phase 2P-A / 2P-B / 2P-C / 2P-D / 2P-E-1 / 2P-E-1-B / 2P-E-1-C / 2P-E-2 / 2P-E-3 / 2P-F-1 / 2P-F-2 / 2P-G-1 的 Documents 统一私密附件底座、多文件 / 文件夹上传、内容详情页附件区域、create-and-upload flow、metadata 管理、多资产关联整理、内容详情页分组展示、文档包整体迁移 / 同步关联工具、受确认保护的删除能力、zip 临时下载和后台 metadata 搜索体验。

步骤：

1. Documents 查询逻辑继续集中在 `src/lib/queries/documents.ts`。
2. Documents 校验逻辑继续集中在 `src/lib/validations/document.ts`。
3. Documents 写入、prepare、finalize、删除和 collection 维护继续集中在 `src/actions/documents.ts`。
4. 文件类型、大小、文件名清理、Storage path 和 signed URL 配置继续集中在 `src/lib/storage/documents.ts`。
5. 上传继续使用两阶段流程：Server Action 准备 metadata 和安全 Storage path，浏览器用管理员 Supabase Auth 会话直接上传到 private bucket，Server Action finalize 写入 `documents` 记录和必要的专用关联记录。
6. 多文件 / 文件夹上传通过 `document_collections` 表记录批次、文件夹、附件包或 Skill 包，并通过 `documents.collection_id` 关联具体文件。
7. Documents 多资产关联写入 `document_asset_links`，文档包多资产关联写入 `document_collection_asset_links`；不要把 Documents 写入 `research_asset_links`。
8. `documents.related_type / related_id` 与 `document_collections.related_type / related_id` 只作为 legacy primary relation、路径 fallback 和兼容 query params；新展示、筛选和搜索应优先读取专用 link tables。展示关联 chips 时，同一资产已有具体关系则隐藏 legacy `related` fallback，只有 `related` 是唯一关系时才显示。多关联选择应使用 checkbox / chips 分组选择器，覆盖上传页、文件详情页、文档包详情页和批量添加关联；不要重新引入原生 `<select multiple>`。
9. `original_name`、`relative_path` 和 `folder_path` 可保存中文或原始路径信息用于后台展示。
10. `storage_path` 必须使用 ASCII-safe object key；最终 Storage 文件名使用 `documentId + extension`，中文文件名和中文目录不得直接进入 object key。
11. Project / Publication / Knowledge / Skill 后台详情页只嵌入关联文件和文档包区域，不重复实现上传系统。
12. 新建 Project / Publication / Knowledge / Skill 时，“保存并上传文件 / 文件夹或文档包”必须先创建内容记录，成功后跳转 `/dashboard/documents/upload` 并用 query params 预填 `related_type`、`related_id`、`mode`、`category` 和 `collection_type`；上传页可在此默认关联之外继续选择更多资产关联。
13. query params 只用于预填；服务端必须继续通过 `ensureRelatedRecordExists` 或同等逻辑验证每个关联对象存在且管理员可读。
14. 上传到已有文档包时，文件应继承文档包多关联，并允许叠加当前上传页传入的关联；不要因为文件和文档包 legacy primary relation 不一致而阻断上传。
15. Publication 删除前同时检查关联 `documents` 和 `document_collections`，存在附件或文档包时阻止删除。
16. Skill 包、代码文件和压缩包只作为文件存储，不执行、不解析、不安装。
17. 文件详情页只允许编辑显示名称、分类、visibility 和 legacy primary relation，不允许编辑 Storage bucket/path、大小、MIME type、原始文件名、relative_path、folder_path 或 collection_id；多资产关联在详情页的关联区域添加或移除。
18. 文档包详情页只允许编辑名称、描述、类型和 legacy primary relation，不允许手动编辑 file_count、total_size、root_folder_name、owner_id、visibility 或时间戳；多资产关联在文档包关联区域添加或移除。
19. 普通“编辑文档包信息”只修改文档包 metadata，不自动批量修改包内文件的多关联或 legacy primary relation。
20. Documents 列表和文档包详情页允许勾选多个文件后批量添加关联、按指定资产移除关联、清空全部关联、批量设为 public / private，legacy primary relation 操作放在高级兼容区域。
21. 批量添加关联写入 `document_asset_links`，目标关联对象必须在 Server Action 中重新校验存在；如果文件没有 legacy primary relation，可用首个新关联补齐 legacy 字段。
22. 批量移除指定关联只删除对应 link rows；清空全部关联会删除所选文件的 link rows，并清空 legacy primary relation。
23. 文档包详情页的“添加文档包关联”可选择同步到包内文件；移除文档包关联也可选择从包内文件移除等价关联。
24. 批量操作的 `return_to` 必须限制为站内 `/dashboard` 路径，避免 open redirect。
25. RelatedDocumentsPanel 按文档包、独立文件和跨文档包文件展示：当前对象文档包内文件由文档包卡片代表，不在独立文件中重复展示；每个文件或文档包显示关联 chips。
26. 单个文件调整：使用文件详情页，只修改该文件 metadata 或专用 link rows。
27. 多个文件调整：使用 Documents 列表或文档包详情页的紧凑批量工具栏，只修改所选文件 metadata 或专用 link rows。
28. 整个资料包调整：使用文档包详情页的关联管理和可选同步到包内文件；legacy “同步主关联”只作为兼容工具保留。
29. 文档包整体同步必须由 Server Action 按 `collection_id` 查询包内文件，不接收前端传入的文件 ID 或文件数量。
30. Documents 列表筛选只影响后台文件中心；`related_type / related_id` 表示“包含该资产关联”，不得读取文件内容或在列表页生成 signed URL。
31. 批量删除文件必须在 Server Action 中重新读取所选文件记录；读取失败或选择为空时不得执行删除。
32. 批量删除文件必须要求确认 checkbox，缺失时返回“请先确认删除操作。”。
33. 批量删除文件先删除 Supabase Storage object，再删除 `documents` 记录；Storage 删除失败时不删除数据库记录。
34. 批量删除文件成功后重新计算受影响文档包的 `file_count` 与 `total_size`，但不自动删除空文档包。
35. 删除整个文档包及文件必须要求确认文本 `DELETE` 或 `删除`；确认失败时不得执行删除。
36. 删除整个文档包及文件先删除包内文件的 Storage object 和 `documents` 记录，再删除 `document_collections` 记录。
37. 当前删除流程不新增数据库事务或 RPC；如果 Storage 成功但数据库删除失败，显示中文安全错误并在日志中记录 id、code/message 供人工复核。
38. 删除相关 Activity Log 不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
39. 需要下载多个附件时，在 Documents 列表或文档包详情页勾选文件后使用“下载选中文件 zip”。
40. 需要下载整个资料包时，在文档包详情页或内容详情页文档包卡片使用“下载 zip”。
41. zip 下载由 Route Handler 重新校验管理员身份并重新查询文件记录，不信任前端传入的文件名、Storage 路径、大小或数量。
42. zip 按请求临时生成，不保存到 Storage，不创建持久化 zip 记录。
43. zip 下载限制为最多 50 个文件、总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查；超限时拆分下载，系统不生成部分 zip。
44. zip 下载失败时不部分打包，不输出 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
45. public 附件只在 Project / Publication 公开详情页展示安全摘要字段；页面不得输出 Storage path、Storage bucket、owner_id、signed URL、raw `document_asset_links` 或 relation note。
46. `/public-files/[id]/download` route 必须重新查询文件记录并校验 `documents.visibility = 'public'`、bucket 为 `workspace-files`、当前资产 public 且文件关联当前资产；校验失败返回 404 / 403 类结果，不生成 signed URL。
47. 公开附件真实环境验收前确认目标 Supabase 已执行 `0021_public_attachment_service_role_grants.sql`，且 Vercel Production / Preview 仅在 server-side 配置 `SUPABASE_SERVICE_ROLE_KEY`；不得把该 key 输出到客户端、日志或文档。
48. 上传和整理文件后，先通过 `/dashboard/search?q=关键词` 按文件名、original_name、relative_path、文档包标题、项目、知识笔记、成果或 Skill metadata 全局查找资产。
49. 需要聚焦某类结果时，在搜索页使用 `type=documents`、`type=knowledge`、`type=projects` 等类型筛选；切回 `type=all` 可恢复全部分组。
50. 全局搜索只查询数据库 metadata；q trim 后少于 2 个字符时不执行查询，每类最多返回 8 条，并显示全部和每类命中数量。
51. 搜索结果标题和描述可高亮关键词，但高亮只在 React 展示层完成，不保存索引。
52. 文件正文搜索、PDF / Word / Excel / zip 解析、OCR、AI 摘要和向量搜索属于后续阶段；当前全局搜索不得读取文件正文、生成 signed URL 或输出 Storage path。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认公开 Project / Publication 详情页只展示显式 public 且关联当前 public 资产的文件附件；Knowledge / Skill 当前不要求展示附件。
- 确认公开页面不展示 private / unlisted 文件、Storage 路径、Storage bucket、signed URL、raw link rows 或 relation note。
- 确认未配置或未执行 `0018_document_collections_and_folder_uploads.sql` 的环境会清晰失败或降级，不假装上传成功。
- 真实上传验收需要用户本人登录管理员账号，并确认目标 Supabase 环境已执行 0003、0018 和 0020。
- metadata 编辑验收需要确认 0018 已执行；多关联添加 / 移除验收需要确认 0020 已执行。
- 批量添加、移除和清空关联验收需要确认 0020 已执行。
- RelatedDocumentsPanel 分组和关联 chips 展示验收需要确认 0018 与 0020 已执行，并确认当前查询返回文档包、文件和专用关联记录。
- 文档包整体关联同步验收需要确认 0018 与 0020 已执行，并验证文档包和包内文件的专用关联与 legacy primary relation 按预期更新或清空。
- 批量删除文件和删除整个文档包及文件验收不需要新增 migration；确认 0018 已执行，并验证 Storage object 与数据库记录按确认操作清理。
- zip 下载验收不需要新增 migration；确认 0018 已执行，并验证选中文件 zip、文档包 zip、超限拒绝和空文档包错误。
- 全局搜索验收不需要新增 migration；确认 `/dashboard/search` 只查 metadata，短关键词不查询，`type` 筛选保留当前 `q`，每类数量统计和关键词高亮可见，结果能跳转后台详情页。
- 不新增公开下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行能力。

## Project Research Hub Workflow

日期：2026-06-13

类型：workflow

用途：

- 维护 Phase 2Q-A-1 的 Project 后台详情页研究中枢，围绕单个研究项目整理研究框架、私密附件、相关知识笔记、学术成果和搜索入口。

步骤：

1. 进入 `/dashboard/projects/[id]` 查看单个研究项目。
2. 先核对项目标题、状态、可见性、标签、更新时间和进度。
3. 在“项目概览”“研究问题”“研究背景”“研究方法”中确认研究框架是否完整。
4. 需要修改项目本身时使用页面保留的“编辑项目”入口。
5. 需要删除项目时继续使用页面保留的删除按钮，并遵守既有删除保护。
6. 需要管理项目附件时优先使用页面内 RelatedDocumentsPanel，理解文档包、独立文件和跨文档包文件分组。
7. 需要上传项目文件时使用“上传项目文件”，由统一 `/dashboard/documents/upload` 通过 query params 预填 `related_type=project` 和当前 `related_id`。
8. 需要上传项目文件夹或资料包时使用“上传项目文件夹”，继续复用 Documents 文件夹上传和文档包流程。
9. 需要查看项目全部附件时使用“查看项目 Documents”，进入带当前 Project 关联筛选的 Documents 列表。
10. 相关知识笔记继续读取 `knowledge_notes.project_id` 显式关系；没有关联时不推断内容关系。
11. 相关学术成果继续读取 `publications.project_id` 显式关系；没有关联时不推断内容关系。
12. 需要维护 Project 与 Knowledge / Skill / Publication / Project 的直接关系时，使用“显式关联资产”区域。
13. 需要查找尚未确认的相关资产时，仍可使用项目标题或标签进入 `/dashboard/search`。
14. Project 研究中枢不得读取附件正文、解析文件、生成 signed URL 或显示 Storage path；公开附件只通过 public Project 详情页的安全 route 展示显式 public 文件。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/projects/[id]` 保留返回、编辑和删除入口。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认相关资产继续展示通过 `project_id` 显式关联的知识笔记和学术成果，显式关联资产区域可展示 outbound 与 backlink，搜索入口仍可用。
- 确认公开 Project 页面不展示后台研究中枢、private 附件、Storage 路径或 signed URL；执行 0021 后，如有符合条件的 public 附件，只显示安全摘要和 `/public-files/[id]/download`。

## Knowledge Node Workflow

日期：2026-06-13

类型：workflow

用途：

- 维护 Phase 2Q-A-2 的 Knowledge 后台详情页知识节点，围绕单个知识笔记整理摘要、正文、关联 Project、私密资料、同项目成果和搜索入口。

步骤：

1. 在 `/dashboard/knowledge/new` 创建 Knowledge Note，必要时选择关联 Project。
2. 进入 `/dashboard/knowledge/[id]` 查看单个知识节点。
3. 先核对知识标题、分类、可见性、标签、创建时间和更新时间。
4. 在“知识概览”中确认摘要、分类、关联 Project 和更新时间是否完整。
5. 在“知识正文”中查看正文内容；空正文显示友好空状态。
6. 需要修改知识本身时使用“编辑知识节点”入口，不在详情页新增富文本编辑能力。
7. 需要管理知识资料时使用页面内 RelatedDocumentsPanel，继续按文档包、独立文件和跨文档包文件理解附件关系。
8. 需要上传单个知识资料时使用“上传知识资料”，由统一 `/dashboard/documents/upload` 通过 query params 预填 `related_type=knowledge` 和当前 `related_id`。
9. 需要上传知识资料文件夹时使用“上传知识资料文件夹”，继续复用 Documents 文件夹上传和文档包流程。
10. 需要查看该知识节点全部附件时使用“查看相关 Documents”，进入带当前 Knowledge 关联筛选的 Documents 列表。
11. 关联 Project 只读取 `knowledge_notes.project_id`；没有关联时不推断 Project，改用 Project 搜索入口。
12. 相关成果优先使用关联 Project 下的 `publications.project_id` 同项目成果；没有关联 Project 时不伪造成果关系。
13. 需要维护 Knowledge 与 Project / Skill / Publication / Knowledge 的直接关系时，使用“显式关联资产”区域。
14. 需要查找尚未确认的相关资产时，仍可使用知识标题或标签进入 `/dashboard/search`。
15. Knowledge 节点不得读取附件正文、解析文件、生成 signed URL、显示 Storage path 或开放公开附件入口。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/knowledge/[id]` 保留返回、编辑和删除入口。
- 确认摘要、正文、分类、标签、可见性、关联 Project 和 metadata 展示正常，空字段有友好空状态。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认相关成果继续展示同项目 Publications，显式关联资产区域可展示 outbound 与 backlink，搜索入口仍可用。
- 确认公开 Knowledge 页面不展示后台知识节点、附件下载、Storage 路径或 signed URL。

## Skill Capability Package Workflow

日期：2026-06-13

类型：workflow

用途：

- 维护 Phase 2Q-A-3 的 Skill 后台详情页能力包 / 工作流包，围绕单个 Skill 整理用途、平台、版本、使用说明、私密资料和相关资产搜索入口。

步骤：

1. 在 `/dashboard/skills/new` 创建 Skill，填写名称、分类、平台、状态、当前版本和说明。
2. 进入 `/dashboard/skills/[id]` 查看单个能力包 / 工作流包。
3. 先核对 Skill 名称、分类、平台、状态、当前版本、可见性和更新时间。
4. 在“能力包概览”中确认用途说明、平台、状态、版本和公开边界是否完整。
5. 在“使用说明 / 工作流内容”中查看 `content`；空正文显示“尚未填写 Skill 使用说明。”
6. 继续查看输入说明、输出说明、使用指南和 `SKILL.md`；这些字段只展示现有文本，不新增富文本编辑器。
7. 需要修改 Skill 本身时使用“编辑 Skill”入口，不在详情页新增复杂 workflow。
8. 需要记录版本时使用现有新增版本记录表单，只写入 `skill_versions`。
9. 需要管理 Skill 资料时使用页面内 RelatedDocumentsPanel，继续按文档包、独立文件和跨文档包文件理解附件关系。
10. 需要上传单个 Skill 资料时使用“上传 Skill 资料”，由统一 `/dashboard/documents/upload` 通过 query params 预填 `related_type=skill` 和当前 `related_id`。
11. 需要上传 Skill 资料文件夹或能力包时使用“上传 Skill 资料文件夹”，继续复用 Documents 文件夹上传和 `skill_package` 文档包流程。
12. Skill package、代码包和压缩包只作为私密资料管理，不在站内安装、解析或执行。
13. 需要查看该 Skill 全部附件时使用“查看相关 Documents”，进入带当前 Skill 关联筛选的 Documents 列表。
14. 需要维护 Skill 与 Project / Knowledge / Publication / Skill 的直接关系时，使用“显式关联资产”区域。
15. 需要查找尚未确认的相关资产时，仍可使用 Skill 名称或 platform 进入 `/dashboard/search`。
16. Skill 能力包不得读取附件正文、解析文件、生成 signed URL、显示 Storage path 或开放公开附件入口。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/skills/[id]` 保留返回、编辑、删除和新增版本记录入口。
- 确认用途说明、平台、状态、版本、可见性、输入输出说明、使用指南、`SKILL.md` 和 metadata 展示正常，空字段有友好空状态。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认显式关联资产区域可展示 Project / Knowledge / Publication / Skill 的 outbound 与 backlink，搜索入口仍可用且不伪造未确认关系。
- 确认公开 Skill 页面不展示后台能力包、附件下载、Storage 路径或 signed URL。

## Publication Output Hub Workflow

日期：2026-06-13

类型：workflow

用途：

- 维护 Phase 2Q-A-4 的 Publication 后台详情页成果中枢，围绕单个成果整理 summary、abstract、关联 Project、私密材料、同项目 Knowledge 和相关资产搜索入口。

步骤：

1. 在 `/dashboard/publications/new` 创建 Publication，必要时选择关联 Project。
2. 进入 `/dashboard/publications/[id]` 查看单个成果中枢。
3. 先核对成果标题、类型、可见性、标签、发表日期和更新时间。
4. 在“成果概览”中确认 summary、成果类型、关联 Project、可见性、标签和更新时间是否完整。
5. 在“成果摘要 / Summary”和“Abstract”中查看成果说明；空字段显示友好空状态。
6. 需要修改成果本身时使用“编辑成果”入口，不在详情页新增富文本编辑能力。
7. 需要管理成果材料时使用页面内 RelatedDocumentsPanel，继续按文档包、独立文件和跨文档包文件理解附件关系。
8. 需要上传单个成果材料时使用“上传成果材料”，由统一 `/dashboard/documents/upload` 通过 query params 预填 `related_type=publication` 和当前 `related_id`。
9. 需要上传成果材料文件夹时使用“上传成果材料文件夹”，继续复用 Documents 文件夹上传和文档包流程。
10. 需要查看该成果全部附件时使用“查看相关 Documents”，进入带当前 Publication 关联筛选的 Documents 列表。
11. 关联 Project 只读取 `publications.project_id`；没有关联时不推断 Project，改用 Project 搜索入口。
12. 同项目 Knowledge 只读取关联 Project 下的 `knowledge_notes.project_id`；没有关联 Project 时不伪造 Knowledge 关系。
13. 需要维护 Publication 与 Project / Knowledge / Skill / Publication 的直接关系时，使用“显式关联资产”区域。
14. 需要查找尚未确认的相关资产时，仍可使用成果标题或标签进入 `/dashboard/search`。
15. `file_path` 不展示、不作为下载入口；`cover_url` 仅作为后台 metadata 状态展示。
16. Publication 成果中枢不得读取附件正文、解析文件、生成 signed URL 或显示 Storage path；公开附件只通过 public Publication 详情页的安全 route 展示显式 public 文件。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/publications/[id]` 保留返回、编辑和删除入口。
- 确认 summary、abstract、成果类型、标签、可见性、关联 Project 和 metadata 展示正常，空字段有友好空状态。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认同项目 Knowledge 继续通过现有 `project_id` 展示，显式关联资产区域可展示 outbound 与 backlink，搜索入口仍可用。
- 确认公开 Publication 页面不展示后台成果中枢、private 附件、Storage 路径、signed URL 或 `file_path`；执行 0021 后，如有符合条件的 public 附件，只显示安全摘要和 `/public-files/[id]/download`。

## Research Asset Links Workflow

日期：2026-06-13

类型：workflow

用途：

- 维护 Phase 2Q-B-1 / 2Q-B-2 / 2Q-B-4 的研究资产显式关系底座，在 Project / Knowledge / Skill / Publication 之间记录管理员手动确认的关系，并通过单个资产详情页的筛选、编辑、outbound 和 backlink 日常整理关系。

步骤：

1. 进入任意后台资产详情页：`/dashboard/projects/[id]`、`/dashboard/knowledge/[id]`、`/dashboard/skills/[id]` 或 `/dashboard/publications/[id]`。
2. 在“显式关联资产”区域选择目标类型和目标资产。
3. 如目标较多，先在“筛选目标资产”输入关键词；筛选只匹配已加载目标资产的标题和 metadata，不读取文件正文或 Storage。
4. 使用 relation_type 表达关系语义：`related` 表示相关，`supports` 表示支持，`references` 表示引用，`uses` 表示使用，`produces` 表示产出，`derived_from` 表示来源于。
5. 如有必要填写备注，说明这条关系的具体上下文。
6. 保存后，当前资产会在“当前资产关联出去”中看到该关系。
7. 打开目标资产详情页，可在“反向关系”中看到来源资产。
8. 查看关系较多的资产时，使用方向、对方资产类型和 relation_type 筛选器聚焦 outbound、backlink 或某类关系。
9. 需要修正关系语义或说明时，展开“编辑关系”，只更新 relation_type 或 note。
10. 如果 source / target 选错，删除该关系后重新创建；不要通过编辑流程更换关系两端。
11. 后台不再提供独立全局关系页面；需要理解某个资产的关系时，回到该 Project / Knowledge / Skill / Publication 详情页查看 outbound 和 backlink。
12. 从 AssetLinksPanel 中的对方资产链接进入对应详情页，再继续维护 create / edit / delete。
13. 需要移除关系时，在任一显示该关系的详情页使用“删除关系”。
14. Documents 仍通过 RelatedDocumentsPanel、Documents 列表和文档包详情页管理，不通过 `research_asset_links` 管理。
15. 现有 `knowledge_notes.project_id` 与 `publications.project_id` 继续保留，不迁移、不删除、不自动转换。
16. 未确认关系时先用 `/dashboard/search` 查找候选资产，不用 AI 或推断自动建立关系。

验证要求：

- 确认目标 Supabase 环境已执行 `0019_research_asset_links.sql`。
- 确认非管理员无法读取或写入 `research_asset_links`。
- 确认管理员可以创建 Project -> Knowledge、Skill -> Project、Publication -> Knowledge 等关系。
- 确认目标页面出现 backlink。
- 确认目标资产搜索可按中文标题或 metadata 过滤候选项。
- 确认方向、对方资产类型和 relation_type 筛选不会触发公开页面变化。
- 确认“编辑关系”只修改 relation_type 和 note，source / target 保持不变。
- 确认后台侧边栏和 AssetLinksPanel 不再提供独立全局关系页面入口。
- 确认访问已移除的全局关系页面时不再显示旧模块。
- 确认自关联会被拒绝，重复关系会显示友好错误。
- 确认删除关系后双方详情页都不再显示该关系。
- 确认公开页面不展示显式关系，不展示 Storage path、signed URL 或 secret。
