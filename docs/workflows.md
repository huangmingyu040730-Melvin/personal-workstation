# Workflows

## Weekly Review And Project Checkpoint

日期：2026-09-02

类型：workflow

用途：

- 每周查看工作站资产健康，处理长期未更新或尚未沉淀的项目，并把阶段结论保存为关联 Knowledge。

步骤：

1. 在管理员 Dashboard 查看“资产健康与本周复盘”，或运行 `workstation-cli review --period week`；需要脚本消费时加 `--json`。
2. 先处理 high，再处理 medium / low。提醒只表示达到阈值，不自动判断内容质量，也不自动修改任何记录。
3. 对“活跃项目尚无关联知识笔记”的条目，点击提醒或进入 Project 详情页使用“记录阶段结论”。
4. 确认已预选正确 Project；按实际用途选择项目阶段结论、课程学习笔记或量化研究记录模板。
5. 填写真实证据、决定、问题和下一步，检查 slug、分类、标签和关联 Project。
6. 保持 private，除非管理员另行完成公开内容审查并明确决定公开；模板本身不会自动保存或公开。
7. 点击保存后回到 Project 或下一次周报确认知识沉淀指标已更新。

验证要求：

- API / CLI 只允许 `period=week`，无 token 返回 401，非法 period 返回 400，并带 requestId。
- 周报查询字段不得包含 Knowledge content、Resume 内容、JD 原文 / notes、Documents 内容或 Storage 信息。
- Dashboard、API 和 CLI 的 totals、thisWeek、health 和 attention 来自同一聚合实现。
- Knowledge 模板必须可编辑、仅预填、默认 private，并只接受真实存在的 Project id 作为预选项。

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

## Retired External Access Workflow

日期：2026-06-16

类型：workflow

用途：

- 记录 Phase 2R-Z 对旧访问申请、Access Grants、Viewer magic link 和 restricted 外部授权流程的退役规则。

规则：

1. 不再新增、修复或恢复 `/access-request`、`/viewer/login`、`/viewer/callback`、`/dashboard/access-requests` 或 `/dashboard/access-grants`。
2. 不再创建访问申请、访问授权、viewer session、邮件邀请或自动审批流程。
3. 不再把 `restricted` 作为后台 visibility 选项；历史 `restricted` 内容由 0022 迁移回写为 `private`。
4. 公开详情页和 fallback 不显示申请访问或 viewer 登录入口，不确认未公开内容是否存在。
5. 0022 迁移用于收紧四类内容表 visibility / public read policy，并删除旧 `access_requests`、`content_access_grants`、`has_content_access()` 和 `can_request_viewer_login()`。
6. Documents、Storage policy、public file download route、管理员后台核心 CRUD 和 `research_asset_links` 不随本退役流程改变。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 本地服务启动后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 确认 sitemap 不包含 `/access-request`、`/viewer` 或 `/public-files`。
- 确认 robots 阻止 `/dashboard`、`/api`、`/viewer`、`/login`、`/access-request` 和 `/public-files`。

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
6. 首页下方继续分区展示研究方向、公开 Project / Publication、Knowledge 预览和 Skill 预览；Knowledge / Skill 首页预览使用紧凑卡片，最多展示 4 条 public 内容。
7. 四个公开列表页 `/projects`、`/publications`、`/knowledge`、`/skills` 使用统一 listing header、公开统计、轻量筛选、公开卡片和友好空状态；筛选只基于已有 public 字段和 URL query params。
8. 四个公开详情页 `/projects/[slug]`、`/publications/[slug]`、`/knowledge/[slug]`、`/skills/[slug]` 使用统一 detail hero、主内容 section、侧栏 metadata、标签和 related public content。
9. 公开详情页只读取 public 详情查询；private / unlisted / 历史 restricted 内容不输出正文或附件，只显示“内容不存在或未公开”的安全 fallback。
10. 公开导航只面向普通访客，保留首页、研究项目、学术成果、知识库、Skill 库和轻量“管理员登录”，不放后台菜单、文件中心、访问申请或全局关系图谱入口。
11. “管理员登录”只链接到登录流程；未登录访客不能直接进入后台，已登录管理员沿用现有 `/login?next=/dashboard` / dashboard 逻辑。
12. 公开列表和详情页只展示 public 内容；private、unlisted 和历史 restricted 内容不进入公开展示。
13. 需要公开少量附件时，管理员先在文件详情页或文件中心批量工具把文件显式设为 public，并确认文件关联到当前 public Project / Publication；未显式 public 的文件仍只在后台 Documents、RelatedDocumentsPanel 或文档包详情页处理。
14. 公开 Project / Publication 详情页只展示安全附件摘要和 `/public-files/[id]/download` 入口；下载 route 服务端复核文件 public、当前资产 public 和关联存在后，才生成 60 秒短时 signed URL。
15. Knowledge / Skill 公开详情页不展示 Documents；Skill 页面只是公开说明页，不展示 Skill package、私密附件，不执行、不安装、不解析 Skill 文件。
16. Documents raw 多资产关联、relation note、Storage path、Storage bucket、owner_id、显式资产关系和后台搜索只用于管理员整理，不在公开页面展示。
17. 外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权已退役，不再通过公开页面处理未公开材料请求。
18. Publication 公开页面不得展示历史 `file_path`、Storage 路径、Storage bucket、signed URL 或 raw 附件关系。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认首页首屏 H1 为“个人研究工作站”，左侧定位 / 标签 / CTA 与右侧统计卡片清晰，CTA 能进入研究项目、学术成果、Skill 库和公开 About。
- 确认 hero 背景有克制的金融 / 量化 / 研究抽象元素，H1 字体更专业，并且 390px 宽度下不遮挡文字、不横向溢出。
- 确认 Knowledge / Skill 首页预览更紧凑，并且只展示 public 查询返回的内容。
- 确认 `/projects`、`/publications`、`/knowledge`、`/skills` 是统一公开内容索引体验，筛选可用、空状态友好、移动端不横向溢出。
- 确认 `/projects/[slug]`、`/publications/[slug]`、`/knowledge/[slug]`、`/skills/[slug]` 是统一公开详情体验，主内容和侧栏在 390px 宽度下正确堆叠。
- 确认公开导航显示“管理员登录”，但不显示后台菜单、文件中心、关系图谱或 Documents 入口。
- 确认 private / unlisted / 历史 restricted 内容不会出现在公开列表、公开首页或 sitemap。
- 确认公开 Project / Publication 页面只展示符合条件的 public 附件；公开 Knowledge / Skill 不展示 Documents 或 Skill 私密包。
- 确认公开页面不展示 private / unlisted 文件、Storage path、Storage bucket、signed URL、`file_path`、raw `document_asset_links`、relation note 或 `research_asset_links` 管理功能。
- 本流程不新增 migration，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或后台显式关系管理，不引入字体文件、外部字体服务、图表库、动画库、外部搜索服务或向量库。

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
5. 未公开或不存在 slug 的详情页 metadata 保持 noindex，不确认 private、unlisted 或历史 restricted 内容是否真实存在。
7. OG / Twitter 图片复用公开安全图片，不生成包含私密字段、文件路径或后台数据的动态图片。
8. sitemap 只包含 `/`、`/about`、`/projects`、`/publications`、`/knowledge`、`/skills` 和 public Project / Publication / Knowledge / Skill 详情。
9. sitemap 查询 public 内容失败时安全降级为基础公开静态页面，不返回 500。
10. sitemap 不包含 dashboard、login、access-request、viewer、public file download route、signed URL、Storage path、private Documents、unlisted / private / 历史 restricted 内容或后台关系页面。
11. robots 允许公开页面；阻止 dashboard、login、access-request、viewer、api、documents、public-files、admin、storage 和 signed 等路径。
12. robots 和 sitemap 不作为安全边界；公开权限仍由 public 查询、Supabase RLS、Storage policy 和 server-side download route 校验。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 打开 `/sitemap.xml`，确认包含基础公开入口和 public 详情链接，不包含 `/dashboard`、`/login`、`/viewer`、`/public-files`、signed URL 或 Storage path。
- 打开 `/robots.txt`，确认公开页面可索引，dashboard / API / viewer / public-files 等路径被 disallow。
- 检查首页、四个列表页和四类详情页的 `<title>`、canonical、OG/Twitter metadata；确认不重复站点名、不包含 query 上下文或私密字段。
- 在 390px 宽度下抽查首页、一个列表页和一个详情页无横向溢出。

## Public Launch QA And Hardening Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-C-2 / 2R-Z 后的公开发布前 QA，确认公开主链路、SEO、fallback、公开附件边界和移动端展示可以安全发布。

步骤：

1. 从最新 `main` 开始，确认本轮不修改 Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。
2. 启动本地服务；如只做 mock fallback 巡检，可使用占位 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 让公开页安全降级。
3. 运行 `npm run smoke:public`；如服务不在默认端口，设置 `PUBLIC_SMOKE_BASE_URL`。
4. 确认 smoke 覆盖 `/`、四类公开列表页、四类 fallback、`/sitemap.xml` 和 `/robots.txt`。
5. 确认未公开 fallback 保持 noindex，不提供访问申请或 viewer 登录入口，不确认内容是否真实存在。
6. 确认 sitemap 只包含公开静态入口和 public 详情，不包含 `/dashboard`、`/api`、`/viewer`、`/login`、`/access-request`、`/public-files`、signed URL、Storage path 或非 public 内容。
7. 确认 robots 允许公开页面，并 disallow `/dashboard`、`/api`、`/viewer`、`/login`、`/access-request`、`/public-files`。
8. 用浏览器在 390px 宽度抽查首页、四类列表页、四类详情或 fallback，确认无横向溢出，长标题和长文件 metadata 不挤出屏幕。
10. 如果公开文案出现面向内部实现的 Storage / signed URL 术语，应改为访客可理解的边界说明；安全规则仍保留在代码和文档中。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 运行 `git diff --check`。
- 运行 `npm run smoke:public`。
- 浏览器 390px 冒烟确认公开主链路无横向溢出。
- 确认没有修改 Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。

## Public Content Operations Workflow

日期：2026-06-14

类型：workflow

用途：

- 维护 Phase 2R-D-1 的公开内容运营基础，用后台 public readiness checklist 判断 Project / Publication / Knowledge / Skill 是否适合设为 public。

步骤：

1. 进入对应后台详情页：Project `/dashboard/projects/[id]`、Publication `/dashboard/publications/[id]`、Knowledge `/dashboard/knowledge/[id]`、Skill `/dashboard/skills/[id]`。
2. 查看右侧“公开发布准备度” checklist，确认 visibility、slug、标题 / 名称、摘要 / description / excerpt、标签 / 分类和正文 / 说明。
3. Project 重点复核研究问题、背景、方法、进度、相关 Publication / Knowledge / Skill，以及是否需要公开附件。
4. Publication 重点复核成果类型、摘要、abstract、日期、关联 Project，以及是否需要公开论文、报告或补充材料。
5. Knowledge 重点复核分类、摘要、正文和关联 Project；公开页不展示 Documents。
6. Skill 重点复核使用说明、适用场景和公开说明页边界；Skill package 不展示、不下载、不执行、不安装、不解析。
7. 如 Project / Publication 需要公开附件，先确认文件 `visibility = public` 且关联到当前 public 资产；公开下载仍只走 `/public-files/[id]/download`。
8. 人工复核 public 字段，不写入 private / unlisted / 历史 restricted 内容、Storage path、signed URL、`file_path`、owner_id、raw link rows、内部备注或 secret。
9. readiness checklist 只作为运营提示；不得把它改成保存阻塞、自动公开、自动审批或权限授予流程。
10. 需要发布前回归时，继续运行 `npm run lint`、`npm run build`、`git diff --check` 和运行中站点的 `npm run smoke:public`。

验证要求：

- 确认四类后台详情页能显示 public readiness checklist。
- 确认 checklist 不阻止保存，不自动修改 visibility，不自动公开附件。
- 确认没有新增数据库字段，没有修改 Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。
- 确认公开页面仍只展示 public 内容；Knowledge / Skill 公开详情仍不展示 Documents。

## Public About Profile Workflow

日期：2026-06-15

类型：workflow

用途：

- 维护 Phase 2R-F-1 的公开个人简介页，让 `/about` 作为个人研究主页、作品集入口和公开研究工作站说明页。

步骤：

1. 打开 `/about`，确认 Hero 展示姓名 / 站点身份、简短定位、公开简介和 Projects / Publications / 首页 CTA。
2. 确认 Research Focus、Workstation Explanation、Skills / Tools、Public Content Navigation 和 Contact / Links 区块展示正常。
3. Contact / Links 只展示公开 Profile 字段；不要硬编码私人邮箱、Auth UUID、Supabase 配置或私密联系方式。
4. 确认 About 页面没有访问申请、Viewer login、Access Grants 或 restricted 外部授权入口。
5. 确认公开内容导航可进入 `/projects`、`/publications`、`/knowledge` 和 `/skills`。
6. 确认 `/about` 在 sitemap 中，且 `/access-request`、`/viewer` 和 `/public-files` 不在 sitemap 中。
7. 确认 robots 继续阻止 dashboard、api、viewer、access-request、public-files 等敏感路径。
8. 确认 390px 移动端无横向溢出。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 在本地运行中站点执行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 确认公开页面 HTML 不出现 signed URL、Storage path、`file_path`、owner_id、raw document links 或后台关系管理数据。

## v1.0 Final QA Workflow

日期：2026-06-15

类型：workflow

用途：

- 在 v1.0 发布前执行最终 QA、release notes 复核和安全边界确认。

前提：

1. PR #115 已关闭且不合并。
2. 首页保持当前 `main` 主结构。
3. 不继续推进 Phase 2R-F-2 homepage featured content polish。

公开页面检查：

1. 打开 `/`、`/about`、`/projects`、`/publications`、`/knowledge` 和 `/skills`。
2. 从 sitemap 或公开列表中抽查一个 public Project、Publication、Knowledge 和 Skill 详情页。
3. 打开一个不存在或非 public slug fallback。
4. 确认公开页没有访问申请入口、viewer login、Access Grants、restricted 授权文案、Documents 私密信息、signed URL、Storage path、`storage_path`、`file_path`、`owner_id` 或 raw document links。
5. 确认 Knowledge / Skill 公开详情页不展示 Documents；Skill package 不展示、不下载、不执行、不安装、不解析。

后台页面检查：

1. 登录管理员后台后打开 `/dashboard`、`/dashboard/projects`、`/dashboard/publications`、`/dashboard/knowledge`、`/dashboard/skills`、`/dashboard/documents`、`/dashboard/profile`、`/dashboard/calendar` 和 `/dashboard/career`。
2. 确认无 Access Requests、Access Grants 或 Viewer 管理入口。
3. 确认 Documents 文件中心正常。
4. 确认 Project / Publication / Knowledge / Skill 后台列表与详情正常。
5. 确认四类后台详情页 public readiness checklist 正常显示，且只提示、不阻止保存、不自动公开内容或附件。

退役路由检查：

- `/access-request`
- `/viewer/login`
- `/viewer/callback`
- `/dashboard/access-requests`
- `/dashboard/access-grants`

以上路由应不存在、404、重定向登录或以其他安全方式不可用；不得恢复为产品入口。

sitemap / robots 检查：

1. sitemap 应包含 `/`、`/about`、`/projects`、`/publications`、`/knowledge`、`/skills` 和 public 详情页。
2. sitemap 不得包含 `/access-request`、`/viewer`、`/dashboard`、`/api`、`/public-files`、private / unlisted 内容、signed URL 或 Storage path。
3. robots 应阻止 `/dashboard`、`/api`、`/viewer`、`/access-request`、`/public-files`、`/login`、`/storage` 和 `/signed`。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 启动本地服务后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 运行 `git diff --check`。
- 暂存后运行 `git diff --cached --check`。
- 如果项目未来新增 `typecheck` script，也运行 `npm run typecheck`。

边界：

- 本流程不新增功能、不新增 migration、不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 `/public-files/[id]/download`。
- 本流程不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

## v1.0 Maintenance Workflow

日期：2026-06-15

类型：workflow

用途：

- 在 v1.0 稳定维护阶段，按 `docs/maintenance-playbook.md` 维护公开内容、Documents、public attachment、安全检查和部署验收。

原则：

1. 后续优先补真实内容，不继续扩复杂功能。
2. 暂时跳过 public content sprint。
3. 新内容由管理员在后台逐步手动补充。
4. 不大改首页、About、公开列表 / 详情或后台主结构。
5. 不恢复 access request、viewer、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

日常内容维护：

1. 新建 Project / Publication / Knowledge / Skill 时先设为 private。
2. 补齐标题、slug、摘要、标签、正文或说明。
3. 检查 public readiness checklist。
4. 人工确认没有敏感信息后再设为 public。
5. 打开对应公开页面和 `/sitemap.xml` 确认展示与收录。
6. 启动本地服务后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。

public attachment 维护：

1. 文件通过 Documents 上传，默认 private。
2. 文件关联到 Project / Publication 后，再人工判断是否适合公开。
3. 只有适合公开的文件才设为 public。
4. 公开展示仅限 public Project / Publication 页面。
5. 下载必须走 `/public-files/[id]/download`。
6. Knowledge / Skill 不展示 Documents。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 启动本地服务后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 运行 `git diff --check`。
- 暂存后运行 `git diff --cached --check`。
- 当前没有独立 `typecheck` script；如果未来新增，也运行 `npm run typecheck`。

边界：

- 本流程不新增 migration、数据库字段、RLS、Storage policy、public zip、AI 摘要、OCR、向量搜索、全文搜索、PDF 在线预览、支付或外部授权。
- 本流程不修改 Documents 上传 / 删除 / zip 下载或 `/public-files/[id]/download`。

## v1.1 Final QA Docs Sync Workflow

日期：2026-06-16

类型：workflow

用途：

- 在 v1.1 polish 收尾阶段，同步 release notes、当前状态、记忆、路线图和维护 checklist。

步骤：

1. 从最新 `main` 创建独立分支。
2. 确认本轮只做文档、QA checklist 和 release notes，不修改业务代码。
3. 新增或更新 `docs/v1-1-release-notes.md`，记录 v1.1 是 Personal Asset Intranet polish，不是功能扩张。
4. 同步 README、`docs/current-status.md`、`docs/memory.md`、`docs/roadmap.md` 和 `docs/maintenance-playbook.md`。
5. 如需解释旧历史条目，更新 `docs/decisions.md`，明确 Market Brief、Access Grants、Viewer、restricted、Agent CEO 或自动化扩张相关旧记录只是历史或已退役 / 已暂停语境。
6. 运行 stale reference 搜索，覆盖 Agent CEO、CEO Workbench、自动化中心、任务中心、Market Brief、access request、viewer login、Access Grants、restricted、`/automations`、`/settings`、`/access-request`、`/viewer/login`、`/viewer/callback`、`/dashboard/access-requests` 和 `/dashboard/access-grants`。
7. 对搜索结果分类：当前功能 / 推荐路线 / 导航入口需要修正文案；历史、退役、暂停、不恢复语境可以保留。
8. 确认 diff 不包含数据库、migration、RLS、Storage policy、bucket visibility、Documents 文件读取或 `/public-files/[id]/download` 改动。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 启动本地服务后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 运行 `git diff --check`。
- 暂存后运行 `git diff --cached --check`。
- 复跑 stale reference 搜索并在 PR 中说明结果。

边界：

- 不新增数据库表、migration、RLS、Storage policy 或 bucket visibility 修改。
- 不读取 Documents 文件正文，不读取 Storage object，不生成新的公开 signed URL 能力。
- 不新增 AI 搜索、OCR、向量搜索、Documents 问答、公开 AI 或访客 AI。
- 不新增 Agent CEO 页面、自动化中心、任务中心、复盘中心、Notion / 飞书 / Gmail 集成。
- 不恢复 Market Brief、Access Request、Viewer login/callback、Access Grants、restricted 外部访问、sidebar 假入口或 topbar 占位按钮。

## AI Draft Form Copilot Workflow

日期：2026-06-16

类型：workflow

用途：

- 在 Project / Publication / Knowledge / Skill 新建与编辑表单中，用 AI 根据当前浏览器草稿补全、优化或检查研究资产字段。

步骤：

1. 打开对应后台新建或编辑表单：Project、Publication、Knowledge 或 Skill。
2. 先填写已有草稿字段，例如标题、简介、摘要、正文、输入 / 输出说明、标签、状态或可见性。
3. 在 AI 草稿助手中选择生成模式：补全空字段、优化已有内容或公开风险检查。
4. 点击当前模式对应按钮，例如“生成补全建议”“生成优化建议”或“检查公开风险”。
5. Server Action 校验当前用户是管理员。
6. Server Action 只接收 `mode` 和当前模块表单白名单字段，不接受任意 prompt。
7. AI 返回当前模块的结构化 JSON 建议，包括可写回字段、公开准备度、敏感风险和下一步建议。
8. 管理员人工复核后，可以复制建议，或采用到浏览器表单字段。
9. 采用建议只更新当前浏览器表单，不提交表单。
10. 确认内容安全后，管理员手动点击保存。

生成模式：

- `complete_missing` / 补全空字段：默认模式，适合新建或草稿不完整时补齐缺口。
- `improve_existing` / 优化已有内容：保留原意，优化语言、结构和清晰度，不新增未经提供的事实。
- `public_safety_check` / 公开风险检查：优先检查公开准备度、敏感信息风险和整改建议；正文草稿字段可以为空。

输入白名单：

Project：

- `title`、`summary`、`background`、`research_question`、`methodology`
- `tags`、`status`、`visibility`、`milestones`
- `progress`、`start_date`、`end_date`

Publication：

- `title`、`publication_type`、`summary`、`abstract`
- `tags`、`visibility`、`published_on`、`project_id`

Knowledge：

- `title`、`category`、`excerpt`、`content`
- `tags`、`visibility`、`project_id`

Skill：

- `name`、`description`、`category`、`content`
- `input_description`、`output_description`、`usage_guide`
- `platforms`、`current_version`、`visibility`、`status`

可采用字段：

- Project：summary、background、research_question、methodology、tags、milestones。
- Publication：title、summary、abstract、tags。
- Knowledge：title、excerpt、content、tags、category。category 仅在建议值能匹配当前 select option 时写回。
- Skill：name、description、content、input_description、output_description、usage_guide、platforms、current_version。platforms 只写回当前表单已有 checkbox 平台。

验证要求：

- 未配置 AI API key 时，Project / Publication / Knowledge / Skill 新建与编辑表单不崩溃，AI 按钮禁用并提示尚未配置。
- 配置 AI API key 后，AI 建议能基于当前草稿生成。
- 三种生成模式均可在四类表单助手中显示；切换模式不修改当前表单。
- 公开风险检查模式应优先展示公开准备度、敏感风险和下一步完善建议。
- 采用建议不会自动保存数据库。
- AI 不会自动修改 `visibility`。
- 公开页面没有 AI 按钮或 AI 输出。
- 运行 `npm run lint`。
- 运行 `npm run build`。
- 启动本地服务后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。
- 运行 `git diff --check`；暂存后运行 `git diff --cached --check`。

边界：

- 不自动保存数据库，不自动创建 Project / Publication / Knowledge / Skill，不自动公开内容。
- 不读取 Documents、Storage object、Skill package、uploaded code、zip 内容、Storage path、file path、owner_id、raw relation rows、private file metadata 或 signed URL。
- 不修改 Documents 上传 / 删除 / zip 下载或 `/public-files/[id]/download`。
- 不新增 migration，不修改 RLS 或 Storage policy。
- 不恢复 access request、viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

## AI Raw Note Draft Lab Workflow

日期：2026-06-16

类型：workflow

用途：

- 在独立后台页面 `/dashboard/ai-drafts` 中，把原始想法、研究笔记、会议摘录或粗糙文本转换为 Project / Publication / Knowledge / Skill 结构化草稿。

步骤：

1. 打开 `/dashboard/ai-drafts`。
2. 选择目标草稿类型：Project、Publication、Knowledge 或 Skill。
3. 粘贴原始文本；不要粘贴客户敏感信息、API key、runner secret、Supabase service role key、未脱敏内部资料、Storage path、signed URL 或私密文件正文。
4. 点击“生成结构化草稿”。
5. Server Action 校验当前用户是管理员。
6. Server Action 只接收 `targetType` 和 `rawText`，不接受任意 prompt。
7. AI 返回目标类型对应的结构化 JSON 草稿。
8. 管理员人工复核后，可以复制单个字段、复制完整 Markdown，或点击“带入新建表单”。
9. 点击“带入新建表单”时，页面把当前草稿保存到当前浏览器 `sessionStorage` 并跳转到对应新建页。
10. 新建页显示“检测到 AI 草稿”提示条；提示条说明这是 AI Draft Lab 带入的浏览器临时草稿，管理员点击“填入表单”后才写入浏览器字段。
11. 填入后清除对应 `sessionStorage` handoff；管理员继续人工检查并手动保存。

输入白名单：

- `targetType`：`project`、`publication`、`knowledge` 或 `skill`。
- `rawText`：20 到 10000 个字符。

输出结构：

- Project：title、summary、background、research_question、methodology、tags、milestones、public_readiness_notes、sensitive_risks、next_steps。
- Publication：title、publication_type_suggestion、summary、abstract、tags、structure_suggestions、public_readiness_notes、sensitive_risks、next_steps。
- Knowledge：title、category_suggestion、excerpt、content_outline、content_draft、tags、public_readiness_notes、sensitive_risks、next_steps。
- Skill：name、category_suggestion、description、content、input_description、output_description、usage_guide、platforms、workflow_steps、public_readiness_notes、sensitive_risks、next_steps。

Prefill 映射：

- Project：title、summary、background、research_question、methodology、tags、milestones。
- Publication：title、summary、abstract、tags；publication_type_suggestion 能匹配 option value 或 label 时才填入，允许大小写或多余空格差异。
- Knowledge：title、excerpt、content_draft 到 content、tags；category_suggestion 能匹配 option 时才填入，允许大小写或多余空格差异。
- Skill：name、description、content、input_description、output_description、usage_guide、platforms；category_suggestion 和 platforms 能匹配现有选项时才填入，允许大小写或多余空格差异。
- 不映射 public_readiness_notes、sensitive_risks、next_steps、visibility、Project relation、status、Skill package 或 Documents。

验证要求：

- 未配置 AI API key 时，`/dashboard/ai-drafts` 不崩溃，生成按钮禁用并显示尚未配置提示。
- 后台侧边栏和 Dashboard 快速入口可以进入 AI 草稿实验室。
- 四种目标类型都能在 UI 中选择。
- 输出可以复制字段或复制完整 Markdown。
- 结果可以通过 `sessionStorage` 带入四类新建表单，并先显示确认条。
- 点击“填入表单”后只预填浏览器字段，不自动保存；点击“忽略并清除”不改表单。
- 390px 移动端无横向滚动。
- 公开页面没有 AI 草稿入口。
- sitemap / robots / public smoke 不受影响。

边界：

- 不自动保存数据库，不自动创建 Project / Publication / Knowledge / Skill，不自动提交表单，不自动修改 `visibility`。
- 不新增草稿表，不新增 migration，不修改 RLS 或 Storage policy。
- 不读取 Documents、Storage object、Skill package、uploaded code、zip 内容、Storage path、file path、owner_id、raw relation rows、private file metadata 或 signed URL。
- 不修改 Documents 上传 / 删除 / zip 下载或 `/public-files/[id]/download`。
- 不恢复 access request、viewer login、Access Grants、restricted 外部授权、`/dashboard/network`、Market Brief 或 #118 详情页 AI。

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
