# 黄铭语个人数字工作站

黄铭语的个人长期资产沉淀主基地（Personal Asset Intranet），同时保留公开研究工作站与私密数字资产后台边界。

项目长期定位：

- 当前重点是 Personal Asset Intranet polish：打磨既有资产模块的清晰度、可信度和使用体验。
- 对外展示公开研究项目、学术成果、知识笔记与 AI Skill / 工作流。
- 对内管理全部项目、知识、成果、文件、日历、AI 草稿与求职资产。
- 通过 Dashboard 与 `workstation-cli review --period week` 做 metadata-only 周度复盘，并把项目阶段结论沉淀为关联 Knowledge。
- Agent CEO / 自动化扩张线暂停；不新增自动化中心、任务中心或外部集成主线。
- 公开站点只展示 public 内容；外部访问申请、Access Grants、Viewer magic link 和 restricted 外部授权已在 Phase 2R-Z 退役，不恢复。

当前项目状态详见 `docs/current-status.md`，v1.0 收口说明详见 `docs/v1-release-notes.md`，v1.1 polish 收尾说明详见 `docs/v1-1-release-notes.md`，维护手册详见 `docs/maintenance-playbook.md`，公开内容运营指南详见 `docs/public-content-operations.md`，AI 表单草稿助手说明详见 `docs/ai-draft-form-copilot.md`，AI 原始素材草稿实验室说明详见 `docs/ai-raw-note-draft-lab.md`，后续阶段规划详见 `docs/roadmap.md`，已知问题详见 `docs/known-issues.md`。

## 资产模型

- Project：沉淀持续推进的研究、业务、开发或个人项目主题，例如全指指增竞品分析、个人数字化工作台开发或长期研究主题。
- Publication：沉淀已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容。
- Knowledge：沉淀可复用的笔记、框架、概念解释、方法论和个人学习记录。
- Skill：沉淀可复用的流程、Prompt 模板、操作手册、自动化方法和能力包。

v1.1 polish 已围绕边界、资产模型、AI Draft Lab 预填、搜索、列表和移动端可用性完成收口；它是 Personal Asset Intranet 的使用体验打磨，不是功能扩张，不新增数据库、migration、RLS、Storage policy，也不修改 public download route。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase Auth、Database、RLS
- Projects、Knowledge Base、Skills Library、Publications 真实 CRUD
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
- Resume 照片 URL 链路：basic 个人信息素材 `photo_url` 优先，Profile `avatar_url` fallback；Preview 和 Word 导出都尊重 `show_photo`，但不提供照片上传或 Storage 写入
- Supabase Storage 私密文件上传与下载
- Documents 文件 metadata、文档包 metadata、多资产关联和列表筛选维护能力
- Documents 批量添加 / 移除多资产关联，并保留 legacy primary relation 兼容能力
- Documents 多关联选择器使用 checkbox / chips 分组选择，不再依赖原生多选框
- Documents 文件中心权限列使用轻量私密状态标签
- Documents 关联 chips 对同一资产下的 legacy `related` fallback 做展示降噪，已有具体关系时不重复显示“相关”
- Documents 批量删除文件与删除整个文档包及文件
- Documents 多文件与文档包 zip 临时下载
- 后台全局搜索 `/dashboard/search`，按数据库 metadata 查找研究资产，并支持类型筛选、结果统计和关键词高亮
- 研究资产显式关联关系，支持在 Project / Knowledge / Skill / Publication 详情页维护人工确认的 outbound 与 backlink，并支持关系编辑、筛选统计和目标资产本地筛选
- RelatedDocumentsPanel 按文档包、独立文件和跨文档包文件分组展示
- 文档包整体迁移 / 同步关联工具
- Project 后台详情页研究中枢，整合研究问题、方法、私密附件、相关知识笔记 / 学术成果和快捷操作
- v1.3.0 资产健康与周度复盘：Dashboard、只读 Workstation review API / CLI 共用统计口径；Project 提供“记录阶段结论”，Knowledge 提供项目、课程、量化三类默认私密模板
- Knowledge 后台详情页知识节点，整合知识摘要、正文、关联 Project、私密附件、同项目成果和搜索入口
- Skill 后台详情页能力包 / 工作流包，整合用途、平台、版本、私密资料、版本记录和相关资产搜索入口
- Publication 后台详情页成果中枢，整合成果摘要、abstract、关联 Project、私密材料、同项目知识节点和搜索入口
- Phase 2R-A 起公开首页与公开导航转向“黄铭语研究工作站”展示 polish；首页 H1 使用“个人研究工作站”，首屏恢复左侧个人定位 / 标签 / CTA 与右侧公开统计卡片结构，Knowledge / Skill 首页预览使用更紧凑卡片展示更多 public 条目，并在公开导航保留轻量“管理员登录”入口；Phase 2R-A-2 进一步用轻量 CSS 背景装饰和系统字体栈增强金融、量化、研究和学术视觉识别；Phase 2R-A-3 将公开 Projects / Publications / Knowledge / Skills 列表页 polish 为正式研究内容索引；Phase 2R-A-4B 统一公开四类详情页为正式研究详情体验
- Phase 2R-C-1 polish 公开 SEO 与分享体验：统一 metadata、canonical、Open Graph / Twitter card、sitemap 和 robots；sitemap 只收录 public 内容，robots 阻止 dashboard / API / viewer / public-files 等敏感路径
- Phase 2R-C-2 发布前 QA 与 hardening：新增轻量 `npm run smoke:public` 巡检公开路由、fallback、sitemap、robots、metadata 与敏感字段边界，并修补公开文案和附件 metadata 长内容换行
- Phase 2R-D-1 公开内容运营基础：Project / Publication / Knowledge / Skill 后台详情页新增基于既有字段的 public readiness checklist，并新增公开内容运营文档；只提示、不阻止保存、不自动公开内容或附件
- Phase 2R-F-1 公开 About / Resume Profile polish：`/about` 成为正式公开个人简介页，展示研究方向、工作站说明、公开技能 / 工具方向、公开内容导航和保守联系方式；不恢复外部访问申请或授权链路
- Phase 2R-G-1 v1.0 final QA / release notes：新增 v1.0 发布说明和最终验收清单；#115 已关闭不合并，首页保持当前 `main` 主结构，不继续推进 2R-F-2 首页精选区改版
- Phase 2R-G-2 v1.0 maintenance playbook：新增稳定维护手册，记录日常 public 内容、Documents、公开附件、安全检查、部署验收和故障排查流程；暂时跳过 public content sprint，后续内容由管理员手动逐步补充
- Phase 3A-R / 3A-S / 3A-T AI Draft Form Copilot：Project、Publication、Knowledge、Skill 新建 / 编辑表单均提供管理员 AI 草稿补全助手，并支持补全空字段、优化已有内容、公开风险检查三种模式；#118 已关闭不合并，AI 只读取当前表单白名单字段，支持复制或采用建议到浏览器表单，不自动保存、不自动公开、不读取 Documents / Storage
- Phase 3B / 3B-1 AI Raw Note Draft Lab：后台新增 `/dashboard/ai-drafts`，支持把原始想法、研究笔记、会议摘录或粗糙文本转换为 Project / Publication / Knowledge / Skill 结构化草稿；可复制内容，或通过当前浏览器 `sessionStorage` 带入对应新建表单预填；不自动创建资产、不保存数据库、不提交表单、不读取 Documents / Storage
- Phase 2R-Z 移除外部访问申请与 viewer 授权：删除 `/access-request`、viewer login/callback、后台 Access Requests / Access Grants、restricted 外部授权代码；新增 0022 迁移将 restricted 回写 private、收紧 public read policy 并删除旧授权表 / 函数；不改 Documents、Storage policy、public 文件下载 route 或核心后台内容管理

## 本地启动

本地运行时基线：Node.js `24.20.0`（Node 24 LTS）与 npm 11。仓库提供 `.nvmrc`；`package.json` 允许 Vercel 当前 Node 24 运行时 `24.19.0` 及以上版本，避免云端构建出现引擎误报。使用 nvm 时可先运行 `nvm use`，切换 Node 后应重新安装依赖。

安装依赖：

```bash
npm ci
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
npm audit
```

公开站点发布前 smoke 需要先启动本地服务，再运行：

```bash
npm run smoke:public
```

如本地服务不在默认端口，可设置 `PUBLIC_SMOKE_BASE_URL` 指向待巡检地址。

## Supabase 配置

复制环境变量示例：

```bash
cp .env.example .env.local
```

填写 Supabase 项目的公开配置：

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SITE_URL=https://personal-workstation.vercel.app
```

`NEXT_PUBLIC_SITE_URL` 用于公开页面 canonical、Open Graph、sitemap 和 robots 中的站点 URL；不是 secret。未设置时默认使用当前生产地址。

不要提交 `.env.local`，不要在前端项目中放入 `service_role` key。

如需使用 AI JD 简历优化助手、后台 AI 表单草稿补全助手或 AI 草稿实验室，推荐只在服务端环境配置通用 AI Provider：

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

`AI_API_KEY` 和 `OPENAI_API_KEY` 不得暴露到客户端。AI Draft Form Copilot 的三种生成模式和 AI 草稿实验室不需要额外环境变量；未配置时，JD 优化页面、Project / Publication / Knowledge / Skill 新建与编辑表单以及 `/dashboard/ai-drafts` 仍可打开，但会提示尚未配置 AI 能力。

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

Phase 2C 已在生产 Supabase 项目执行 `supabase/migrations/0003_publications_documents_storage.sql`，用于创建私密 `workspace-files` Storage bucket 与管理员专属 Storage policies。0004 至 0006 曾用于访问申请、restricted 内容授权和 viewer 登录前授权检查；Phase 2R-Z 已用 `supabase/migrations/0022_remove_external_access_and_restricted_viewer.sql` 将这些外部访问能力退役：既有 restricted 内容回写为 private，四类内容表 visibility 约束收紧为 `public/private/unlisted`，public read policy 只允许 public 或管理员读取，并删除旧访问申请 / 授权表与授权函数。0013 至 0017 是已保留的旧迁移；当前产品代码不再依赖这些旧表。0018 至 0020 是 Documents、文档包、多资产关联和研究资产关系底座。`0021_public_attachment_service_role_grants.sql` 只给 server-side `service_role` 补公开附件查询 / 下载校验所需表的 `select` 权限，不修改 RLS、Storage policy、bucket 或文件数据。新建环境仍需按顺序执行 0001 至 0022。更完整的配置步骤见 `docs/supabase-setup.md`。

## 页面

公开浏览路由：

- `/` 公开研究工作站首页
- `/about` 关于我与公开工作站说明
- `/projects` 公开研究项目列表
- `/projects/[slug]` 公开研究项目详情
- `/publications` 公开学术成果列表
- `/publications/[slug]` 公开学术成果详情
- `/knowledge` 公开知识库列表
- `/knowledge/[slug]` 公开知识笔记详情
- `/skills` 公开 Skill 列表
- `/skills/[slug]` 公开 Skill 详情
- `/login` 管理员登录

后台管理路由：

- `/dashboard` 管理员工作台
- `/dashboard/search` 后台全局 metadata 搜索
- `/dashboard/ai-drafts` AI 草稿实验室
- `/dashboard/projects` 研究项目管理
- `/dashboard/projects/[id]` 研究项目详情中枢
- `/dashboard/publications` 学术成果管理
- `/dashboard/publications/[id]` 学术成果详情中枢
- `/dashboard/knowledge` 知识库管理
- `/dashboard/knowledge/[id]` 知识节点详情中枢
- `/dashboard/skills` Skill 库管理
- `/dashboard/skills/[id]` Skill 能力包详情中枢
- `/dashboard/documents` 文件中心管理
- `/dashboard/documents/upload` 单文件、多文件与文件夹上传
- `/dashboard/documents/collections/[id]` 文档包详情
- `/dashboard/profile` 个人信息管理
- `/dashboard/calendar` 站内日程管理
- `/dashboard/career` 求职中心
- `/dashboard/resume` 简历素材库
- `/dashboard/resume/versions` 简历版本管理
- `/dashboard/resume/applications` 投递看板
- `/dashboard/resume/versions/[id]/jd-review` AI JD 简历优化建议
- `/dashboard/resume/jd-reviews` JD 分析历史与投递记录
- `/dashboard/resume/versions/[id]/export/docx` 简历 Word 导出
- `/calendar` 公开日历占位
- `/profile` 兼容跳转到 `/dashboard/profile`

旧 `/documents` 路径仍受管理员保护，并兼容重定向到 `/dashboard/documents`。

## 产品路线图

当前产品方向为“黄铭语的个人长期资产沉淀主基地 / Personal Asset Intranet”。详细状态见 `docs/current-status.md`，v1.1 收口说明见 `docs/v1-1-release-notes.md`，路线图见 `docs/roadmap.md`。

长期访问层级：

- `public`：所有访客可浏览，可出现在公开首页、公开列表和公开详情页。
- `unlisted`：不公开列出，当前仍保持后台管理和保守公开边界。
- `private`：仅管理员本人在后台查看和管理。

近期维护重点：

- 稳定使用现有 Projects、Publications、Knowledge、Skills、Documents、AI Draft Lab 和 Career 能力。
- 持续录入真实资产，观察资产分类、搜索、Documents 和移动端体验。
- 只做明确 bugfix、明显 UX polish、文档同步和安全边界复查。
- 不主动推进 Agent CEO、自动化中心、任务中心、Market Brief、Notion / 飞书 / Gmail 集成或新的外部授权访问链路。

既有能力现状补充：

- Phase 2P-C 起新建 Project、Publication、Knowledge、Skill 时可选择“保存并上传附件”，创建成功后跳转到统一 Documents 上传页并预选当前对象。
- Phase 2P-D 起 Documents 从上传底座进一步扩展为可维护的私密附件管理系统，支持编辑文件 / 文档包 metadata、调整关联对象和按文档包状态筛选。
- Phase 2P-E-1 起 Documents 列表和文档包详情页支持批量选择文件、批量移动关联对象和批量解除关联。
- Phase 2P-E-1-B 起 Project、Publication、Knowledge、Skill 后台详情页的关联附件区域按“文档包 / 独立文件 / 跨文档包文件”分组，避免文档包内文件重复展示。
- Phase 2P-E-1-C 起文档包详情页支持“整体迁移文档包 / 整体解除关联”，同步更新文档包和包内全部文件的关联对象。
- Phase 2P-E-2 起 Documents 列表和文档包详情页支持批量删除选中文件，文档包详情页支持输入确认文本后删除整个文档包及包内文件。
- Phase 2P-E-3 起 Documents 列表和文档包详情页支持多文件 zip 临时下载，文档包详情页和内容详情页文档包卡片支持下载整个文档包 zip。
- Phase 2P-F-1 起后台新增 `/dashboard/search` 全局搜索入口，用于按 Projects、Publications、Knowledge、Skills、Documents 和文档包 metadata 快速查找研究资产。
- Phase 2P-F-2 起后台全局搜索支持 `type` 类型筛选、每类数量统计、选中类型空状态和标题 / 描述关键词高亮。
- Phase 2P-G-1 起 Documents 与文档包支持 Project / Knowledge / Skill / Publication 多资产关联，文件中心批量操作区改为紧凑工具栏，并保留 legacy primary relation 作为兼容字段。
- Phase 2Q-A-1 起 Project 后台详情页作为研究项目中枢，集中展示研究框架、私密附件、相关知识笔记 / 学术成果和快捷操作。
- Phase 2Q-A-2 起 Knowledge 后台详情页作为知识节点，集中展示知识摘要、正文、关联 Project、私密附件、同项目成果和搜索入口。
- Phase 2Q-A-3 起 Skill 后台详情页作为能力包 / 工作流包，集中展示用途、平台、版本、状态、使用说明、私密资料和相关资产搜索入口。
- Phase 2Q-A-4 起 Publication 后台详情页作为成果中枢，集中展示成果摘要、abstract、关联 Project、私密材料、同项目 Knowledge 和搜索入口。
- Phase 2Q-B-1 起 Project / Knowledge / Skill / Publication 后台详情页支持显式资产关系，管理员可手动维护“相关 / 支持 / 引用 / 使用 / 产出 / 来源于”关系并查看 backlinks。
- Phase 2Q-B-2 起显式资产关系区域支持本地筛选目标资产、关系统计、方向 / 类型筛选，以及只修改关系类型和备注的编辑流程。
- Phase 2Q-B-4 起取消此前的全局关系可视化页面；显式资产关系继续在 Project / Knowledge / Skill / Publication 后台详情页中维护。
- Phase 2R-A-1 起公开首页和公开导航强调“黄铭语研究工作站”站点身份；Phase 2R-A-4A 允许公开 Project / Publication 详情页展示显式 public 文件附件；0021 hotfix 补齐该 server-side 查询所需的 `service_role` 只读授权。Phase 2R-D-1 在四类后台详情页加入 public readiness checklist，并新增公开内容运营指南。Phase 2R-F-1 将 `/about` 打磨为正式公开个人简介页。Phase 2R-Z 已移除访问申请、Access Grants、Viewer 登录和 restricted 外部授权，公开页面仍只展示 public 内容，不公开 private Documents、Storage 路径、signed URL、`file_path`、raw link rows 或后台关系管理。
- Viewer 登录与 restricted 外部访问不再作为 bugfix 专项继续修复。
- Calendar、Documents、Profile、Projects、Knowledge、Skills、Publications 和 Career Center 以稳定维护为主。
- 不主动扩展新的求职自动化、Market Brief 或独立 AI 生成产品线。

## 权限与数据状态

- 未配置 Supabase 时，后台页面保持 mock data 开发预览，便于本地构建和视觉检查。
- 配置 Supabase 后，后台页面会要求登录，并通过 `public.admin_users` + `public.is_admin()` 判断管理员权限。
- 登录成功后的 `next` 跳转会经过内部后台路径白名单校验，不允许跳到外部 URL。
- 公开首页与公开列表/详情页只读取 `visibility = "public"` 的项目、成果、知识文章与 Skill；private / unlisted 不在公开页面返回或展示。
- 公开访客不再提交访问申请；后台不再提供 Access Requests、Access Grants 或 Viewer 登录授权入口。旧 restricted 内容经 0022 迁移回写为 private，后续不恢复外部授权链路。
- 公开 About 页面不硬编码管理员邮箱、Supabase 配置、Auth UUID 或其他敏感联系信息。
- 后台 Projects、Publications、Skills、Knowledge 列表页提供轻量公开运营提示，帮助维护 public / featured 内容质量。
- 公开可读取内容表不存储管理员 Supabase Auth UUID；管理员身份只保存在私密的 `admin_users` 表中。
- 公开访问通过 `visibility = "public"` 控制；后台写入、更新、删除权限通过 `public.is_admin()` 控制。
- 当前 Projects、Knowledge Base、Skills Library、Publications 已接入真实 CRUD，并通过 Supabase RLS 与管理员身份保护写入。
- Documents 已接入真实文件记录、私密 Storage 上传、短时 signed URL 下载和删除流程；Phase 2P-A 新增 `document_collections` 文档包、多文件 / 文件夹上传、relative_path / folder_path 保存、Knowledge 关联和更完整的研究文件格式白名单。Phase 2P-B 将关联文件区域嵌入 Project、Publication、Knowledge 和 Skill 后台详情页，上传入口仍统一跳转到 `/dashboard/documents/upload` 并通过 query params 预填关联对象、分类、上传模式和文档包类型。Phase 2P-C 在四类内容新建表单加入 create-and-upload flow：先保存内容对象，再跳转统一上传页；不做 pending upload、临时文件 staging 或 create action 文件处理。Phase 2P-D 支持管理员编辑文件显示名、分类、关联对象，编辑文档包名称、描述、类型、关联对象，并在 Documents 列表按 category、related_type、collection 状态筛选。Phase 2P-E-1 支持在 Documents 列表和文档包详情页批量移动文件关联对象、批量解除文件关联；不修改文档包自身关联或文件 `collection_id`。Phase 2P-E-1-B 澄清内容详情页附件分组：当前对象文档包内文件由文档包卡片代表，不在独立文件中重复展示；文件级关联指向当前对象但仍属于其他文档包的文件进入“跨文档包文件”分组并提示。Phase 2P-E-1-C 在文档包详情页新增整体迁移 / 同步关联工具，可把文档包和包内全部文件一起关联到 Project、Publication、Knowledge 或 Skill，也可一起解除关联；该工具不修改 `collection_id`，不移动、不重命名、不删除 Storage object。Phase 2P-E-2 新增批量删除文件和删除整个文档包及文件，删除时先删除 Storage object，再删除数据库记录；批量删除文件不会自动删除空文档包。Phase 2P-E-3 新增按请求临时生成 zip 下载，支持选中文件 zip、文档包 zip 和内容详情页文档包卡片下载 zip；zip 不保存到 Storage。Phase 2P-G-1 新增 `document_asset_links` / `document_collection_asset_links`，文件与文档包可同时关联多个 Project / Knowledge / Skill / Publication；上传、筛选、搜索和 RelatedDocumentsPanel 优先读取专用 link tables，旧 `related_type / related_id` 只作为 legacy primary relation 与路径 fallback。同一资产如果已有 `deliverable` 等具体关系，UI 不重复显示该资产的 legacy `related` fallback。PR #99 追加 polish 将上传、详情页和批量添加关联统一为 checkbox / chips 分组选择器，并把文件中心“私密”权限显示改为轻量状态标签。附件上传默认 private；只有管理员显式设为 public 且关联到当前 public Project / Publication 的文件，才会在对应公开详情页以安全附件摘要和 `/public-files/[id]/download` 展示。修改 metadata 或关联不会移动或重命名 Storage object。
- 后台全局搜索 `/dashboard/search` 只查询数据库 metadata，每类最多返回 8 条；支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选、每类数量统计和标题 / 描述关键词高亮；不读取文件正文，不解析 PDF / Office / zip，不做 OCR、AI 摘要或向量搜索，不生成 signed URL，不输出 Storage path。
- Project / Knowledge / Skill / Publication 后台详情页已支持显式资产关系面板：管理员可在四类研究资产之间手动创建关系，查看 outbound 和 backlink，按方向 / 对方资产类型 / 关系类型筛选，编辑 relation_type 与 note，并删除关系；如需更换 source / target，需要删除后重新创建。全局关系可视化页面已移除，现有 `project_id` 关系继续保留，不迁移、不删除；搜索入口也继续作为辅助定位能力。
- Skill package 仅作为私密资料存储和管理，不安装、不解析、不执行。
- Publication 的 `file_path` 不展示也不作为下载入口，`cover_url` 仅作为安全 metadata 状态展示。
- Access Requests、Access Grants、Viewer login/callback 与 restricted 外部访问已经退役；不再作为后台入口、公开入口或未来修复方向。
- Profile 已接入真实 Supabase 编辑；公开 About 页面优先读取 `is_public = true` 且 `visibility = "public"` 的 Profile 字段。
- Calendar 已接入站内 `calendar_events` CRUD；管理员可在 `/dashboard/calendar` 新建、编辑、删除日程，Dashboard 会展示近期日程。
- Resume 已接入履历素材库与版本组合；管理员可在 `/dashboard/career` 进入求职中心，并继续通过 `/dashboard/resume`、`/dashboard/resume/versions`、`/dashboard/resume/applications` 和 `/dashboard/resume/jd-reviews` 使用原有子模块路径。管理员可在 `/dashboard/resume` 按个人信息、教育、实习、在校、项目、研究、技能、证书和奖项等区块维护结构化素材，并在 `/dashboard/resume/versions` 组合不同简历版本。版本编辑页可选择进入简历顶部的个人字段，并为每条素材控制日期、机构、角色、摘要、bullets、技能和核心课程等字段是否展示。版本详情、列表和预览页提供规则化简历质量检查、完整度评分、缺失项和投递方向提示。Phase 2K-E 新增 AI JD 简历优化助手，可基于当前版本已选素材和管理员粘贴的 JD 生成关键词差距、经历强化和 bullet 改写建议；该能力支持 `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` 通用配置，可接入 DeepSeek 等 OpenAI-compatible Provider，并继续兼容 `OPENAI_API_KEY` / `OPENAI_MODEL`。Hotfix 进一步将 AI JD 输入与页面“版本内容概览”统一到 `resume-template-model` 派生的 `resume-ai-input`，确保教育、实习、项目、研究和技能等可见字段与预览 / Word 导出的核心内容一致。AI JD 优化只生成建议，不自动写回 Resume Items 或 Resume Versions。Phase 2K-H 新增 JD 分析历史与投递记录，管理员可保存单次 AI JD 分析、公司/岗位信息、缺失关键词、风险、下一步行动和投递状态；该记录仍为后台私密数据，不公开展示。Phase 2K-I 新增 `/dashboard/resume/applications` 投递看板，基于 `resume_jd_reviews.application_status` 按草稿、已分析、准备投递、已投递、面试中、被拒、Offer 和已归档管理求职 pipeline，并支持列表筛选和快速改状态；本阶段不自动投递、不发送邮件、不公开记录，也不新增 migration。Phase 2K-J 新增 `/dashboard/career` 求职中心首页，将简历素材、简历版本、投递看板和 JD 分析记录收拢到一个侧边栏入口，并在子页面顶部提供统一 Career tabs；原有子模块路径保持不变。版本预览页提供贴近中文金融简历 PDF 的 A4 样式和浏览器打印 / 另存为 PDF 能力；Phase 2K-F 新增 Word `.docx` 即时导出，导出只读取当前版本已选素材、Profile/basic 信息和字段可见性设置，不写入 Storage，不创建公开简历页面或分享链接。Phase 2K-G 将 Preview 与 Word 导出统一到 20260523 风格模板模型，补充照片位置、模块标题视觉符号和左时间 / 右内容的正式简历布局。
- 求职中心当前进入稳定维护状态，后续只做 bugfix、文案修正和 broken link 修复；不主动扩展面试记录、自动提醒、投递邮件、Notion 同步或新的求职自动化。
- Market Brief / 市场简报模块已因数据可靠性不足从产品入口和代码主路径移除；历史表暂时保留为 unused legacy data，不在本项目路线中继续维护。
- 公共页 UI 已完成蓝白清爽研究工作站风格优化；管理后台 UI 已完成工作台式视觉优化。
- Dashboard 已读取真实项目、笔记、Skill、Publications、Documents、Calendar、Career 与 Activity Logs。
- Google Calendar、提醒系统和外部日历同步尚未实现，也不是当前主动扩展优先级。
- `profiles.contact` 与 `profiles.social_links` 仅应保存希望公开展示的联系方式；若 profile 记录设置为 public，其中公开字段会被访客读取。
- 文件附件默认比正文内容更严格；即使 Project、Publication、Knowledge 或 Skill 设置为 public，关联 Documents 仍默认 private。只有管理员显式设为 public 且关联到当前 public Project / Publication 的文件，才会通过安全附件摘要和 `/public-files/[id]/download` 公开。
- Notion 的长期定位是草稿、临时研究笔记、日常记录和协作辅助，不替代个人网站的正式公开门户、权限系统与私密资产库。

## 已知问题

Viewer magic link、restricted 外部授权、访问申请和 Access Grants 已在 Phase 2R-Z 退役，不再作为待修已知问题或未来功能恢复。

该问题不影响：

- public 内容浏览；
- 管理员后台；
- Documents 私密文件中心；
- 公开站点 SEO 和 UI；
- 公开站点 SEO 和 UI。

## 初始数据结构

`supabase/migrations/0001_initial_schema.sql` 已为 Phase 2B 真实 CRUD 预留主要字段：

- `profiles`：独立内容 ID、个人展示、公开角色、组织、所在地、公开状态、邮箱、简历链接、联系方式、社交链接、研究兴趣与技能标签，不引用 Auth 用户 ID。
- `projects`：使用 `title`、`slug`、背景、研究问题、方法论、进度、状态、精选标记与开始日期。
- `publications`：成果标题、slug、摘要、封面、精选标记、附件路径与关联项目。
- `knowledge_notes`：笔记标题、slug、分类、正文、精选标记与关联项目。
- `skills`：Skill 名称、slug、说明、输入输出描述、使用指南、Skill.md 内容、仓库链接、版本、状态与精选标记。
- `calendar_events`：日程时间、类型、地点、可见性与项目 / 成果 / 知识 / Skill 关联。
- `document_collections`：一次上传批次、文件夹或文档包，记录关联对象、根文件夹、文件数量和总大小。
- `documents`：文件存储路径、分类、关联实体类型与关联 ID；Phase 2P-A 起可关联 `document_collections`，保存原始文件名、relative_path 与 folder_path。
- `activity_logs` 与 `skill_versions`：后续审计与 Skill 版本记录基础。
- `access_requests` / `content_access_grants`：历史外部访问申请与授权表；Phase 2R-Z 的 0022 迁移会删除这些旧表，当前产品代码不再依赖。
- `resume_items`：Phase 2K-A 履历素材库记录，包括素材类型、标题、机构、角色、时间、bullet、skills、tags、关联对象、排序、可见性与精选标记。
- `resume_versions` 与 `resume_version_items`：Phase 2K-B 简历版本与素材组合关系，记录版本标题、目标岗位、语言、模板、启用状态、已选素材、区块、排序和展示开关；Phase 2K-C 通过 0011 补充顶部个人字段开关、区块顺序、模板选项和逐条素材可见字段控制。
- `resume_jd_reviews`：Phase 2K-H JD 分析历史与投递记录，保存关联简历版本、JD 原文、AI 结构化建议、关键词缺口、风险、下一步行动、公司/岗位和投递状态；Phase 2K-I 投递看板继续复用该表和 `application_status`，不新增表结构。
公开可读表 `profiles`、`projects`、`publications`、`knowledge_notes`、`skills` 不保存管理员 Auth UUID。私密后台表 `calendar_events`、`documents`、`document_collections`、`activity_logs` 可保留 `owner_id` 或 `actor_id` 用于后续审计。

## 存储与文件安全

Phase 2C 使用 Supabase Storage bucket：

- `workspace-files`

安全边界：

- bucket 必须为 private。
- 匿名访客不能读取、上传、更新或删除文件。
- 普通非管理员登录用户不能读取或修改文件。
- 管理员通过 `public.is_admin()` 和 Storage policy 操作文件。
- 上传采用两阶段流程：Server Actions 只验证管理员、校验 metadata、生成安全路径并最终写入数据库；文件二进制由浏览器直接上传到 Supabase Storage，不经过 Vercel Function。
- 文件上传默认写入 `documents.visibility = 'private'`。管理员可在文件详情页或文件中心批量工具中显式设为 `public`；只有 public 文件且关联到 public Project / Publication / Knowledge / Skill 时，公开内容页才展示安全附件摘要。
- 文件和文档包 metadata 可在后台修正；新增 / 移除多资产关联写入 `document_asset_links` 或 `document_collection_asset_links`，必要时只同步 legacy primary relation，不修改 `storage_bucket`、`storage_path`、文件大小、MIME type、原始路径、`collection_id` 或文档包统计字段。关联 chips 的 `related` 降噪和多关联选择器 polish 只发生在展示层，不删除 legacy 字段或回填 rows，不新增 migration。内容详情页只展示后台附件摘要和现有后台下载入口，不输出 Storage path 或 signed URL。
- public 附件展示只返回安全字段：文件名、分类、大小、MIME type、更新时间、关系标签和 `/public-files/[id]/download`。页面不输出 `storage_path`、`storage_bucket`、owner、raw `document_asset_links`、relation note 或 signed URL。
- public 下载路由会在服务端复核文件为 public、当前资产为 public 且文件确实关联该资产，再按需生成 60 秒短时 signed URL；signed URL 不保存到数据库，也不写入页面 HTML。
- public 附件查询和下载 route 依赖 server-side `SUPABASE_SERVICE_ROLE_KEY`，并要求生产 Supabase 已执行 `0021_public_attachment_service_role_grants.sql`；该授权只补 `select`，不把 `workspace-files` 改成 public bucket。
- 批量删除文件和删除整个文档包及文件采用保守顺序：先删除 private Storage object，再删除 `documents` / `document_collections` 记录；该流程不新增数据库事务或 RPC，失败时显示中文安全错误并要求人工复核。
- 管理员下载与 public 下载均使用 60 秒短时 signed URL，不保存到数据库，也不在页面 HTML 中输出。
- zip 下载通过 `jszip` 在请求时临时生成，不保存到 Storage；仅管理员后台可用，不公开 signed URL、Storage 路径或 zip 持久链接。
- zip 下载当前限制为最多 50 个文件、总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查；超限或任一 Storage object 读取失败时不部分打包。
- 单文件上传限制为 50 MB；批量 / 文件夹上传单次最多 100 个文件、总量 200 MB，并同时校验扩展名与 MIME type。
- 支持 PDF、Office、Markdown、文本、CSV/TSV、JSON/YAML、Notebook、代码文件、图片和 zip/tar/gz/7z 压缩包。
- 不支持 exe、dmg、app、msi、bat、cmd；上传的代码和 Skill 包只作为文件存储，不执行、不解析、不安装。
- private / unlisted 文件即使关联到 public Project、Publication、Knowledge 或 Skill，也不会在公开页面展示下载入口。
- 外部授权链路已移除；public 附件仍只按 public 文件与 public 资产关联规则展示。
