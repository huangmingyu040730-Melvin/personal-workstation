# Project Memory

日期：2026-06-15

## Current State

项目定位：

> 黄铭语的公开研究工作站与私密数字资产后台。

当前主线已经从功能扩张收口到稳定维护：

- 研究资产沉淀：Projects、Publications、Knowledge、Skills。
- 公开展示：公开首页、About、公开列表与详情页、SEO、sitemap、robots。
- 文件 / 知识管理：Documents 作为统一私密附件底座，服务 Project / Publication / Knowledge / Skill。
- 求职闭环维护：Career Center、Resume、AI JD 分析历史、投递看板。

已完成阶段：

- Phase 1：前端原型。
- Phase 2A：Supabase Auth、RLS、管理员登录、后台保护。
- Phase 2B：Projects / Knowledge / Skills 真实 CRUD。
- Phase 2C：Publications / Documents / private Storage。
- Phase 2D：公开研究工作站、公开内容路由、公开内容填充。
- Phase 2E-A：曾实现访问申请表单与后台审批；Phase 2R-Z 已退役。
- Phase 2E-B：曾实现 restricted 授权基础；Phase 2R-Z 已退役外部授权链路。
- Phase 2F：SEO 基础、sitemap、robots、metadata。
- Phase 2G-A / 2G-B：公开站点与管理后台 UI 优化。
- Phase 2J-A / 2J-B / 2J-C：Profile 真实编辑、Calendar CRUD 与月视图。
- Phase 2K-A 至 2K-J：Resume 素材库、版本组合、模板预览、质量检查、AI JD 建议、Word 导出、JD 分析历史、投递看板与 Career Center。
- Phase 2N-Z：Market Brief / 市场简报从产品入口和代码主路径移除。
- Phase 2O-A：工作台稳定维护路线确立。
- Phase 2P-A：Documents 文档包、多文件 / 文件夹上传与 50 MB Storage 上限。
- Phase 2P-B：Project / Publication / Knowledge / Skill 后台详情页嵌入私密附件区域。
- Phase 2P-C：四类内容新建表单支持“保存并上传附件”，创建成功后跳转统一 Documents 上传页。
- Phase 2P-D：Documents 文件 metadata、文档包 metadata、关联对象与列表筛选维护能力。
- Phase 2P-E-1：Documents 列表和文档包详情页支持批量移动文件关联对象与批量解除关联。
- Phase 2P-E-1-B：内容详情页 RelatedDocumentsPanel 按文档包、独立文件和跨文档包文件分组，避免当前对象文档包内文件重复展示。
- Phase 2P-E-1-C：文档包详情页支持整体迁移 / 同步关联工具，可同步更新文档包和包内全部文件的关联对象，或一起解除关联。
- Phase 2P-E-2：Documents 列表和文档包详情页支持批量删除文件；文档包详情页支持删除整个文档包及包内文件。
- Phase 2P-E-3：Documents 列表和文档包详情页支持选中文件 zip 临时下载；文档包详情页和内容详情页文档包卡片支持下载整个文档包 zip。
- Phase 2P-F-1：后台新增 `/dashboard/search` 全局搜索入口，用于按数据库 metadata 搜索 Projects、Publications、Knowledge、Skills、Documents 和文档包。
- Phase 2P-F-2：后台全局搜索支持类型筛选、每类数量统计、选中类型空状态、结果卡片类型 badge 和标题 / 描述关键词高亮。
- Phase 2P-G-1：Documents 文件中心批量操作区改为紧凑工具栏，并新增 `document_asset_links` / `document_collection_asset_links` 专用多资产关联表；legacy `related_type / related_id` 保留为 primary relation 兼容字段。
- Phase 2P-G-1 后续修复：Documents 与文档包关联 chips 会对同一资产下的 legacy `related` fallback 做展示降噪；已有具体关系时不重复显示“相关”，不删除 legacy 数据或新增 migration。
- Phase 2P-G-1 追加 UI polish：上传页、文件详情页、文档包详情页和批量添加关联使用 checkbox / chips 分组选择器；文件中心权限列使用轻量私密状态标签。
- Phase 2Q-A-1：Project 后台详情页升级为研究项目中枢，整合项目研究框架、私密附件、相关知识笔记 / 学术成果和快捷操作。
- Phase 2Q-A-2：Knowledge 后台详情页升级为知识节点，整合知识摘要、正文、关联 Project、私密附件、同项目成果和搜索入口。
- Phase 2Q-A-3：Skill 后台详情页升级为能力包 / 工作流包，整合用途说明、平台版本、私密资料、版本记录和相关资产搜索入口。
- Phase 2Q-A-4：Publication 后台详情页升级为成果中枢，整合成果摘要、abstract、关联 Project、私密材料、同项目 Knowledge 和搜索入口。
- Phase 2Q-B-1：新增研究资产显式关联关系底座，支持 Project / Knowledge / Skill / Publication 之间的管理员手动关系与 backlinks。
- Phase 2Q-B-2：优化研究资产显式关系管理体验，支持目标资产本地筛选、关系统计 / 筛选和只修改 relation_type / note 的关系编辑。
- Phase 2Q-B-3：曾新增后台全局研究资产关系视图 MVP；Phase 2Q-B-4 已取消并移除该独立页面，显式关系系统保留在四类资产详情页中。
- Phase 2Q-B-4：移除后台全局研究资产关系视图模块；保留 `research_asset_links`、0019 migration、AssetLinksPanel、outbound / backlink、relation_type / note 维护能力。
- Phase 2R-A-1：公开首页与公开导航 polish，站点身份保留“黄铭语研究工作站”，首页 H1 使用“个人研究工作站”，首屏采用左侧个人定位 / 标签 / CTA 与右侧公开统计卡片结构；#100 追加 UI polish 后，Knowledge / Skill 首页预览使用紧凑卡片展示最多 4 条 public 内容，公开导航保留轻量“管理员登录”入口。
- Phase 2R-A-2：公开首页 hero 视觉识别 polish，保留左文案 + 右统计卡片结构和 H1“个人研究工作站”，用自绘 CSS 金融 / 量化 / 研究背景元素与系统中文 serif 字体栈增强专业感；#101 预览反馈后将背景装饰重心移到左侧 / 中间偏左，右侧统计卡片区保持干净；不新增 migration，不引入字体文件、外部字体服务、图表库或动画库。
- Phase 2R-A-3：公开 Projects / Publications / Knowledge / Skills 列表页 polish 为正式研究内容索引，统一 listing header、公开统计、轻量 URL 筛选、公开卡片和空状态；只展示 public 内容，不新增 migration，不读取或公开 Documents、Storage path、signed URL、`file_path`、`document_asset_links` 或 `research_asset_links` 管理能力。
- Phase 2R-A-4A：新增公开文件附件基础能力，Documents 仍上传默认 private，但管理员可显式设置单个文件 public；公开 Project / Publication 详情页可展示当前 public 资产关联的 public 文件附件，下载经 `/public-files/[id]/download` 服务端校验后短时签名，不把 signed URL、Storage path、Storage bucket、owner_id 或 raw link rows 写入页面。
- 2R-A-4A public 附件生产 hotfix：Vercel Production / Preview 已有 `SUPABASE_SERVICE_ROLE_KEY`，但 runtime log 显示 `isPublicAsset` 查询 `publications` 时 `permission denied for table publications`；新增 `0021_public_attachment_service_role_grants.sql` 只给 `service_role` 补 public 附件查询 / 下载校验需要的 `select` grant。
- Phase 2R-A-4B：公开 Project / Publication / Knowledge / Skill 详情页统一为正式研究详情体验，使用 detail hero、主内容 section、侧栏 metadata、related public content 和安全 metadata；Project / Publication 继续整合 public attachments，Knowledge / Skill 不展示 Documents 或 Skill package。
- Phase 2R-B-1：曾 polish 访问申请与受限内容体验；Phase 2R-Z 已移除该链路。
- Phase 2R-C-1：公开 SEO 与分享体验 polish，统一 metadata、canonical、Open Graph / Twitter card、sitemap 和 robots；sitemap 只收录 public 内容和公开静态入口，robots 阻止 dashboard、API、viewer、public-files 和后台下载入口。
- Phase 2R-C-2：公开发布前 QA / hardening，新增 `npm run smoke:public` 巡检公开路由、未公开 fallback、metadata、sitemap、robots 和敏感字段边界；公开文案避免访客页面暴露内部文件实现词，公开附件 metadata 增加移动端换行保护。
- Phase 2R-D-1：公开内容运营基础，Project / Publication / Knowledge / Skill 后台详情页新增 public readiness checklist，基于既有字段和 public 附件计数提示发布准备度；新增 `docs/public-content-operations.md`，不新增 migration、不改权限或公开下载边界。
- Phase 2R-E-1：访问申请后台流程 polish，后台申请列表新增状态 / 目标类型筛选和更完整的申请卡片，详情页升级为人工审核工作台；只复用既有 `status` / `admin_note`，不自动创建 Access Grant、不发邮件、不开放 Documents 或 signed URL。
- Phase 2R-E-2：Access Grants 后台管理 polish，授权列表新增有效 / 过期 / 撤销状态筛选和内容类型筛选，创建页强化手动选择 restricted 内容，新增授权详情页和 `docs/access-grants-workflow.md`；不新增 migration、不改权限模型、不自动授权或开放 Documents。
- Phase 2R-Z：移除外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权链路；删除公开 / 后台相关页面、actions、queries、forms 和 docs，0022 迁移将历史 restricted 内容回写 private、收紧四类内容表 visibility / public read policy，并删除旧 `access_requests`、`content_access_grants` 与授权函数。不修改 Documents、Storage policy、public 文件下载 route 或后台核心内容管理。
- Phase 2R-F-1：公开 About / Resume Profile polish，`/about` 升级为正式公开个人简介页，展示个人定位、研究方向、公开研究工作站说明、技能 / 工具方向、公开内容导航和保守 Contact / Links；只读取公开 Profile 字段或静态公开文案，不新增 migration、不改权限、不恢复外部访问链路。

当前网站包括：

- 面向外部访客的公开研究工作站。
- 管理员本人使用的私密后台。
- 私密文件中心与文档包。
- Resume / Career 求职闭环。

详细当前状态见 `docs/current-status.md`。

## Important Context

事实：

- 网站默认语言为中文。
- 技术栈：Next.js App Router、TypeScript、Tailwind CSS、Lucide React、Supabase Auth / Database / RLS / Storage。
- 查询逻辑集中在 `src/lib/queries/`。
- 校验逻辑集中在 `src/lib/validations/`。
- 写入逻辑集中在 `src/actions/`。
- 后台写操作必须在 Server Action 中验证登录和管理员身份，并继续依赖 RLS。
- 公开页面只展示 `visibility = "public"` 的内容。
- private / unlisted / 历史 restricted 内容不得进入公开列表、公开首页或 sitemap。
- 外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权已退役；不要恢复 `/access-request`、`/viewer/*`、`/dashboard/access-requests` 或 `/dashboard/access-grants`，也不要重新引入外部授权流程。
- Phase 2R-Z 后，公开导航面向普通访客，保留首页、研究项目、学术成果、知识库、Skill 库和轻量“管理员登录”；不得展示后台菜单、文件中心、访问申请或全局关系图谱入口。
- Phase 2R-A-2 的 hero 视觉层只用于公开首页氛围表达；可使用低对比网格、研究纸张轮廓、抽象 K 线 / bar、散点、曲线和公式片段，但不得使用真实行情、具体股票代码、外部图片、字体文件、外部字体服务、图表库或动画库。
- Phase 2R-A-3 后，四个公开列表页只使用既有 public 查询结果、现有公开字段和 URL query params 做轻量筛选；不新增全文搜索、外部搜索服务、向量库、数据库字段、Documents 读取或内部关系读取。
- Phase 2R-Z 后，未公开 fallback 不得确认 private / unlisted / 历史 restricted 内容是否真实存在，不显示访问申请或 viewer 登录入口。
- Phase 2R-C-1 后，公开 metadata 使用“黄铭语研究工作站”模板；详情页 description 只使用 public summary / excerpt / description 截断；未公开 fallback metadata 保持 noindex。
- Phase 2R-C-2 后，发布前公开 QA 可使用 `npm run smoke:public` 巡检运行中的站点；该脚本只访问公开路由、fallback、sitemap 和 robots，不读取 private data，也不作为真实权限边界。
- Phase 2R-D-1 后，后台四类资产详情页的公开发布准备度只是运营提示：基于已有字段、关系和 Project / Publication public 附件计数判断，不阻止保存、不自动设为 public、不自动公开附件。
- Phase 2R-F-1 后，`/about` 是公开个人简介与公开研究工作站说明页；只能展示 public Profile 字段或静态公开文案，不展示 Documents、Storage path、signed URL、owner_id、raw link rows、访问申请、Viewer 登录或 Access Grants。
- sitemap 只收录 public Project / Publication / Knowledge / Skill 详情和公开静态入口；不得收录 dashboard、viewer、login、public file download route、signed URL、Storage path、private Documents、unlisted / private / 历史 restricted 内容或后台关系页面。
- robots 阻止 dashboard、login、access-request、viewer、api、documents、public-files、admin、storage 和 signed 等路径；robots 不是安全边界。
- Documents 上传默认保持 private；只有管理员显式设置 `documents.visibility = 'public'`，且文件关联到 public 资产时，公开页面才可展示安全附件摘要。
- signed URL 只由管理员下载流程或 public 下载 route 按需短时生成，不保存到数据库，不输出到页面 HTML。
- 公开 Publication 页面和首页不得展示历史 `file_path`、Storage 路径、Storage bucket、owner_id、signed URL、raw Documents 多资产关联或 `research_asset_links` 管理功能。
- `robots.txt` 和 `sitemap.xml` 不是安全边界；真正安全边界依赖 Supabase Auth、RLS、Storage policy 和后台路由保护。
- 不提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL、Storage 内部路径或 `service_role`。

权限边界：

| 区域 | 谁可访问 |
| --- | --- |
| public 内容 | 所有人 |
| unlisted 内容 | 不出现在公开列表，当前能力保持保守 |
| private 内容 | 仅管理员 |
| dashboard | 仅管理员 |
| documents 管理 | 仅管理员 |
| public document downloads | public 文件 + public 资产关联经服务端路由校验 |
| signed URL | 管理员流程或 public 下载 route 按需短时生成，不写入页面 HTML |

Documents / Storage：

- Documents 是 Project / Publication / Knowledge / Skill 的统一默认私密附件底座；Phase 2R-A-4A 起支持单个文件显式 public 后在相关公开内容页展示。
- 上传继续采用两阶段浏览器直传 Supabase Storage；文件二进制不经过 Vercel Function。
- `document_collections` 表示一次上传批次、文件夹、附件包或 Skill 包。
- `documents.collection_id`、`original_name`、`relative_path`、`folder_path` 保存多文件 / 文件夹上传 metadata。
- `documents.storage_path` 必须使用 ASCII-safe object key；中文文件名和文件夹名只用于后台展示字段。
- `document_asset_links` 与 `document_collection_asset_links` 是 Documents / 文档包专用多资产关联表，可把一个文件或文档包关联到多个 Project / Knowledge / Skill / Publication，并记录 relation_type 与 note。
- `documents.related_type / related_id` 与 `document_collections.related_type / related_id` 仅保留为 legacy primary relation、路径 fallback 与兼容 query params；新展示、筛选和搜索应优先读取专用 link tables。
- 关联 chips 的展示归一化规则：同一 `asset_type + asset_id` 如果只有 `related`，显示“相关”；如果同时存在 `related` 和更具体关系，只显示具体关系；如果有多个具体关系，保留多个具体 chips。
- 多关联选择器是展示层 UI：通过 checkbox / chips 生成多个 `asset_links` hidden inputs，后端 Server Actions 和 0020 表结构不变。
- 文件 metadata 可编辑字段为显示名称、分类、visibility 和 legacy primary relation；不可编辑 Storage bucket/path、大小、MIME type、原始文件名、relative_path、folder_path 或 collection_id。多资产关联在文件详情页关联区域添加或移除。
- 文档包 metadata 可编辑字段为名称、描述、类型和 legacy primary relation；不可手动编辑 file_count、total_size、root_folder_name、owner_id、visibility 或时间戳。多资产关联在文档包详情页关联区域添加或移除。
- 文件级关联和文档包级关联允许不一致；修改文档包 legacy primary relation 或多关联不自动批量同步包内文件，除非管理员显式选择同步。
- 批量添加 / 移除 / 清空关联只写入或删除专用 link rows，并必要时同步 legacy primary relation；不修改 Storage object、`storage_path`、`collection_id` 或文档包统计字段。
- RelatedDocumentsPanel 中，当前对象文档包内文件由文档包卡片代表；文件级关联指向当前对象但仍属于其他文档包的文件展示为跨文档包文件并提示。
- 文档包整体关联同步会主动同步专用 link rows 和 legacy primary relation；整体解除关联会一起清空，但不修改文件 `collection_id`。
- 文档包整体迁移 / 同步关联只修改 metadata，不移动、不重命名、不删除 Storage object，也不修改 `documents.collection_id`。
- 批量删除文件会删除所选 `documents` 记录和对应 Storage object，但不会自动删除空文档包。
- 删除整个文档包及文件会删除包内文件记录、对应 Storage object 和 `document_collections` 记录；确认文本必须为 `DELETE` 或 `删除`。
- Documents 删除流程采用先 Storage object、后数据库记录的保守顺序；当前不新增数据库事务或 RPC。
- public 附件组件只接收安全字段：id、文件名、分类、大小、MIME type、更新时间、关系标签和 `/public-files/[id]/download`；不得接收或输出 Storage path、Storage bucket、owner_id、signed URL、raw `document_asset_links` 或 relation note。
- public 下载 route 必须复核文件 public、bucket 为 `workspace-files`、当前资产 public 且文件关联该资产；通过后才生成 60 秒短时 signed URL。
- 公开详情页只读取 public 详情查询；private / restricted / unlisted slug 不输出正文或附件。Related public content 只能来自 public 记录或公开字段推导，不展示显式关系管理数据、后台关系备注或 raw 文件关联。
- zip 下载按请求临时生成，不保存到 Storage；仅管理员后台可用，不公开 signed URL、Storage 路径或持久 zip 链接。
- zip 下载限制为最多 50 个文件、总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查；超限或任一 Storage object 下载失败时不部分打包。
- 后台全局搜索 `/dashboard/search` 只查数据库 metadata；支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选、每类数量统计和标题 / 描述关键词高亮；不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要或向量搜索，不读取 Storage object，不生成 signed URL，不输出 Storage path。
- 单文件上限为 50 MB；批量 / 文件夹上传单次最多 100 个文件、总量 200 MB。
- 支持 PDF、Office、Markdown、文本、CSV/TSV、JSON/YAML、Notebook、代码文件、图片和 zip/tar/gz/7z 压缩包。
- 不支持 exe、dmg、app、msi、bat、cmd。
- 上传的代码、Skill 包和压缩包只作为文件存储，不执行、不解析、不安装。

Project 研究中枢：

- `/dashboard/projects/[id]` 现在是单个研究项目中枢，展示项目概览、研究问题、背景、方法、状态、进度、标签、开始日期、里程碑和项目 metadata。
- Project 详情页保留返回项目列表、编辑项目和删除项目入口。
- Project 详情页继续复用 RelatedDocumentsPanel 展示私密文档包、独立文件和跨文档包文件，不重复实现 Documents 行为。
- 相关研究资产继续读取现有 `knowledge_notes.project_id` 与 `publications.project_id`，每类最多展示 5 条。
- Project 详情页新增显式关联资产区域，可维护 Project 与 Knowledge / Skill / Publication / Project 的人工确认关系和 backlinks。
- 除 `research_asset_links` 关系底座外，不修改 Storage policy，不读取附件正文，不暴露 Storage path 或 signed URL。

Knowledge 知识节点：

- `/dashboard/knowledge/[id]` 现在是单个知识节点中枢，展示知识摘要、正文、分类、标签、可见性、创建时间、更新时间和知识 metadata。
- Knowledge 详情页保留返回知识库、编辑知识节点和删除知识节点入口。
- Knowledge 详情页继续复用 RelatedDocumentsPanel 展示私密文档包、独立文件和跨文档包文件，不重复实现 Documents 行为。
- 关联 Project 只读取现有 `knowledge_notes.project_id`；没有关联时显示空状态和 Project 搜索入口。
- 相关成果保留同项目 `publications.project_id` 展示，最多 5 条。
- Knowledge 详情页新增显式关联资产区域，可维护 Knowledge 与 Project / Skill / Publication / Knowledge 的人工确认关系和 backlinks。
- 除 `research_asset_links` 关系底座外，不修改 Storage policy，不读取附件正文，不做 AI、OCR、文件内容索引或向量搜索，不暴露 Storage path 或 signed URL。

Skill 能力包：

- `/dashboard/skills/[id]` 现在是单个能力包 / 工作流包，展示 Skill 用途说明、分类、平台、状态、当前版本、输入说明、输出说明、使用指南、`SKILL.md`、版本记录和 metadata。
- Skill 详情页保留返回 Skill 库、编辑 Skill、删除 Skill 和新增版本记录入口。
- Skill 详情页继续复用 RelatedDocumentsPanel 展示私密文档包、独立文件和跨文档包文件，不重复实现 Documents 行为。
- Skill package、代码包和压缩包仅作为私密资料存储和管理，不安装、不解析、不执行。
- Skill 不新增单独 Project / Knowledge / Publication 外键字段；跨资产关系通过 `research_asset_links` 维护。
- Skill 详情页新增显式关联资产区域，也继续保留按 Skill 名称、platform 和搜索类型查找相关资产的快捷入口。
- 除 `research_asset_links` 关系底座外，不修改 Storage policy，不读取附件正文，不做 AI、OCR、文件内容索引或向量搜索，不暴露 Storage path 或 signed URL。

Publication 成果中枢：

- `/dashboard/publications/[id]` 现在是单个研究成果中枢，展示成果 summary、abstract、类型、可见性、标签、发表日期、创建时间、更新时间和成果 metadata。
- Publication 详情页保留返回成果列表、编辑成果和删除成果入口。
- Publication 详情页继续复用 RelatedDocumentsPanel 展示私密文档包、独立文件和跨文档包文件，不重复实现 Documents 行为。
- 关联 Project 只读取现有 `publications.project_id`；没有关联时显示空状态和 Project 搜索入口。
- 同项目 Knowledge 只读取关联 Project 下的 `knowledge_notes.project_id`，最多展示 5 条。
- Publication 详情页新增显式关联资产区域，可维护 Publication 与 Project / Knowledge / Skill / Publication 的人工确认关系和 backlinks，也继续保留搜索入口。
- `file_path` 不在后台详情页展示，也不作为下载入口；`cover_url` 仅作为后台 metadata 状态展示。
- 除 `research_asset_links` 关系底座外，不修改 Storage policy，不读取附件正文，不做 AI、OCR、文件内容索引或向量搜索，不暴露 Storage path 或 signed URL。

Research Asset Links：

- `research_asset_links` 是 Project / Knowledge / Skill / Publication 之间的显式关系表，只在管理员后台使用。
- 关系类型为 `related`、`supports`、`references`、`uses`、`produces`、`derived_from`，当前只作为管理员维护标签，不驱动权限继承、公开展示或自动推理。
- 四类后台详情页均展示显式关联资产区域，支持创建 outbound 关系、查看 inbound backlinks、打开对方后台详情页、编辑 relation_type / note 和删除关系。
- 新增关系时可按目标资产标题和 metadata 本地筛选当前已加载候选；不做异步搜索、外部搜索、文件内容搜索或向量搜索。
- 关系列表可显示总数、outbound、inbound、当前筛选数量和 relation_type 统计，并按方向、对方资产类型和 relation_type 客户端筛选。
- 全局研究资产关系视图页面已在 Phase 2Q-B-4 取消并移除；后台不再提供独立全局关系页面、可视化网络或 force graph。
- 显式关系维护仍在 Project / Knowledge / Skill / Publication 后台详情页的 AssetLinksPanel 内完成，通过单个资产详情页查看 outbound 和 backlinks。
- 创建关系时必须校验管理员身份、source / target 类型、source / target 记录存在性、自关联和重复关系。
- 编辑关系时必须校验管理员身份和关系存在性；source / target 不允许编辑，如需更换目标需删除后重新创建。
- Documents 不纳入 `research_asset_links`；Documents 与文档包使用专用 `document_asset_links` / `document_collection_asset_links`，legacy `related_type / related_id` 只保留为兼容字段。
- 现有 `knowledge_notes.project_id` 与 `publications.project_id` 继续保留，不迁移、不删除、不自动转换。
- 2Q-B-2 / 2Q-B-3 / 2Q-B-4 不新增 schema、不修改 0019 migration、不新增 RPC、不引入数据库事务；本阶段不做 AI 自动关联、复杂关系可视化、拖拽连线、公开页面展示或复杂权限继承。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path。

## Recent Decisions

- 公开研究工作站与私密后台已经分离：公开只读路由为 `/projects`、`/publications`、`/skills`、`/knowledge`；后台管理路由为 `/dashboard/...`。
- 文件附件默认比正文更严格。即使内容 public，关联 Documents 也默认 private；只有管理员显式 public 且关联 public 资产的文件才可作为公开附件展示。
- Publication 有关联 `documents` 或 `document_collections` 时禁止直接删除，要求先处理附件。
- Documents 上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。
- Phase 2R-Z 取代旧 restricted / Viewer 路线：外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权已退役，不再作为 Phase 2I / hotfix 继续修复。
- Phase 2F / 2G 只优化公开站点运营体验、SEO 和 UI，不扩展权限系统。
- Resume 模块采用统一素材库、版本组合、浏览器预览 / 打印、Word 即时导出、AI JD 建议和 JD 分析历史；AI 输出只作为建议，不自动写回素材或版本。
- Career Center 已进入稳定维护状态；后续只做 bugfix、文案修正和 broken link 修复，不主动扩展面试记录、提醒、邮件、Notion 同步或自动投递。
- Market Brief / 市场简报已因数据可靠性不足弃用并从产品入口和代码主路径移除；历史迁移 0013-0017 暂作 unused legacy data，不在当前路线继续维护。
- Phase 2P-A / 2P-B / 2P-C 将 Documents 扩展为统一私密附件底座，并把附件查看、预填上传、新建后上传串到 Project / Publication / Knowledge / Skill 后台流程中。
- Phase 2P-D / 2P-E-1 / 2P-E-1-B / 2P-E-1-C / 2P-E-2 / 2P-E-3 将 Documents 进一步打磨为可维护的私密附件管理系统；metadata 修正、legacy 批量关联整理、详情页分组展示、文档包整体迁移、受确认保护的删除能力和 zip 临时下载均不新增 migration。
- Phase 2P-G-1 采用 dedicated document asset links 决策：新增 `0020_document_asset_links.sql`，用 Documents 专用 link tables 支持文件和文档包多资产关联；不把 Documents 混入 `research_asset_links`，不修改 Storage policy，不新增 RPC。
- Documents relation chips 采用展示降噪决策：legacy primary relation 或 0020 回填产生的 `related` 只在同一资产没有具体关系时显示；该决策不删除旧字段、回填 rows 或 Storage object。
- Documents multi-association UI polish 决策：替换原生多选框和大号权限 pill，但不改变上传、删除、zip、Storage、RLS 或多关联写入逻辑。
- Phase 2P-E-2 删除能力继续保持 Documents 私密边界：Activity Log 不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
- Phase 2P-E-3 zip 下载继续保持 Documents 私密边界：zip 不保存到 Storage，Activity Log 不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
- Phase 2P-F-1 全局搜索采用 metadata-first 决策：只在管理员后台搜索数据库字段，不新增 migration、索引、RPC、外部搜索服务、向量库或文件内容解析。
- Phase 2P-F-2 搜索体验增强继续采用 metadata-only 决策：类型筛选只是结果过滤，关键词高亮只在展示层完成，不保存索引，不新增外部搜索、OCR、AI 摘要或向量搜索。
- Phase 2Q-A-1 采用 Project-first 研究中枢决策：先把 `/dashboard/projects/[id]` 打磨为研究项目中枢，使用既有 Project 字段、RelatedDocumentsPanel、`knowledge_notes.project_id`、`publications.project_id` 和后台搜索，不新增资产关系表或数据库能力。
- Phase 2Q-A-2 采用 Knowledge-node 决策：继 Project 后把 `/dashboard/knowledge/[id]` 打磨为知识节点，使用既有 Knowledge 字段、`knowledge_notes.project_id`、`publications.project_id`、RelatedDocumentsPanel 和后台搜索，不新增资产关系表；显式跨资产关系留到 2Q-B。
- Phase 2Q-A-3 采用 Skill-capability 决策：继 Project、Knowledge 后把 `/dashboard/skills/[id]` 打磨为能力包 / 工作流包，使用既有 Skill 字段、`skill_versions`、RelatedDocumentsPanel 和后台搜索，不新增资产关系表；Skill package 只存储和管理，不安装、不解析、不执行。
- Phase 2Q-A-4 采用 Publication-output 决策：继 Project、Knowledge、Skill 后把 `/dashboard/publications/[id]` 打磨为成果中枢，使用既有 Publication 字段、`publications.project_id`、`knowledge_notes.project_id`、RelatedDocumentsPanel 和后台搜索，不新增资产关系表；`file_path` 不展示也不作为下载入口。
- Phase 2Q-B-1 采用 admin-only research asset links 决策：新增 `research_asset_links` 覆盖 Project / Knowledge / Skill / Publication；Documents 暂不纳入；保留既有 `project_id` 关系；只在管理员后台展示 outbound 和 backlinks；不做 AI 自动关联、图谱、公开展示或复杂权限继承。
- Phase 2Q-B-2 采用 management-polish 决策：只增强显式关系管理体验；关系仍只覆盖 Project / Knowledge / Skill / Publication；Documents 仍不纳入；edit link 只允许修改 relation_type 和 note，不允许修改 source / target；不新增 schema、migration、RPC、数据库事务、AI 自动关联、图谱可视化、公开展示或复杂权限继承。
- Phase 2Q-B-3 的 read-only global relation view 决策已被 Phase 2Q-B-4 取代；旧的独立全局关系页面不再是当前能力。
- Phase 2Q-B-4 采用 remove network view 决策：用户判断全局关系可视化对实际工作效率帮助有限，因此移除独立全局关系页面、侧边栏入口和 AssetLinksPanel 附近的全局入口；保留 `research_asset_links`、0019 migration、Server Action、查询、校验、AssetLinksPanel、outbound / backlink、relation_type / note 和详情页内关系筛选 / 编辑。
- Phase 2R-A-1 采用 public presentation polish 决策：后台核心能力阶段性完成后转向公开展示质量；公开首页聚合研究方向和公开内容预览，hero H1 改为“个人研究工作站”并恢复左侧文案 + 右侧统计卡片结构；Knowledge / Skill 首页预览改为紧凑卡片；公开导航保留轻量“管理员登录”但不展示后台菜单；公开页面继续只展示 public 内容。当时“不公开 Documents / 附件”的边界已由 Phase 2R-A-4A 精确化为显式 public 文件安全下载；仍不公开 private Documents、Storage 路径、signed URL、后台文件关联或显式关系管理。
- Phase 2R-A-2 采用 hero visual identity polish 决策：用户认可 2R-A-1 信息架构，但希望首页首屏更有金融、量化、研究和学术气质；本阶段只用自绘 CSS 装饰和系统字体栈增强 hero 背景与标题，不改变公开查询、后台能力、Supabase schema、RLS、Storage、Documents 或显式关系。
- Phase 2R-A-3 采用 public listing polish 决策：公开首页完成后继续把 `/projects`、`/publications`、`/knowledge`、`/skills` 打磨为正式研究内容索引；筛选只在应用展示层基于已加载 public 记录、既有字段和 URL query params 完成，不新增 migration、搜索服务、AI 摘要、向量搜索、Documents 读取或内部关系展示。
- Phase 2R-A-4A 采用 public document attachments foundation 决策：显式 public 文件可在 public Project / Publication 详情页展示和下载，但不开放公开文件中心、不改 Storage policy、不公开 raw link rows、Storage path 或 signed URL；旧的“公开页面完全不提供附件下载”边界被此更精确规则取代。后续 0021 只作为 service-role grant hotfix，不新增业务 schema 或公开能力。
- 0021 采用 public attachment service-role grant 决策：公开附件查询与下载 route 仍由服务端复核 public 文件、public 资产和关联存在；补 `service_role` 对 `projects`、`publications`、`knowledge_notes`、`skills`、`documents`、`document_asset_links` 的 `select`，不开放 anon / viewer 读取 Documents，不修改 RLS 或 Storage policy。
- Phase 2R-A-4B 采用 public detail polish 决策：四类公开详情页统一为正式研究详情体验；Project / Publication 整合 4A 的公开附件，Knowledge / Skill 暂不展示 Documents；所有 related content 只展示 public 记录，不读取后台显式关系管理或私密文件。
- Phase 2R-B-1 采用 access request context polish 决策已被 Phase 2R-Z 取代；旧访问申请上下文、表单、后台申请展示和 viewer 登录入口已删除。
- Phase 2R-C-1 采用 public SEO and sharing polish 决策：只在应用层统一公开 metadata、OG/Twitter card、sitemap 和 robots；复用公开安全图片，不生成动态私密 OG；sitemap 只收 public 内容并在查询失败时降级；不新增 migration、不修改 RLS、Storage policy、Documents 或 public 文件下载 route。
- Phase 2R-C-2 采用 public launch QA and hardening 决策：只新增公开 smoke 脚本、访客文案 hardening 和附件 metadata 移动端换行保护；不新增公开能力、不新增 migration、不修改 RLS、Storage policy、Documents 或 public 文件下载 route。
- Phase 2R-D-1 采用 public content operations foundation 决策：公开主链路完成后先补后台内容运营辅助，四类详情页 checklist 只读提示字段缺口、关联状态、公开附件边界和人工复核项；不做强校验、不新增 schema、不自动公开内容或附件。
- Phase 2R-F-1 采用 public about profile polish 决策：公开个人简介页承担作品集 / 研究主页入口，复用 public Profile 和静态公开说明，不新增 schema、不修改 RLS/Storage/Documents/public download route，不恢复访问申请或外部授权。
- Phase 2R-E-1 / 2R-E-2 的访问申请后台与 Access Grants polish 已被 Phase 2R-Z 取代；不要恢复相关页面、actions、queries、forms 或流程文档。
- Phase 2R-Z 采用 remove external access 决策：新增 0022 migration，将历史 restricted 回写 private，收紧 public read policy，删除旧 `access_requests`、`content_access_grants`、`has_content_access()` 和 `can_request_viewer_login()`；不修改 Documents、Storage policy 或 public 下载 route。
- 后续数据库变更必须新增 `0023_*` 或更高编号 migration，不修改或重跑已执行过的旧 migration。

## Known Issues

### Viewer / restricted 外部授权退役

状态：已退役，不再作为已知问题或待修 hotfix。

- Phase 2R-Z 删除外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权链路。
- 公开站点只展示 public 内容；未公开 fallback 不确认内容是否存在，也不提供申请或 viewer 登录入口。
- 不再规划 Phase 2I Viewer 修复。

### Resume 预览 bullet-like 文本拆行遗留问题

状态：冻结，后续如继续处理应单独开 hotfix。

影响：

- 不影响 Resume 素材库、版本组合、质量检查、AI JD 分析、JD 历史、投递看板或 Word 导出主流程。

## Migration State

生产 Supabase 已执行：

- `0001_initial_schema.sql`
- `0002_grant_api_table_privileges.sql`
- `0003_publications_documents_storage.sql`
- `0004_access_requests.sql`
- `0005_restricted_content_access.sql`
- `0006_viewer_login_grant_check.sql`
- `0007_profile_public_fields.sql`
- `0008_calendar_events.sql`

后续功能对应迁移：

- Phase 2K-A：`0009_resume_items.sql`
- Phase 2K-B：`0010_resume_versions.sql`
- Phase 2K-C：`0011_resume_template_fields.sql`
- Phase 2K-H：`0012_resume_jd_reviews.sql`
- Phase 2N 旧 Market Brief 遗留迁移：`0013_market_briefs.sql` 至 `0017_market_brief_material_packages.sql`
- Phase 2P-A：`0018_document_collections_and_folder_uploads.sql`
- Phase 2Q-B-1：`0019_research_asset_links.sql`
- Phase 2Q-B-2：不新增 migration，继续依赖已执行的 `0019_research_asset_links.sql`
- Phase 2Q-B-3：不新增 migration，继续依赖已执行的 `0019_research_asset_links.sql`
- Phase 2P-G-1：`0020_document_asset_links.sql`
- Phase 2R-A-1 / 2R-A-2 / 2R-A-3：不新增 migration；公开首页结构、视觉识别、系统字体栈、micro-interactions、公开列表页 listing header、轻量筛选、卡片和 metadata polish 只发生在应用展示层。
- Phase 2R-A-4A：不新增业务 schema；沿用既有 `documents.visibility`、`document_collections.visibility` 和 `0020_document_asset_links.sql`，只新增 public 附件查询、组件、下载 route 和后台 visibility 操作。
- 2R-A-4A hotfix：`0021_public_attachment_service_role_grants.sql`
- Phase 2R-A-4B：不新增 migration；只新增 / 调整公开详情组件、四类详情页组合、public related content 和 metadata，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或多关联核心逻辑。
- Phase 2R-B-1 / 2R-E-1 / 2R-E-2：历史访问申请 / 授权能力已被 2R-Z 移除。
- Phase 2R-C-1：不新增 migration；只调整公开 metadata、canonical、OG/Twitter card、sitemap 和 robots，不修改 RLS、Storage policy、Documents、public 文件下载 route 或任何 Supabase schema。
- Phase 2R-C-2：不新增 migration；只新增公开 smoke 巡检脚本、访客文案 hardening 和公开附件 metadata 移动端换行保护，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或任何 Supabase schema。
- Phase 2R-D-1：不新增 migration；只新增后台 public readiness checklist、只读 public 附件计数 helper 和公开内容运营文档，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或任何 Supabase schema。
- Phase 2R-F-1：不新增 migration；只 polish `/about`、首页 About CTA、robots allow 和 smoke 覆盖，不修改 RLS、Storage policy、Documents、public 下载 route 或四类公开内容核心查询。
- Phase 2R-Z：新增 `0022_remove_external_access_and_restricted_viewer.sql`，只退役外部访问链路、回写历史 restricted 为 private、收紧 visibility / public read policy 并删除旧访问申请 / 授权表和函数；不修改 Storage policy、Documents 或 public 下载 route。

规则：

- 已执行 migration 不应修改或重跑。
- 0013 至 0017 是 Market Brief unused legacy data 对应迁移；当前产品代码不再依赖这些旧表，本轮不 drop。
- 执行 0022 后，后续数据库变更应新增 `0023_*` 或更高编号。
- 不得放宽 RLS、Storage policies 或 Documents 访问边界。

## Workflows

重复流程：

- 本地开发：`npm run dev`。
- 每轮代码修改后验证：`npm run lint`、`npm run build`。
- Supabase 数据库变更：新增 migration，不修改已执行旧 migration。
- Documents 上传：prepare metadata -> 浏览器直传 private `workspace-files` -> finalize 写库 -> 必要时清理失败对象。
- 新建内容并上传附件：先创建 Project / Publication / Knowledge / Skill，成功后跳转 `/dashboard/documents/upload` 并通过 query params 预填关联对象、上传模式、分类和文档包类型。
- Documents metadata、清理与导出维护：文件详情页修正单个文件显示名、分类、visibility 和 legacy primary relation，并在关联区域用 checkbox / chips 添加或移除多资产关联；文档包详情页修正文档包名称、描述、类型和 legacy primary relation，并在关联区域添加 / 移除文档包关联，可选择同步到包内文件；列表页用 category、related_type、collection 筛选整理，其中 related_type / related_id 表示包含该资产关联；Documents 列表或文档包详情页用紧凑批量工具栏批量添加、移除或清空关联、批量设置 public/private、批量删除文件或下载选中文件 zip；内容详情页用文档包、独立文件、跨文档包文件和关联 chips 理解附件关系，chips 已对同一资产的 legacy `related` 做展示降噪；危险区用于删除整个文档包及文件；文档包详情页或内容详情页文档包卡片用于下载整个文档包 zip；跨模块查找资产时先使用 `/dashboard/search?q=关键词` 按 metadata 搜索，再用 `type` 筛选聚焦 Documents、Knowledge、Projects 等类型。
- 公开详情与附件维护：四类公开详情页只展示 public 记录；Project / Publication 可显示 public related content 与显式 public 文件附件，管理员先在文件详情页或文件中心批量工具将文件显式设为 public，并确认该文件通过专用 link row 或 legacy primary relation 关联到对应 public Project / Publication；公开详情页只显示安全附件摘要，下载点击 `/public-files/[id]/download`，服务端再校验 public 文件、public 资产和关联存在后短时签名；Knowledge / Skill 公开详情不展示 Documents。
- 公开 SEO 与分享维护：页面 metadata 通过 `src/lib/site.ts` 统一站点名、canonical、OG / Twitter card 和公开安全图片；sitemap 只收录 public 内容和公开静态入口，查询失败时降级；robots 阻止 dashboard、API、viewer、public-files 等路径；robots / sitemap 不作为权限边界。
- 公开发布前 QA：启动本地服务后运行 `npm run smoke:public`，巡检公开入口、fallback、metadata、sitemap、robots 和敏感字段；结合浏览器 390px 冒烟确认首页、列表页、详情或 fallback、公开附件 metadata 无横向溢出。
- 外部访问链路退役维护：不要恢复 `/access-request`、`/viewer/*`、`/dashboard/access-requests`、`/dashboard/access-grants`、访问申请 / 授权 actions、queries、forms、validations 或流程文档；fallback 不显示申请 / viewer 入口。
- Project 研究中枢维护：进入 `/dashboard/projects/[id]` 先查看研究问题、背景、方法和进度；整理项目附件时使用页面内上传项目文件 / 文件夹或项目 Documents 筛选入口；整理相关资产时查看显式关联的知识笔记和学术成果，Skill 先通过标题或标签搜索定位。
- Knowledge 知识节点维护：进入 `/dashboard/knowledge/[id]` 先查看摘要、正文、分类、标签和关联 Project；整理知识资料时使用页面内上传知识资料 / 文件夹或 Knowledge Documents 筛选入口；查找相关资产时查看同项目 Publications，并用搜索入口查找 Project / Publication / Skill。
- Skill 能力包维护：进入 `/dashboard/skills/[id]` 先查看用途说明、平台、状态、版本和使用内容；整理 Skill 资料时使用页面内上传 Skill 资料 / 文件夹或 Skill Documents 筛选入口；查找相关资产时使用 Skill 名称或 platform 搜索 Project / Knowledge / Publication；Skill package 只作为私密资料管理，不在站内执行。
- Publication 成果中枢维护：进入 `/dashboard/publications/[id]` 先查看 summary、abstract、成果类型、标签、发表日期和关联 Project；整理成果材料时使用页面内上传成果材料 / 文件夹或 Publication Documents 筛选入口；查找相关资产时查看同项目 Knowledge，并用搜索入口查找 Project / Knowledge / Skill；`file_path` 不作为下载入口。
- 研究资产显式关系维护：进入任意 Project / Knowledge / Skill / Publication 后台详情页，在“显式关联资产”区域选择目标资产、relation_type 和可选备注；目标较多时用“筛选目标资产”按标题或 metadata 本地过滤；保存后当前页显示 outbound，对方详情页显示 backlink；关系较多时按方向、对方资产类型和 relation_type 筛选；如需理解某个资产的关系上下文，从该资产详情页查看 outbound 和 backlinks，并通过对方资产链接继续跳转；如需修正关系语义或说明，展开“编辑关系”只修改 relation_type / note；如需更换 source / target，删除后重新创建；Documents 仍通过文件面板、Documents 列表和文档包详情页管理。
- 项目记忆更新：先读 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`，再按 SOP 同步 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`、`docs/workflows.md`，并标记 stale / superseded。

详细流程见 `docs/workflows.md`。

## Next Steps

建议顺序：

1. Phase 2P / 2Q / 2R-A-4A / 2R-A-4B / 2R-C-1 / 2R-C-2 / 2R-D-1 / 2R-Z 相关真实环境验收：确认 `0018_document_collections_and_folder_uploads.sql`、`0019_research_asset_links.sql`、`0020_document_asset_links.sql`、`0021_public_attachment_service_role_grants.sql` 和 `0022_remove_external_access_and_restricted_viewer.sql` 已在目标 Supabase 环境执行，验证多文件 / 文件夹上传、文档包详情、四类内容详情页附件区域、create-and-upload flow、多资产关联添加 / 移除 / 清空、文件 visibility 设置、public Project / Publication 详情页公开附件展示和 `/public-files/[id]/download` 安全下载、公开四类详情页统一布局与 390px 移动端堆叠、未公开 fallback 不含申请 / viewer 入口、后台不含 access requests / grants 菜单、公开 metadata / OG / Twitter card、`/sitemap.xml` 只收 public 内容、`/robots.txt` 阻止 dashboard / API / viewer / access-request / public-files、`npm run smoke:public` 发布前巡检、Knowledge / Skill 不展示 Documents、RelatedDocumentsPanel 分组与关联 chips、文档包关联同步、受确认保护的删除流程、zip 临时下载、`/dashboard/search` metadata 搜索、type 筛选与关键词高亮，以及四类后台详情页的中枢展示、显式资产关系和 public readiness checklist。
2. 研究资产内容维护：补齐 Projects、Publications、Knowledge、Skills 的公开质量与附件关联。
3. 稳定维护 Career Center：只处理 bugfix、文案修正和 broken link。

暂不主动推进：

- Market Brief / 市场简报恢复。
- 新的求职自动化。
- 公开文件中心或公开 zip 下载。
- 外部访问申请、Access Grants、Viewer magic link 或 restricted 外部授权恢复。
- OCR、文件内容索引、AI 文件总结。
- Google Calendar、提醒系统、Notion 同步。

## Stale Or Superseded Notes

- “页面数据仍保持 mock data 预览”已过时。Projects、Knowledge、Skills、Publications、Documents、Profile、Calendar、Resume 与 Career 已使用真实 Supabase 数据或真实表结构；公开 `/calendar` 仍保留占位展示，真实管理入口为 `/dashboard/calendar`。Access Requests 和 Access Grants 曾接入真实表，但已由 Phase 2R-Z 退役。
- “restricted 属于后续规划，尚未进入 schema / RLS / UI”已过时。restricted 基础代码和 migration 曾完成，但已由 Phase 2R-Z 移除外部访问链路并通过 0022 回写为 private。
- “后台页面仍位于公开候选路径”已过时。主要后台管理页面已迁移到 `/dashboard/...`。
- “Phase 2K-D 才做 AI JD 优化”已过时。Resume 已完成规则化质量检查、AI JD 建议、JD 分析历史、投递看板和 Career Center；后续默认稳定维护。
- “Market Brief 是可继续扩展模块”已废弃。Market Brief 已在 Phase 2N-Z 移除产品入口和代码主路径，后续不维护相关 runner、素材包、探针或环境变量。
- “Documents 只服务 Publication 附件”已过时。Documents 已升级为 Project / Publication / Knowledge / Skill 的统一私密附件底座。
- “后续数据库变更应新增 `0018_*`”已过时。`0018_document_collections_and_folder_uploads.sql` 已存在；该过渡备注也已被 2Q-B-1 的 `0019` 取代。
- “后续数据库变更应新增 `0019_*`”已过时。`0019_research_asset_links.sql` 已存在，且已被 2P-G-1 的 `0020_document_asset_links.sql` 继续推进。
- “后续数据库变更应新增 `0020_*`”已过时。`0020_document_asset_links.sql` 已存在。
- “后续数据库变更应新增 `0021_*` / `0022_*`”已过时。`0021_public_attachment_service_role_grants.sql` 与 `0022_remove_external_access_and_restricted_viewer.sql` 已存在，后续应使用 `0023_*` 或更高编号。
- “访问申请、Access Grants、Viewer magic link 和 restricted 外部授权是当前基础能力”已过时。Phase 2R-Z 已移除这些能力，不再作为 bugfix 或未来路线恢复。
- “Publication / Skill 与 Knowledge 的显式关系留到后续 Phase 2Q-B 统一设计”已过时。Phase 2Q-B-1 已新增 `research_asset_links` 管理员后台显式关系底座，但 Documents 仍保持独立附件关系模型。
- “Skill 当前没有 Project / Knowledge / Publication 显式关联字段，只能搜索相关资产”已过时。Skill 仍不新增单独外键字段，但可通过 `research_asset_links` 建立显式关系。
- “后台存在独立全局研究资产关系视图页面”已过时。Phase 2Q-B-4 已移除该模块；显式关系仍在四类资产详情页维护。
