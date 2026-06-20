# Product Roadmap

## Product Positioning

黄铭语个人数字工作站当前定位为：

> 黄铭语的个人长期资产沉淀主基地 / Personal Asset Intranet。

网站同时承担：

- 对外公开展示研究方向、公开项目、学术成果、知识笔记和 AI Skill / 工作流。
- 对内管理全部项目、知识、成果、统一私密附件、日程、公开内容运营和求职闭环。
- 维护求职中心 / Resume / AI JD / 投递看板的闭环，但后续只做 bugfix 和必要文案修正。

当前路线暂停 Agent CEO / 自动化扩张线，优先做已有资产模块的边界、定义、文案和体验 polish。Skill 仍可沉淀可复用流程、Prompt 模板和自动化方法，但不新增自动化中心、任务中心、runner 或外部集成主线。

Notion 可作为草稿、临时研究笔记、日常记录和自动化中间层，但正式公开门户、权限系统、私密资产库和统一浏览体验继续由个人网站承担。

Market Brief / 市场简报模块已在 Phase 2N-Z 后弃用并从产品入口和代码主路径移除。后续路线不再维护 Market Brief、市场素材包、行情探针或相关生成任务。

v1.1 已作为 Personal Asset Intranet polish 收口。后续近期路线不新增大模块，优先稳定使用、真实资产录入、明显 bugfix、轻量 UX polish 和安全边界复查。

v1.1.4 新增 Workstation API/CLI design，先为未来 Codex 通过受控 CLI / Admin API 操作个人工作站做方案冻结。本阶段仍不实现真实 API、CLI、token、migration、RLS 或 Storage policy；后续如果继续推进，应先进入 v1.2.0 Workstation Admin API MVP。

v1.2.0 已完成 Workstation Admin API MVP：第一批只包括 health、Project / Knowledge / Skill list/create 和 Document Collections metadata list。它使用服务端 `WORKSTATION_API_TOKEN` 静态 token，不实现文件上传、token 管理页面、operation_logs 表、migration、RLS 或 Storage policy。

v1.2.1 已实现 Workstation CLI MVP：新增 `npm run workstation -- ...` 本地薄层入口，支持 health、Project / Knowledge / Skill list/create 和 Collection list。CLI 只调用 Admin API，不直接连接 Supabase，不读取或保存 service role key，不支持 upload、delete、update、public publish 或 visibility manage。

v1.2.2 已完成 Workstation diagnostics and CLI query polish；v1.2.3 已完成 operation logs and permission hardening，新增 requestId、审计表、后台只读日志页和 best-effort rate limit。文件上传、update/delete、public publish、visibility manage、token lifecycle 和 MCP / Agent CEO 仍保持后置。

v1.2.4 已完成 Workstation Codex Skill wrapper：新增 `.codex/skills/workstation/SKILL.md` 作为 Codex 调用 Workstation CLI 的项目内说明层，明确适用场景、命令入口、环境变量、安全边界、标准流程和错误 requestId 处理。本阶段只做说明包装，不新增任何真实 API / CLI 能力。

## Access Layers

### Public Research Workstation

所有访客无需登录即可访问：

- 公开首页。
- About 页面。
- 公开 Projects / Publications / Skills / Knowledge 列表与详情。
- 公开统计、精选内容和 SEO 页面。

公开页面不得展示：

- private、unlisted 或历史 restricted 内容。
- 后台新增、编辑、删除入口。
- private / unlisted Documents、raw 附件关系、signed URL、Storage bucket 或 Storage 路径。
- Activity Logs、私密日历、内部任务或管理设置。

公开 Project / Publication 详情页可以展示显式 public 文件附件摘要，但只能通过安全下载路由访问，不直接输出 Storage 路径或 signed URL。

### Private Admin Backend

只有管理员本人可以进入后台，用于：

- 查看全部 public / unlisted / private 内容。
- 新建、编辑和删除 Projects、Publications、Knowledge、Skills。
- 上传与管理私密 Documents、文档包和文件夹上传。
- 查看 Dashboard、公开内容维护提示和 Activity Logs。

管理员身份继续由 Supabase Auth、`public.admin_users` 和 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。

### Retired External Access

Phase 2R-Z 已退役：

- 外部访问申请。
- Access Grants。
- Viewer magic link / callback。
- restricted 外部授权。

这些能力不再作为待修问题或未来路线恢复；公开站点只展示 public 内容。

## Visibility Model

| 可见性 | 含义 | 公开列表展示 | 当前状态 |
| --- | --- | --- | --- |
| public | 所有人可浏览 | 是 | 已稳定使用 |
| unlisted | 不公开列出，当前保持保守 | 否 | 字段与后台管理已具备，公开访问保持保守 |
| private | 仅管理员本人可查看 | 否 | 已稳定使用 |

文件附件默认比正文更严格。Documents 是 Project / Publication / Knowledge / Skill 的统一默认私密附件底座；上传默认 private。Phase 2R-A-4A 起，只有管理员显式设为 public 且关联到 public 资产的文件，才会在对应公开内容页展示安全附件摘要并通过短时签名下载路由访问。外部授权链路已移除，不存在通过 viewer 获得 Documents 权限的路径。

## Phase Status

### Phase 1 - Frontend MVP

已完成并合并。建立 Next.js App Router、TypeScript、Tailwind CSS、Lucide React 的前端原型和主要页面。

### Phase 2A - Supabase Auth And RLS Foundation

已完成并合并。建立 Supabase Auth、RLS、管理员登录、后台路由保护与 Vercel 部署基础。

### Phase 2B - Core Content CRUD

已完成并通过生产验收。Projects、Knowledge Base、Skills Library、Skill 最小版本记录、Dashboard 真实读取与公开首页 public + featured 展示已经接入真实 Supabase 数据。

### Phase 2C - Publications And Secure Documents

已完成并通过生产验收。Publications 真实 CRUD、Documents 私密文件上传/下载/删除、private `workspace-files` bucket、Publication 附件关联、删除保护、Dashboard 成果统计与 Activity Logs 已完成。

### Phase 2P-A - Document Collections And Folder Uploads

已完成代码实现。Documents 升级为统一私密附件底座，新增 `document_collections` 文档包、多文件上传、文件夹上传、relative_path / folder_path 保存、Knowledge 关联、研究工作台常见文件格式白名单、50 MB 单文件上限和 100 文件 / 200 MB 批次限制。

边界：

- 不公开附件。
- 不生成公开下载链接。
- 不做批量 zip 下载。
- 不做 OCR、文件内容索引或 AI 总结。
- 不解析、不执行、不安装上传的代码或 Skill 包。
- 不修改 Resume / Career 逻辑。

### Phase 2P-B - Embedded Content Attachments

已完成代码实现。Project、Publication、Knowledge 和 Skill 后台详情页内嵌关联文件 / 文档包区域，管理员可以在内容对象内查看私密附件、跳转下载、打开文档包详情，并通过预填 query params 进入统一 `/dashboard/documents/upload` 上传文件、文件夹或文档包。

边界：

- 不重复实现上传逻辑。
- 不新增 migration。
- 不改 Storage policy。
- 不公开附件或 signed URL。
- Skill 包仍只作为私密文件存储，不执行、不解析、不安装。
- 不修改 Resume / Career 逻辑。

### Phase 2P-C - Create And Upload Flows

已完成代码实现。Project、Publication、Knowledge 和 Skill 新建表单增加“保存并上传文件 / 文件夹或文档包”操作：Server Action 先创建内容记录，创建成功后跳转到统一 `/dashboard/documents/upload`，并通过 query params 预填 `related_type`、`related_id`、`mode`、`category` 和 `collection_type`。

边界：

- 不做 pending upload 或临时文件 staging。
- 不在 create action 中接收 File 或文件二进制。
- 不让文件经过 Vercel Function。
- 不重复实现 Documents 上传逻辑。
- 不新增 migration，不改 Storage policy。
- 不公开附件或 signed URL。
- Skill 包仍只作为私密文件存储，不执行、不解析、不安装。
- 不修改 Resume / Career 逻辑。

### Phase 2P-D - Document And Collection Management Polish

已完成代码实现。Documents 从上传底座进一步扩展为可维护的私密附件管理系统：

- 文件详情页支持编辑显示名称、分类和关联对象。
- 文档包详情页支持编辑名称、描述、类型和关联对象。
- 文档包级关联与文件级关联允许不一致；修改文档包关联对象不会自动批量同步包内文件。
- Documents 列表支持按 category、related_type、collection 状态筛选，并支持查看未关联文件。
- 内容详情页关联文件面板展示文档包数量和文件数量，并尽量带上具体 related_id 跳转文件中心。

边界：

- 不新增 migration，继续依赖既有 `0018_document_collections_and_folder_uploads.sql`。
- 不修改 Storage policy。
- 不移动、不重命名 Storage object，不修改 `storage_path`。
- 不公开附件、signed URL 或 Storage 路径。
- 不做批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 逻辑，不恢复 Market Brief。

### Phase 2P-E-1 - Bulk Document Relation Actions

已完成代码实现。Documents 后台继续面向大量研究附件整理，新增批量选择和批量关联维护能力：

- Documents 列表支持勾选多个文件。
- 文档包详情页的包内文件列表支持勾选多个文件。
- 批量操作区显示已选择文件数量，并支持批量移动到 Project / Publication / Knowledge / Skill。
- 支持批量解除关联；解除后可通过 `related_type=unlinked` 筛选查看。
- 批量操作保留 Documents 当前筛选 URL；文档包详情页操作后回到当前文档包。

边界：

- 只更新 `documents.related_type` 与 `documents.related_id`。
- 不新增 migration，继续依赖既有 `0018_document_collections_and_folder_uploads.sql`。
- 不修改 Storage policy。
- 不移动、不重命名、不删除 Storage object，不修改 `storage_path`。
- 不修改文件 `collection_id`，不修改文档包自身关联对象。
- 不删除 `documents` 或 `document_collections` 记录。
- 不做批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 逻辑，不恢复 Market Brief。

### Phase 2P-E-1-B - Clarify Related Document Grouping

已完成代码实现。Project、Publication、Knowledge 和 Skill 后台详情页中的关联附件区域进一步澄清文档包与文件的关系：

- 统计仍显示当前对象关联的文档包数量和文件数量。
- 文档包区域展示 `document_collections.related_type / related_id` 指向当前对象的文档包。
- 独立文件区域只展示 `documents.collection_id is null` 且文件级关联指向当前对象的文件。
- 当前对象文档包内文件由文档包卡片代表，不在独立文件区域重复展示。
- 跨文档包文件单独分组展示：文件级关联指向当前对象，但文件仍属于其他文档包。
- 跨文档包文件区域提示管理员该状态合法但需要显式整理。

边界：

- 不新增 migration，不新增字段。
- 不修改 RLS、Storage policy、bucket 或 `storage_path`。
- 不移动、不重命名、不删除 Storage object。
- 不自动同步文档包和包内文件关联。
- 不修改 `document_collections.related_type / related_id`、`documents.related_type / related_id` 或 `documents.collection_id`。
- 不公开附件、signed URL 或 Storage 路径。

### Phase 2P-E-1-C - Collection Relation Sync Tool

已完成代码实现。文档包详情页新增“同步文档包与包内文件关联”工具，用于整体迁移一个资料包或一起解除关联：

- 当前关联对象在操作区内明确展示。
- 管理员可选择目标 Publication、Project、Knowledge 或 Skill。
- 整体迁移会同时更新 `document_collections.related_type / related_id` 和该文档包下全部 `documents.related_type / related_id`。
- 整体解除关联会把文档包和包内全部文件的 `related_type / related_id` 一起置空。
- 空文档包允许执行整体迁移或整体解除关联，此时只修改文档包自身关联。
- 操作完成写入 Activity Log，并记录 `collection_id`、服务端计算的 `document_count`、旧关联和新关联摘要。
- 页面提示该操作不移动、不重命名、不删除 Storage object，也不修改文件 `collection_id`。

边界：

- 不新增 migration，继续依赖既有 `0018_document_collections_and_folder_uploads.sql`。
- 不修改 RLS、Storage policy、bucket 或 `storage_path`。
- 不移动、不重命名、不删除 Supabase Storage object。
- 不修改 `documents.collection_id`。
- 不删除 `documents` 或 `document_collections` 记录。
- 不做批量 zip 下载、OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不公开附件、signed URL 或 Storage 路径。
- 不修改 Resume / Career 逻辑，不恢复 Market Brief。

### Phase 2P-E-2 - Bulk Document Deletion

已完成代码实现。Documents 后台新增受确认保护的删除能力，用于清理不再需要的私密附件：

- Documents 列表支持勾选多个文件后批量删除。
- 文档包详情页支持勾选包内多个文件后批量删除。
- 批量删除会删除所选 `documents` 记录和对应 Supabase Storage object。
- 批量删除文件不会自动删除空文档包；文档包可能保留为 0 文件记录。
- 文档包详情页危险区支持输入 `DELETE` 或 `删除` 后删除整个文档包及包内全部文件。
- 删除整个文档包及文件会删除包内文件记录、Storage object 和 `document_collections` 记录。
- 删除完成写入 Activity Log，只记录文件 ID、数量、collection id 和关联摘要。

边界：

- 不新增 migration，继续依赖既有 `0018_document_collections_and_folder_uploads.sql`。
- 不新增 RPC 或数据库事务；删除流程由 Server Action 分步执行。
- 删除顺序采用先 Supabase Storage object、后数据库记录，以避免数据库记录先消失但文件对象仍残留。
- 不修改 Storage policy、bucket 或 `storage_path` 生成规则。
- 不移动、不重命名 Storage object。
- 不公开附件、signed URL 或 Storage 路径。
- 不做 OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 逻辑，不恢复 Market Brief。

### Phase 2P-E-3 - Document Zip Downloads

已完成代码实现。Documents 后台新增按请求临时生成的 zip 下载能力：

- Documents 列表支持勾选多个文件后下载 zip。
- 文档包详情页支持勾选包内部分文件后下载 zip。
- 文档包详情页支持下载整个文档包 zip。
- Project / Publication / Knowledge / Skill 后台详情页的文档包卡片支持下载 zip。
- zip 内部文件名优先使用 `relative_path`、`original_name`、`name`，并清理 Zip Slip 风险。
- zip 文件按请求临时生成，不保存到 Supabase Storage。
- 下载写入 Activity Log，只记录 document ids、document_count、collection id 和 total_size。

边界：

- 不新增 migration，继续依赖既有 `0018_document_collections_and_folder_uploads.sql`。
- 不新增 RPC、后台任务、队列、cron 或持久化 zip 文件。
- 不修改数据库模型、RLS、Storage policy、bucket 或 `storage_path`。
- 不移动、不重命名、不删除 Supabase Storage object。
- zip 下载仅限管理员后台，不新增公开附件入口，不暴露 Storage 路径或 signed URL。
- 当前限制：最多 50 个文件，总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查。
- 任一 Storage object 下载失败或超过限制时不部分打包。
- 不做 OCR、文件内容索引、AI 文件总结、Skill 包解析或执行。
- 不修改 Resume / Career 逻辑，不恢复 Market Brief。

### Phase 2P-F-1 - Workspace Search

已完成代码实现。后台新增统一研究资产搜索入口：

- 新增 `/dashboard/search` 管理员后台页面。
- Sidebar 和 Topbar 搜索框进入 `/dashboard/search?q=...`。
- 搜索范围包括 Projects、Publications、Knowledge、Skills、Documents 和 Document Collections。
- 搜索只查数据库 metadata，每类最多返回 8 条结果，不做分页。
- q trim 后少于 2 个字符时不执行查询。
- 搜索结果按类型分组，并跳转到对应后台详情页。

边界：

- 不新增 migration、索引、RPC、外部搜索服务或向量库。
- 不读取文件正文，不解析 PDF / Word / Excel / zip。
- 不做 OCR、AI 文件摘要或向量搜索。
- 不读取 Storage object，不生成 signed URL，不展示 Storage path。
- 不新增公开搜索页，不修改公开页面导航。
- 不修改 Storage policy、RLS、Resume / Career 或 Market Brief。

### Phase 2P-F-2 - Workspace Search Filters And Result Polish

已完成代码实现。后台全局搜索继续保持 metadata-only 边界，并优化结果体验：

- `/dashboard/search` 支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选。
- 类型筛选 chips 显示全部和每类命中数量。
- 切换类型时保留当前 `q`，选中类型无结果时显示“当前类型没有匹配结果”。
- 结果卡片显示类型 badge、metadata chips、更新时间和进入详情页箭头。
- 结果标题与描述使用安全 React 文本切片做关键词高亮。
- Documents 结果更明确展示文件分类、原始文件名、相对路径、文件夹和文档包 metadata。
- Document Collections 结果展示 collection type、file count、total size 和 related type。

边界：

- 不新增 migration、索引、RPC、外部搜索服务或向量库。
- 类型筛选只过滤已查询的数据库 metadata 搜索结果，不扩大搜索范围。
- 关键词高亮只发生在前端展示层，不保存索引。
- 不读取文件正文，不解析 PDF / Word / Excel / zip。
- 不做 OCR、AI 文件摘要或向量搜索。
- 不读取 Storage object，不生成 signed URL，不展示 Storage path。
- 不新增公开搜索页，不修改公开页面导航。
- 不修改 Storage policy、RLS、Resume / Career 或 Market Brief。

### Phase 2P-G-1 - File Center UI And Multi-Asset Document Associations

已完成代码实现。Documents 文件中心继续作为统一私密附件底座，并把文件 / 文档包从单一关联对象扩展为专用多资产关联：

- 新增 `document_asset_links` 与 `document_collection_asset_links`，分别记录文件和文档包到 Project / Knowledge / Skill / Publication 的关联。
- 关系类型支持 `related`、`source_material`、`supporting_material`、`deliverable`、`reference`、`input`、`output`，并支持备注。
- `documents.related_type / related_id` 与 `document_collections.related_type / related_id` 保留为 legacy primary relation、路径 fallback 和兼容输入，不作为新展示与筛选的唯一来源。
- 上传页支持一次选择多个关联资产；首个关联会写入 legacy primary relation，全部关联写入专用 link tables。
- 上传到已有文档包时继承文档包多关联，并允许叠加当前页面传入的关联，不再因单一关联不一致而阻断上传。
- `/dashboard/documents` 批量操作区改为紧凑工具栏，支持批量添加关联、按资产移除关联、清空关联、zip 下载、批量删除和高级 legacy primary relation 操作。
- 文件详情页和文档包详情页展示全部关联 chips，并支持添加 / 移除 link-table 关联；文档包关联可选择同步到包内文件。
- RelatedDocumentsPanel 按多关联查询文档包、独立文件和跨文档包文件，并显示关联 chips，避免当前对象文档包内文件重复展示。
- 关联 chips 对同一资产下的 legacy `related` fallback 做展示归一化：已有 `deliverable`、`supporting_material` 等具体关系时不重复显示“相关”。
- #99 追加 UI polish：多关联选择器从原生多选框升级为 checkbox / chips 分组选择器，覆盖上传页、文件详情页、文档包详情页和批量添加关联；文件中心权限列改为轻量状态标签。
- Documents 列表的 `related_type / related_id` 筛选语义改为“包含该资产关联”；`unlinked` 表示既没有专用关联，也没有 legacy primary relation。
- 后台全局搜索继续只查 metadata，但可展示由专用关联表解析出的关联标题。

边界：

- Documents 不纳入 `research_asset_links`；研究资产显式关系仍只覆盖 Project / Knowledge / Skill / Publication。
- 不修改 `0019_research_asset_links.sql`，不修改全局关系图谱移除决策。
- 新增 migration 仅为 `0020_document_asset_links.sql`；不新增 RPC，不修改 Storage policy，不改 RLS 旧策略。
- 不移动、不重命名、不重写 Storage object，不修改 `storage_path` 生成规则。
- `related` 降噪是展示归一化，不删除 legacy 字段、0020 回填 rows 或任何 Storage object。
- UI polish 不新增 migration，仍依赖 0020 的专用多关联表。
- 不公开附件、不生成 public signed URL，不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 文件总结或向量搜索。
- 不修改 Resume / Career、外部授权、Calendar、Profile 或 Market Brief。

### Phase 2Q-A-1 - Project Detail Research Hub

已完成代码实现。Project 后台详情页从普通详情页升级为单个研究项目中枢：

- `/dashboard/projects/[id]` 集中展示项目概览、研究问题、研究背景、研究方法、状态、进度、标签、开始日期、里程碑和项目 metadata。
- 保留返回、编辑和删除项目入口。
- 继续复用 RelatedDocumentsPanel 展示项目关联文档包、独立文件和跨文档包文件。
- 快捷操作支持编辑项目、上传单个项目文件、上传项目文件夹、进入项目 Documents 筛选页、按项目标题搜索和创建知识笔记。
- 相关研究资产使用现有显式关系展示 `knowledge_notes.project_id` 与 `publications.project_id`，每类最多 5 条。
- Skill 当前没有显式项目关联字段，本阶段只提供按项目标题或标签搜索 Skill 的入口。

边界：

- 不新增 migration、RPC、索引、关系表或字段。
- 不新增公开页面入口，不修改公开 Project 详情页。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除流程或 `storage_path` 生成规则。
- 不读取文件正文，不解析附件，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改 Resume / Career 或 Market Brief。

### Phase 2Q-A-2 - Knowledge Detail Node Hub

已完成代码实现。Knowledge 后台详情页从普通 CRUD 笔记详情升级为单个知识节点：

- `/dashboard/knowledge/[id]` 集中展示知识标题、分类、可见性、标签、更新时间、摘要、正文、关联 Project 和知识 metadata。
- 保留返回、编辑和删除知识节点入口。
- 继续复用 RelatedDocumentsPanel 展示知识资料与附件，包括文档包、独立文件和跨文档包文件。
- 快捷操作支持编辑知识节点、上传知识资料、上传知识资料文件夹、进入该知识节点 Documents 筛选页、按知识标题搜索、搜索相关 Project / Publication / Skill，以及打开关联 Project。
- 关联 Project 使用现有 `knowledge_notes.project_id`，没有关联时显示空状态和 Project 搜索入口。
- 相关成果在 2Q-A-2 阶段不新增直接关系；如果 Knowledge 关联 Project，则展示同项目 `publications.project_id` 成果，最多 5 条。该边界已由 2Q-B-1 的 `research_asset_links` 扩展。
- Skill 当前没有显式 Knowledge 关联字段，本阶段只提供按知识标题或标签搜索 Skill 的入口。

边界：

- 不新增 migration、RPC、索引、关系表或字段。
- 不新增公开页面入口，不修改公开 Knowledge 详情页。
- 不修改 Project、Publication 或 Skill 详情页逻辑。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 流程或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改 Resume / Career、外部授权或 Market Brief。

### Phase 2Q-A-3 - Skill Detail Capability Hub

已完成代码实现。Skill 后台详情页从普通 CRUD 展示升级为单个能力包 / 工作流包：

- `/dashboard/skills/[id]` 集中展示 Skill 名称、分类、平台、状态、当前版本、可见性、更新时间、用途说明、输入输出说明、使用指南、`SKILL.md`、版本记录和 metadata。
- 保留返回、编辑和删除 Skill 入口。
- 继续复用 RelatedDocumentsPanel 展示 Skill 资料与能力包附件，包括文档包、独立文件和跨文档包文件。
- 快捷操作支持编辑 Skill、上传 Skill 资料、上传 Skill 资料文件夹、进入该 Skill Documents 筛选页、按 Skill 名称搜索、搜索相关 Project / Knowledge / Publication，以及按 platform 搜索全局资产。
- 2Q-A-3 阶段 Skill 没有 Project / Knowledge / Publication 显式关联字段，因此不伪造相关资产，只提供搜索入口。该边界已由 2Q-B-1 的 `research_asset_links` 扩展。
- Skill package 仅作为私密资料存储和管理，不安装、不解析、不执行。

边界：

- 不新增 migration、RPC、索引、关系表或字段。
- 不新增公开页面入口，不修改公开 Skill 详情页。
- 不修改 Project、Knowledge 或 Publication 详情页逻辑。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 流程或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改 Resume / Career、外部授权或 Market Brief。

### Phase 2Q-A-4 - Publication Detail Output Hub

已完成代码实现。Publication 后台详情页从普通 CRUD 展示升级为单个研究成果中枢：

- `/dashboard/publications/[id]` 集中展示成果标题、类型、可见性、标签、发表日期、更新时间、summary、abstract、关联 Project、成果 metadata 和私密材料。
- 保留返回、编辑和删除成果入口。
- 继续复用 RelatedDocumentsPanel 展示成果材料与附件，包括文档包、独立文件和跨文档包文件。
- 快捷操作支持编辑成果、上传成果材料、上传成果材料文件夹、进入该成果 Documents 筛选页、按成果标题搜索、搜索相关 Project / Knowledge / Skill，以及打开关联 Project。
- 关联 Project 使用现有 `publications.project_id`，没有关联时显示空状态和 Project 搜索入口。
- 同项目 Knowledge 使用现有 `knowledge_notes.project_id`，最多展示 5 条。
- 2Q-A-4 阶段 Skill 没有 Publication 显式关联字段，因此只提供按成果标题或标签搜索 Skill 的入口。该边界已由 2Q-B-1 的 `research_asset_links` 扩展。
- `file_path` 不展示、不作为下载入口；`cover_url` 仅作为后台 metadata 状态展示。

边界：

- 不新增 migration、RPC、索引、关系表或字段。
- 不新增公开页面入口，不修改公开 Publication 详情页。
- 不修改 Project、Knowledge 或 Skill 详情页逻辑。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 流程或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改 Resume / Career、外部授权或 Market Brief。

### Phase 2Q-B-1 - Research Asset Links Foundation

已完成代码实现。Project、Knowledge、Skill、Publication 之间新增管理员后台显式关系底座：

- 新增 `research_asset_links` 表，支持 source / target 多态资产关系。
- 支持关系类型：相关、支持、引用、使用、产出、来源于。
- 四类后台详情页新增“显式关联资产”区域，支持创建 outbound 关系、查看 inbound backlinks、打开对方后台详情页和删除关系。
- Server Action 校验管理员身份、资产类型、source / target 存在性、自关联和重复关系。
- `knowledge_notes.project_id` 与 `publications.project_id` 继续保留，不迁移、不删除、不自动推断。

边界：

- 关系只在管理员后台使用，不新增公开页面展示。
- Documents 不纳入 `research_asset_links`；当前 Documents 多关联由专用 `document_asset_links` / `document_collection_asset_links` 管理，legacy `related_type / related_id` 仅作兼容字段。
- 不新增 RPC，不保存 zip，不修改 Storage policy，不读取 Storage object，不生成 signed URL。
- 不做 AI 自动关联、关系图谱可视化、拖拽连线、公开展示或复杂权限继承。
- 不修改 Resume / Career、外部授权或 Market Brief。

### Phase 2Q-B-2 - Research Asset Links Management Polish

已完成代码实现。基于 2Q-B-1 的 `research_asset_links` 底座，显式关联资产区域增强后台管理体验：

- 新增关系表单支持本地筛选目标资产，按目标标题和 metadata 匹配，不做异步搜索或外部搜索。
- 关系列表新增总数、outbound、inbound、当前筛选数量和 relation_type 数量统计。
- 关系列表支持按方向、对方资产类型和 relation_type 筛选；筛选只在当前页面已查询结果中完成，不写入 URL。
- 关系卡片展示对方资产类型、标题、中文关系标签、方向、关系句子、备注、更新时间、打开对方资产、编辑关系和删除关系。
- 编辑关系只允许修改 `relation_type` 与 `note`；source / target 不允许修改，如需更换目标资产需要删除后重新创建。

边界：

- 本阶段只增强管理员后台管理体验，不新增公开页面展示。
- 关系仍只覆盖 Project / Knowledge / Skill / Publication；Documents 仍不纳入 `research_asset_links`。
- 不新增 migration，不修改 `0019_research_asset_links.sql`，不新增 RPC，不引入数据库事务。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path。
- 不做 AI 自动关联、关系图谱可视化、拖拽连线、批量导入、批量删除或复杂权限继承。
- 不修改 Storage policy、Documents、Resume / Career、外部授权或 Market Brief。

### Phase 2Q-B-3 - Research Asset Network View MVP

历史状态：曾完成代码实现，但已被 Phase 2Q-B-4 移除。基于 2Q-B-1 / 2Q-B-2 的显式关系底座，当时新增管理员后台只读全局关系页面：

- 新增独立后台全局关系页面，并在后台侧边栏显示入口。
- 最多读取最近更新的 200 条 `research_asset_links`，节点只来自这些关系的 source / target。
- 页面展示节点总数、关系总数、Project / Knowledge / Skill / Publication 节点数量和 relation_type 数量。
- 采用轻量分组列表：按资产类型展示节点卡片、出度、入度和详情入口，不引入复杂可视化库。
- 页面下方展示只读“全部关系列表”，source / target 均可跳转到对应后台详情页。
- 支持按资产类型、relation_type 和节点标题 / metadata 关键词进行前端本地筛选。
- 四类资产详情页的显式关联资产区域曾增加全局页面入口。

边界：

- 该全局页面只读，不提供 create / edit / delete；关系维护仍在资产详情页完成。
- 只展示 Project / Knowledge / Skill / Publication；Documents 仍不纳入显式关系表。
- 不新增 schema，不修改 `0019_research_asset_links.sql`，不新增 migration、RPC 或数据库事务。
- 不引入 d3、cytoscape、react-flow 等复杂可视化库，不做拖拽连线、编辑或批量关系管理。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path。
- 不做 AI 自动关联、公开展示、向量搜索、外部搜索服务或复杂权限继承。
- 不修改 Storage policy、Documents、Resume / Career、外部授权或 Market Brief。

### Phase 2Q-B-4 - Remove Research Asset Network View

已完成代码实现。用户判断全局关系页面对实际工作效率帮助有限，因此取消该大模块，保留单个资产详情页中的显式关系管理：

- 删除独立后台全局关系页面，不再提供全局关系可视化入口。
- 删除后台侧边栏中的全局关系入口。
- 删除四类资产详情页 AssetLinksPanel 附近的全局页面入口。
- 删除该页面专用查询和组件。
- 保留 `research_asset_links` 表、`0019_research_asset_links.sql`、Server Actions、校验、查询和 AssetLinksPanel。
- Project / Knowledge / Skill / Publication 详情页仍可创建、编辑、删除显式关系，查看 outbound 和 backlink。

边界：

- 不删除 `research_asset_links` 表。
- 不删除或修改 `0019_research_asset_links.sql`。
- 不新增 migration，不新增 RPC，不修改 RLS 或 Storage policy。
- 不做新的可视化替代方案，不引入新的可视化库。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path。
- Documents 不纳入 `research_asset_links`，继续使用文件和文档包专用关联模型。
- 不修改 Resume / Career、外部授权或 Market Brief。

### Phase 2R-A-1 - Public Research Workstation Homepage Polish

已完成代码实现。后台 Documents、搜索、研究资产详情页和显式关系管理阶段性完成后，下一阶段转向公开展示质量，把首页和公开导航打磨为更清晰的“黄铭语研究工作站”入口：

- 首页首屏 H1 改为“个人研究工作站”，站点身份仍在品牌、metadata、footer 或 eyebrow 中保留“黄铭语研究工作站”。
- Hero 恢复左侧个人定位、标题、说明、标签 chips 和 CTA，右侧展示公开项目、公开成果、公开 Skill、知识笔记四张统计卡片。
- 首页展示研究方向、公开 Project / Publication / Knowledge / Skill 预览。
- 首页 section 使用更明确的 wrapper、边框、间距和交替背景；公开项目与学术成果内部两列分隔，Knowledge 和 Skill 独立成段。
- Knowledge / Skill 首页预览改为更紧凑的 preview card，最多展示 4 条 public 内容，不影响公开列表页卡片设计。
- 首页增加克制的 micro-interactions：统计卡片、CTA、标签 chips 和预览卡片 hover / focus 时轻微上浮、边框变化和箭头位移。
- 公开导航包含首页、研究项目、学术成果、知识库、Skill 库和轻量“管理员登录”。
- 普通访客公开导航不显示后台菜单、文件中心或全局关系图谱入口。
- 公开 Publication 查询收窄展示边界，公开页面不使用历史 `file_path` 或附件字段。

边界：

- 公开页面只展示 public 内容；private、unlisted 和历史 restricted 内容不进入公开展示，也不通过访问申请或 viewer 授权处理。
- Documents 原始管理、多资产文件关联、`research_asset_links` 和 AssetLinksPanel 仍只在管理员后台使用。
- 本阶段不公开附件下载；该边界已在 Phase 2R-A-4A 精确化为只允许显式 public 文件经安全下载 route 访问。仍不展示 Storage 路径或 signed URL。
- 不新增 migration，不新增 RPC，不修改 RLS 或 Storage policy。
- 不修改 Documents 上传、删除、zip 下载、Resume / Career、Market Brief 或后台显式关系管理。

### Phase 2R-A-2 - Public Homepage Hero Visual Identity

已完成代码实现。在不改变首页信息架构和公开边界的前提下，继续 refine 首屏视觉识别：

- Hero 仍采用左侧个人定位、说明、标签 chips 和 CTA，右侧公开项目、公开成果、公开 Skill、知识笔记统计卡片。
- H1 文案继续保持“个人研究工作站”，但使用更适合中文研究标题的系统 serif 字体栈、克制渐变和兼容 fallback。
- Hero 背景增加自绘 CSS 装饰层：轻量网格、研究纸张轮廓、抽象 K 线 / bar、散点、曲线和公式片段，用于表达金融、量化、研究和学术氛围。
- 统计卡片继续保持轻量 hover，上浮、阴影、icon grid 和箭头位移动效更统一。
- 背景元素不使用真实市场数据、具体股票代码、外部图片、字体文件、外部字体服务、图表库或动画库。

边界：

- 不新增 migration，不新增 RPC，不修改 RLS 或 Storage policy。
- 不修改 Supabase schema、Documents 后台、文件多关联逻辑、AssetLinksPanel、Resume / Career 或 Market Brief。
- 不改变公开内容查询；公开页面仍只展示 public 内容。附件边界已在 Phase 2R-A-4A 精确化为显式 public 文件安全下载；仍不公开 private Documents、Storage path、signed URL、`file_path`、raw `document_asset_links` 或 `research_asset_links` 管理能力。

### Phase 2R-A-3 - Public Research Listing Pages Polish

已完成代码实现。公开首页完成后，四个公开列表页继续统一为正式研究内容索引：

- `/projects`、`/publications`、`/knowledge`、`/skills` 采用统一 listing header、公开统计、轻量筛选、内容 grid 和友好空状态。
- Projects 支持基于 status、tag、featured 和关键词的轻量浏览；卡片展示 title、summary、status、progress、tags 和详情入口。
- Publications 支持基于 publication_type、tag、时间排序和关键词的轻量浏览；公开查询继续清空 `file_path` / `cover_url`，不展示附件入口。
- Knowledge 支持 category、tag 和关键词浏览，卡片更紧凑，适合多条公开知识笔记扫描。
- Skills 支持 status、category、platform 和关键词浏览，平台 chips 清晰展示，仍只作为公开说明目录，不提供 Skill package 下载或执行入口。
- 四页 metadata 标题统一为“页面名 | 黄铭语研究工作站”。

边界：

- 不新增 migration，不新增字段，不新增 RPC、索引、外部搜索服务、全文搜索、OCR、AI 摘要或向量搜索。
- 不修改 RLS、Storage policy、Documents 后台、文件多关联逻辑、AssetLinksPanel、Resume / Career 或 Market Brief。
- 公开列表页只展示 public 内容，不展示 Documents、Storage path、signed URL、`file_path`、`document_asset_links` 或 `research_asset_links` 管理能力。

### Phase 2R-A-4A - Public Document Attachments Foundation

已完成代码实现。公开内容详情开始支持安全的公开附件底座，但不做公开文件中心或大规模下载页：

- Documents 上传仍默认 private，不自动公开既有文件。
- 文件详情页可编辑 `documents.visibility`，文件中心批量工具可将选中文件设为 public 或 private。
- 公开 Project / Publication 详情页可展示当前 public 资产关联的 public 文件附件。
- 公开附件组件只展示安全摘要字段：文件名、分类、文件大小、MIME type、更新时间、关系标签和下载入口。
- 下载入口使用 `/public-files/[id]/download`，服务端复核文件 public、当前资产 public、文件确实关联该资产后，才按需生成 60 秒短时 signed URL。
- 同一文件对同一资产已有具体关系时，公开附件关系标签同样隐藏低价值 legacy `related` fallback。
- `0021_public_attachment_service_role_grants.sql` 作为生产 hotfix 补齐 server-side public 附件查询 / 下载校验所需的 `service_role` 只读 grant，避免 Vercel 已配置 service-role key 但 Supabase 表级权限返回 permission denied。

边界：

- 不新增业务 schema；沿用既有 `documents.visibility`、`document_collections.visibility` 和 `0020_document_asset_links.sql`。0021 只补 `service_role` 的 `select` grant。
- 不修改 RLS、Storage policy、bucket、`storage_path`、上传、删除、zip 下载或文件多关联数据模型。
- 不公开 private / unlisted / 历史 restricted 文件，不公开文档包 zip 下载，不公开 raw `document_asset_links`、relation note、owner_id、Storage path、Storage bucket、signed URL 或 `file_path`。
- Knowledge / Skill 公开附件展示可作为后续独立 polish；本阶段只把基础能力接入 Project / Publication 详情页。

### Phase 2R-A-4B - Public Research Detail Pages Polish

已完成代码实现。四类公开详情页统一为正式研究详情体验：

- `/projects/[slug]`、`/publications/[slug]`、`/knowledge/[slug]`、`/skills/[slug]` 共享公开详情 hero、主内容 section、侧栏 metadata、标签和 related public content 设计语言。
- Project 详情展示研究问题、背景、方法、状态、进度、标签、相关公开成果 / 知识和 2R-A-4A 的公开附件面板。
- Publication 详情展示成果摘要、类型、发布日期、公开关联项目、相关公开知识和 2R-A-4A 的公开附件面板。
- Knowledge 详情展示分类、摘要 / 正文、公开关联项目、相关公开知识 / 成果；不展示 Documents。
- Skill 详情展示说明、输入 / 输出 / 使用指南、平台、状态、版本和相关公开 Skill；不展示 Skill 私密附件或 package，不执行、不安装、不解析 Skill 文件。
- 四类详情页 metadata 使用内容标题、公开摘要截断和 canonical path，不包含私密字段、Storage、`file_path` 或内部关系信息。

边界：

- 不新增 migration，不新增字段，不新增 RPC，不修改 RLS、Storage policy、bucket、`storage_path`、Documents 上传 / 删除 / zip 下载或文件多关联核心逻辑。
- 详情页只读取 public 详情查询；private / unlisted / 历史 restricted 内容不输出正文或附件，只显示安全 fallback。
- Related public content 只来自 public 记录或公开字段推导，不展示 `research_asset_links` 管理数据、后台关系备注、raw `document_asset_links` 或 private Documents。
- Project / Publication 公开附件仍必须满足文件 public、当前资产 public、文件关联当前资产；Knowledge / Skill 本阶段不开放公开附件展示。

### Phase 2R-B-1 - Access Request And Restricted Content Experience Polish (retired by 2R-Z)

历史实现，Phase 2R-Z 已移除。当前代码不再保留访问申请页、访问申请 CTA、viewer 登录入口或后台申请审核入口。不要恢复该能力。

- 未公开 slug fallback 仅显示“内容不存在或未公开”，不确认内容是否存在。
- 公开详情页不显示申请访问 CTA。
- 旧 `/access-request` 和 viewer 登录入口已删除。

边界：

- 2R-Z 不修改 Documents、Storage policy、public 文件下载 route 或后台核心内容管理。

### Phase 2R-C-1 - Public SEO And Sharing Polish

已完成代码实现。公开站点具备更正式的 SEO、分享卡片、sitemap 和 robots 体验：

- 公开页面 metadata 使用统一站点模板“黄铭语研究工作站”，避免 title 重复站点名。
- 首页分享标题为“个人研究工作站 | 黄铭语研究工作站”，描述聚焦公开研究项目、学术成果、知识笔记与 AI 工作流。
- 公开列表页 Open Graph / Twitter card 标题使用“研究项目 / 学术成果 / 知识库 / Skill 库 | 黄铭语研究工作站”。
- 公开详情页分享标题使用内容标题，description 使用 public summary / excerpt / description 截断。
- 统一复用 `public/research-workstation-hero.png` 作为公开安全分享图片，不生成包含私密信息的动态 OG 图片。
- sitemap 包含公开静态入口和所有 public Project / Publication / Knowledge / Skill 详情；Supabase 查询失败时安全降级为基础公开静态页面。
- robots 允许公开页面索引，阻止 dashboard、login、access-request、viewer、api、documents、public-files、admin、storage 和 signed 等路径。

边界：

- 不新增 migration，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。
- sitemap 不包含 private / unlisted / 历史 restricted 内容，不包含 `/public-files/[id]/download`、signed URL、Storage path、dashboard、viewer 或 admin login。
- metadata 不读取或输出 private / unlisted / 历史 restricted 正文、private Documents、`file_path`、raw `document_asset_links`、`research_asset_links` 管理数据、Storage bucket、Storage path、signed URL 或 owner_id。
- robots 和 sitemap 不是安全边界；真实边界仍依赖 Supabase Auth、RLS、Storage policy 和服务端下载 route 校验。

### Phase 2R-C-2 - Public Launch QA And Hardening

已完成代码实现。公开站点主链路进入发布前 QA 与轻量 hardening：

- 新增 `npm run smoke:public`，对运行中的公开站点巡检首页、四类列表页、未公开 fallback、sitemap、robots、metadata 和敏感字段边界。
- 公开页面文案进一步收敛，不在访客页面直接展示 Storage / signed URL 等内部实现词。
- 公开附件 metadata 行增加长分类、关系标签、MIME type、文件大小和更新时间的换行保护，降低 390px 移动端横向溢出风险。
- smoke 覆盖 fallback noindex、sitemap 不包含 public file download route、robots 阻止 dashboard / API / viewer / login / access-request / public-files。

边界：

- 不新增 migration，不新增业务 schema，不新增字段、RPC、索引、邮件服务、搜索服务或外部依赖。
- 不修改 RLS、Storage policy、bucket、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或 public 附件服务端校验逻辑。
- 不恢复 Market Brief，不修改 Resume / Career，不恢复 `/dashboard/network`。
- `npm run smoke:public` 只用于发布前公开路由巡检，不作为权限边界；真实安全仍依赖 Auth、RLS、Storage policy 和服务端下载 route 校验。

### Phase 2R-D-1 - Public Content Operations Foundation

已完成代码实现。公开站点主链路完成后，后台新增轻量公开内容运营辅助：

- Project / Publication / Knowledge / Skill 后台详情页新增 public readiness checklist。
- checklist 基于已有字段与现有关系判断：visibility、slug、标题 / 名称、摘要 / description / excerpt、标签 / 分类、正文 / 使用说明、Project 关联、显式资产关系和 Project / Publication public 附件计数。
- 新增 `docs/public-content-operations.md`，说明什么内容适合 public、什么内容应保持 private / unlisted、四类资产发布检查清单、公开附件边界、外部授权退役边界和发布前 QA。
- checklist 只是管理员后台提示，不阻止保存，不自动修改 visibility，不自动公开内容或附件。

边界：

- 不新增 migration、数据库字段、RPC、索引、AI、OCR、向量搜索、全文搜索、邮件服务、审批流、支付或会员能力。
- 不修改 RLS、Storage policy、bucket、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。
- 不改变公开页面安全边界；Knowledge / Skill 公开详情页仍不展示 Documents，Skill 仍不展示 package、不下载、不执行、不安装、不解析文件。

### Phase 2R-F-1 - Public About Profile Polish

已完成代码实现。`/about` 升级为正式公开个人简介页：

- Hero 展示姓名 / 站点身份、简短定位、公开简介和 Projects / Publications / 首页 CTA。
- Research Focus 展示金融研究、量化分析、AI 工具、研究资产管理和公开研究工作站建设等方向。
- Workstation Explanation 说明公开研究工作站用于展示 public 项目、成果、知识笔记和 Skill / 工作流，私密文件和后台资料不会公开。
- Skills / Tools 展示金融研究、数据分析、Next.js / Supabase / GitHub / Vercel、Codex / ChatGPT / 自动化工作流等公开能力方向。
- Public Content Navigation 连接 Projects、Publications、Knowledge 和 Skills。
- Contact / Links 只展示公开 Profile 字段，缺失时保守提示后续补充。

边界：

- 不新增 migration，不修改 RLS、Storage policy、Documents、public file download route 或公开内容核心查询。
- 不恢复访问申请、Viewer login、Access Grants 或 restricted 外部授权。

### Phase 2R-G-1 - v1.0 Final QA And Release Notes

已完成文档收口与 QA 辅助。当前稳定版本进入 v1.0 final QA：

- PR #115 已关闭且不合并，首页保持当前 `main` 主结构。
- 不继续推进 Phase 2R-F-2 homepage featured content polish，不重做首页精选区。
- 新增 `docs/v1-release-notes.md`，记录 v1.0 版本定位、公开站点能力、后台能力、安全边界、退役功能、当前不做事项和可复制验收清单。
- `npm run smoke:public` 补充退役路由不可用性检查，并继续检查公开路由、fallback、sitemap、robots、metadata 和敏感字段边界。
- 现有文档记录 v1.0 发布前只做检查、文档收口和小 bug 修复。

边界：

- 不新增功能、不新增 migration、不新增数据库字段、RPC、索引、AI、OCR、向量搜索、全文搜索、PDF 预览、public zip 下载、支付或会员能力。
- 不修改首页主结构、About 主结构、公开列表 / 详情主结构、后台主结构、Documents、RLS、Storage policy 或 public file download route。
- 不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

### Phase 2R-G-2 - v1.0 Maintenance Playbook

已完成文档收口。当前稳定版本进入 v1.0 日常维护：

- 新增 `docs/maintenance-playbook.md`，记录 public 内容新增、public attachment 公开、部署前检查、部署后检查、安全巡检和故障排查顺序。
- README、current status、roadmap、memory、decisions 和 workflows 记录当前进入 v1.0 稳定维护阶段。
- 暂时跳过 public content sprint，后续真实内容由管理员在后台逐步手动补充。
- 不继续推进 #115 或 Phase 2R-F-2，不重做首页精选区，不大改公开站点或后台主结构。

边界：

- 不新增功能、不新增 migration、不新增数据库字段、RPC、索引、AI、OCR、向量搜索、全文搜索、PDF 预览、public zip 下载、支付或会员能力。
- 不修改首页、About、公开列表、公开详情、后台主结构、Documents、RLS、Storage policy 或 public file download route。
- 不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

### Phase 3A-R - Project AI Draft Form Copilot

已完成代码实现。AI 能力从 #118 的详情页事后点评方向调整为 Project 新建 / 编辑表单中的草稿补全助手；#118 已关闭且不合并。

- `/dashboard/projects/new` 和 `/dashboard/projects/[id]/edit` 表单内新增 AI 草稿补全助手。
- AI 读取当前浏览器表单草稿字段，而不是依赖已保存资产 ID。
- 输入白名单包括 `title`、`summary`、`background`、`research_question`、`methodology`、`tags`、`status`、`visibility`、`milestones`、`progress` 和 `start_date`。
- 输出包括 summary / background / research question / methodology 草稿、标签建议、研究流程、阶段计划、公开准备度、敏感风险和下一步建议。
- 管理员可复制建议，或将字段建议采用到浏览器表单；采用不会提交表单，仍需手动保存。
- 未配置 AI API key 时，Project 表单正常显示，AI 按钮禁用并显示尚未配置提示。

边界：

- 不自动保存数据库，不自动创建 Project，不自动修改 `visibility`，不自动公开内容。
- 不读取 Documents、Storage object、Storage path、file path、owner_id、raw relation rows、private file metadata 或 signed URL。
- 不新增 migration，不新增字段，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public file download route。
- 不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。
- Publication / Knowledge / Skill 表单 AI 已由 Phase 3A-S 作为后续独立阶段扩展完成。

### Phase 3A-S - Extend AI Draft Form Copilot To Publication / Knowledge / Skill

已完成代码实现。Phase 3A-S 按照当前表单字段和使用场景，把 AI Draft Form Copilot 从 Project 扩展到 Publication、Knowledge 和 Skill 新建 / 编辑表单。

- `/dashboard/publications/new` 和 `/dashboard/publications/[id]/edit` 新增 Publication AI 草稿助手。
- `/dashboard/knowledge/new` 和 `/dashboard/knowledge/[id]/edit` 新增 Knowledge AI 草稿助手。
- `/dashboard/skills/new` 和 `/dashboard/skills/[id]/edit` 新增 Skill AI 草稿助手。
- Publication 输入白名单包括 `title`、`publication_type`、`summary`、`abstract`、`tags`、`visibility`、`published_on` 和 `project_id`；输出包括标题建议、summary、abstract、标签、成果定位、结构建议、公开准备度、敏感风险和下一步建议。
- Knowledge 输入白名单包括 `title`、`category`、`excerpt`、`content`、`tags`、`visibility` 和 `project_id`；输出包括标题建议、摘要、正文大纲、Markdown 正文草稿、标签、分类建议、公开准备度、敏感风险和下一步建议。
- Skill 输入白名单包括 `name`、`description`、`category`、`content`、`input_description`、`output_description`、`usage_guide`、`platforms`、`current_version`、`visibility` 和 `status`；输出包括名称建议、描述、详细说明、输入 / 输出说明、使用指南、平台建议、版本号建议、工作流步骤、公开准备度、敏感风险和下一步建议。
- 管理员可复制建议，或将可写回字段采用到浏览器表单；采用不会提交表单，仍需手动保存。
- 未配置 AI API key 时，三类表单正常显示，AI 按钮禁用并显示尚未配置提示。

边界：

- 不自动保存数据库，不自动创建 Publication / Knowledge / Skill，不自动修改 `visibility`，不自动公开内容。
- 不读取 Documents、Storage object、Skill package、uploaded code、zip 内容、file path、owner_id、raw relation rows、private attachment metadata 或 signed URL。
- 不新增 migration，不新增字段，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public file download route。
- 不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

### Phase 3A-T - AI Draft Form Copilot Modes

已完成代码实现。Phase 3A-T 在 Project、Publication、Knowledge 和 Skill 新建 / 编辑表单的既有 AI Draft Form Copilot 中增加模式切换，让管理员按当前写作任务选择不同生成策略。

- 四类表单助手共用三种模式：`complete_missing` 补全空字段、`improve_existing` 优化已有内容、`public_safety_check` 公开风险检查。
- 默认模式为 `complete_missing`，Server Action schema 为旧调用提供默认值，保持向后兼容。
- 生成模式只影响 prompt 策略、进度文案、按钮文案和结果区排序；不改变 AI Provider 配置、管理员校验、白名单字段或保存流程。
- 公开风险检查模式优先展示公开准备度提示、敏感信息风险和下一步整改建议；正文草稿字段可以为空，最终公开判断仍由管理员人工完成。
- 未配置 AI API key 时，四类表单仍正常显示，模式控件可见，AI 按钮禁用并显示尚未配置提示。

边界：

- 不新增详情页 AI，不恢复 #118 的事后点评式 AI Content Copilot。
- 不新增 migration，不新增字段，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public file download route。
- 不读取 Documents、Storage object、Skill package、uploaded code、zip 内容、file path、owner_id、raw relation rows、private attachment metadata 或 signed URL。
- 不自动保存数据库，不自动创建 Project / Publication / Knowledge / Skill，不自动修改 `visibility`，不自动公开内容。
- 不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network` 或 Market Brief。

### Phase 3B - AI Raw Note To Structured Draft Lab

已完成代码实现。Phase 3B 新增独立后台 AI 草稿实验室 `/dashboard/ai-drafts`，用于把原始想法、研究笔记、会议摘录或粗糙文本转换成结构化后台内容草稿。

- 新增后台页面 `/dashboard/ai-drafts`，侧边栏和 Dashboard 快速入口可进入。
- 支持目标类型：`project`、`publication`、`knowledge`、`skill`。
- Server Action 只接受 `targetType` 和 `rawText`，不接受任意 prompt。
- rawText 最多 10000 个字符，最少 20 个字符；服务端会拦截明显 secret、API key、Storage path、signed URL、file_path、owner_id 等敏感模式。
- 输出结构化 JSON 草稿，页面支持复制单个字段或复制完整 Markdown。
- 如果模型返回非 JSON，页面显示原始文本并提示人工复核，不崩溃。
- 未配置 AI API key 时，页面正常显示，生成按钮禁用并提示尚未配置。

边界：

- Phase 3B 不是表单内 copilot；表单内补全仍由 Phase 3A-R / 3A-S / 3A-T 维护。
- 不自动保存数据库，不自动创建 Project / Publication / Knowledge / Skill，不自动修改 `visibility`，不自动公开内容。
- 不新增草稿表，不新增 migration，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public file download route。
- 不读取 Documents、Storage object、Skill package、uploaded code、zip 内容、file path、owner_id、raw relation rows、private attachment metadata 或 signed URL。
- 不恢复 Access Request、Viewer login、Access Grants、restricted 外部授权、`/dashboard/network`、Market Brief 或 #118 详情页 AI。

### Phase 3B-1 - AI Draft Lab To New Form Prefill

已完成代码实现。Phase 3B-1 让 AI 草稿实验室生成的结构化草稿可以带入对应新建表单，减少复制粘贴成本。

- `/dashboard/ai-drafts` 结果区新增“带入新建 Project / Publication / Knowledge / Skill 表单”按钮。
- Handoff 使用当前浏览器 `sessionStorage`，不把完整草稿放进 URL query，不写数据库。
- 四类新建页读取对应 target 的 handoff 后显示确认提示条，管理员可选择“填入表单”或“忽略并清除”。
- 填入后立即清除 `sessionStorage` 中该草稿，避免刷新后重复误填。
- Project 映射 title、summary、background、research_question、methodology、tags、milestones。
- Publication 映射 title、summary、abstract、tags，并在能匹配时填入 publication_type_suggestion。
- Knowledge 映射 title、excerpt、content_draft、tags，并在能匹配时填入 category_suggestion。
- Skill 映射 name、description、content、input_description、output_description、usage_guide、platforms，并在能匹配时填入 category_suggestion。

边界：

- 这只是浏览器表单预填，不自动保存、不自动创建资产、不自动提交表单、不自动修改 `visibility`。
- 不映射 public_readiness_notes、sensitive_risks、next_steps、Project relation、status、Skill package 或 Documents。
- 不新增 migration，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public file download route。
- 不读取 Documents、Storage object、Skill package、uploaded code、zip 内容、private attachment metadata 或 signed URL。

### Phase 2R-E-1 - Access Request Admin Workflow Polish (retired by 2R-Z)

历史实现，Phase 2R-Z 已移除。当前代码不再保留 `/access-request`、后台访问申请页面、提交 / 审核 actions 或对应流程文档。不要恢复该能力。

- 旧访问申请表与后台页面被删除。
- 旧 `docs/access-request-workflow.md` 被删除。
- 未公开 fallback 不再引导申请访问或 viewer 登录。

边界：

- 2R-Z 不修改 Documents、Storage policy、public 文件下载 route 或后台核心内容管理。

### Phase 2R-E-2 - Access Grants Admin Management Polish (retired by 2R-Z)

历史实现，Phase 2R-Z 已移除。当前代码不再保留 Access Grants 后台、创建 / 撤销 actions、grant queries 或流程文档。不要恢复该能力。

- 旧 `/dashboard/access-grants`、`/dashboard/access-grants/new`、`/dashboard/access-grants/[id]` 被删除。
- 旧 `docs/access-grants-workflow.md` 被删除。
- 后续不再修复 Viewer magic link 或 restricted 外部授权。

边界：

- 2R-Z 新增 0022 migration 收紧 visibility / public read policy，并删除旧授权表与授权函数。

### Phase 2R-Z - Remove External Access Request And Viewer Authorization

已完成代码实现。公开研究工作站回到 public-only 展示与管理员私密后台：

- 删除 `/access-request`、`/viewer/login`、`/viewer/callback`、`/dashboard/access-requests`、`/dashboard/access-grants`、`/dashboard/access-grants/new` 和 `/dashboard/access-grants/[id]`。
- 删除访问申请 / 授权相关 actions、queries、forms、validations、context helper 和 viewer redirect helper。
- 公开导航、首页、列表页、详情页和 fallback 不再显示访问申请或 viewer 登录入口。
- 后台 Dashboard 和 sidebar 不再显示访问申请 / 授权入口或待处理申请卡片。
- 后台 visibility 选项收紧为 public / private / unlisted。
- `npm run smoke:public` 不再访问 `/access-request`，并检查 fallback 不含访问申请 / viewer 登录链接。
- 新增 `0022_remove_external_access_and_restricted_viewer.sql`。

边界：

- 不修改 Documents 上传 / 删除 / zip 下载。
- 不修改 Storage policy 或 `workspace-files` bucket。
- 不修改 `/public-files/[id]/download`。
- 不修改 `research_asset_links`。
- 不修改后台 Project / Publication / Knowledge / Skill 核心 CRUD。

### Phase 2D - Public Research Workstation

已完成。公开首页、About、公开 Projects / Publications / Skills / Knowledge 列表与详情、公开内容填充、公开详情展示质量和后台公开内容运营提示已建立。

### Phase 2E-A - Access Requests (retired)

历史能力，已被 Phase 2R-Z 移除。

### Phase 2E-B - Restricted Access Foundation (retired)

历史能力，已被 Phase 2R-Z 移除；Viewer magic link 不再作为待修问题。

### Phase 2F - Public Site Operations And SEO

已完成。动态 sitemap、robots、公开页面 metadata、canonical / Open Graph 基础信息、公开内容发现体验和 About 页面说明已完善。

### Phase 2G-A - Public Site UI Polish

已完成。公共页 UI 调整为蓝白清爽研究工作站风格，大屏左右留白改善，卡片和按钮动效增强。

### Phase 2G-B - Admin UI Polish

已完成。管理后台 UI 优化，Dashboard、Sidebar、Topbar、列表页、详情页、新建 / 编辑 / 上传 / 授权页视觉统一；表单页改为更平衡的工作台布局。

## Stabilization Roadmap

### Phase 2O - Workspace Stabilization

目标：

- 保持 Dashboard、Sidebar、公开页和后台主路径稳定。
- 继续突出 Projects、Knowledge、Skills、Publications、Documents、Workspace Search、Calendar 和 Career。
- 确认 Market Brief 不再出现在产品入口、API 主路径或推荐环境变量中。
- 将求职中心标记为稳定维护状态。

范围边界：

- 不新增 migration。
- 不新增 cron。
- 不新增 AI 功能。
- 不主动扩展求职自动化。
- 不恢复 Market Brief、外部 runner、市场素材包、行情探针或任何 Market Brief 生成任务。

### v1.1 - Personal Asset Intranet Polish

已完成并进入稳定使用阶段：

- #125 Boundary polish：收紧 public attachment download route，清理 dashboard 假入口、topbar 占位按钮、旧 Market Brief env，并支持 `NEXT_PUBLIC_SITE_URL`。
- #126 Asset model clarity：明确 Project / Publication / Knowledge / Skill 的资产角色，并同步到表单、列表空状态、AI Draft Lab 和文档。
- #127 Form consistency and AI prefill：打磨 AI Draft Lab 到新建表单的浏览器临时 handoff、提示条、字段映射和表单一致性。
- #128 Search listing and mobile polish：打磨后台搜索、后台列表、Documents 文件中心、公开列表和 390px 移动端长文本展示。
- Final QA docs sync：新增 `docs/v1-1-release-notes.md`，同步 README、current status、memory、roadmap 和维护检查清单。

边界：

- 不新增数据库、migration、RLS、Storage policy 或 bucket visibility 修改。
- 不修改 `/public-files/[id]/download`。
- 不读取 Documents 文件正文或 Storage object。
- 不新增 AI 搜索、OCR、向量搜索、Documents 问答或公开 AI。
- 不恢复 Agent CEO、自动化中心、任务中心、Market Brief、Access Grants、Viewer magic link 或 restricted 外部授权。

### v1.1.4 - Workstation API/CLI Design

已完成设计文档：

- 新增 `docs/workstation-cli-design.md`。
- 明确推荐架构：User / Codex -> Workstation CLI -> Workstation Admin API -> existing server-side validation -> Supabase Auth / RLS / Storage。
- 设计第一版 CLI 命令：`workstation health`、Project / Knowledge / Skill 的 list/create、`workstation collection list`、`workstation document upload`。
- 设计第一版 Admin API route 草案：health、projects、knowledge、skills、document-collections、documents upload-intent 和 finalize。
- 设计统一响应格式、error code、token capability、operation logs 和文件上传失败处理。
- 明确第一版只考虑 `read_assets`、`create_assets`、`upload_documents`，不开放删除、公开发布、visibility 管理、用户管理、private Documents 正文读取、批量更新或创建新文档包。

边界：

- 不新增 API route。
- 不新增 CLI 可执行文件或 npm bin。
- 不新增 token 生成页面或真实 token。
- 不新增数据库表或 migration。
- 不修改 RLS、Storage policy、bucket visibility 或 public download route。
- 不读取 Documents 正文，不读取 Storage object，不生成 signed URL。
- 不恢复 Market Brief、外部访问申请、Viewer、Access Grants、restricted 外部授权、自动化中心、MCP server 或 Agent CEO。

### v1.2.x - Workstation Admin API And CLI Preparation

建议后续版本路线：

- v1.2.0 Workstation Admin API MVP：已实现受控 Admin API、静态 token 校验、health、Project / Knowledge / Skill list/create、Document Collections metadata list。
- v1.2.1 Workstation CLI MVP：已实现薄层 CLI，负责命令解析、读取本地环境变量、调用 Admin API 和展示结果；先不做文件上传。
- v1.2.2 Workstation diagnostics and CLI query polish：增强 health data access 诊断、CLI health 输出、Knowledge 按 Project 查询、生产 / 本地 grant checklist 和 Node fetch 代理说明。
- v1.2.3 Workstation operation logs and permission hardening：已新增 requestId、operation logs、best-effort rate limit、CLI 错误 requestId 输出和后台只读日志页。
- v1.2.4 Workstation Codex Skill wrapper：已新增 `.codex/skills/workstation/SKILL.md`，指导 Codex 何时和如何调用既有 Workstation CLI，并重申 token、service role、Documents、Storage、upload/delete/update/public publish/visibility manage 等边界。
- v1.2.x Token lifecycle / capability hardening：后续再单独评审 token rotate / revoke、capability hardening 和更细粒度授权。
- v1.2.x 文件上传 PR：单独设计并实现 upload-intent / finalize 和 `upload_documents` capability。
- v1.3.x MCP Server / Agent CEO Workbench exploration：只在 Admin API 边界稳定后探索更高层 agent workbench，不绕过 CLI / API 安全模型。

v1.2.0 当前边界：

- token 第一版只来自服务端环境变量 `WORKSTATION_API_TOKEN`，不新增 token 表或管理页面。
- token capability 首版只允许 `read_assets` 和 `create_assets`。
- CLI 永远不保存 Supabase service role key，不直连 Supabase。
- 创建 Project / Knowledge / Skill 默认 private，不允许 API 创建 public 内容。
- 不实现文件上传、删除、更新、公开发布、visibility 管理、用户管理、bulk update、private Documents 正文读取、signed URL 生成或 Storage object 读取。
- operation logs 已在 v1.2.3 通过专用表落库；token lifecycle 仍未实现。

v1.2.1 当前边界：

- CLI 默认读取 `WORKSTATION_API_URL` 和 `WORKSTATION_API_TOKEN`，默认 API URL 为生产站点。
- CLI 不支持 `--token` 参数，不把 token 写入代码、文档示例、请求日志或错误输出。
- CLI create 命令不发送 public / unlisted visibility，且拒绝 owner / user / created_by 等越界字段。
- CLI 的 `--content-file` 与 `--usage-file` 只读取用户显式传入的本地文本文件，不读取 Documents、Storage object、Skill package 或 private 文件正文。
- 不新增依赖、不新增 migration、不新增 RLS / Storage policy / public download route 改动。

v1.2.2 当前边界：

- health 只做轻量 `select limit 1` data access 检查，不检查 insert、不插入测试记录、不读取 Documents 正文、不读取 Storage object、不生成 signed URL。
- CLI health 展示 auth、capabilities 和 dataAccess；`--json` 仍原样输出 API JSON。
- Knowledge list 支持 `--project-id` / `--project_id`，只作为查询过滤，不新增关联写入或 update 能力。
- 文档补充 `service_role` grant checklist、本地 fallback 和 Node fetch 代理问题；CLI 仍不保存 service role key，不直连 Supabase，不新增代理依赖。
- 不新增 upload、delete、update、public publish、visibility manage、token 管理页面、operation logs 落库、RLS / Storage policy / public download route 改动。

v1.2.3 当前边界：

- operation logs 只记录 Workstation API 安全摘要，不记录 token 明文、Authorization header、service role key、signed URL、Storage path、Documents 正文、文件内容或完整请求体。
- rate limit 是进程内 best-effort，在 serverless 环境下不保证强一致。
- 后台 logs 页面为 `/dashboard/developer/workstation-logs`，只读展示最近 100 条日志，继承 dashboard admin 保护。
- 不新增 upload、delete、update、public publish、visibility manage、token 管理页面、token 表、token rotate / revoke UI、MCP server、Agent CEO、外部集成、Storage policy、bucket visibility、public download route 或 CLI Supabase 直连。

v1.2.4 当前边界：

- Skill wrapper 只指导 Codex 使用既有 `npm run workstation -- ...` 命令，不新增命令或 API。
- Codex 可用 CLI 创建 private Project / Knowledge / Skill、查询 metadata、查询文档包 metadata 和查看 health。
- Codex 不得用 CLI 或其它方式上传文件、读取 Documents 正文、读取 Storage object、生成 signed URL、删除、更新、公开发布、修改 visibility、批量操作、修改权限、操作 Supabase、操作 service role key、操作 token 或调用外部 app。

### Near-term Stable Usage

近期只做：

- 录入真实 Project / Publication / Knowledge / Skill 资产。
- 观察四类资产分类是否清楚。
- 使用 AI Draft Lab 整理原始想法、会议摘录和研究笔记，但继续手动检查、手动保存、手动决定 visibility。
- 观察 `/dashboard/search`、Documents 和 390px 移动端在真实资产增长后的可用性。
- 修复明确 bug、明显 UX 问题、broken link 和文档漂移。
- 如继续推进 Workstation API / CLI，优先观察 requestId / logs / rate limit 在生产与本地的可用性，或单独评审 document upload-intent / finalize。
- Workstation CLI diagnostics 与 operation logs 已完成后，后续如需 token rotate / revoke、文件上传、update/delete/public publish 或 visibility manage，应单独评审安全模型，不和日志 hardening 混在同一轮。
- Workstation Codex Skill wrapper 完成后，日常“保存到工作台 / 沉淀为 Knowledge / 沉淀为 Skill”请求应优先走 `.codex/skills/workstation/SKILL.md` 描述的 CLI 流程，失败时保留 requestId 便于追踪。

近期不做：

- Agent CEO / 自动化扩张线。
- 自动化中心、任务中心、复盘中心。
- Notion / 飞书 / Gmail 集成。
- 未经 Admin API 边界评审的 Workstation CLI 高风险扩展、MCP server 或 Agent CEO Workbench。
- 新的公开 AI、访客 AI、AI 搜索、OCR 或向量搜索。
- 外部访问申请、Access Grants、Viewer login/callback 或 restricted 外部访问恢复。

### Research Asset Curation

后续主要投入应集中在已有研究资产质量：

- Projects：沉淀持续推进的研究、业务、开发或个人项目主题；继续补齐研究背景、问题、方法、进度、私密附件、显式关系和相关搜索。
- Publications：沉淀已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容；用显式资产关系记录成果引用、产出或来源。
- Knowledge：沉淀可复用的笔记、框架、概念解释、方法论和个人学习记录；继续整理摘要、正文、关联 Project、私密资料和相关资产搜索。
- Skills：沉淀可复用的流程、Prompt 模板、操作手册、自动化方法和能力包；用显式资产关系记录 Skill 使用、支持或产出的研究资产。

v1.1 Asset model clarity polish 只更新上述资产模型说明、后台 helper text、空状态和 AI Draft Lab 目标类型说明；不新增数据库、migration、RLS、Storage policy，不修改 public download route。

### Public Display And Private Asset Management

继续维护公开站点与私密后台的边界：

- public 页面只展示明确设为 `public` 的内容；公开首页和公开导航承担“黄铭语研究工作站”说明，首页 H1 使用“个人研究工作站”，并展示研究方向、公开内容预览和管理员登录入口。2R-Z 已移除访问申请、Access Grants、Viewer magic link 和 restricted 外部授权，后续不要恢复。
- Documents 上传默认 private；只有管理员显式设为 public 且关联 public 资产的文件，才可在对应公开内容页展示安全附件摘要并通过短时签名下载路由访问。
- Documents 作为可维护的统一默认私密附件管理系统承载 Project、Publication、Knowledge 和 Skill 的附件，并通过专用多关联表表达一个文件或文档包对应多个资产，避免每个模块重复实现文件系统。
- 内容详情页继续嵌入后台附件视图；公开 Project / Publication 详情页只展示经 public 附件查询归一化后的安全字段，不展示 raw link rows、Storage 路径、Storage bucket、owner_id 或 signed URL；公开 Knowledge / Skill 详情页不展示 Documents。
- Documents 多资产关联、显式研究资产关系和后台搜索仍是管理员后台能力，不在公开页面展示或作为公开导航入口；“管理员登录”只进入登录流程，不展示后台内容。
- 新建内容时的“保存并上传附件”仅在创建成功后跳转统一上传页，不创建临时上传记录或 staging 文件。
- 外部访问申请、Access Grants、Viewer magic link 和 restricted 外部授权不再作为未来路线或 bugfix。

### Career Maintenance

求职中心当前体验已足够，后续只做：

- bugfix；
- 文案修正；
- broken link 修复；
- 现有 Resume / AI JD / 投递看板流程的稳定性维护。

默认不做：

- 面试记录；
- 面试复盘；
- 自动提醒；
- 投递邮件草稿；
- Notion 同步；
- 自动投递；
- 新的求职自动化功能。
