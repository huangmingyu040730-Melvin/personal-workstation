# Current Status

日期：2026-06-12

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
- Documents 批量移动文件关联对象与批量解除关联能力。
- Documents 批量删除文件与删除整个文档包及文件能力。
- Documents 多文件与文档包 zip 临时下载能力。
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

Phase 2O-A 后，后台产品进入稳定维护阶段。Dashboard 和侧边栏主入口集中在 Projects、Knowledge、Skills、Publications、Documents、Calendar、Career、Profile、Access Requests 和 Access Grants；Market Brief 已弃用并移除产品入口；求职中心后续只做 bugfix、文案修正和 broken link 修复，不主动扩展新的求职自动化功能。

### Documents And Storage

已完成：

- private Supabase Storage bucket：`workspace-files`。
- 管理员上传。
- 多文件上传。
- 文件夹上传 metadata。
- 管理员下载。
- signed URL 短时下载。
- 文件关联 Publication / Project / Knowledge / Skill。
- Project / Publication / Knowledge / Skill 后台详情页可直接查看关联文件和文档包。
- 各内容详情页上传入口复用 `/dashboard/documents/upload`，并通过 query params 预填关联对象、上传模式、分类和文档包类型。
- Project / Publication / Knowledge / Skill 新建表单支持“保存并上传附件”操作：对象先创建成功，再跳转统一上传页并预选新对象。
- 文件详情页支持编辑文件显示名称、分类和关联对象。
- 文档包详情页支持编辑文档包名称、描述、类型和关联对象。
- Documents 列表支持按 category、related_type 和 collection 状态筛选；`related_type=unlinked` 可查看未关联文件。
- Documents 列表支持批量选择文件、批量移动关联对象和批量解除关联，并尽量保留当前筛选 URL。
- Documents 列表支持批量删除选中文件，删除数据库记录和对应 private Storage object，但不会自动删除空文档包。
- Documents 列表支持勾选多个文件后临时下载 zip。
- 文档包详情页支持批量修改包内文件关联对象或批量解除包内文件关联，不修改文档包自身关联或文件 `collection_id`。
- 文档包详情页支持批量删除包内选中文件，并在危险区通过确认文本删除整个文档包及包内全部文件。
- 文档包详情页支持下载整个文档包 zip；Project / Publication / Knowledge / Skill 后台详情页的文档包卡片也提供后台 zip 下载入口。
- Project / Publication / Knowledge / Skill 后台详情页的 RelatedDocumentsPanel 将附件分为文档包、独立文件和跨文档包文件；当前对象文档包内文件不再在独立文件区域重复展示。
- 跨文档包文件表示文件级关联指向当前对象，但文件仍属于其他文档包；页面只提示该状态，不自动同步或修复关联。
- 文档包详情页支持“同步文档包与包内文件关联”：整体迁移时同步更新 `document_collections.related_type / related_id` 和该文档包下全部 `documents.related_type / related_id`；整体解除关联时一起置空。
- 空文档包也可以执行整体迁移或整体解除关联，此时只修改文档包自身关联，记录的 `document_count` 为 0。
- 文档包关联对象修改不会自动批量修改包内文件的关联对象；不一致时页面提示管理员在文件详情页单独调整。
- `document_collections` 文档包记录上传批次、文件夹、附件包或 Skill 包。
- `documents.relative_path` / `documents.folder_path` 保存文件夹上传的相对路径信息。
- `documents.storage_path` 使用 ASCII-safe object key；中文文件名和文件夹名只保存在显示名、`original_name`、`relative_path` 等展示字段中。
- 单文件最大 50 MB；批量 / 文件夹上传单次最多 100 个文件，总量 200 MB。
- Publication 有附件时禁止直接删除。
- 公开页面不展示 Documents。
- 公开页面不展示 signed URL。
- 公开页面不展示 Storage 路径。

文件上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。Documents 是 Project / Publication / Knowledge / Skill 的统一私密附件底座，但不对外开放，不生成公开下载链接，不执行上传代码，不解析或安装 Skill 包。Phase 2P-B 只把附件查看与预填上传入口嵌入后台内容详情页；Phase 2P-C 只增加 create-and-upload 跳转流，不做 pending upload、临时文件 staging 或 create action 文件处理。Phase 2P-D 只增强后台 metadata 管理与筛选；Phase 2P-E-1 只增强批量关联整理能力；Phase 2P-E-1-B 只澄清内容详情页附件展示；Phase 2P-E-1-C 只增加主动整体迁移 / 同步关联工具；Phase 2P-E-2 只增加管理员批量删除文件和删除整个文档包及文件能力；Phase 2P-E-3 只增加管理员后台 zip 临时下载能力。zip 按请求生成，不保存到 Storage。不新增 migration，不改 Storage policy，不新增 RPC。

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

Phase 2P-D / 2P-E-1 / 2P-E-1-B / 2P-E-1-C / 2P-E-2 / 2P-E-3 不新增 migration。文件与文档包 metadata 编辑、批量移动关联对象、批量解除关联、内容详情页分组展示、文档包整体迁移 / 同步关联、批量删除文件、删除整个文档包及文件和 zip 临时下载均复用既有 `documents` 和 `document_collections` 字段，不修改 Storage policy。

规则：

- 已执行过的 migration 不应修改。
- 执行 0018 后，后续数据库变更应新增 `0019_*` 或更高编号。
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

- 研究资产沉淀：继续维护 Projects、Publications、Knowledge 和 Skills 的内容质量与关联关系。
- 公开展示：保持公开首页、About、Projects、Publications、Knowledge 和 Skills 的只读展示稳定。
- 文件 / 知识管理：Documents 作为可维护的统一私密附件管理系统，服务 Projects、Publications、Knowledge 和 Skills；Knowledge Base 继续维护内容本身，不开放公开附件下载。需要调整单个文件时使用文件详情页，需要调整多个文件时使用 Documents 批量移动，需要调整整个资料包关联时使用文档包整体迁移 / 同步关联工具，需要清理文件资产时使用批量删除或“删除整个文档包及文件”危险操作，需要本地备份或交付资料时使用 zip 临时下载。
- 求职闭环维护：Career Center、Resume、AI JD 分析记录和投递看板维持现有流程，只做 bugfix 和文案修正。
- 受限访问：Viewer magic link 和 restricted 访问可作为独立 bugfix 专项处理，但不得开放 Documents 或 signed URL。

不主动推进：

- Market Brief / 市场简报模块。
- 新的求职自动化，如面试记录、自动提醒、投递邮件、Notion 同步或自动投递。
- 新增 cron、migration 或 AI 生成产品线。
