# Product Roadmap

## Product Positioning

黄铭语个人数字工作站当前定位为：

> 黄铭语的公开研究工作站与私密数字资产后台。

网站同时承担：

- 对外公开展示研究方向、公开项目、学术成果、知识文章和 AI Skill。
- 对内管理全部项目、知识、成果、统一私密附件、日程、访问申请与授权基础。
- 维护求职中心 / Resume / AI JD / 投递看板的闭环，但后续只做 bugfix 和必要文案修正。

Notion 可作为草稿、临时研究笔记、日常记录和自动化中间层，但正式公开门户、权限系统、私密资产库和统一浏览体验继续由个人网站承担。

Market Brief / 市场简报模块已在 Phase 2N-Z 后弃用并从产品入口和代码主路径移除。后续路线不再维护 Market Brief、市场素材包、行情探针或相关生成任务。

## Access Layers

### Public Research Workstation

所有访客无需登录即可访问：

- 公开首页。
- About 页面。
- 公开 Projects / Publications / Skills / Knowledge 列表与详情。
- 访问申请表单。
- 公开统计、精选内容和 SEO 页面。

公开页面不得展示：

- private、restricted 或 unlisted 内容。
- 后台新增、编辑、删除入口。
- Documents、附件下载入口、signed URL 或 Storage 路径。
- Activity Logs、私密日历、内部任务或管理设置。

### Private Admin Backend

只有管理员本人可以进入后台，用于：

- 查看全部 public / unlisted / restricted / private 内容。
- 新建、编辑和删除 Projects、Publications、Knowledge、Skills。
- 上传与管理私密 Documents、文档包和文件夹上传。
- 管理访问申请与访问授权基础。
- 查看 Dashboard、公开内容维护提示和 Activity Logs。

管理员身份继续由 Supabase Auth、`public.admin_users` 和 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。

### Restricted Access Foundation

已实现基础代码：

- `restricted` visibility。
- `content_access_grants`。
- `has_content_access()`。
- 后台 Access Grants。
- viewer login 和 callback。

但 Viewer magic link 登录仍不稳定，restricted 访问体验尚未完成真实稳定验收。该问题已冻结，后续单独进入 Phase 2I。

## Visibility Model

| 可见性 | 含义 | 公开列表展示 | 当前状态 |
| --- | --- | --- | --- |
| public | 所有人可浏览 | 是 | 已稳定使用 |
| unlisted | 不公开列出，当前保持保守 | 否 | 字段与后台管理已具备，公开访问保持保守 |
| restricted | 管理员可见，未来授权 viewer 只读 | 否 | 基础代码已实现，viewer 登录待修 |
| private | 仅管理员本人可查看 | 否 | 已稳定使用 |

文件附件默认比正文更严格。Documents 是 Project / Publication / Knowledge / Skill 的统一私密附件底座；即使 Publication 或其他内容设置为 public，关联 Documents 仍保持 private，不在公开页面提供下载入口。即使未来 viewer 可以查看 restricted 正文，也不自动获得 Documents 权限。

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
- 不修改 Resume / Career、viewer/restricted 或 Market Brief。

### Phase 2Q-A-2 - Knowledge Detail Node Hub

已完成代码实现。Knowledge 后台详情页从普通 CRUD 笔记详情升级为单个知识节点：

- `/dashboard/knowledge/[id]` 集中展示知识标题、分类、可见性、标签、更新时间、摘要、正文、关联 Project 和知识 metadata。
- 保留返回、编辑和删除知识节点入口。
- 继续复用 RelatedDocumentsPanel 展示知识资料与附件，包括文档包、独立文件和跨文档包文件。
- 快捷操作支持编辑知识节点、上传知识资料、上传知识资料文件夹、进入该知识节点 Documents 筛选页、按知识标题搜索、搜索相关 Project / Publication / Skill，以及打开关联 Project。
- 关联 Project 使用现有 `knowledge_notes.project_id`，没有关联时显示空状态和 Project 搜索入口。
- 相关成果不新增直接关系；如果 Knowledge 关联 Project，则展示同项目 `publications.project_id` 成果，最多 5 条。
- Skill 当前没有显式 Knowledge 关联字段，本阶段只提供按知识标题或标签搜索 Skill 的入口。

边界：

- 不新增 migration、RPC、索引、关系表或字段。
- 不新增公开页面入口，不修改公开 Knowledge 详情页。
- 不修改 Project、Publication 或 Skill 详情页逻辑。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 流程或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改 Resume / Career、viewer/restricted 或 Market Brief。

### Phase 2D - Public Research Workstation

已完成。公开首页、About、公开 Projects / Publications / Skills / Knowledge 列表与详情、公开内容填充、公开详情展示质量和后台公开内容运营提示已建立。

### Phase 2E-A - Access Requests

已完成。公开访问申请表单、后台申请管理、pending / approved / rejected 状态、管理员备注和 Dashboard 待处理申请提示已建立。

### Phase 2E-B - Restricted Access Foundation

基础代码已完成。`restricted` visibility、访问授权表、授权管理、viewer login 和 viewer callback 已建立。

未完成：Viewer magic link 登录仍不稳定，详见 `docs/known-issues.md`。

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

### Research Asset Curation

后续主要投入应集中在已有研究资产质量：

- Projects：补齐研究背景、问题、方法和进度；用 Project 后台详情页作为单项目研究资产中枢，继续整理私密附件、相关知识笔记和学术成果。
- Publications：沉淀报告、论文草稿、策略分析和阅读综述。
- Knowledge：维护研究方法、工具笔记和知识文章；用 Knowledge 后台详情页作为单知识节点中枢，继续整理摘要、正文、关联 Project、私密资料和相关资产搜索。
- Skills：整理可公开复用的 AI / Codex 工作流说明。

### Public Display And Private Asset Management

继续维护公开站点与私密后台的边界：

- public 页面只展示明确设为 `public` 的内容。
- Documents 继续保持私密，不开放公开下载或 viewer signed URL。
- Documents 作为可维护的统一私密附件管理系统承载 Project、Publication、Knowledge 和 Skill 的私密附件，避免每个模块重复实现文件系统。
- 内容详情页只嵌入后台私密附件视图，公开 Projects、Publications、Knowledge 和 Skills 页面仍不展示附件下载入口。
- 新建内容时的“保存并上传附件”仅在创建成功后跳转统一上传页，不创建临时上传记录或 staging 文件。
- Access Requests / Access Grants 继续作为 restricted 访问基础。
- Viewer magic link 和 restricted 访问可以另开 bugfix，但不得扩大 Documents 权限。

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
