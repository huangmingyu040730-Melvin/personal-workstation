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
9. 文件下载只为管理员生成 60 秒 signed URL，不保存 signed URL，不输出到公开页面。
10. Publication 删除前检查关联 documents；存在附件时阻止删除。
11. Activity Logs 只记录后台摘要，不记录文件内容、signed URL、完整 Storage 路径、密码、密钥或 Auth UUID。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 检查 0003 migration 只包含 private bucket 和最小 Storage policies。
- 检查公开首页不展示 private/unlisted Publications，也不展示任何附件下载入口。
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
8. Documents、Storage、附件下载和 signed URL 不随 restricted 内容授权开放。
9. Viewer 登录前授权检查依赖 `0006_viewer_login_grant_check.sql`，但 0006 只提供 RPC，不代表 viewer 登录链路已稳定。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 合并后在生产 Supabase 手动执行 `0005_restricted_content_access.sql`。
- 验证 public 内容仍所有访客可看，restricted 内容只有管理员或匹配邮箱授权用户可看，private 内容仅管理员可看。
- 验证非管理员登录用户不能进入 `/dashboard`，不能访问 `/dashboard/access-grants` 或 Documents。

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

- 维护 Phase 2P-A / 2P-B / 2P-C / 2P-D / 2P-E-1 / 2P-E-1-B / 2P-E-1-C / 2P-E-2 / 2P-E-3 / 2P-F-1 / 2P-F-2 的 Documents 统一私密附件底座、多文件 / 文件夹上传、内容详情页附件区域、create-and-upload flow、metadata 管理、批量关联整理、内容详情页分组展示、文档包整体迁移 / 同步关联工具、受确认保护的删除能力、zip 临时下载和后台 metadata 搜索体验。

步骤：

1. Documents 查询逻辑继续集中在 `src/lib/queries/documents.ts`。
2. Documents 校验逻辑继续集中在 `src/lib/validations/document.ts`。
3. Documents 写入、prepare、finalize、删除和 collection 维护继续集中在 `src/actions/documents.ts`。
4. 文件类型、大小、文件名清理、Storage path 和 signed URL 配置继续集中在 `src/lib/storage/documents.ts`。
5. 上传继续使用两阶段流程：Server Action 准备 metadata 和安全 Storage path，浏览器用管理员 Supabase Auth 会话直接上传到 private bucket，Server Action finalize 写入 `documents` 记录。
6. 多文件 / 文件夹上传通过 `document_collections` 表记录批次、文件夹、附件包或 Skill 包，并通过 `documents.collection_id` 关联具体文件。
7. `original_name`、`relative_path` 和 `folder_path` 可保存中文或原始路径信息用于后台展示。
8. `storage_path` 必须使用 ASCII-safe object key；最终 Storage 文件名使用 `documentId + extension`，中文文件名和中文目录不得直接进入 object key。
9. Project / Publication / Knowledge / Skill 后台详情页只嵌入关联文件和文档包区域，不重复实现上传系统。
10. 新建 Project / Publication / Knowledge / Skill 时，“保存并上传文件 / 文件夹或文档包”必须先创建内容记录，成功后跳转 `/dashboard/documents/upload` 并用 query params 预填 `related_type`、`related_id`、`mode`、`category` 和 `collection_type`。
11. query params 只用于预填；服务端必须继续通过 `ensureRelatedRecordExists` 或同等逻辑验证关联对象存在且管理员可读。
12. Publication 删除前同时检查关联 `documents` 和 `document_collections`，存在附件或文档包时阻止删除。
13. Skill 包、代码文件和压缩包只作为私密文件存储，不执行、不解析、不安装。
14. 文件详情页只允许编辑显示名称、分类和关联对象，不允许编辑 Storage bucket/path、大小、MIME type、原始文件名、relative_path、folder_path 或 collection_id。
15. 文档包详情页只允许编辑名称、描述、类型和关联对象，不允许手动编辑 file_count、total_size、root_folder_name、owner_id、visibility 或时间戳。
16. 普通“编辑文档包信息”只修改文档包 metadata，不自动批量修改包内文件的 `related_type` / `related_id`。
17. Documents 列表和文档包详情页允许勾选多个文件后批量移动关联对象或批量解除关联。
18. 批量移动只更新 `documents.related_type` 与 `documents.related_id`，目标关联对象必须在 Server Action 中重新校验存在。
19. 批量解除关联只把 `documents.related_type` 与 `documents.related_id` 置空；不修改 `collection_id`。
20. 文档包详情页的批量操作只修改包内文件 metadata，不修改文档包自身关联对象。
21. 批量操作的 `return_to` 必须限制为站内 `/dashboard` 路径，避免 open redirect。
22. RelatedDocumentsPanel 按文档包、独立文件和跨文档包文件展示：当前对象文档包内文件由文档包卡片代表，不在独立文件中重复展示。
23. 单个文件调整：使用文件详情页，只修改该文件 metadata。
24. 多个文件调整：使用 Documents 列表或文档包详情页的批量移动 / 批量解除关联，只修改所选文件 metadata。
25. 整个资料包调整：使用文档包详情页的整体迁移 / 同步关联工具，同步修改文档包和包内全部文件的 `related_type` / `related_id`。
26. 文档包整体迁移 / 同步关联必须由 Server Action 按 `collection_id` 查询包内文件，不接收前端传入的文件 ID 或文件数量。
27. 文档包整体解除关联会把文档包和包内全部文件的 `related_type` / `related_id` 置空，但不修改 `collection_id`。
28. Documents 列表筛选只影响后台文件中心，不读取文件内容，不生成 signed URL。
29. 批量删除文件必须在 Server Action 中重新读取所选文件记录；读取失败或选择为空时不得执行删除。
30. 批量删除文件必须要求确认 checkbox，缺失时返回“请先确认删除操作。”。
31. 批量删除文件先删除 Supabase Storage object，再删除 `documents` 记录；Storage 删除失败时不删除数据库记录。
32. 批量删除文件成功后重新计算受影响文档包的 `file_count` 与 `total_size`，但不自动删除空文档包。
33. 删除整个文档包及文件必须要求确认文本 `DELETE` 或 `删除`；确认失败时不得执行删除。
34. 删除整个文档包及文件先删除包内文件的 Storage object 和 `documents` 记录，再删除 `document_collections` 记录。
35. 当前删除流程不新增数据库事务或 RPC；如果 Storage 成功但数据库删除失败，显示中文安全错误并在日志中记录 id、code/message 供人工复核。
36. 删除相关 Activity Log 不记录 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
37. 需要下载多个附件时，在 Documents 列表或文档包详情页勾选文件后使用“下载选中文件 zip”。
38. 需要下载整个资料包时，在文档包详情页或内容详情页文档包卡片使用“下载 zip”。
39. zip 下载由 Route Handler 重新校验管理员身份并重新查询文件记录，不信任前端传入的文件名、Storage 路径、大小或数量。
40. zip 按请求临时生成，不保存到 Storage，不创建持久化 zip 记录。
41. zip 下载限制为最多 50 个文件、总原始大小 100 MB；数据库声明大小会先用于预检查，下载后按实际字节数再次检查；超限时拆分下载，系统不生成部分 zip。
42. zip 下载失败时不部分打包，不输出 Storage path、signed URL、token、Authorization header、cookie、API key、Supabase key 或 secret。
43. 上传和整理文件后，先通过 `/dashboard/search?q=关键词` 按文件名、original_name、relative_path、文档包标题、项目、知识笔记、成果或 Skill metadata 全局查找资产。
44. 需要聚焦某类结果时，在搜索页使用 `type=documents`、`type=knowledge`、`type=projects` 等类型筛选；切回 `type=all` 可恢复全部分组。
45. 全局搜索只查询数据库 metadata；q trim 后少于 2 个字符时不执行查询，每类最多返回 8 条，并显示全部和每类命中数量。
46. 搜索结果标题和描述可高亮关键词，但高亮只在 React 展示层完成，不保存索引。
47. 文件正文搜索、PDF / Word / Excel / zip 解析、OCR、AI 摘要和向量搜索属于后续阶段；当前全局搜索不得读取文件正文、生成 signed URL 或输出 Storage path。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认公开 Projects、Publications、Knowledge、Skills 页面不展示附件、Storage 路径、signed URL 或下载入口。
- 确认未配置或未执行 `0018_document_collections_and_folder_uploads.sql` 的环境会清晰失败或降级，不假装上传成功。
- 真实上传验收需要用户本人登录管理员账号，并确认目标 Supabase 环境已执行 0003 和 0018。
- metadata 编辑验收不需要新增 migration；确认 0018 已执行即可。
- 批量移动和批量解除关联验收不需要新增 migration；确认 0018 已执行即可。
- RelatedDocumentsPanel 分组展示验收不需要新增 migration；确认当前查询返回文档包和文件记录即可。
- 文档包整体迁移 / 同步关联验收不需要新增 migration；确认 0018 已执行，并验证文档包和包内文件的关联对象一起更新或一起置空。
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
10. 相关知识笔记只读取 `knowledge_notes.project_id` 显式关系；没有关联时不推断内容关系。
11. 相关学术成果只读取 `publications.project_id` 显式关系；没有关联时不推断内容关系。
12. Skill 当前没有显式 Project 关系；需要查找相关 Skill 时使用项目标题或标签进入 `/dashboard/search`。
13. 本阶段不新增资产关系表、数据库字段、migration、RPC、索引或外部搜索服务。
14. Project 研究中枢不得读取附件正文、解析文件、生成 signed URL、显示 Storage path 或开放公开附件入口。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/projects/[id]` 保留返回、编辑和删除入口。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认相关资产只展示通过 `project_id` 显式关联的知识笔记和学术成果，Skill 只提供搜索快捷入口。
- 确认公开 Project 页面不展示后台研究中枢、附件下载、Storage 路径或 signed URL。

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
13. Skill 当前没有显式 Knowledge 关系；需要查找相关 Skill 时使用知识标题或标签进入 `/dashboard/search`。
14. Publication / Skill 与 Knowledge 的直接显式关联关系留到后续 Phase 2Q-B 统一设计。
15. 本阶段不新增资产关系表、数据库字段、migration、RPC、索引、AI、OCR、文件内容索引或向量搜索。
16. Knowledge 节点不得读取附件正文、解析文件、生成 signed URL、显示 Storage path 或开放公开附件入口。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/knowledge/[id]` 保留返回、编辑和删除入口。
- 确认摘要、正文、分类、标签、可见性、关联 Project 和 metadata 展示正常，空字段有友好空状态。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认相关成果只展示同项目 Publications，Skill 只提供搜索快捷入口。
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
14. 当前 Skill 没有 Project / Knowledge / Publication 显式关联字段；需要查找相关资产时使用 Skill 名称或 platform 进入 `/dashboard/search`。
15. 资产之间的显式关联关系留到后续 Phase 2Q-B 统一设计。
16. 本阶段不新增资产关系表、数据库字段、migration、RPC、索引、AI、OCR、文件内容索引或向量搜索。
17. Skill 能力包不得读取附件正文、解析文件、生成 signed URL、显示 Storage path 或开放公开附件入口。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/skills/[id]` 保留返回、编辑、删除和新增版本记录入口。
- 确认用途说明、平台、状态、版本、可见性、输入输出说明、使用指南、`SKILL.md` 和 metadata 展示正常，空字段有友好空状态。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认相关 Project / Knowledge / Publication 只提供搜索快捷入口，不伪造关联数据。
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
13. Skill 当前没有显式 Publication 关系；需要查找相关 Skill 时使用成果标题或标签进入 `/dashboard/search`。
14. Publication / Knowledge / Skill 的直接显式关联关系留到后续 Phase 2Q-B 统一设计。
15. `file_path` 不展示、不作为下载入口；`cover_url` 仅作为后台 metadata 状态展示。
16. 本阶段不新增资产关系表、数据库字段、migration、RPC、索引、AI、OCR、文件内容索引或向量搜索。
17. Publication 成果中枢不得读取附件正文、解析文件、生成 signed URL、显示 Storage path 或开放公开附件入口。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 确认 `/dashboard/publications/[id]` 保留返回、编辑和删除入口。
- 确认 summary、abstract、成果类型、标签、可见性、关联 Project 和 metadata 展示正常，空字段有友好空状态。
- 确认 RelatedDocumentsPanel 的文档包、独立文件和跨文档包文件展示仍沿用既有行为。
- 确认同项目 Knowledge 只通过现有 `project_id` 展示，Skill 只提供搜索快捷入口。
- 确认公开 Publication 页面不展示后台成果中枢、附件下载、Storage 路径、signed URL 或 `file_path`。
