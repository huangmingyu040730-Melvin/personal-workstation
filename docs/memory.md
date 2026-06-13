# Project Memory

日期：2026-06-13

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
- Phase 2E-A：访问申请表单与后台审批。
- Phase 2E-B：restricted 授权基础能力已实现，但 viewer magic link 登录仍未稳定。
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
- Phase 2Q-A-1：Project 后台详情页升级为研究项目中枢，整合项目研究框架、私密附件、相关知识笔记 / 学术成果和快捷操作。
- Phase 2Q-A-2：Knowledge 后台详情页升级为知识节点，整合知识摘要、正文、关联 Project、私密附件、同项目成果和搜索入口。
- Phase 2Q-A-3：Skill 后台详情页升级为能力包 / 工作流包，整合用途说明、平台版本、私密资料、版本记录和相关资产搜索入口。
- Phase 2Q-A-4：Publication 后台详情页升级为成果中枢，整合成果摘要、abstract、关联 Project、私密材料、同项目 Knowledge 和搜索入口。
- Phase 2Q-B-1：新增研究资产显式关联关系底座，支持 Project / Knowledge / Skill / Publication 之间的管理员手动关系与 backlinks。
- Phase 2Q-B-2：优化研究资产显式关系管理体验，支持目标资产本地筛选、关系统计 / 筛选和只修改 relation_type / note 的关系编辑。
- Phase 2Q-B-3：曾新增后台全局研究资产关系视图 MVP；Phase 2Q-B-4 已取消并移除该独立页面，显式关系系统保留在四类资产详情页中。
- Phase 2Q-B-4：移除后台全局研究资产关系视图模块；保留 `research_asset_links`、0019 migration、AssetLinksPanel、outbound / backlink、relation_type / note 维护能力。

当前网站包括：

- 面向外部访客的公开研究工作站。
- 管理员本人使用的私密后台。
- 私密文件中心与文档包。
- 访问申请与审批。
- restricted 内容授权基础。
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
- private / restricted / unlisted 内容不得进入公开列表、公开首页或 sitemap。
- Documents 始终保持管理员私密文件，不对外开放。
- signed URL 只由管理员流程短时生成，不保存到数据库，不输出到公开页面。
- `robots.txt` 和 `sitemap.xml` 不是安全边界；真正安全边界依赖 Supabase Auth、RLS、Storage policy 和后台路由保护。
- 不提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL、Storage 内部路径或 `service_role`。

权限边界：

| 区域 | 谁可访问 |
| --- | --- |
| public 内容 | 所有人 |
| unlisted 内容 | 不出现在公开列表，当前能力保持保守 |
| restricted 内容 | 管理员可见，viewer 授权基础已实现但登录链路待修 |
| private 内容 | 仅管理员 |
| dashboard | 仅管理员 |
| documents | 仅管理员 |
| signed URL | 仅管理员流程生成 |
| access requests 提交 | 访客可提交 |
| access requests 管理 | 仅管理员 |
| access grants 管理 | 仅管理员 |

Documents / Storage：

- Documents 是 Project / Publication / Knowledge / Skill 的统一私密附件底座。
- 上传继续采用两阶段浏览器直传 Supabase Storage；文件二进制不经过 Vercel Function。
- `document_collections` 表示一次上传批次、文件夹、附件包或 Skill 包。
- `documents.collection_id`、`original_name`、`relative_path`、`folder_path` 保存多文件 / 文件夹上传 metadata。
- `documents.storage_path` 必须使用 ASCII-safe object key；中文文件名和文件夹名只用于后台展示字段。
- 文件 metadata 可编辑字段为显示名称、分类和关联对象；不可编辑 Storage bucket/path、大小、MIME type、原始文件名、relative_path、folder_path 或 collection_id。
- 文档包 metadata 可编辑字段为名称、描述、类型和关联对象；不可手动编辑 file_count、total_size、root_folder_name、owner_id、visibility 或时间戳。
- 文件级关联和文档包级关联允许不一致；修改文档包关联对象不自动批量同步包内文件。
- 批量移动关联对象和批量解除关联只更新 `documents.related_type` / `documents.related_id`；不修改 Storage object、`storage_path`、`collection_id` 或文档包自身关联对象。
- RelatedDocumentsPanel 中，当前对象文档包内文件由文档包卡片代表；文件级关联指向当前对象但仍属于其他文档包的文件展示为跨文档包文件并提示。
- 文档包整体迁移 / 同步关联工具会主动同步更新 `document_collections.related_type / related_id` 和该文档包下全部 `documents.related_type / related_id`；整体解除关联会一起置空。
- 文档包整体迁移 / 同步关联只修改 metadata，不移动、不重命名、不删除 Storage object，也不修改 `documents.collection_id`。
- 批量删除文件会删除所选 `documents` 记录和对应 Storage object，但不会自动删除空文档包。
- 删除整个文档包及文件会删除包内文件记录、对应 Storage object 和 `document_collections` 记录；确认文本必须为 `DELETE` 或 `删除`。
- Documents 删除流程采用先 Storage object、后数据库记录的保守顺序；当前不新增数据库事务或 RPC。
- zip 下载按请求临时生成，不保存到 Storage；仅管理员后台可用，不公开 signed URL、Storage 路径或持久 zip 链接。
- zip 下载限制为最多 50 个文件、总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查；超限或任一 Storage object 下载失败时不部分打包。
- 后台全局搜索 `/dashboard/search` 只查数据库 metadata；支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选、每类数量统计和标题 / 描述关键词高亮；不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要或向量搜索，不读取 Storage object，不生成 signed URL，不输出 Storage path。
- 单文件上限为 50 MB；批量 / 文件夹上传单次最多 100 个文件、总量 200 MB。
- 支持 PDF、Office、Markdown、文本、CSV/TSV、JSON/YAML、Notebook、代码文件、图片和 zip/tar/gz/7z 压缩包。
- 不支持 exe、dmg、app、msi、bat、cmd。
- 上传的代码、Skill 包和压缩包只作为私密文件存储，不执行、不解析、不安装。

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
- Documents 不纳入 `research_asset_links`；Documents 与文档包继续使用 `documents.related_type / related_id` 和 `document_collections.related_type / related_id`。
- 现有 `knowledge_notes.project_id` 与 `publications.project_id` 继续保留，不迁移、不删除、不自动转换。
- 2Q-B-2 / 2Q-B-3 / 2Q-B-4 不新增 schema、不修改 0019 migration、不新增 RPC、不引入数据库事务；本阶段不做 AI 自动关联、复杂关系可视化、拖拽连线、公开页面展示或复杂权限继承。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path。

## Recent Decisions

- 公开研究工作站与私密后台已经分离：公开只读路由为 `/projects`、`/publications`、`/skills`、`/knowledge`；后台管理路由为 `/dashboard/...`。
- 文件附件默认比正文更严格。即使内容 public，关联 Documents 仍保持 private。
- Publication 有关联 `documents` 或 `document_collections` 时禁止直接删除，要求先处理附件。
- Documents 上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。
- Phase 2E-B 的 restricted 基础代码保留，但 Viewer 登录问题仍未稳定，后续单独做 Phase 2I / hotfix。
- Phase 2F / 2G 只优化公开站点运营体验、SEO 和 UI，不扩展权限系统。
- Resume 模块采用统一素材库、版本组合、浏览器预览 / 打印、Word 即时导出、AI JD 建议和 JD 分析历史；AI 输出只作为建议，不自动写回素材或版本。
- Career Center 已进入稳定维护状态；后续只做 bugfix、文案修正和 broken link 修复，不主动扩展面试记录、提醒、邮件、Notion 同步或自动投递。
- Market Brief / 市场简报已因数据可靠性不足弃用并从产品入口和代码主路径移除；历史迁移 0013-0017 暂作 unused legacy data，不在当前路线继续维护。
- Phase 2P-A / 2P-B / 2P-C 将 Documents 扩展为统一私密附件底座，并把附件查看、预填上传、新建后上传串到 Project / Publication / Knowledge / Skill 后台流程中。
- Phase 2P-D / 2P-E-1 / 2P-E-1-B / 2P-E-1-C / 2P-E-2 / 2P-E-3 将 Documents 进一步打磨为可维护的私密附件管理系统；metadata 修正、批量关联整理、详情页分组展示、文档包整体迁移、受确认保护的删除能力和 zip 临时下载均不新增 migration。
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
- 后续数据库变更必须新增 `0020_*` 或更高编号 migration，不修改或重跑已执行过的旧 migration。

## Known Issues

### Viewer magic link 登录问题

状态：未稳定；后续单独做 Phase 2I / hotfix，当前不视为已验收能力。

现象：

- 已授权邮箱仍可能无法发送 magic link。
- magic link 成功后 viewer session 可能未稳定建立。
- 已授权用户仍可能无法查看 restricted 内容。

影响：

- 不影响 public 内容浏览。
- 不影响管理员后台。
- 不影响 Documents 私密文件。
- 不影响访问申请提交与审批。
- 不影响公开站点 SEO 和 UI。

边界：

- Phase 2I 只能修复 viewer login、viewer callback、viewer session 与 restricted 只读访问闭环。
- 不得扩大 restricted grants、RLS、Supabase Auth 或 Storage 权限边界。
- Documents、signed URL 和 Storage 路径仍不得对 Viewer 或公开访客开放。

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

规则：

- 已执行 migration 不应修改或重跑。
- 0013 至 0017 是 Market Brief unused legacy data 对应迁移；当前产品代码不再依赖这些旧表，本轮不 drop。
- 执行 0019 后，后续数据库变更应新增 `0020_*` 或更高编号。
- 不得放宽 RLS、Storage policies 或 Documents 访问边界。

## Workflows

重复流程：

- 本地开发：`npm run dev`。
- 每轮代码修改后验证：`npm run lint`、`npm run build`。
- Supabase 数据库变更：新增 migration，不修改已执行旧 migration。
- Documents 上传：prepare metadata -> 浏览器直传 private `workspace-files` -> finalize 写库 -> 必要时清理失败对象。
- 新建内容并上传附件：先创建 Project / Publication / Knowledge / Skill，成功后跳转 `/dashboard/documents/upload` 并通过 query params 预填关联对象、上传模式、分类和文档包类型。
- Documents metadata、清理与导出维护：文件详情页修正单个文件显示名、分类、关联对象；文档包详情页修正文档包名称、描述、类型、关联对象；列表页用 category、related_type、collection 筛选整理；Documents 列表或文档包详情页批量移动多个文件关联对象、批量解除关联、批量删除文件或下载选中文件 zip；内容详情页用文档包、独立文件、跨文档包文件分组理解附件关系；文档包详情页整体迁移 / 同步关联工具用于同步调整整个资料包和包内全部文件；危险区用于删除整个文档包及文件；文档包详情页或内容详情页文档包卡片用于下载整个文档包 zip；跨模块查找资产时先使用 `/dashboard/search?q=关键词` 按 metadata 搜索，再用 `type` 筛选聚焦 Documents、Knowledge、Projects 等类型。
- Project 研究中枢维护：进入 `/dashboard/projects/[id]` 先查看研究问题、背景、方法和进度；整理项目附件时使用页面内上传项目文件 / 文件夹或项目 Documents 筛选入口；整理相关资产时查看显式关联的知识笔记和学术成果，Skill 先通过标题或标签搜索定位。
- Knowledge 知识节点维护：进入 `/dashboard/knowledge/[id]` 先查看摘要、正文、分类、标签和关联 Project；整理知识资料时使用页面内上传知识资料 / 文件夹或 Knowledge Documents 筛选入口；查找相关资产时查看同项目 Publications，并用搜索入口查找 Project / Publication / Skill。
- Skill 能力包维护：进入 `/dashboard/skills/[id]` 先查看用途说明、平台、状态、版本和使用内容；整理 Skill 资料时使用页面内上传 Skill 资料 / 文件夹或 Skill Documents 筛选入口；查找相关资产时使用 Skill 名称或 platform 搜索 Project / Knowledge / Publication；Skill package 只作为私密资料管理，不在站内执行。
- Publication 成果中枢维护：进入 `/dashboard/publications/[id]` 先查看 summary、abstract、成果类型、标签、发表日期和关联 Project；整理成果材料时使用页面内上传成果材料 / 文件夹或 Publication Documents 筛选入口；查找相关资产时查看同项目 Knowledge，并用搜索入口查找 Project / Knowledge / Skill；`file_path` 不作为下载入口。
- 研究资产显式关系维护：进入任意 Project / Knowledge / Skill / Publication 后台详情页，在“显式关联资产”区域选择目标资产、relation_type 和可选备注；目标较多时用“筛选目标资产”按标题或 metadata 本地过滤；保存后当前页显示 outbound，对方详情页显示 backlink；关系较多时按方向、对方资产类型和 relation_type 筛选；如需理解某个资产的关系上下文，从该资产详情页查看 outbound 和 backlinks，并通过对方资产链接继续跳转；如需修正关系语义或说明，展开“编辑关系”只修改 relation_type / note；如需更换 source / target，删除后重新创建；Documents 仍通过文件面板、Documents 列表和文档包详情页管理。
- 项目记忆更新：先读 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`，再按 SOP 同步 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`、`docs/workflows.md`，并标记 stale / superseded。

详细流程见 `docs/workflows.md`。

## Next Steps

建议顺序：

1. Phase 2P / 2Q 相关真实环境验收：确认 `0018_document_collections_and_folder_uploads.sql` 和 `0019_research_asset_links.sql` 已在目标 Supabase 环境执行，验证多文件 / 文件夹上传、文档包详情、四类内容详情页附件区域、create-and-upload flow、批量关联整理、RelatedDocumentsPanel 分组展示、文档包整体迁移 / 同步关联工具、受确认保护的删除流程、zip 临时下载、`/dashboard/search` metadata 搜索、type 筛选与关键词高亮，以及 `/dashboard/projects/[id]`、`/dashboard/knowledge/[id]`、`/dashboard/skills/[id]`、`/dashboard/publications/[id]` 的中枢展示、快捷操作、显式资产关系、backlinks、目标资产筛选、关系筛选和关系编辑。
2. Phase 2I：Viewer 登录与 restricted 访问专项修复。
3. 研究资产内容维护：补齐 Projects、Publications、Knowledge、Skills 的公开质量与附件关联。
4. 稳定维护 Career Center：只处理 bugfix、文案修正和 broken link。

暂不主动推进：

- Market Brief / 市场简报恢复。
- 新的求职自动化。
- 公开附件下载。
- viewer 附件授权下载。
- OCR、文件内容索引、AI 文件总结。
- Google Calendar、提醒系统、Notion 同步。

## Stale Or Superseded Notes

- “页面数据仍保持 mock data 预览”已过时。Projects、Knowledge、Skills、Publications、Documents、Access Requests、Access Grants、Profile、Calendar、Resume 与 Career 已使用真实 Supabase 数据或真实表结构；公开 `/calendar` 仍保留占位展示，真实管理入口为 `/dashboard/calendar`。
- “restricted 属于后续规划，尚未进入 schema / RLS / UI”已过时。restricted 基础代码和 migration 已完成，但 viewer 登录链路仍待修。
- “后台页面仍位于公开候选路径”已过时。主要后台管理页面已迁移到 `/dashboard/...`。
- “Phase 2K-D 才做 AI JD 优化”已过时。Resume 已完成规则化质量检查、AI JD 建议、JD 分析历史、投递看板和 Career Center；后续默认稳定维护。
- “Market Brief 是可继续扩展模块”已废弃。Market Brief 已在 Phase 2N-Z 移除产品入口和代码主路径，后续不维护相关 runner、素材包、探针或环境变量。
- “Documents 只服务 Publication 附件”已过时。Documents 已升级为 Project / Publication / Knowledge / Skill 的统一私密附件底座。
- “后续数据库变更应新增 `0018_*`”已过时。`0018_document_collections_and_folder_uploads.sql` 已存在；该过渡备注也已被 2Q-B-1 的 `0019` 取代。
- “后续数据库变更应新增 `0019_*`”已过时。`0019_research_asset_links.sql` 已存在，后续应使用 `0020_*` 或更高编号。
- “Publication / Skill 与 Knowledge 的显式关系留到后续 Phase 2Q-B 统一设计”已过时。Phase 2Q-B-1 已新增 `research_asset_links` 管理员后台显式关系底座，但 Documents 仍保持独立附件关系模型。
- “Skill 当前没有 Project / Knowledge / Publication 显式关联字段，只能搜索相关资产”已过时。Skill 仍不新增单独外键字段，但可通过 `research_asset_links` 建立显式关系。
- “后台存在独立全局研究资产关系视图页面”已过时。Phase 2Q-B-4 已移除该模块；显式关系仍在四类资产详情页维护。
