# Current Status

日期：2026-09-02

## 2026-09-02 Maintenance Baseline

- 本地运行时已统一到 Node.js `24.20.0`（Node 24 LTS）与 npm 11，并通过 `.nvmrc` 和 `package.json` `engines` 固化支持范围。
- Next.js 已从 16.2.6 升级到 16.3.4，并同步兼容的 React、类型声明与直接依赖；当前本地 `npm audit` 为 0 vulnerabilities。
- 全局 Workstation wrapper 已启用 Node 24 原生环境代理支持，并能在未显式配置代理变量时读取 macOS 当前系统代理；不硬编码或输出代理地址，localhost 保持直连。
- 已清理失效 worktree metadata、带 gone upstream 的历史本地分支和旧依赖树；分支删除前已创建可验证的 Git bundle 备份。
- 本轮不修改数据库 migration、RLS、Storage policy、bucket visibility、public download route 或 Workstation 权限边界。本地 lint、build、dev 和 public smoke 已通过；当前机器的 GitHub CLI 授权失效且 Vercel CLI 未登录，因此生产部署仍待重新授权，不能从本地结果推断线上已升级。

## Product Positioning

本项目当前定位为：

> 黄铭语的个人长期资产沉淀主基地 / Personal Asset Intranet。

当前网站包括：

1. 面向外部访客的公开研究工作站。
2. 管理员本人使用的私密后台。
3. 私密文件中心。
4. 研究资产沉淀、公开展示、文件 / 知识管理和求职闭环维护。

当前阶段从 Agent CEO / 自动化扩张线收口，优先打磨已有资产模块的清晰度和可信度，不新增自动化中心、任务中心或外部集成主线。

四类核心资产角色：

- Project：持续推进的研究、业务、开发或个人项目主题。
- Publication：已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容。
- Knowledge：可复用的笔记、框架、概念解释、方法论和个人学习记录。
- Skill：可复用的流程、Prompt 模板、操作手册、自动化方法和能力包。

Phase 2R-Z 已移除外部访问申请、Access Grants、Viewer magic link 和 restricted 外部授权链路。公开站点只展示 `public` 内容；未公开 slug 只显示安全 fallback，不确认 private、unlisted 或历史 restricted 内容是否存在。

Phase 2R-G-1 将当前稳定版本收口为 v1.0 final QA / release notes。PR #115 已关闭且不合并，后续不继续推进 Phase 2R-F-2 homepage featured content polish，首页保持当前 `main` 的主结构。

Phase 2R-G-2 标记项目进入 v1.0 稳定维护阶段：新增 `docs/maintenance-playbook.md` 作为日常维护手册，暂时跳过 public content sprint，后续真实内容由管理员在后台逐步手动补充和完善，不继续大改框架或页面主结构。

Phase 3A-R 将 AI 能力调整为后台 Project 新建 / 编辑表单中的草稿补全助手。Phase 3A-S 继续把同一方向扩展到 Publication、Knowledge 和 Skill 新建 / 编辑表单。Phase 3A-T 为四类表单助手增加补全空字段、优化已有内容、公开风险检查三种模式。Phase 3B 新增独立后台 AI 草稿实验室 `/dashboard/ai-drafts`，可把原始想法、研究笔记、会议摘录或粗糙文本转换成 Project / Publication / Knowledge / Skill 结构化草稿。Phase 3B-1 允许把实验室结果通过当前浏览器 `sessionStorage` 带入对应新建表单，由管理员确认后预填字段。#118 的详情页事后点评式 AI 已关闭且不合并；当前 AI 只服务管理员后台内容生产效率，不做公开 AI 聊天，不自动保存、不自动创建资产、不自动公开、不读取 Documents 或 Storage。

v1.1 已作为 Personal Asset Intranet polish 收口：#125 完成 public download route 边界和假入口清理，#126 明确四类资产定义，#127 打磨 AI Draft Lab 到新建表单预填链路，#128 打磨搜索、列表和移动端展示。本轮 final QA 只同步文档、维护清单和 release notes，不新增功能。

v1.1.2 Resume photo export polish 补齐求职中心的照片链路：basic 个人信息素材可维护 `details.photo_url`，Resume Preview 在 `show_photo = true` 时显示照片或占位，Word 导出会优先使用 basic item 的 `photo_url`、其次使用 Profile `avatar_url`。Word 导出只接受 data URL 或安全 HTTPS 图片 URL，并限制 2 MB、常见图片 MIME type、HTTPS 重定向、Supabase Storage object URL 和私网地址；图片获取失败时不阻断导出。本轮不新增照片上传、裁剪、美颜、Profile avatar upload、Storage policy、public download route 或数据库改动。

v1.1.3 Resume export typography fixes 只修简历预览与 Word 导出的排版细节：邮箱字段与电话、性别、年龄、所在地使用一致的个人信息样式；实习经历的岗位 / 部门行加粗。追加 v1.1.3 Resume export section order and icons fix 后，Word 导出会隐藏没有可导出条目的固定 section 标题 / 图标，并把项目经历固定在实习经历之后、在校经历之前；后续 project icon and role typography polish 将项目经历图标替换为更简洁的深灰文件夹 / 项目文件图标，并让项目经历角色行、在校经历岗位行加粗。该小修不改变简历数据结构、照片导出安全逻辑、Storage、public download route 或数据库权限边界。

v1.1.4 Workstation API/CLI design 新增 `docs/workstation-cli-design.md`，为后续 Workstation Admin API MVP 和 Workstation CLI MVP 设计安全边界、首版命令、API route 草案、统一响应、token capability、operation logs 和文件上传流程。当前仍是设计阶段：不新增真实 API route、CLI、npm bin、token、数据库表、migration、RLS、Storage policy、bucket visibility 或外部写入能力；Codex 未来也不应直接持有 Supabase service role key 或绕过现有后台 server-side validation。

v1.2.0 Workstation Admin API MVP 新增第一批 `/api/workstation/*` 受控 API route：health、Project / Knowledge / Skill list/create，以及 Document Collections metadata list。认证第一版使用服务端 `WORKSTATION_API_TOKEN` 静态 token，capability 只开放 `read_assets` 和 `create_assets`；创建 Project / Knowledge / Skill 时默认 private，并拒绝 public / unlisted visibility 与 owner_id / user_id / created_by 等非白名单字段。本轮不实现 CLI、文件上传、upload-intent / finalize、operation_logs 落库、token 管理页面、migration、RLS、Storage policy 或 public download route 改动。

v1.2.1 Workstation CLI MVP 新增本地薄层 CLI：`npm run workstation -- ...`。CLI 从本地环境变量读取 `WORKSTATION_API_URL` 和 `WORKSTATION_API_TOKEN`，只调用既有 Workstation Admin API，支持 health、Project / Knowledge / Skill list/create 和 Document Collections metadata list；不直接连接 Supabase，不读取或保存 service role key，不支持 upload、delete、update、public publish、visibility manage、operation logs 落库、migration、RLS、Storage policy 或 public download route 改动。注意：这是 v1.2.1 的历史边界，已被 v1.2.5 / v1.2.7 扩展；判断当前 CLI 能力时不要据此得出“Project update 不支持”的结论。

v1.2.2 Workstation diagnostics and CLI query polish 增强 health 的 data access 诊断：token 正确时返回 `auth`、capabilities 和 `dataAccess`，只对 Projects、Knowledge、Skills 和 Document Collections 做轻量 `select limit 1` 检查；CLI health 人类可读输出展示 dataAccess，并为 create 权限错误提示检查 Supabase `service_role` grant；Knowledge list 新增 `--project-id` / `--project_id` 查询过滤。该轮只做诊断、查询和文档补强，不新增 upload、delete、update、public publish、visibility manage、token 管理、operation logs 落库、RLS、Storage policy、public download route 或 Supabase 直连能力。

v1.2.3 Workstation operation logs and permission hardening 新增 `workstation_operation_logs` 审计表、`wreq_...` requestId、Workstation API success / error logging、CLI 错误 requestId 输出、best-effort rate limit 和后台只读日志页 `/dashboard/developer/workstation-logs`。日志只保存安全摘要和 hash，不记录 token 明文、Authorization header、service role key、signed URL、Storage path、Documents 正文、文件内容或大段 Knowledge / Skill 正文。本轮仍不新增 upload、delete、update、public publish、visibility manage、token 管理页面、token 表、Storage policy、public download route 或 CLI Supabase 直连。

v1.2.4 Workstation Codex Skill wrapper 新增 `.codex/skills/workstation/SKILL.md`，让 Codex 在用户要求保存到工作台、创建 Project / Knowledge / Skill、查询资产或查询文档包 metadata 时优先使用 `npm run workstation -- ...`，并明确 token、service role、Documents、Storage、upload、delete、update、public publish、visibility manage、外部应用和 Agent CEO 的禁用边界。本轮只做 skill 使用说明和文档同步，不新增真实 CLI 命令、API route、migration、RLS、Storage policy、token 管理或 Supabase 直连能力。

v1.2.5 Workstation update API / CLI MVP 新增低风险 `PATCH /api/workstation/projects/[id]`、`PATCH /api/workstation/knowledge/[id]`、`PATCH /api/workstation/skills/[id]` 与 `npm run workstation -- project|knowledge|skill update --id ...`。update 只允许 Project / Knowledge / Skill 白名单字段，新增 `update_assets` capability，继续记录 requestId、operation logs 和 rate limit；新增 `0024_workstation_update_service_role_grants.sql` 只为 service_role 补白名单 update grant，并让 operation logs 接受 PATCH method。后续 hotfix 新增 `0025_consolidate_workstation_service_role_grants.sql`，一次性固化 Workstation API 已需的 Project / Knowledge / Skill select / insert / update、Document Collections select 与 operation logs select / insert 权限；不新增 API / CLI 能力，不允许 visibility update、delete、upload、public publish、Documents 关联、Documents 正文读取、Storage object、signed URL、token 管理、MCP、Agent CEO、外部集成或 CLI Supabase 直连。

v1.2.6 Workstation show / ID resolution polish 新增 `GET /api/workstation/projects/[id]`、`/knowledge/[id]`、`/skills/[id]` 的安全 show 能力，路径段可为 id 或 slug；CLI 新增 `project|knowledge|skill show --id|--slug`，并允许 `project|knowledge|skill update --slug ...` 先通过 show API 解析真实 id 后继续调用既有 update-by-id API。人类可读 list 输出新增完整 `id` 第一列。该轮不新增 migration，不读取 Documents / Storage，不生成 signed URL，不新增 upload / delete / public publish / visibility manage / token lifecycle / Supabase 直连。

v1.2.7 Workstation project progress/date update 只扩展 Project update 白名单，新增 `progress` 和 `start_date` 两个既有字段；CLI 支持 `project update --progress 25 --start-date 2026-06-16` / `--start_date`，progress 校验整数 0-100，start_date 校验 YYYY-MM-DD 有效日期。新增 `0026_workstation_project_progress_date_update_grants.sql` 只给 service_role 补 `projects.progress` / `projects.start_date` 列级 update 权限。不新增 `current_stage` 字段；阶段信息仍建议写入 summary / background / methodology，或用关联 Knowledge 记录。本轮不新增 upload / delete / public publish / visibility manage / Documents / Storage / signed URL / token lifecycle / Supabase 直连。

v1.2.8 Workstation document upload design 新增 `docs/workstation-document-upload-design.md`，只为后续 CLI document upload 设计 upload-intent、受控上传、finalize、private metadata 写入、collection stats 刷新和 operation logs。设计新增未来 capability `upload_documents`，并明确 Storage path 必须由服务端生成、文件默认 private、只上传到已有 document collection、不读取 Documents 正文、不生成 public link。本轮不新增 API route、CLI upload 命令、migration、RLS、Storage policy、bucket visibility、public download route、真实 upload-intent / finalize、signed URL、OCR、向量索引、AI 摘要、delete、public publish 或 visibility manage。

v1.2.9 Workstation Document Upload API MVP 新增后端 `POST /api/workstation/documents/upload-intent` 和 `POST /api/workstation/documents/finalize`。`upload-intent` 使用新的 `upload_documents` capability 校验已有 document collection、文件大小、MIME type、扩展名、title 和 category，并由服务端生成 ASCII-safe `upload_id` / `storage_path`；`finalize` 重新计算受控 path、验证 Storage object 已存在且可检查的 size / MIME metadata 匹配，安全拒绝重复 finalize，写入默认 private 的 `documents` metadata，并重算 collection `file_count` / `total_size`。该轮只实现后端 API MVP 和最小 service_role grants，不实现 CLI upload 命令、不实现受控上传器、不上传文件、不读取 Documents 正文、不读取 Storage object body、不生成 signed URL、不修改 RLS、Storage policy、bucket visibility 或 public download route。

v1.2.10 Workstation controlled uploader / CLI document upload MVP 新增 `POST /api/workstation/documents/upload` 受控上传 route，并让 `npm run workstation -- document upload --collection-id ... --file ... --title ... --category ...` 完成单文件上传闭环。CLI 只做本地文件存在 / 普通文件 / 非空 / 10 MB / 扩展名初检，随后调用 `upload-intent`、multipart 受控上传和 `finalize`；后端用 service-role server-side 写入 private `workspace-files` bucket 的服务端生成 path，成功后 `finalize` 写入默认 private `documents` metadata、刷新 collection stats，并记录 `documents.upload_intent` / `documents.upload` / `documents.finalize` operation logs。本轮不新增 migration，不修改 RLS、Storage policy、bucket visibility、public download route，不读取 Documents 正文或 Storage object body，不生成 signed URL，不支持批量 / 目录 / zip、自动创建 collection、delete、public publish 或 visibility manage；CLI 仍不直连 Supabase、不读取 service role key。

v1.2.11 Workstation upload UX / safety polish 只打磨 CLI 日常使用体验和验收文档：非 `--json` 上传会先显示 basename、size、MIME type、collection id 和 `visibility: private` 的安全摘要，再显示 `1/3 Created upload intent.`、`2/3 Uploaded file to private storage.`、`3/3 Finalized document metadata.`；`--json` 仍保持纯 finalize JSON。CLI 对 0027 grant 缺失、collection 不存在、文件类型不支持和超过 10 MB 增加友好提示，并继续避免输出本地绝对路径、完整 Storage path、token、Authorization header、service role key、signed URL 或文件内容。本轮不新增 migration、API route、RLS、Storage policy、bucket visibility、public download route、CLI logs 命令、delete、public publish 或 visibility manage，不扩展批量 / 目录 / OCR / vector / AI summary / 外部集成。

v1.2.12 Workstation collection resolution polish 只增强上传前查找文档包 ID 的体验：新增只读 `GET /api/workstation/document-collections/[id]` 和 CLI `npm run workstation -- collection show --id ...`，继续支持 `collection list --q` / `--related-type` / `--related-id`，并记录 `document_collections.show` operation log。上传前应先用 `collection list` / `collection show` 确认真实 collection id；Codex 不猜 id、不自动创建 collection。本轮不新增 migration，不做 collection create / update / delete，不扩展 upload / delete / public publish / visibility manage，不读取 Documents 正文或 Storage object，不修改 RLS、Storage policy、bucket visibility 或 public download route。

v1.2.13 Workstation Codex runbook 只新增 `docs/workstation-codex-runbook.md`，从本项目真实 Codex 执行过的 Workstation API/CLI 开发、Project / Knowledge / Skill create/update 验收、progress/start_date、document upload、collection list/show、Supabase grant 排查、PR 验证和 public smoke 中提炼可执行规则。该 runbook 作为 Codex Workstation 操作的 operational source of truth，覆盖默认开发流程、资产操作、文件上传、collection resolution、migration/grant troubleshooting、PR review、stop conditions 和 never-do 边界。本轮不新增 API route、CLI command、migration、RLS、Storage policy、bucket visibility、public download route、delete、public publish、visibility manage、批量/目录上传、OCR/vector/AI summary 或外部集成。

v1.2.14 Workstation Codex Skill discovery hardening 只强化 `.codex/skills/workstation/SKILL.md` 的 frontmatter metadata、description 关键词、触发语义、Never do 边界和标准调用模式，并新增 `.codex/skills/workstation/examples.md` 作为 Codex 使用示例。目标是让 Personal Workstation / Workstation CLI 更容易被 Codex slash menu 或语义检索发现和正确调用；不新增 API route、CLI command、migration、RLS、Storage policy、bucket visibility、public download route、delete、public publish、visibility manage、批量/目录上传、自动创建 collection、OCR/vector/AI summary、MCP、Agent CEO 或外部集成。

v1.2.15 Cross-project Workstation Skill Pack design 只新增 `docs/workstation-cross-project-skill-pack.md`，设计未来如何把 Personal Workstation Skill / examples / standalone client / installer 作为轻量 Skill Pack 接入其他 Codex 项目。当前 `.codex/skills/workstation/SKILL.md` 仍是 repo-level；跨项目可用需要后续单独实现安装器和 standalone client，不能承诺 Codex slash menu 全局可见。本轮不创建 `packages/workstation-skill-pack/`，不复制文件到其他项目，不新增 API route、CLI command、migration、RLS、Storage policy、bucket visibility、public download route、delete、public publish、visibility manage、批量/目录上传、自动创建 collection、OCR/vector/AI summary、MCP、Agent CEO 或外部集成，不写入真实 token、service role key 或 `.env.local`。

v1.2.16 Cross-project Workstation Skill Pack installer 新增最小可复制 Skill Pack：`packages/workstation-skill-pack/README.md`、`install.sh`、`.codex/skills/workstation/SKILL.md`、`.codex/skills/workstation/examples.md` 和 standalone `scripts/workstation.mjs`。新增根脚本 `npm run workstation:install-skill -- /path/to/target-project`，安装器只复制 Skill / examples / CLI client，默认不覆盖目标文件，`--force` 才覆盖，并只打印手动添加 package script 的说明，不自动修改目标项目 `package.json`。目标项目仍需本地配置 `WORKSTATION_API_URL` / `WORKSTATION_API_TOKEN`；安装器不复制 token、`.env.local`、service role key、Storage credentials、migration、RLS、Storage policy 或真实文件，也不让 Skill 全局自动可见。本轮不新增 Workstation API route、CLI capability、migration、RLS、Storage policy、bucket visibility、public download route、delete、public publish、visibility manage、批量/目录上传、自动创建 collection、OCR/vector/AI summary、MCP、Agent CEO 或外部集成。

v1.2.17 Cross-project install UX polish 只优化 Skill Pack 安装器体验：`install.sh` 支持 `--check` 和 `--dry-run`，并在安装完成后检查目标项目 `package.json` 与 `scripts.workstation` 状态，给出可复制 script 建议。安装器仍不自动修改目标 `package.json`，不做全局系统安装，不写 shell profile，不写 `.env.local`，不复制 `WORKSTATION_API_TOKEN`、`SUPABASE_SERVICE_ROLE_KEY`、Storage credentials 或真实 token。README 补充 uninstall 指南和 Codex slash menu / discovery 排查步骤；跨项目 Skill 仍是 repo-level 文件安装，不承诺全局自动可见。本轮不新增 Workstation API route、API capability、migration、RLS、Storage policy、bucket visibility、public download route 或任何上传 / 删除 / 公开发布能力。

v1.2.18 New Project Bootstrap Guide 只新增 `docs/workstation-new-project-bootstrap.md` 并同步相关文档，把 Workstation 从“可用工具”沉淀为“新项目默认能力接入标准”。该指南覆盖从 `npm init -y`、安装 Skill Pack、手动添加 `scripts.workstation`、本地配置 `WORKSTATION_API_URL` / `WORKSTATION_API_TOKEN` 到 `health` / `project list` / `collection list` 验证的完整流程，并明确最小接入原则、token 安全边界、slash menu 不显示时的排查和安装失败排查。本轮不改变 installer 行为，不新增 Workstation API route、CLI command、migration、RLS、Storage policy、bucket visibility、public download route 或任何上传 / 删除 / 公开发布能力。

v1.2.19 Personal Career Center global Skill 将现有私密求职闭环接入 Workstation API / CLI，并新增可全局发现的 `personal-career-center` Skill。覆盖 Career overview、简历素材、简历版本、质量检查、结构化预览、Word 导出、AI JD 分析、JD 记录和投递状态；删除需要独立 `delete_career` capability、API `confirm=true` 和 CLI `--confirm-delete`。新增 `0028_workstation_career_center_grants.sql` 只补 service_role 最小 grants 和 DELETE operation-log method，不修改 RLS、Storage、bucket、public download route 或 visibility；Career API 创建记录始终 private，AI 不自动改写经历，不自动投递或联系雇主。

## Completed Capabilities

### Public Site

已完成：

- 公开首页 `/`。
- Phase 2R-A-1 后，首页明确表达“黄铭语研究工作站”站点身份，并聚合研究方向、公开 Project / Publication / Knowledge / Skill 预览。
- #100 追加 UI polish 后，hero H1 使用“个人研究工作站”，首屏恢复左侧个人定位 / 标签 / CTA 与右侧公开统计卡片结构；Knowledge / Skill 首页预览改为紧凑卡片并展示最多 4 条 public 内容。
- Phase 2R-A-2 后，首页 hero 在保留左侧文案 + 右侧统计卡片结构的基础上，增加低对比金融 / 量化 / 研究风格 CSS 背景装饰，并用系统中文 serif 栈优化“个人研究工作站”标题质感；#101 预览反馈后，背景装饰重心从右侧移到左侧 / 中间偏左，避免被统计卡片遮挡。
- Phase 2R-A-3 后，公开 Projects / Publications / Knowledge / Skills 列表页统一为正式研究内容索引：listing header、公开统计、轻量 URL 筛选、公开卡片、友好空状态和更清晰 metadata。
- Phase 2R-A-4A 后，公开 Project / Publication 详情页可展示显式 public 文件附件；附件下载通过 `/public-files/[id]/download` 服务端校验后按需生成 60 秒短时 signed URL，页面 HTML 不输出 signed URL、Storage 路径或 raw link rows。
- 2R-A-4A public 附件线上排查确认：Vercel Production / Preview 已配置 `SUPABASE_SERVICE_ROLE_KEY`，但 server-side service-role 查询曾因缺少表级 `select` grant 在 `publications` 校验处返回 permission denied。`0021_public_attachment_service_role_grants.sql` 已作为 hotfix 补齐公开附件查询 / 下载校验所需的 service-role 只读权限，不修改 RLS、Storage policy、bucket 或文件数据。
- Phase 2R-A-4B 后，公开 Project / Publication / Knowledge / Skill 详情页统一为正式研究详情体验：detail hero、主内容 section、侧栏 metadata、related public content 和安全 SEO metadata；Project / Publication 详情继续整合公开附件，Knowledge / Skill 不展示 Documents。
- Phase 2R-C-1 后，公开 SEO 与分享体验统一：公开页面使用“黄铭语研究工作站”站点模板、canonical、Open Graph / Twitter card 和统一安全图片；sitemap 只收录 public 内容与公开静态入口，Supabase 查询失败时安全降级；robots 阻止 dashboard、API、viewer、public-files 和后台下载入口。
- Phase 2R-C-2 后，公开站点进入发布前 QA / hardening：新增 `npm run smoke:public` 巡检公开入口、未公开 fallback、metadata、sitemap、robots 和敏感字段边界；公开文案进一步避免暴露内部文件实现细节，公开附件 metadata 在移动端长分类 / MIME type 下可换行。
- Phase 2R-D-1 后，公开内容运营基础建立：四类后台详情页新增 public readiness checklist，帮助管理员用既有字段判断内容是否适合公开；该提示只读、不阻止保存、不自动公开内容或附件。
- Phase 2R-Z 后，访问申请、Viewer 登录、Access Grants 和 restricted 外部授权代码已移除；0022 迁移将历史 restricted 内容回写 private，收紧可见性约束和 public read policy，并删除旧访问申请 / 授权表与授权函数。
- Phase 2R-F-1 后，`/about` 成为正式公开个人简介页，集中展示个人定位、研究方向、公开研究工作站说明、技能 / 工具方向、公开内容导航和保守 Contact / Links；不新增 migration，不恢复外部访问申请或授权。
- Phase 2R-G-1 后，新增 `docs/v1-release-notes.md`，集中记录 v1.0 版本定位、公开站点能力、后台能力、安全边界、退役功能、当前不做事项和可复制验收清单。
- Phase 2R-G-2 后，新增 `docs/maintenance-playbook.md`，记录 v1.0 稳定维护阶段的 public 内容发布、public attachment、部署前后检查、安全巡检和故障排查流程；不新增功能，不修改页面主结构。
- 首页区块之间使用清晰 section wrapper、边框和交替背景分隔，并补充克制的 hover / focus micro-interactions。
- 公开导航包含首页、研究项目、学术成果、知识库、Skill 库和轻量“管理员登录”；不显示后台菜单、文件中心、访问申请或全局关系图谱入口。
- About 页面 `/about`，用于公开个人简介、研究方向、工作站说明和公开内容导航。
- 公开 Projects 列表与详情 `/projects`、`/projects/[slug]`。
- 公开 Publications 列表与详情 `/publications`、`/publications/[slug]`。
- 公开 Skills 列表与详情 `/skills`、`/skills/[slug]`。
- 公开 Knowledge 列表与详情 `/knowledge`、`/knowledge/[slug]`。
- 公开内容只展示 `visibility = "public"` 的记录。
- `public` / `private` / `unlisted` 的边界已经形成；restricted 外部授权已退役。
- `sitemap.xml` 只包含公开静态入口和 public Project / Publication / Knowledge / Skill 详情，不包含 dashboard、viewer、public-files、signed URL 或 Storage path。
- `robots.txt` 允许公开内容索引，并阻止 dashboard、login、viewer、api、documents、public-files、admin、storage 和 signed 等敏感路径。
- SEO metadata、canonical、Open Graph 与 Twitter card。
- 首页 metadata 调整为“个人研究工作站 | 黄铭语研究工作站”，描述聚焦公开研究项目、学术成果、知识笔记与 AI 工作流。
- #115 的首页精选内容改版不进入 v1.0；当前首页保持 `main` 既有 hero、研究方向、公开入口、公开项目 / 成果、Knowledge / Skill 预览和 public boundary 结构。
- 公共页 UI 已完成蓝白清爽研究工作站风格优化。
- 大屏左右留白已改善。
- 卡片和按钮动效已增强。

公开页面只展示 public 内容和显式 public 文件附件。公开详情页使用 public-only 查询；private / unlisted / 历史 restricted slug 只显示“内容不存在或未公开”的安全 fallback，不输出正文或附件，也不显示访问申请或 viewer 登录入口。公开页面不得展示 private Documents、Storage 路径、Storage bucket、owner_id、signed URL、`file_path`、raw `document_asset_links`、后台操作入口、Activity Logs、后台关系管理或非 public 内容。Publication 公开查询会对历史 `file_path` / `cover_url` 做公开边界处理，避免公开组件误用。

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
- Documents 文件详情页和文件中心批量工具支持显式设置文件 `visibility`；上传默认 private，不自动公开旧文件。
- Documents 批量删除文件与删除整个文档包及文件能力。
- Documents 多文件与文档包 zip 临时下载能力。
- 后台全局搜索 `/dashboard/search`，按研究资产 metadata 搜索 Projects、Publications、Knowledge、Skills、Documents 和文档包，并支持类型筛选、统计和关键词高亮。
- 研究资产显式关联关系 `research_asset_links`，用于在 Project / Knowledge / Skill / Publication 后台详情页维护管理员手动确认的关系和 backlinks，并支持关系编辑、筛选统计和目标资产本地筛选。
- Project 后台详情页研究中枢：集中展示项目概览、研究问题、背景、方法、里程碑、私密附件、相关知识笔记 / 学术成果和快捷操作。
- Knowledge 后台详情页知识节点：集中展示知识摘要、正文、分类、标签、关联 Project、私密附件、同项目成果和搜索入口。
- Skill 后台详情页能力包 / 工作流包：集中展示用途、平台、版本、状态、使用说明、私密资料、版本记录和相关资产搜索入口。
- Publication 后台详情页成果中枢：集中展示成果摘要、abstract、关联 Project、私密材料、同项目 Knowledge 和搜索入口。
- Project / Publication / Knowledge / Skill 后台详情页提供公开发布准备度 checklist，基于 visibility、slug、标题、摘要、标签 / 分类、正文 / 说明、关系和 public 附件计数等已有字段提示公开运营状态。
- v1.1 Asset model clarity polish 已明确 Project / Publication / Knowledge / Skill 的资产定义，并同步到新建 / 编辑表单、列表空状态和 AI Draft Lab 目标类型说明；本轮不新增数据库、migration、RLS、Storage policy，也不修改 public download route。
- v1.1 Form consistency and AI prefill polish 已复查 AI Draft Lab 到四类新建表单的浏览器临时 handoff：提示条明确只做浏览器预填、不自动保存或公开；select / checkbox 字段匹配允许大小写和多余空格差异；本轮不新增数据库、migration、RLS、Storage policy，也不修改 public download route。
- v1.1 Search / Listing / Mobile polish 已打磨后台全局搜索、后台四类资产列表、Documents 文件中心和四类公开列表页的长文本、标签换行、结果摘要和 390px 移动端可读性；本轮不新增数据库、migration、RLS、Storage policy、public download route、AI 搜索、OCR、向量搜索或 Documents 正文读取。
- v1.1 Final QA docs sync and release notes 已新增 `docs/v1-1-release-notes.md`，并把 README、当前状态、项目记忆、路线图和维护手册同步到 Personal Asset Intranet 稳定使用阶段；本轮只做文档和 QA checklist，不新增数据库、migration、RLS、Storage policy，也不修改 public download route。
- v1.1.1 Documents collection-first polish 将 `/dashboard/documents` 首页调整为文档包优先：先展示 document collections metadata，再展示 `collection_id IS NULL` 的独立文件；文档包详情页支持继续上传单个文件到当前已有文档包；个人资料建议先通过文档包组织，Profile 真实文件关联暂不实现。本轮不新增数据库、migration、RLS、Storage policy，不读取 Documents 正文或 Storage object，也不修改 public download route。
- v1.1.3 Resume export typography fixes 修复简历个人信息区邮箱导出样式与实习经历岗位 / 部门加粗；追加 section order and icons fix 后，Word 导出不再保留空 section 标题 / 图标，项目经历固定在实习经历之后、在校经历之前；project icon and role typography polish 继续替换为更简洁的深灰项目文件夹图标，并同步加粗项目经历角色行、在校经历岗位行；只涉及网页预览顺序、默认 section order 和 Word 模板导出前 / 渲染后的样式归一化，不改数据库、Storage、public download route 或照片上传 / 导出安全逻辑。
- v1.1.4 Workstation API/CLI design 只新增设计文档和状态同步，建议未来通过 Workstation CLI -> Workstation Admin API -> 现有 server-side validation -> Supabase Auth / RLS / Storage 的路径提供受控操作。第一版规划 health、Project / Knowledge / Skill list/create、collection list 和 document upload，但本轮不实现任何真实 API、CLI、token、migration 或外部写入能力。
- v1.2.0 Workstation Admin API MVP 已新增 `/api/workstation/health`、`/api/workstation/projects`、`/api/workstation/knowledge`、`/api/workstation/skills` 和 `/api/workstation/document-collections`。当前只支持静态 token 认证、统一 JSON 响应、metadata list 和 private create；不支持 upload、delete、update、public publish、visibility manage、operation logs 落库或 CLI。
- v1.2.1 Workstation CLI MVP 已新增 `scripts/workstation.mjs` 与 `npm run workstation -- ...` 入口。CLI 只解析命令、读取本地环境变量、读取用户显式提供的本地文本文件、调用 Admin API 并格式化输出；不直连 Supabase，不读取 Storage，不读取 Documents 正文，不生成 signed URL。该条是历史状态，`update` 禁止边界已被 v1.2.5 / v1.2.7 的白名单 update 取代。
- v1.2.2 Workstation diagnostics and CLI query polish 已增强 `/api/workstation/health` 的 data access select 诊断、CLI health 输出和 Knowledge list 的 `project_id` 查询过滤；生产 / 本地联调文档新增 `service_role` grant checklist、本地 fallback 和 Node fetch 代理注意事项。
- v1.2.3 Workstation operation logs and permission hardening 已新增 Workstation API requestId、operation log 落库、轻量 rate limit、CLI 错误 requestId 展示和后台 `/dashboard/developer/workstation-logs` 只读审计页；仍不开放 upload、delete、update、public publish 或 visibility manage。
- v1.2.4 Workstation Codex Skill wrapper 已新增项目内 Codex skill 文档 `.codex/skills/workstation/SKILL.md`，用于指导 Codex 何时调用 Workstation CLI、如何处理 requestId 错误和哪些高风险能力继续禁止；不新增真实 Workstation 能力。
- v1.2.5 Workstation update API / CLI MVP 已新增 Project / Knowledge / Skill 白名单 update：Project 可补充 title、summary、status、tags、background、research_question、methodology；Knowledge 可补充 title、category、excerpt、content、tags、project_id；Skill 可补充 name、description、category、platforms、status、content、usage_guide、input/output description、current_version、repository_url。update 会写 operation logs，但不开放 upload、delete、public publish 或 visibility manage。
- v1.2.6 Workstation show / ID resolution polish 已新增 Project / Knowledge / Skill show by id or slug，CLI update 可用 slug 解析到 id 后复用既有 update route，list 人类可读输出包含完整 id；仍不开放 Documents / Storage / upload / delete / public publish / visibility manage。
- v1.2.7 Workstation project progress/date update 已把 Project update 白名单扩展到 `progress` 和 `start_date`，用于维护项目进度百分比和开始日期；不新增 `current_stage`，不开放 Documents / Storage / upload / delete / public publish / visibility manage。
- v1.2.8 Workstation document upload design 已新增后续文件上传设计文档，规划未来 `document upload` 命令、`upload-intent` / `finalize` API、`upload_documents` capability、服务端生成 ASCII-safe Storage path、默认 private metadata、collection stats 刷新和 operation logs 摘要；本轮仍不实现真实上传，不新增 API / CLI / migration / Storage / RLS / public download 改动。
- v1.2.9 Workstation Document Upload API MVP 已新增后端 `upload-intent` / `finalize` route、`upload_documents` capability、Workstation 专用 10 MB 文件限制、受控 `workstation-uploads/collections/{collection_id}/uploads/{upload_id}/file.{ext}` path、Storage object existence check、默认 private metadata 写入、collection stats 重算和 `documents.upload_intent` / `documents.finalize` operation logs；CLI 仍没有 `document upload` 命令，真实受控上传器和 CLI upload 后续单独 PR。
- v1.2.10 Workstation controlled uploader / CLI document upload MVP 已新增 `documents.upload` 受控上传 route 和 CLI `document upload` 命令，支持把单个本地 PDF / DOCX / XLSX / CSV / TXT / MD / PNG / JPG / JPEG 上传到已有文档包；上传仍走 Workstation Admin API、`upload_documents` capability、服务端生成 Storage path、private bucket、默认 private metadata、collection stats 刷新和安全 operation logs，不开放批量 / 目录 / public / visibility / delete / OCR / vector / AI summary / signed URL。
- v1.2.11 Workstation upload UX / safety polish 已让 CLI `document upload` 在非 JSON 模式显示上传前安全摘要和三步进度，在 `--json` 模式保持纯 JSON，并补充 0027 grant、collection 不存在、支持类型和 10 MB 上限的友好错误提示；collection list 继续展示完整 id，文档和 skill 明确上传前先查 id、不猜 id、不自动创建 collection。
- v1.2.12 Workstation collection resolution polish 已新增 collection show 只读 API / CLI，`collection list --q`、`--related-type`、`--related-id` 和完整 id 输出用于上传前定位文档包；operation logs 新增 `document_collections.show`，request summary 只记录 `collection_id`。
- v1.2.13 Workstation Codex runbook 已新增 `docs/workstation-codex-runbook.md`，把 v1.2.0-v1.2.12 的真实 PR / smoke / grant 排查经验整理为 Codex 可执行操作手册；`.codex/skills/workstation/SKILL.md` 和 CLI usage 已指向该 runbook。
- v1.2.14 Workstation Codex Skill discovery hardening 已把 Skill 名称调整为 `Personal Workstation`，扩展 description 的 `personal workstation` / `workstation CLI` / `project` / `knowledge note` / `document upload` 等检索关键词，补充中英文触发语义、Never do、标准调用模式和 examples 文件；这只是 Codex 发现性和说明层加固。
- v1.2.15 Cross-project Workstation Skill Pack design 已新增 `docs/workstation-cross-project-skill-pack.md`，设计未来 `packages/workstation-skill-pack/`、目标项目 `.codex/skills/workstation/`、standalone `scripts/workstation.mjs`、安装器、token 安全策略和接入验证流程；当前只是设计，不新增真实安装器或跨项目复制动作。
- v1.2.16 Cross-project Workstation Skill Pack installer 已新增 `packages/workstation-skill-pack/` 的最小安装器、README、目标项目 Skill / examples 和 standalone Workstation client，并新增根脚本 `workstation:install-skill`。安装器只复制文件到用户指定目标项目，拒绝覆盖除非 `--force`，不自动改目标 `package.json`，不复制 token、`.env.local`、service role key、Storage credentials、migration、RLS 或 Storage policy。
- v1.2.17 Cross-project install UX polish 已让安装器支持 `--check` / `--dry-run`，并检查目标 `package.json` / `scripts.workstation` 后给出手动配置提示；仍不自动修改目标项目、不复制 secret、不新增后端或 Storage 能力。
- v1.2.18 New Project Bootstrap Guide 已新增新项目接入手册，定义 5 分钟接入流程、标准目录结构、最小接入原则和失败排查；仍不新增真实系统能力。
- Project / Publication / Knowledge / Skill 新建与编辑表单提供 AI 草稿补全助手，基于当前浏览器表单白名单字段生成建议，并支持补全空字段、优化已有内容、公开风险检查三种模式；管理员可复制或采用到表单字段，但仍需手动保存。AI 不自动修改 visibility，不自动创建内容，不读取 Documents / Storage。
- `/dashboard/ai-drafts` 提供 AI 草稿实验室，可把管理员粘贴的原始文本转换为 Project / Publication / Knowledge / Skill 结构化草稿；支持复制字段、复制完整 Markdown，或通过当前浏览器 `sessionStorage` 带入对应新建表单进行人工确认预填。不自动保存数据库、不自动创建资产、不读取 Documents / Storage。
- RelatedDocumentsPanel 按文档包、独立文件和跨文档包文件分组展示。
- 文档包整体迁移 / 同步关联工具。
- Project / Publication / Knowledge / Skill 后台详情页内嵌关联文件与文档包区域。
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
- v1.1.2 后，Resume 照片来源优先为 basic 素材的 `details.photo_url`，其次为 Profile `avatar_url`；网页预览和 Word 导出都尊重 `show_photo`，Word 图片获取失败时安全降级为无真实照片 / 占位导出。
- 管理后台 UI 已优化。
- 后台新建 / 编辑 / 上传 / 授权页已调整为更平衡的工作台布局。

后台仍只允许管理员访问。后台写入继续通过 Server Actions 验证管理员身份，并依赖 Supabase RLS 作为数据库权限边界。

Phase 2O-A 后，后台产品进入稳定维护阶段。Dashboard 和侧边栏主入口集中在 Projects、Knowledge、Skills、Publications、Documents、Workspace Search、AI Draft Lab、Calendar、Career 和 Profile；Market Brief 已弃用并移除产品入口；访问申请 / Access Grants / Viewer 外部授权已在 Phase 2R-Z 退役，不恢复；v1.1 后维护以真实资产录入、手动内容补充、安全巡检、搜索 / Documents / 移动端观察和小 bug 修复为主，不主动扩展 Agent CEO、自动化中心、任务中心、公开内容 sprint、首页精选区或求职自动化功能。Phase 3A-R / 3A-S / 3A-T / 3B 的 AI 只作为管理员后台内容生产辅助，不改变公开站点或权限模型。

### Workspace Search

已完成：

- 后台新增 `/dashboard/search` 全局搜索入口。
- 搜索范围包括 Projects、Publications、Knowledge、Skills、Documents 和 Document Collections。
- 搜索只查数据库 metadata，每类最多返回 8 条结果，不做分页。
- 搜索支持 `type=all|projects|publications|knowledge|skills|documents|collections` 类型筛选。
- 类型筛选 chips 显示全部和每类命中数量；选中某类但无结果时保留切换入口并显示“当前类型没有匹配结果”。
- 结果标题和描述用安全 React 文本切片做关键词高亮，不保存索引，不使用 HTML 注入。
- 结果摘要在展示前做长度限制；文件名搜索对中文、英文、空格、下划线和短横线分隔更宽容，但仍只基于 metadata。
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
- 不修改公开 Project 页面、外部授权、Resume、Career 或 Market Brief。

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
- 不修改公开 Knowledge 页面、Project / Skill / Publication 详情页、外部授权、Resume、Career 或 Market Brief。

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
- 不修改公开 Skill 页面、Project / Knowledge / Publication 详情页、外部授权、Resume、Career 或 Market Brief。

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
- 不修改公开 Publication 页面、Project / Knowledge / Skill 详情页、外部授权、Resume、Career 或 Market Brief。

### Documents And Storage

已完成：

- private Supabase Storage bucket：`workspace-files`。
- 管理员上传。
- 多文件上传。
- 文件夹上传 metadata。
- 管理员下载。
- signed URL 短时下载。
- 文件上传默认 `visibility = "private"`；管理员可在文件详情页或文件中心批量工具中显式设为 `public` / `private`。
- 文件和文档包可关联 Publication / Project / Knowledge / Skill，并支持一个文件或文档包同时关联多个研究资产。
- Project / Publication / Knowledge / Skill 后台详情页可直接查看关联文件和文档包。
- 各内容详情页上传入口复用 `/dashboard/documents/upload`，并通过 query params 预填关联对象、上传模式、分类和文档包类型。
- Project / Publication / Knowledge / Skill 新建表单支持“保存并上传附件”操作：对象先创建成功，再跳转统一上传页并预选新对象。
- `/dashboard/documents` 首页现在以文档包为主入口，卡片展示文档包标题、类型、文件数、总大小、更新时间、根目录和关联摘要；点击卡片进入现有文档包详情页。
- 文件中心首页的独立文件区域只展示 `collection_id IS NULL` 的文件；已加入文档包的文件在对应文档包详情页维护，避免默认首页重复展开全部文件。
- 文档包详情页的“上传文件到此文档包”入口会跳转到现有单文件上传页并传入 `collection_id`；上传页验证文档包可读后显示提示、提交 hidden `collection_id`，上传成功后返回该文档包详情页。
- 个人生活、签证、身份、求职、合同等资料当前建议通过文档包组织；Profile 真实文件关联涉及类型、resolver、页面和权限边界，暂不实现。
- 文件详情页支持编辑文件显示名称、分类、visibility 和 legacy primary relation，并可查看全部关联 chips、添加关联或移除 link-table 关联。
- 文档包详情页支持编辑文档包名称、描述、类型和 legacy primary relation，并可查看全部关联 chips、添加 / 移除文档包关联，可选择同步到包内文件。
- Documents 列表支持按 category、related_type 和 collection 状态筛选；`related_type / related_id` 现在表示“包含该资产关联”，`related_type=unlinked` 可查看没有专用关联和 legacy 关联的文件。
- Documents 文件中心批量区已改为紧凑工具栏，支持批量添加关联、按资产批量移除关联、清空全部关联、设置公开性、zip 下载、批量删除和高级 legacy primary relation 操作。
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
- #99 追加 UI polish：上传页、文件详情页、文档包详情页和文件中心批量添加关联都使用 checkbox / chips 分组选择器，不再使用原生多选框；文件中心“权限”列显示为轻量私密状态标签。
- Phase 2R-A-4A 新增公开附件底座：公开 Project / Publication 详情页可展示当前 public 资产下显式 public 文件；附件组件只接收 id、文件名、分类、大小、MIME type、更新时间、关系标签和 `/public-files/[id]/download`，不接收或输出 Storage path、Storage bucket、owner_id、signed URL、raw link rows 或 relation note。
- `0021_public_attachment_service_role_grants.sql` 只给 `service_role` 授予 `projects`、`publications`、`knowledge_notes`、`skills`、`documents` 和 `document_asset_links` 的 `select`，用于 server-side public 附件查询与下载 route 复核；它不开放匿名 Documents 读取，也不把 private Storage bucket 改为 public。
- Phase 2R-A-4B polish 公开四类详情页：Project 展示研究问题、背景、方法、状态、进度、标签、相关公开成果 / 知识和公开附件；Publication 展示成果摘要、类型、日期、项目、相关知识和公开附件；Knowledge 展示分类、摘要 / 正文、公开项目和相关公开内容；Skill 展示说明、平台、状态、版本和相关公开 Skill，但不公开 Skill 包或私密附件。
- public 下载路由会服务端复核：文件 `visibility = "public"`、文件属于 `workspace-files`、当前资产为 public，且文件通过 `document_asset_links` 或 legacy `related_type / related_id` 关联到该资产；通过后才按需生成 60 秒短时 signed URL。
- public 附件关系展示也会对同一资产下的 legacy `related` fallback 做降噪：已有 `deliverable` 等具体关系时，不再同时展示“相关”。
- `documents.relative_path` / `documents.folder_path` 保存文件夹上传的相对路径信息。
- `documents.storage_path` 使用 ASCII-safe object key；中文文件名和文件夹名只保存在显示名、`original_name`、`relative_path` 等展示字段中。
- 单文件最大 50 MB；批量 / 文件夹上传单次最多 100 个文件，总量 200 MB。
- Publication 有附件时禁止直接删除。
- 公开页面不展示 private / unlisted Documents，不展示 signed URL，不展示 Storage 路径。

文件上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。Documents 是 Project / Publication / Knowledge / Skill 的统一默认私密附件底座；Phase 2R-A-4A 只允许管理员显式公开单个文件后，通过当前 public Project / Publication 详情页的安全下载路由展示，Phase 2R-A-4B 只 polish 公开详情页整合方式和 public related content，不公开 Knowledge / Skill 附件、不公开 raw Documents 管理能力、不执行上传代码、不解析或安装 Skill 包。Phase 2P-B 只把附件查看与预填上传入口嵌入后台内容详情页；Phase 2P-C 只增加 create-and-upload 跳转流，不做 pending upload、临时文件 staging 或 create action 文件处理。Phase 2P-D 只增强后台 metadata 管理与筛选；Phase 2P-E-1 只增强批量关联整理能力；Phase 2P-E-1-B 只澄清内容详情页附件展示；Phase 2P-E-1-C 只增加主动整体迁移 / 同步关联工具；Phase 2P-E-2 只增加管理员批量删除文件和删除整个文档包及文件能力；Phase 2P-E-3 只增加管理员后台 zip 临时下载能力。Phase 2P-G-1 新增 0020 migration 和专用多关联表，同时保留 legacy primary relation 兼容；关联 chips 的 `related` 降噪、多关联选择器和权限列 polish 只在展示层完成，不删除 legacy 数据，不新增 migration，不改 Storage policy，不新增 RPC。Phase 2R-A-4A / 2R-A-4B 不新增业务 schema、不新增 RPC、不修改 RLS 或 Storage policy；0021 只补 service-role `select` grant。zip 按请求生成，不保存到 Storage。

### External Access Requests And Grants

状态：Phase 2R-Z 已退役，不再作为当前能力。

- `/access-request` 已删除。
- `/viewer/login` 与 `/viewer/callback` 已删除。
- `/dashboard/access-requests` 与 `/dashboard/access-grants` 已删除。
- 访问申请 / 授权 actions、queries、forms、validations、context helper 和 viewer redirect helper 已删除。
- 0022 migration 会删除旧 `access_requests`、`content_access_grants`、`has_content_access()` 和 `can_request_viewer_login()`。

后续不要恢复外部访问申请、Access Grants、Viewer magic link 或 restricted 外部授权。

### Restricted Access Foundation

状态：Phase 2R-Z 已退役。

历史 `restricted` 内容由 0022 migration 回写为 `private`。后台 visibility 选项收紧为 `public`、`private`、`unlisted`。公开页面只展示 public 内容，未公开 slug 不确认内容是否存在。

## Permission Boundary

| 区域 | 谁可访问 |
| --- | --- |
| public 内容 | 所有人 |
| unlisted 内容 | 不出现在公开列表，当前能力保持保守 |
| private 内容 | 仅管理员 |
| dashboard | 仅管理员 |
| documents | 仅管理员 |
| signed URL | 仅管理员流程生成 |

重要边界：

- `robots.txt` 和 `sitemap.xml` 不是安全边界。
- 真正安全边界依赖 Supabase Auth、RLS、Storage policy 和后台路由保护。
- Documents 不对外开放。
- private / unlisted / 历史 restricted 内容不得出现在公开列表或 sitemap 中，也不得被公开页面泄露标题、ID、Storage 路径或 signed URL。

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
- `0009_resume_items.sql`
- `0010_resume_versions.sql`
- `0011_resume_template_fields.sql`
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

Phase 2R-A-1 只调整公开首页、公开导航、公开 publication 查询边界和项目文档，不新增 Supabase migration，不修改 RLS、Storage policy、Documents 或 `research_asset_links`。

Phase 2R-A-2 只 refine 公开首页 hero 视觉识别：增加自绘 CSS 金融 / 量化 / 研究背景元素，优化 H1 系统字体栈，不新增 Supabase migration，不引入字体文件、外部字体服务、图表库或动画库，不修改公开查询、Documents、RLS、Storage policy 或后台显式关系。

Phase 2R-A-3 只 polish 公开 Projects / Publications / Knowledge / Skills 列表页和 SEO metadata：筛选基于已有 public 字段和 URL query params，不新增 Supabase migration，不新增字段、RPC、索引、外部搜索服务或动画库，不读取 Documents、Storage object、文件内容、`document_asset_links` 或 `research_asset_links`。

Phase 2R-A-4A public 附件功能本身不新增业务 schema，但生产排查发现 server-side `service_role` 缺少表级 `select` grant 会导致 public 附件面板返回空数组。hotfix 后需要继续执行：

- `0021_public_attachment_service_role_grants.sql`
- `0022_remove_external_access_and_restricted_viewer.sql`

`0021` 只给 `service_role` 补公开附件查询和 `/public-files/[id]/download` 校验链路需要的只读表权限；不新增表、字段、RPC，不修改 RLS、Storage policy、bucket public 状态、`storage_path` 或文件多关联数据。

Phase 2R-B-1 / 2R-E-1 / 2R-E-2 的访问申请与授权体验已被 Phase 2R-Z 取代；当前产品代码不再依赖 `access_requests` 或 `content_access_grants`。

Phase 2R-C-1 公开 SEO 与分享体验 polish 不需要新增 migration；它只调整应用层 metadata、canonical、Open Graph / Twitter card、sitemap 和 robots。sitemap 只读取 public 查询，查询失败时返回基础公开静态页面；robots 不改变真实权限边界，只阻止 dashboard、API、viewer、public-files 和后台下载入口被索引。

Phase 2R-C-2 公开发布前 QA / hardening 不需要新增 migration；它只新增公开 smoke 脚本、公开文案 hardening 和附件 metadata 移动端换行修补。不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载、public 文件下载 route 或任何 Supabase schema。

Phase 2R-D-1 公开内容运营基础不需要新增 migration；它只新增后台 public readiness checklist、一个只读 public 附件计数 helper 和公开内容运营文档。不新增字段、RPC、索引、AI、搜索服务或审批流，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。

Phase 3A-R Project AI 表单草稿助手不需要新增 migration；它只新增后台 Project 表单内 AI 组件、严格白名单 Server Action 和文档。不新增字段、RPC、索引，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。

Phase 3A-S Publication / Knowledge / Skill AI 表单草稿助手不需要新增 migration；它只扩展后台三类资产新建 / 编辑表单、严格白名单 Server Action 和文档。不新增字段、RPC、索引，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。

Phase 3B AI 原始素材转结构化草稿实验室不需要新增 migration；它只新增后台 `/dashboard/ai-drafts` 页面、严格白名单 Server Action 和文档。不新增草稿表，不写数据库，不修改 RLS、Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。

Phase 3B-1 AI Draft Lab to New Form Prefill 不需要新增 migration；它只新增浏览器 `sessionStorage` handoff 和四类新建表单的确认预填提示。不自动提交表单，不自动保存数据库，不自动创建资产，不修改 `visibility`，不读取 Documents / Storage，也不修改 RLS、Storage policy 或 public 文件下载 route。

Phase 2R-Z 新增 `0022_remove_external_access_and_restricted_viewer.sql`；该迁移将历史 `restricted` 内容回写为 `private`，收紧四类内容表 visibility constraint 和 public read policy，并删除旧访问申请 / 授权表与授权函数。不修改 Storage policy、Documents 上传 / 删除 / zip 下载或 public 文件下载 route。

v1.1 / v1.1.1 / v1.1.2 / v1.1.3 / v1.1.4 polish 不新增 migration。#125、#126、#127、#128、v1.1 final QA、v1.1.1 Documents collection-first polish、v1.1.2 Resume photo export polish、v1.1.3 Resume export typography fixes 和 v1.1.4 Workstation API/CLI design 只围绕边界、文案、表单预填、搜索 / 列表 / 移动端展示、维护清单、release notes、Documents 首页 / 文档包上传信息架构、Resume 照片预览 / Word 导出链路、简历导出排版细节和未来受控 API/CLI 方案设计打磨；不修改数据库 schema、RLS、Storage policy、bucket visibility、Documents 文件读取、public 文件下载 route，也不新增真实 Admin API、CLI、token 或外部写入能力。

v1.2.0 Workstation Admin API MVP 不新增 migration。它只新增受 `WORKSTATION_API_TOKEN` 保护的低风险 `/api/workstation/*` route、服务端 capability 常量、统一响应 helper 和 metadata 查询 / private 创建 helper；不新增 token 表、operation_logs 表、Storage 逻辑、文件上传 API、CLI 或外部集成。

v1.2.1 Workstation CLI MVP 不新增 migration。它只新增本地 Node CLI 脚本、`npm run workstation` 入口、环境变量占位和使用文档；不新增 token 表、operation_logs 表、RLS、Storage policy、bucket visibility、文件上传 API、public download route 或任何 Supabase schema。

v1.2.2 Workstation diagnostics and CLI query polish 不新增 migration。它只新增 health select 诊断、Knowledge list 查询过滤、CLI 输出小修和文档 checklist；生产 Supabase 如缺少 `service_role` 表级权限，应通过 SQL Editor 或后续 migration 管理 grant，不修改既有 RLS、Storage policy、bucket visibility、Documents 或 public download route。

v1.2.3 Workstation operation logs and permission hardening 新增 `0023_create_workstation_operation_logs.sql`。该 migration 只创建 Workstation API 审计表、约束、索引和 admin-read RLS policy，并给 `service_role` 最小 `select, insert` grant；不修改 Documents、Storage policy、bucket visibility、public download route、既有内容表 RLS 或文件数据。

v1.2.4 Workstation Codex Skill wrapper 不新增 migration。它只新增 `.codex/skills/workstation/SKILL.md` 和文档同步，不修改数据库 schema、RLS、Storage policy、bucket visibility、Workstation API route、CLI 命令、public download route 或 Documents 数据。

v1.2.5 Workstation update API / CLI MVP 新增 `0024_workstation_update_service_role_grants.sql`。该 migration 只让 `workstation_operation_logs` 接受 PATCH method，并给 `service_role` 补 Projects / Knowledge / Skills 白名单字段 update grant；不修改 RLS、Storage policy、bucket visibility、Documents、public download route 或文件数据。

v1.2.5 hotfix 新增 `0025_consolidate_workstation_service_role_grants.sql`。该 migration 只补齐 Workstation Admin API 已经需要的 `service_role` 最小权限：Project / Knowledge / Skill 的 select / insert / update，Document Collections 的 select，以及 Workstation operation logs 的 select / insert 和 PATCH method check；不新增 API route、CLI 命令、RLS policy、Storage policy、bucket visibility、public download route、upload、delete、public publish、visibility manage、token 表或 token UI。

v1.2.6 Workstation show / ID resolution polish 不新增 migration。它只复用既有 `[id]` route 增加 GET show、CLI show、CLI slug-to-id update 解析和 list 输出字段调整；继续依赖 0025 已固化的 select / update / operation log 权限，不修改 RLS、Storage policy、bucket visibility、Documents 或 public download route。

v1.2.7 Workstation project progress/date update 新增 `0026_workstation_project_progress_date_update_grants.sql`。该 migration 只给 `service_role` 补既有 `projects.progress` 和 `projects.start_date` 的列级 update 权限，不新增字段，不修改 RLS、Storage policy、bucket visibility、Documents、visibility 行为或 public download route。

v1.2.8 Workstation document upload design 不新增 migration。它只新增设计文档和状态同步，不新增 API route、CLI 命令、RLS、Storage policy、bucket visibility、public download route 或真实上传能力。

v1.2.9 Workstation Document Upload API MVP 新增 `0027_workstation_document_upload_grants.sql`。该 migration 只给 `service_role` 补 Workstation document upload finalize 所需的 `documents` select / insert 和 `document_collections` stats update grant，不修改 RLS、Storage policy、bucket visibility、public download route 或文件数据。

v1.2.10 Workstation controlled uploader / CLI document upload MVP 不新增 migration。它只新增受控上传 API route、CLI `document upload` 流程、日志 action 常量和文档同步，继续依赖 0027 的最小表权限和 server-side service-role Storage upload；不修改 RLS、Storage policy、bucket visibility、public download route、Documents visibility 语义或现有文件数据。

v1.2.11 Workstation upload UX / safety polish 不新增 migration。它只修改 CLI 输出 / hint 和文档 / skill，不新增 API route，不修改 RLS、Storage policy、bucket visibility、public download route、Documents visibility 语义或现有文件数据。

v1.2.12 Workstation collection resolution polish 不新增 migration。`workstation_operation_logs` 没有 action constraint，新增 `document_collections.show` action 只需更新应用层筛选常量；本轮只新增只读 collection show API / CLI 和文档 / skill，不修改 RLS、Storage policy、bucket visibility、public download route、Documents visibility 语义或现有文件数据。

v1.2.13 Workstation Codex runbook 不新增 migration。它只新增经验复盘 runbook 并同步 Skill / CLI usage / 状态文档，不新增 API route、CLI command、RLS、Storage policy、bucket visibility、public download route 或 Workstation 数据写入能力。

v1.2.14 Workstation Codex Skill discovery hardening 不新增 migration。它只修改 `.codex/skills/workstation/SKILL.md`、新增 Skill examples 并同步文档，不新增 API route、CLI command、RLS、Storage policy、bucket visibility、public download route 或 Workstation 数据写入能力。

v1.2.15 Cross-project Workstation Skill Pack design 不新增 migration。它只新增 cross-project Skill Pack 设计文档并同步 Skill / runbook / CLI usage / 状态文档，不创建真实 package、安装器、CLI client、API route、CLI command、RLS、Storage policy、bucket visibility、public download route 或 Workstation 数据写入能力。

规则：

- 已执行过的 migration 不应修改。
- 执行 0027 后，后续数据库变更应新增 `0028_*` 或更高编号。
- 不得重跑旧 migration。
- 不得放宽 Storage / RLS。
- 不得提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL 或 `service_role`。

## Known Issue

Viewer magic link 登录、访问申请、Access Grants 和 restricted 外部授权已退役，不再作为 known issue 或后续 Phase 2I 修复方向。

Resume 预览页中 summary / 素材概述里的 bullet-like 文本自动拆行仍有生产验收遗留问题。该问题当前冻结，不纳入 Phase 2K-D 的质量检查开发范围；后续如继续处理，应单独开 hotfix。

建议后续单独开启：

- 暂无 Viewer / restricted 外部访问修复阶段。

## Stabilization Direction

v1.1 后，默认路线从“继续扩展新功能”转为“稳定使用 Personal Asset Intranet”：

- 研究资产沉淀：继续维护 Projects、Publications、Knowledge 和 Skills 的内容质量与关联关系；Project 后台详情页可作为单个研究项目的中枢入口，Knowledge 后台详情页可作为单个知识节点入口，Skill 后台详情页可作为能力包 / 工作流包入口，Publication 后台详情页可作为成果中枢入口，先整理研究框架、成果摘要、正文摘要、使用说明、平台版本、私密附件、显式资产关系和相关搜索入口。
- 公开展示：Phase 2R-A-1 起把公开首页作为“黄铭语研究工作站”入口维护，首屏 H1 为“个人研究工作站”，清晰展示研究方向、公开 Projects、Publications、Knowledge 和 Skills；Phase 2R-A-2 只强化 hero 的金融 / 量化 / 研究视觉氛围和标题字体质感；Phase 2R-A-3 只把四个公开列表页打磨为正式内容索引并增加轻量筛选，不改变公开内容查询或权限边界；Phase 2R-C-1 起统一公开 SEO、分享卡片、sitemap 和 robots，让公开站点可被安全索引和分享；Phase 2R-C-2 起用 `npm run smoke:public` 和浏览器冒烟作为公开发布前 QA，复查公开路由、fallback、sitemap、robots、metadata 和移动端边界；Phase 2R-D-1 起后台详情页提供 public readiness checklist 和公开内容运营文档，帮助管理员持续整理可公开内容；Phase 2R-F-1 起 `/about` 作为正式公开个人简介页维护；Phase 2R-Z 起移除访问申请、Access Grants、Viewer magic link 和 restricted 外部授权，公开导航保留轻量“管理员登录”入口但不显示后台菜单、文件中心、访问申请或全局关系图谱入口，公开页面继续只读展示 public 内容。
- 文件 / 知识管理：Documents 作为可维护的统一默认私密附件管理系统，服务 Projects、Publications、Knowledge 和 Skills，也可承载签证、身份、生活、求职、合同等个人私密资料；公开站点只在 Project / Publication 详情页展示显式 public 且关联当前 public 资产的安全附件摘要，Knowledge / Skill 公开详情不展示 Documents。文件中心首页优先进入文档包列表，未加入文档包的文件才显示在独立文件区域。需要调整单个文件时使用文件详情页添加 / 移除多资产关联；需要整理多个文件或个人资料时优先使用文档包；需要补充已有资料包时从文档包详情页上传单个文件到当前文档包；需要调整整个资料包时使用文档包详情页的关联管理和可选同步到包内文件；legacy primary relation 仅作为兼容字段处理。需要清理文件资产时使用批量删除或“删除整个文档包及文件”危险操作，需要本地备份或交付资料时使用 zip 临时下载；需要跨模块查找研究资产时使用 `/dashboard/search?q=关键词` 搜索 metadata，再用 `type` 筛选定位到 Documents、Knowledge、Projects 等类型。Profile 真实文件关联作为未来可能方向，当前不实现。
- v1.1 维护：继续观察四类资产分类是否清楚、AI Draft Lab 预填是否顺手、搜索和 Documents 是否适合真实资产增长、390px 移动端是否稳定；后续默认只做明确 bugfix、轻量 UX polish、文档同步和安全边界复查。
- v1.1.4 后可进入 Workstation Admin API MVP 准备：先按 `docs/workstation-cli-design.md` 评审 token capability、operation logs、upload-intent / finalize 和 API 版本兼容策略；实现前仍不得让 CLI 直连 Supabase、持有 service role key、创建 signed URL 或绕过现有后台业务校验。
- v1.2.0 后 Workstation API 进入低风险 MVP 试用：只允许静态 token 调用 health、metadata list 和 private create；如继续推进，应先做 CLI 薄层或 operation logs / permission hardening，文件上传仍需单独安全审查。
- v1.2.3 后 Workstation CLI / API 进入可审计试用：Codex / 用户可通过 `npm run workstation -- health|project|knowledge|skill|collection ...` 调用 Admin API，并在失败时用 requestId 到 `/dashboard/developer/workstation-logs` 查最近审计摘要；删除、公开发布和 visibility 管理仍需单独安全设计。
- v1.2.4 后 Codex 应优先通过 `.codex/skills/workstation/SKILL.md` 判断是否调用 Workstation CLI：保存到工作台、创建 Project / Knowledge / Skill、查询 metadata 和 health 可以使用 CLI；v1.2.10 起单文件 document upload 可用，但仍不得 delete、非白名单 update、public publish、visibility manage、读取 Documents 正文、读取 Storage object body、生成 signed URL、操作 token / service role 或调用外部应用。
- v1.2.5 后 Workstation CLI / API 可用于低风险补充既有 Project / Knowledge / Skill metadata：只更新白名单字段并记录 `projects.update`、`knowledge.update`、`skills.update` operation logs；delete、public publish、visibility manage、Documents 正文 / Storage object body / signed URL、token lifecycle、MCP、Agent CEO 和外部集成仍不开放。
- v1.2.6 后 Workstation CLI / API 可用 `project|knowledge|skill show --id|--slug` 读回单个资产的安全字段，并可用 `update --slug` 由 CLI 先解析真实 id 后调用既有 update-by-id API；list 输出首列保留完整 id，便于复制到后续命令。show / slug resolution 不读取 Documents、Storage、signed URL、owner 或 service role key。
- v1.2.7 后 Project update 还可维护 `progress` 和 `start_date`：`progress` 必须是 0-100 整数，`start_date` 必须是有效 `YYYY-MM-DD` 日期。不要新增或使用 `current_stage` 字段；阶段描述继续放在 summary / background / methodology，或沉淀为关联 Knowledge。
- v1.2.10 后 Workstation CLI / API 可把单个本地文件上传到已有 document collection：CLI 初检文件，API 生成受控 path，server-side route 写入 private Storage，finalize 写默认 private metadata 并刷新 stats。该能力只覆盖单文件 MVP，不支持批量 / 目录 / 自动建包 / public / visibility 修改 / 删除 / zip / OCR / 向量索引 / AI 摘要 / signed URL。
- v1.2.11 后 Workstation CLI document upload 更适合日常使用和 Codex 自动执行：上传前先用 `collection list` 获取真实 id，非 JSON 输出会展示安全摘要和三步进度，失败时保留 requestId 并给出 0027 grant、collection list、支持类型或 10 MB 上限提示；operation logs UI 验收优先登录后台查看，本地无 session 时只确认 API 200/201 和 requestId，不为验收打印 token、读取 `.env.local` 或直连数据库。
- v1.2.12 后上传前 collection resolution 更明确：优先用 `collection list --q "关键词"` 搜索候选，再用 `collection show --id ...` 确认目标文档包安全 metadata；多个候选时不要猜，应让用户确认。该流程不自动创建 collection，不读取 Documents / Storage，不返回 signed URL 或公开下载入口。
- v1.2.13 后 Workstation CLI 已进入可日常使用阶段：Codex 应按 `docs/workstation-codex-runbook.md` 执行开发、资产操作、上传、grant 排查和 PR review；后续可单独考虑 audit review polish 或 Agent CEO Workbench design，但不得把这些方向混入普通 CLI 操作。
- v1.2.14 后 Workstation Codex Skill 更适合被 slash menu / 语义检索发现：Skill frontmatter 使用 `Personal Workstation` 名称和更宽的 description 关键词，正文保留 runbook 为 operational source of truth，并通过 `.codex/skills/workstation/examples.md` 固化常见调用样例；后续仍不因此扩大 CLI/API 能力边界。
- v1.2.16 后，跨项目使用 Personal Workstation 有最小 Skill Pack 安装器：其他 Codex 项目可通过安装器复制 `.codex/skills/workstation/` 和轻量 CLI client，但仍需手动配置目标项目 package script 与本地 `WORKSTATION_API_URL` / `WORKSTATION_API_TOKEN`，也不把 repo-level Skill 视为全局 Skill。
- v1.2.17 后，安装器可用 `--check` 检查目标安装状态，也可用 `--dry-run` 预览复制动作；安装后会提示 `package.json` 是否缺少 `scripts.workstation`，但仍只提示、不自动改文件。
- v1.2.18 后，新项目接入 Personal Workstation 的默认入口是 `docs/workstation-new-project-bootstrap.md`；新项目无需改业务代码即可安装 Skill Pack、添加 npm script、配置本地 token 并验证只读连接。
- 求职闭环维护：Career Center、Resume、AI JD 分析记录和投递看板维持现有流程，只做 bugfix 和文案修正。
- 外部授权：Viewer magic link、访问申请、Access Grants 和 restricted 外部授权已退役，不再作为 bugfix 专项处理。

不主动推进：

- Agent CEO / 自动化扩张线。
- 自动化中心、任务中心或复盘中心。
- Market Brief / 市场简报模块。
- 新的求职自动化，如面试记录、自动提醒、投递邮件、Notion 同步或自动投递。
- 新增 cron、migration、外部集成或 AI 生成产品线。
