# Current Status

日期：2026-06-13

## Product Positioning

本项目当前定位为：

> 黄铭语的公开研究工作站与私密数字资产后台。

当前网站包括：

1. 面向外部访客的公开研究工作站。
2. 管理员本人使用的私密后台。
3. 私密文件中心。
4. 访问申请与审批。
5. restricted 内容授权基础。
6. 研究资产沉淀、公开展示、文件 / 知识管理和求职闭环维护。

## Completed Capabilities

### Public Site

已完成：

- 公开首页 `/`。
- About 页面 `/about`。
- 公开 Projects 列表与详情 `/projects`、`/projects/[slug]`。
- 公开 Publications 列表与详情 `/publications`、`/publications/[slug]`。
- 公开 Skills 列表与详情 `/skills`、`/skills/[slug]`。
- 公开 Knowledge 列表与详情 `/knowledge`、`/knowledge/[slug]`。
- 公开内容只展示 `visibility = "public"` 的记录。
- `public` / `private` / `unlisted` / `restricted` 的边界已经形成。
- `sitemap.xml`。
- `robots.txt`。
- SEO metadata。
- 公共页 UI 已完成蓝白清爽研究工作站风格优化。
- 大屏左右留白已改善。
- 卡片和按钮动效已增强。

公开页面不得展示 Documents、signed URL、Storage 路径、后台操作入口、Activity Logs 或非 public 内容。

### Admin Backend

已完成：

- `/dashboard` 管理工作台。
- Projects 后台 CRUD。
- Publications 后台 CRUD。
- Knowledge 后台 CRUD。
- Skills 后台 CRUD。
- Documents 文件中心。
- Documents 文档包、多文件 / 文件夹上传与统一私密附件底座。
- Documents 文件 metadata、文档包 metadata、关联对象与列表筛选维护能力。
- Documents 文件中心紧凑批量操作工具栏，以及批量添加 / 移除多资产关联能力。
- Documents 批量删除文件与删除整个文档包及文件能力。
- Documents 多文件与文档包 zip 临时下载能力。
- 后台全局搜索 `/dashboard/search`，按研究资产 metadata 搜索 Projects、Publications、Knowledge、Skills、Documents 和文档包，并支持类型筛选、统计和关键词高亮。
- 研究资产显式关联关系 `research_asset_links`，用于在 Project / Knowledge / Skill / Publication 后台详情页维护管理员手动确认的关系和 backlinks，并支持关系编辑、筛选统计和目标资产本地筛选。
- Project 后台详情页研究中枢：集中展示项目概览、研究问题、背景、方法、里程碑、私密附件、相关知识笔记 / 学术成果和快捷操作。
- Knowledge 后台详情页知识节点：集中展示知识摘要、正文、分类、标签、关联 Project、私密附件、同项目成果和搜索入口。
- Skill 后台详情页能力包 / 工作流包：集中展示用途、平台、版本、状态、使用说明、私密资料、版本记录和相关资产搜索入口。
- Publication 后台详情页成果中枢：集中展示成果摘要、abstract、关联 Project、私密材料、同项目 Knowledge 和搜索入口。
- RelatedDocumentsPanel 按文档包、独立文件和跨文档包文件分组展示。
- 文档包整体迁移 / 同步关联工具。
- Project / Publication / Knowledge / Skill 后台详情页内嵌关联文件与文档包区域。
- Access Requests 访问申请管理。
- Access Grants 授权管理基础。
- Profile 个人公开信息编辑基础。
- Calendar 站内日程 CRUD。
- Resume 履历素材库基础 CRUD。
- Resume 简历版本组合与后台预览。
- Resume 分区式素材管理、A4 中文简历模板化预览与浏览器打印 PDF。
- Resume 简历质量检查、完整度评分和投递版本提示。
- Resume AI JD 简历优化建议，支持 OpenAI-compatible Provider 与 DeepSeek。
- Resume JD 分析历史与投递记录。
- Resume 投递看板与求职 Pipeline 管理。
- Career Center / 求职中心导航整合。
- AI JD 分析完成后自动保存为 JD 分析记录，并在求职中心继续维护投递状态。
- Resume Word `.docx` 即时导出。
- Resume Preview 与 Word 导出共用 20260523 风格模板模型。
- 管理后台 UI 已优化。
- 后台新建 / 编辑 / 上传 / 授权页已调整为更平衡的工作台布局。

后台仍只允许管理员访问。后台写入继续通过 Server Actions 验证管理员身份，并依赖 Supabase RLS 作为数据库权限边界。

Phase 2O-A 后，后台产品进入稳定维护阶段。Dashboard 和侧边栏主入口集中在 Projects、Knowledge、Skills、Publications、Documents、Workspace Search、Calendar、Career、Profile、Access Requests 和 Access Grants；Market Brief 已弃用并移除产品入口；求职中心后续只做 bugfix、文案修正和 broken link 修复，不主动扩展新的求职自动化功能。

### Workspace Search

已完成：

- 后台新增 `/dashboard/search` 全局搜索入口。
- 搜索范围包括 Projects、Publications、Knowledge、Skills、Documents 和 Document Collections。
- 搜索只查数据库 metadata，每类最多返回 8 条结果，不做分页。
- 搜索支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选。
- 类型筛选 chips 显示全部和每类命中数量；选中某类但无结果时保留切换入口并显示“当前类型没有匹配结果”。
- 结果标题和描述用安全 React 文本切片做关键词高亮，不保存索引，不使用 HTML 注入。
- q trim 后少于 2 个字符时不执行查询并提示“请输入至少 2 个字符。”
- Documents 搜索只查文件名、原始文件名、relative_path、folder_path、category、legacy related_type 和专用关联表解析出的关联标题等 metadata。
- 搜索不读取 Supabase Storage 文件内容，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要或向量搜索，不生成 signed URL，不输出 Storage path。

### Research Asset Links

已完成：

- 新增 `research_asset_links` 作为管理员后台使用的显式研究资产关系表。
- 支持资产类型：Project、Knowledge、Skill、Publication。
- 支持关系类型：`related`、`supports`、`references`、`uses`、`produces`、`derived_from`。
- 四类后台详情页均新增“显式关联资产”区域，可创建 outbound 关系、查看 inbound backlinks、跳转对方详情页和删除关系。
- 创建关系时在 Server Action 中验证管理员身份、source / target 类型、source / target 记录存在性、自关联和重复关系。
- 新增关系表单支持按标题和 metadata 本地筛选目标资产；目标候选仍使用受限数量的数据库 metadata，不读取文件内容或 Storage。
- 关系列表支持总数、outbound、inbound、当前筛选数量和关系类型数量统计，并支持按方向、对方资产类型和 relation_type 筛选。
- 已有关系可编辑 relation_type 和 note；source / target 不允许编辑，如需更换目标资产需删除后重新创建。
- Phase 2Q-B-4 已取消并移除全局关系可视化页面；后台不再提供独立的全局关系页面。
- 显式关系维护仍集中在四类资产详情页的 AssetLinksPanel 中，通过单个资产查看 outbound 和 backlink。
- 现有 `knowledge_notes.project_id`、`publications.project_id` 关系继续保留，不迁移、不删除、不自动推断。

边界：

- 关系只在管理员后台使用，不新增公开关系展示。
- Documents 不纳入 `research_asset_links`；文件和文档包使用专用 `document_asset_links` / `document_collection_asset_links` 管理多资产关联，legacy `related_type / related_id` 只保留为 primary relation 兼容字段。
- Phase 2Q-B-2 / 2Q-B-4 不新增 migration，不修改 `0019_research_asset_links.sql`，不新增 RPC，也不引入数据库事务。
- 不保留独立全局关系可视化页面；如未来重新需要，应作为独立新阶段重新设计。
- 不读取文件正文，不读取 Storage object，不生成 signed URL，不展示 Storage path。
- 不做 AI 自动关联、动态图谱、3D 图谱、蜘蛛网可视化、拖拽连线、图谱编辑或复杂权限继承。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 逻辑、Resume / Career 或 Market Brief。

### Project Detail Research Hub

已完成：

- `/dashboard/projects/[id]` 详情页从普通详情展示升级为研究项目中枢。
- 首屏保留返回、编辑、删除入口，并展示状态、可见性、标签、进度和更新时间。
- 页面集中展示项目简介、研究问题、研究背景、研究方法、开始日期、里程碑和项目 metadata。
- 继续复用 RelatedDocumentsPanel 展示当前 Project 的私密文档包、独立文件和跨文档包文件。
- 新增显式关联资产区域，用于维护 Project 与 Knowledge / Skill / Publication / Project 的人工确认关系和 backlinks。
- 快捷操作进入编辑项目、上传项目文件、上传项目文件夹、项目 Documents 筛选页、后台全局搜索和新建知识笔记。
- 相关研究资产继续读取现有 `knowledge_notes.project_id` 与 `publications.project_id`，每类最多展示 5 条；Skill 可通过显式资产关系维护，也保留按项目标题或标签搜索 Skill 的快捷入口。

边界：

- 2Q-B-1 新增 `research_asset_links` 表；Project 详情页不新增公开入口、RPC 或 Storage 行为。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除逻辑或 `storage_path` 生成规则。
- 不读取文件正文，不解析附件，不做 OCR、AI 摘要或向量搜索。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改公开 Project 页面、viewer/restricted、Resume、Career 或 Market Brief。

### Knowledge Detail Node Hub

已完成：

- `/dashboard/knowledge/[id]` 详情页从普通 CRUD 笔记详情升级为知识节点。
- 首屏保留返回、编辑、删除入口，并展示分类、可见性、标签、创建时间和更新时间。
- 页面集中展示知识概览、摘要、正文、分类、标签、可见性、关联 Project 和知识 metadata。
- 继续复用 RelatedDocumentsPanel 展示当前 Knowledge 的私密文档包、独立文件和跨文档包文件。
- 新增显式关联资产区域，用于维护 Knowledge 与 Project / Skill / Publication / Knowledge 的人工确认关系和 backlinks。
- 快捷操作进入编辑知识节点、上传知识资料、上传知识资料文件夹、该知识节点 Documents 筛选页、后台全局搜索和关联 Project。
- 关联 Project 只读取现有 `knowledge_notes.project_id`；不存在时显示空状态和 Project 搜索入口。
- 相关成果保留同项目 `publications.project_id` 展示，最多 5 条；直接 Knowledge / Publication / Skill 关系可通过显式资产关系维护。

边界：

- 2Q-B-1 新增 `research_asset_links` 表；Knowledge 详情页不新增公开入口、RPC 或 Storage 行为。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 逻辑或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改公开 Knowledge 页面、Project / Skill / Publication 详情页、viewer/restricted、Resume、Career 或 Market Brief。

### Skill Detail Capability Hub

已完成：

- `/dashboard/skills/[id]` 详情页从普通 CRUD 展示升级为能力包 / 工作流包。
- 首屏保留返回、编辑、删除入口，并展示分类、平台、状态、当前版本、可见性和更新时间。
- 页面集中展示能力包概览、用途说明、输入说明、输出说明、使用指南、`SKILL.md`、平台版本信息、版本记录和 metadata。
- 继续复用 RelatedDocumentsPanel 展示 Skill 资料与能力包附件，包括文档包、独立文件和跨文档包文件。
- 新增显式关联资产区域，用于维护 Skill 与 Project / Knowledge / Publication / Skill 的人工确认关系和 backlinks。
- 快捷操作进入编辑 Skill、上传 Skill 资料、上传 Skill 资料文件夹、该 Skill Documents 筛选页、按 Skill 名称搜索和按 platform 搜索。
- Skill 不再新增单独外键字段；跨 Project / Knowledge / Publication 关系通过 `research_asset_links` 维护，同时保留 `/dashboard/search?q=...&type=...` 搜索入口。
- Skill package 仅作为私密资料存储和管理，不安装、不解析、不执行。

边界：

- 2Q-B-1 新增 `research_asset_links` 表；Skill 详情页不新增公开入口、RPC 或 Storage 行为。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 逻辑或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改公开 Skill 页面、Project / Knowledge / Publication 详情页、viewer/restricted、Resume、Career 或 Market Brief。

### Publication Detail Output Hub

已完成：

- `/dashboard/publications/[id]` 详情页从普通成果详情升级为成果中枢。
- 首屏保留返回、编辑、删除入口，并展示成果类型、可见性、标签、发表日期和更新时间。
- 页面集中展示成果概览、summary、abstract、关联 Project、metadata 和私密成果材料。
- 继续复用 RelatedDocumentsPanel 展示 Publication 材料与附件，包括文档包、独立文件和跨文档包文件。
- 新增显式关联资产区域，用于维护 Publication 与 Project / Knowledge / Skill / Publication 的人工确认关系和 backlinks。
- 快捷操作进入编辑成果、上传成果材料、上传成果材料文件夹、该成果 Documents 筛选页和后台全局搜索。
- 关联 Project 只读取现有 `publications.project_id`；不存在时显示空状态和 Project 搜索入口。
- 同项目 Knowledge 只使用现有 `knowledge_notes.project_id` 关系，最多展示 5 条。
- Publication / Knowledge / Skill 的直接关系可通过 `research_asset_links` 维护；搜索入口继续作为辅助定位。
- `file_path` 不在后台详情页展示，也不作为下载入口；`cover_url` 仅作为是否记录封面链接的 metadata 状态展示。

边界：

- 2Q-B-1 新增 `research_asset_links` 表；Publication 详情页不新增公开入口、RPC 或 Storage 行为。
- 不修改 Storage policy、Documents 上传 / 下载 / 删除 / zip 逻辑或 `storage_path` 生成规则。
- 不读取文件正文，不解析 PDF / Word / Excel / zip，不做 OCR、AI 摘要、向量搜索或文件内容索引。
- 不暴露 Storage path、signed URL、token、headers、cookie、API key、Supabase key 或 secret。
- 不修改公开 Publication 页面、Project / Knowledge / Skill 详情页、viewer/restricted、Resume、Career 或 Market Brief。

### Documents And Storage

已完成：

- private Supabase Storage bucket：`workspace-files`。
- 管理员上传。
- 多文件上传。
- 文件夹上传 metadata。
- 管理员下载。
- signed URL 短时下载。
- 文件和文档包可关联 Publication / Project / Knowledge / Skill，并支持一个文件或文档包同时关联多个研究资产。
- Project / Publication / Knowledge / Skill 后台详情页可直接查看关联文件和文档包。
- 各内容详情页上传入口复用 `/dashboard/documents/upload`，并通过 query params 预填关联对象、上传模式、分类和文档包类型。
- Project / Publication / Knowledge / Skill 新建表单支持“保存并上传附件”操作：对象先创建成功，再跳转统一上传页并预选新对象。
- 文件详情页支持编辑文件显示名称、分类和 legacy primary relation，并可查看全部关联 chips、添加关联或移除 link-table 关联。
- 文档包详情页支持编辑文档包名称、描述、类型和 legacy primary relation，并可查看全部关联 chips、添加 / 移除文档包关联，可选择同步到包内文件。
- Documents 列表支持按 category、related_type 和 collection 状态筛选；`related_type / related_id` 现在表示“包含该资产关联”，`related_type=unlinked` 可查看没有专用关联和 legacy 关联的文件。
- Documents 文件中心批量区已改为紧凑工具栏，支持批量添加关联、按资产批量移除关联、清空全部关联、zip 下载、批量删除和高级 legacy primary relation 操作。
- Documents 列表支持批量删除选中文件，删除数据库记录和对应 private Storage object，但不会自动删除空文档包。
- Documents 列表支持勾选多个文件后临时下载 zip。
- 文档包详情页支持批量修改包内文件关联对象或批量解除包内文件关联，不修改文档包自身关联或文件 `collection_id`。
- 文档包详情页支持批量删除包内选中文件，并在危险区通过确认文本删除整个文档包及包内全部文件。
- 文档包详情页支持下载整个文档包 zip；Project / Publication / Knowledge / Skill 后台详情页的文档包卡片也提供后台 zip 下载入口。
- Project / Publication / Knowledge / Skill 后台详情页的 RelatedDocumentsPanel 将附件分为文档包、独立文件和跨文档包文件；当前对象文档包内文件不再在独立文件区域重复展示。
- 跨文档包文件表示文件级关联指向当前对象，但文件仍属于其他文档包；页面只提示该状态，不自动同步或修复关联。
- 文档包详情页支持“同步文档包与包内文件关联”：整体迁移时同步更新专用 link tables 和 legacy `related_type / related_id`；整体解除关联时一起清空。
- 空文档包也可以执行整体迁移或整体解除关联，此时只修改文档包自身关联，记录的 `document_count` 为 0。
- 文档包关联对象修改不会自动批量修改包内文件的关联对象；不一致时页面提示管理员在文件详情页单独调整。
- `document_collections` 文档包记录上传批次、文件夹、附件包或 Skill 包。
- `document_asset_links` 与 `document_collection_asset_links` 记录文件 / 文档包到 Project / Knowledge / Skill / Publication 的多资产关联，支持 `related`、`source_material`、`supporting_material`、`deliverable`、`reference`、`input`、`output` 关系类型和备注。
- 关联 chips 在展示查询层归一化：同一文件 / 文档包对同一资产如果已有具体关系，则隐藏同一资产的 legacy `related` fallback；只有 `related` 是唯一关系时才显示“相关”。
- `documents.relative_path` / `documents.folder_path` 保存文件夹上传的相对路径信息。
- `documents.storage_path` 使用 ASCII-safe object key；中文文件名和文件夹名只保存在显示名、`original_name`、`relative_path` 等展示字段中。
- 单文件最大 50 MB；批量 / 文件夹上传单次最多 100 个文件，总量 200 MB。
- Publication 有附件时禁止直接删除。
- 公开页面不展示 Documents。
- 公开页面不展示 signed URL。
- 公开页面不展示 Storage 路径。

文件上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。Documents 是 Project / Publication / Knowledge / Skill 的统一私密附件底座，但不对外开放，不生成公开下载链接，不执行上传代码，不解析或安装 Skill 包。Phase 2P-B 只把附件查看与预填上传入口嵌入后台内容详情页；Phase 2P-C 只增加 create-and-upload 跳转流，不做 pending upload、临时文件 staging 或 create action 文件处理。Phase 2P-D 只增强后台 metadata 管理与筛选；Phase 2P-E-1 只增强批量关联整理能力；Phase 2P-E-1-B 只澄清内容详情页附件展示；Phase 2P-E-1-C 只增加主动整体迁移 / 同步关联工具；Phase 2P-E-2 只增加管理员批量删除文件和删除整个文档包及文件能力；Phase 2P-E-3 只增加管理员后台 zip 临时下载能力。Phase 2P-G-1 新增 0020 migration 和专用多关联表，同时保留 legacy primary relation 兼容；关联 chips 的 `related` 降噪只在展示查询层完成，不删除 legacy 数据，不新增 migration，不改 Storage policy，不新增 RPC。zip 按请求生成，不保存到 Storage。

### Access Requests

已完成：

- 公开 `/access-request`。
- 访客提交申请。
- 后台查看申请。
- `pending` / `approved` / `rejected` 状态。
- 管理员备注。
- Dashboard 待处理申请提示。

申请审批状态不等同于内容授权。访问授权通过 Access Grants 单独创建和撤销。

### Restricted Access Foundation

已完成代码层面基础能力：

- `restricted` visibility。
- `content_access_grants` 表。
- `has_content_access()`。
- 授权列表。
- 创建 / 撤销授权。
- viewer 登录入口。
- viewer callback。
- 未授权 restricted 内容不展示正文。

真实 viewer magic link 登录体验仍存在已知问题，详见 `docs/known-issues.md`。

## Permission Boundary

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

重要边界：

- `robots.txt` 和 `sitemap.xml` 不是安全边界。
- 真正安全边界依赖 Supabase Auth、RLS、Storage policy 和后台路由保护。
- Documents 不对外开放。
- restricted 内容不得出现在公开列表或 sitemap 中。
- private / unlisted / restricted 内容不得被公开页面泄露标题、ID、Storage 路径或 signed URL。

## Migration State

当前生产项目已按顺序执行：

- `0001_initial_schema.sql`
- `0002_grant_api_table_privileges.sql`
- `0003_publications_documents_storage.sql`
- `0004_access_requests.sql`
- `0005_restricted_content_access.sql`
- `0006_viewer_login_grant_check.sql`
- `0007_profile_public_fields.sql`
- `0008_calendar_events.sql`

Phase 2K-A 合并后需要继续执行：

- `0009_resume_items.sql`

Phase 2K-B 合并后需要继续执行：

- `0010_resume_versions.sql`

Phase 2K-C 合并后需要继续执行：

- `0011_resume_template_fields.sql`

Phase 2K-H 合并后需要继续执行：

- `0012_resume_jd_reviews.sql`

0013 至 0017 是已保留的旧迁移。当前产品代码不再依赖这些旧表；本轮不修改历史 migration，也不新增 drop table migration。

Phase 2P-A 新增 Documents 文档包与文件夹上传能力后需要继续执行：

- `0018_document_collections_and_folder_uploads.sql`

`0018` 创建 `document_collections`，为 `documents` 增加 `collection_id`、`original_name`、`relative_path`、`folder_path`，扩展 `workspace-files` bucket 的文件大小上限与 MIME 白名单。该 migration 不公开附件、不修改历史 migration、不放宽 Storage/RLS。

Phase 2P-D / 2P-E-1 / 2P-E-1-B / 2P-E-1-C / 2P-E-2 / 2P-E-3 / 2P-F-1 / 2P-F-2 / 2Q-A-1 / 2Q-A-2 / 2Q-A-3 / 2Q-A-4 不新增 migration。文件与文档包 metadata 编辑、批量移动关联对象、批量解除关联、内容详情页分组展示、文档包整体迁移 / 同步关联、批量删除文件、删除整个文档包及文件、zip 临时下载、后台 metadata 搜索、搜索体验增强、Project 详情页研究中枢、Knowledge 详情页知识节点、Skill 详情页能力包和 Publication 详情页成果中枢均复用既有字段，不修改 Storage policy。

Phase 2Q-B-1 新增研究资产显式关系底座后需要继续执行：

- `0019_research_asset_links.sql`

`0019` 创建 `research_asset_links`，只覆盖 Project / Knowledge / Skill / Publication 的管理员后台显式关系。该 migration 不纳入 Documents，不修改 Storage policy，不新增 RPC，不开放 public / viewer / restricted 读取。

Phase 2Q-B-2 只优化显式关系管理体验，不新增 migration，不修改已执行的 `0019_research_asset_links.sql`。Phase 2Q-B-3 的后台只读网络视图是已被 2Q-B-4 移除的历史能力，当前不再提供全局关系页面。

Phase 2P-G-1 新增 Documents 专用多资产关联后需要继续执行：

- `0020_document_asset_links.sql`

`0020` 创建 `document_asset_links` 与 `document_collection_asset_links`，从 legacy `documents.related_type / related_id` 和 `document_collections.related_type / related_id` 回填 `related` 关系，并通过 `public.is_admin()` 限定管理员读写。当前展示查询会在同一资产已有更具体关系时隐藏 legacy `related` fallback，但不删除回填 rows。该 migration 不修改 Storage policy，不新增 RPC，不纳入 `research_asset_links`，不开放 public / viewer / restricted 读取。

规则：

- 已执行过的 migration 不应修改。
- 执行 0020 后，后续数据库变更应新增 `0021_*` 或更高编号。
- 不得重跑旧 migration。
- 不得放宽 Storage / RLS。
- 不得提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL 或 `service_role`。

## Known Issue

Viewer magic link 登录仍未稳定。Phase 2E-B restricted 授权基础代码保留，但当前不继续排查，不影响 public 内容浏览、管理员后台、Documents 私密文件、访问申请提交与审批、公开站点 SEO 和 UI。

Resume 预览页中 summary / 素材概述里的 bullet-like 文本自动拆行仍有生产验收遗留问题。该问题当前冻结，不纳入 Phase 2K-D 的质量检查开发范围；后续如继续处理，应单独开 hotfix。

建议后续单独开启：

- Phase 2I: Viewer login and restricted access stabilization

## Stabilization Direction

Phase 2O-A 后，默认路线从“继续扩展新功能”转为“稳定现有工作台”：

- 研究资产沉淀：继续维护 Projects、Publications、Knowledge 和 Skills 的内容质量与关联关系；Project 后台详情页可作为单个研究项目的中枢入口，Knowledge 后台详情页可作为单个知识节点入口，Skill 后台详情页可作为能力包 / 工作流包入口，Publication 后台详情页可作为成果中枢入口，先整理研究框架、成果摘要、正文摘要、使用说明、平台版本、私密附件、显式资产关系和相关搜索入口。
- 公开展示：保持公开首页、About、Projects、Publications、Knowledge 和 Skills 的只读展示稳定。
- 文件 / 知识管理：Documents 作为可维护的统一私密附件管理系统，服务 Projects、Publications、Knowledge 和 Skills；Knowledge Base 继续维护内容本身，不开放公开附件下载。需要调整单个文件时使用文件详情页添加 / 移除多资产关联；需要整理多个文件时使用 Documents 紧凑批量工具栏添加、移除或清空关联；需要调整整个资料包时使用文档包详情页的关联管理和可选同步到包内文件；legacy primary relation 仅作为兼容字段处理。需要清理文件资产时使用批量删除或“删除整个文档包及文件”危险操作，需要本地备份或交付资料时使用 zip 临时下载；需要跨模块查找研究资产时使用 `/dashboard/search?q=关键词` 搜索 metadata，再用 `type` 筛选定位到 Documents、Knowledge、Projects 等类型。
- 求职闭环维护：Career Center、Resume、AI JD 分析记录和投递看板维持现有流程，只做 bugfix 和文案修正。
- 受限访问：Viewer magic link 和 restricted 访问可作为独立 bugfix 专项处理，但不得开放 Documents 或 signed URL。

不主动推进：

- Market Brief / 市场简报模块。
- 新的求职自动化，如面试记录、自动提醒、投递邮件、Notion 同步或自动投递。
- 新增 cron、migration 或 AI 生成产品线。
