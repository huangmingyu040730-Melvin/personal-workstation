# Workstation CLI Usage

日期：2026-06-21

## Status

v1.2.1 新增本地 Workstation CLI MVP，v1.2.2 补充诊断输出和 Knowledge 查询过滤，v1.2.3 补充 requestId、operation logs、轻量 rate limit 和后台日志页，v1.2.4 新增 Codex Skill wrapper，v1.2.5 新增 Project / Knowledge / Skill 白名单 update，并通过 `0025_consolidate_workstation_service_role_grants.sql` 固化既有 list/create/update/log 所需的 service_role 最小权限。v1.2.6 新增 Project / Knowledge / Skill `show --id|--slug`、CLI update `--slug` 本地解析和 list 人类可读输出中的完整 `id`。v1.2.7 扩展 Project update 白名单，新增 `progress` 和 `start_date`。v1.2.8 只新增 Workstation document upload 设计文档；v1.2.9 新增后端 `upload-intent` / `finalize` API MVP；v1.2.10 新增 server-side controlled upload route 和 CLI `document upload` 单文件上传闭环；v1.2.11 打磨上传前安全摘要、三步进度、常见错误提示、operation logs 验收文档和 Codex skill 边界；v1.2.12 新增只读 `collection show --id` 和上传前 collection resolution 流程；v1.2.13 新增 `docs/workstation-codex-runbook.md`，沉淀真实 Codex 执行经验；v1.2.14 强化 `Personal Workstation` Codex Skill discovery metadata、触发语义和 examples。入口为：

```bash
npm run workstation -- <command>
```

CLI 是薄层：只解析命令、读取本地环境变量、做必要的本地文件初检、调用 Workstation Admin API 并展示结果。它不直接连接 Supabase，不读取或保存 Supabase service role key，不读取 Documents 正文，不读取 Storage object body，不生成 signed URL。

For Codex workflows and operational rules, see `docs/workstation-codex-runbook.md`. 该 runbook 基于本项目真实 Codex 执行、smoke、PR 和 grant 排查经验整理，不是新增 API / CLI 能力。

For Codex Skill discovery examples, see `.codex/skills/workstation/examples.md`. 这些 examples 说明如何调用既有 CLI，不新增命令、权限、API route 或 migration。

v1.2.6 后，Project / Knowledge / Skill 支持按 id 或 slug 查看安全字段；update 仍只调用既有 PATCH by id route，CLI 在收到 `--slug` 且没有 `--id` 时会先通过 show API 解析真实 id，再执行 update。`--id` 和 `--slug` 互斥。

v1.2.7 后，Project update 可维护 `progress` 和 `start_date`：`--progress` 必须是 0-100 整数，`--start-date` / `--start_date` 必须是有效 `YYYY-MM-DD` 日期。本轮不新增 `current_stage` 字段；阶段描述继续写入 `summary` / `background` / `methodology`，或沉淀为关联 Knowledge。

过时信息保护：如果旧线程、旧截图或历史版本段落声称 Workstation CLI “只支持 list/create”或“不能 update Project 字段”，应视为 v1.2.1 时期的旧边界。当前能力以 `scripts/workstation.mjs --help`、本文件、`.codex/skills/workstation/SKILL.md` 和 v1.2.7 之后的记录为准。

v1.2.11 后，document upload 已有 CLI MVP 和 UX / safety polish：`document upload` 只上传单个本地普通文件到已有 document collection。CLI 调用 `upload-intent` 获取服务端生成的 `upload_id` / `storage_path`，通过 server-side controlled upload route 写入 private `workspace-files` bucket，再调用 `finalize` 写入默认 private metadata 并刷新 collection stats。非 `--json` 模式会显示上传前安全摘要和 1/3、2/3、3/3 进度；`--json` 仍只输出最终 JSON。CLI 不会生成 Storage path、创建 public link、生成 signed URL、读取 Documents 正文、读取 Storage object body、创建 collection、删除文件或修改 visibility。

v1.2.12 后，上传前可以先用 `collection list --q "关键词"` 搜索候选，再用 `collection show --id ...` 确认目标文档包安全 metadata。多个候选时不要猜 collection id，应让用户确认；CLI 和 Codex 都不得自动创建 collection。

v1.2.3 后，Workstation API 成功 / 失败响应都会包含 `requestId`。CLI 人类可读错误输出会显示该 requestId，便于到后台 `/dashboard/developer/workstation-logs` 查看最近审计摘要。成功输出默认不额外显示 requestId；`--json` 会原样输出 API JSON。

v1.2.4 后，Codex 使用 Workstation CLI 的项目内说明为：

```text
.codex/skills/workstation/SKILL.md
```

该 skill 只指导 Codex 何时调用既有 CLI、如何组织命令、如何处理 requestId 错误以及哪些事情不能做；它不新增任何真实命令或权限。

v1.2.14 后，该 skill 的 frontmatter 名称为 `Personal Workstation`，description 覆盖 `personal workstation`、`workstation CLI`、`save to workstation`、Project、Knowledge note、Skill、Document collection、Document upload、private asset、progress、start date 和 Codex 等关键词，以便 Codex slash menu 或语义检索更容易发现它。

Codex 执行 Workstation CLI 任务时，还应优先参考：

```text
docs/workstation-codex-runbook.md
```

## Environment

生产模式：

```bash
export WORKSTATION_API_URL="https://personal-workstation.vercel.app"
export WORKSTATION_API_TOKEN="your-local-workstation-token"
npm run workstation -- health
```

如果不设置 `WORKSTATION_API_URL`，CLI 会使用上面的默认生产地址。token 必须从本地环境变量读取，不要把真实 token 写进仓库、GitHub issue / PR、聊天窗口、日志或命令参数。CLI 不支持 `--token`，避免 token 进入 shell history。

本地模式：

```bash
export WORKSTATION_API_URL="http://localhost:3000"
export WORKSTATION_API_TOKEN="your-local-workstation-token"
npm run dev
npm run workstation -- health
```

本地真实 list/create 需要 Next.js server 端 `.env.local` 配置 Supabase data access：

```text
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

不要提交 `.env.local`，不要截图或打印 service role key，不要把 service role key 发给 Codex 聊天框。service role key 只给本地或 Vercel 的 Next.js server 使用；CLI 只持有 Workstation token，不能直接读取或保存 service role key。

如果本地 server 缺少 `SUPABASE_SERVICE_ROLE_KEY`，Workstation API 仍可验证 token，但真实 list/create 会返回 data access 未配置，例如：

```text
Workstation API data access is not configured.
```

## Health

```bash
npm run workstation -- health
npm run workstation -- health --json
```

成功时会显示 API 版本、auth、capability 和 data access 诊断，例如：

```text
Workstation API is available
apiVersion: v1
auth: ok
capabilities: read_assets, create_assets, update_assets, upload_documents
dataAccess: ok
- projects.select: ok
- knowledge.select: ok
- skills.select: ok
- documentCollections.select: ok
```

如果服务端未配置 data access：

```text
dataAccess: unconfigured
message: Workstation API data access is not configured.
```

如果某个表的只读检查失败：

```text
dataAccess: degraded
- projects.select: error
  message: permission denied for table projects
```

`--json` 会原样输出 API JSON，便于脚本检查 `data.dataAccess`。

## Project

查询：

```bash
npm run workstation -- project list
npm run workstation -- project list --q "factor" --visibility private --limit 10
npm run workstation -- project list --json
npm run workstation -- project show --id "project-id"
npm run workstation -- project show --slug "factor-investing-learning-plan"
npm run workstation -- project show --slug "factor-investing-learning-plan" --json
```

人类可读 `project list` 输出会包含完整 `id`，便于直接复制到后续 show / update 命令。

创建 private Project：

```bash
npm run workstation -- project create \
  --title "因子投资学习计划" \
  --slug "factor-investing-learning-plan" \
  --summary "围绕因子投资方法论、机器学习工具和量化研究流程的长期学习项目" \
  --status "in_progress" \
  --tags "factor,quant,learning"
```

CLI 不发送 public / unlisted visibility。传入 `--visibility public` 或 `--visibility unlisted` 会在本地被拒绝。

更新 Project 白名单字段：

```bash
npm run workstation -- project update \
  --id "project-id" \
  --progress 25 \
  --start-date "2026-06-16" \
  --background "长期研究背景" \
  --research-question "核心研究问题" \
  --methodology "阶段性学习和实验方法" \
  --tags "factor,quant,learning"
```

也可以用 slug 更新，CLI 会先解析为 id，再调用既有 update-by-id API：

```bash
npm run workstation -- project update \
  --slug "factor-investing-learning-plan" \
  --status "in_progress" \
  --progress 25 \
  --start-date "2026-06-16" \
  --summary "更新后的项目摘要"
```

允许字段：`title`、`summary`、`status`、`progress`、`start_date`、`tags`、`background`、`research_question`、`methodology`。也可以使用 `--background-file`、`--research-question-file`、`--methodology-file` 读取用户显式传入的本地文本文件。CLI 不支持 `--current-stage`。

## Knowledge

查询：

```bash
npm run workstation -- knowledge list
npm run workstation -- knowledge list --q "多因子" --category "因子投资" --limit 10
npm run workstation -- knowledge list --project-id "project-id" --visibility private
npm run workstation -- knowledge show --id "knowledge-id"
npm run workstation -- knowledge show --slug "multi-factor-model-core-logic"
```

人类可读 `knowledge list` 输出会包含完整 `id`。

创建 private Knowledge：

```bash
npm run workstation -- knowledge create \
  --title "多因子模型的核心逻辑" \
  --slug "multi-factor-model-core-logic" \
  --category "因子投资" \
  --excerpt "解释多因子模型如何通过多个风险因子刻画股票截面收益差异" \
  --content-file "./note.md" \
  --tags "factor,model,quant" \
  --project-id "project-id"
```

`--content` 和 `--content-file` 二选一；同时传入会报错。`--content-file` 只读取本地文本文件，不读取 Documents 或 Storage。

更新 Knowledge 白名单字段：

```bash
npm run workstation -- knowledge update \
  --id "knowledge-id" \
  --excerpt "更新后的摘要" \
  --content-file "./note.md" \
  --project-id "project-id" \
  --tags "factor,model,quant"
```

也可以使用 `--slug` 更新；CLI 会先用 show API 解析 id。允许字段：`title`、`category`、`excerpt`、`content`、`tags`、`project_id`。`--content` 和 `--content-file` 二选一；如果传入 `project_id`，API 会校验 Project 存在。

## Skill

查询：

```bash
npm run workstation -- skill list
npm run workstation -- skill list --category "workflow" --platform codex
npm run workstation -- skill show --id "skill-id"
npm run workstation -- skill show --slug "codex-pr-review-workflow"
```

人类可读 `skill list` 输出会包含完整 `id`。

创建 private Skill：

```bash
npm run workstation -- skill create \
  --name "Codex PR 审查流程" \
  --slug "codex-pr-review-workflow" \
  --description "用于审查 Codex 开发 PR 的固定流程" \
  --category "workflow" \
  --platforms "codex,github" \
  --usage-file "./skill-usage.md"
```

未传 `--platforms` 时默认使用 `codex`。`--usage` 和 `--usage-file` 二选一；CLI 不上传 Skill package，不执行、不解析、不安装 Skill。

更新 Skill 白名单字段：

```bash
npm run workstation -- skill update \
  --id "skill-id" \
  --usage-file "./skill-usage.md" \
  --platforms "codex,github"
```

也可以使用 `--slug` 更新；CLI 会先用 show API 解析 id。允许字段：`name`、`description`、`category`、`platforms`、`status`、`content`、`usage_guide`、`input_description`、`output_description`、`current_version`、`repository_url`。CLI 的 `--usage` / `--usage-file` 会发送为 `usage_guide`；二者不能同时传入。

## Collections

查询文档包 metadata：

```bash
npm run workstation -- collection list
npm run workstation -- collection list --q "resume" --related-type project --related-id "project-id"
npm run workstation -- collection show --id "collection-id"
npm run workstation -- collection list --json
```

Collection list 展示安全 metadata 和完整 `id`，便于复制到 `document upload --collection-id`。它不返回 Storage path、signed URL，不读取 Documents 正文，也不上传文件。

上传前应先运行 `collection list --q "关键词"` 找到候选 collection id，必要时再运行 `collection show --id "..."` 确认目标文档包。不要猜测 id，也不要为了上传自动创建 collection。人类可读 `collection list` 输出列至少包括：

```text
id | title | type | file_count | total_size | updated_at
```

`collection show` 是只读查询，只返回安全 metadata：

```text
Document collection:
- id: ...
- title: ...
- collection_type: ...
- related_type: ...
- related_id: ...
- file_count: ...
- total_size: ...
- visibility: ...
- updated_at: ...
- created_at: ...
```

`collection show` 需要 Workstation token 和 `read_assets` capability；它不读取 Documents 正文，不读取 Storage object，不生成 signed URL，不返回 public download link，也不暴露 Storage credential。

## Document Upload

v1.2.10 起 CLI 支持把单个本地文件上传到已有 document collection；v1.2.11 起非 JSON 输出会先展示安全摘要和三步进度；v1.2.12 起上传前推荐先用 `collection list --q` 和 `collection show --id` 确认真实 id：

```bash
npm run workstation -- document upload \
  --collection-id "..." \
  --file "./report.pdf" \
  --title "因子投资学习材料" \
  --category "research_material"
```

成功的人类可读输出：

```text
Preparing document upload:
- file: report.pdf
- size: 123456 bytes
- mime_type: application/pdf
- collection_id: ...
- visibility: private
1/3 Created upload intent.
2/3 Uploaded file to private storage.
3/3 Finalized document metadata.
Uploaded document:
- title: 因子投资学习材料
- id: ...
- visibility: private
- collection_id: ...
```

上传前摘要只显示 basename，不显示本地绝对路径。它也不显示 Storage path、token、Authorization、service role key、signed URL、upload credential 或文件内容。

`--json` 只输出最终 `finalize` 的 API JSON，不输出上传前摘要、三步进度或中间 `upload-intent` / `upload` 响应。

CLI 本地负责：

- 检查 `--file` 存在。
- 确认目标是普通文件，不是目录。
- 拒绝空文件。
- 拒绝 10 MB 以上文件。
- 根据扩展名猜测 MIME type。
- 拒绝 `.zip`、`.sh`、`.exe`、`.dmg`、`.app` 等压缩包、脚本、安装包和可执行文件。
- 调用 `upload-intent`、受控上传 route 和 `finalize`。
- 在非 `--json` 模式输出安全摘要和三步进度。
- 在常见失败场景下输出不含 secret 的 hint。

后端负责：

- `POST /api/workstation/documents/upload-intent`。
- `POST /api/workstation/documents/upload`。
- `POST /api/workstation/documents/finalize`。
- `upload_documents` capability。
- 10 MB 单文件上限。
- PDF / DOCX / XLSX / CSV / TXT / MD / PNG / JPG / JPEG 白名单。
- 服务端生成 ASCII-safe Storage path。
- 使用 service-role server-side 上传到 private `workspace-files` bucket。
- finalize 前检查 private bucket object 是否存在。
- 默认 `visibility = "private"`。
- 写入 `documents` metadata。
- 重算 collection `file_count` / `total_size`。
- 记录 `documents.upload_intent` / `documents.upload` / `documents.finalize` operation logs。

当前 CLI 第一版范围：

- 只上传单个本地文件。
- 只上传到已有 document collection。
- 默认 `visibility = "private"`。
- 由服务端生成 ASCII-safe Storage path。
- 写入 `documents` metadata。
- 刷新 collection `file_count` / `total_size`。

当前 CLI 第一版仍不支持批量上传、目录上传、自动创建 collection、public 文件、visibility 修改、文件删除、Documents 正文读取、Storage object body 读取、OCR、向量索引、自动摘要、zip、signed URL 或 signed public URL。

CLI 不负责：

- 生成 Storage path。
- 直连 Supabase。
- 读取或保存 service role key。
- 读取 Documents 正文。
- 解析 PDF / Word / Excel 内容。
- 自动摘要、OCR 或向量索引。
- 公开发布或创建 public link。

## Codex Skill Wrapper

项目内 Codex skill 文档位于：

```text
.codex/skills/workstation/SKILL.md
```

当用户说“保存到我的工作台”“创建 Project”“创建 Knowledge”“把这段流程沉淀成 Skill”“查询工作台项目”或“查询文档包 metadata”时，Codex 应使用该 skill 判断是否调用 Workstation CLI。

该 skill 的核心约束：

- 只调用 `npm run workstation -- ...`。
- 只读取 `WORKSTATION_API_URL` 和 `WORKSTATION_API_TOKEN`。
- 不要求用户把 token 粘贴到聊天框。
- 不打印 token，不读取或展示 `.env.local`。
- 不读取 Supabase service role key。
- document upload 只支持单文件上传到已有 collection，默认 private。
- 不读取 Documents 正文，不读取 Storage object body，不生成 signed URL。
- 只允许 Project / Knowledge / Skill 白名单 update。
- Project update 白名单包含 `progress` 和 `start_date`，但不包含 `current_stage`。
- 查询和 update 可使用 id 或 slug；slug update 只由 CLI 本地解析到 id 后调用既有 update-by-id API。
- document upload 必须使用独立 `upload_documents` capability，并只允许上传到已有 collection、默认 private、服务端生成 Storage path。
- 不 delete，不 public publish，不修改 visibility。
- 不操作 Supabase、token、用户权限、Feishu / Lark、Notion、Gmail、MCP server 或 Agent CEO。

失败时 Codex 应向用户返回 error code、message 和 `requestId`，例如：

```text
requestId: wreq_...
```

但不得输出 token 或 secret。

## Production Data Access Checklist

Workstation Admin API 使用 server-side service role client 作为受控 API 的数据访问方式。Codex / CLI 不直接持有 service role key，但 Vercel Production / Preview 或本地 Next.js server 需要配置服务端 data access。

生产 Supabase 应执行 `0025_consolidate_workstation_service_role_grants.sql` 固化 Workstation Admin API 已需的最小 grant，执行 `0026_workstation_project_progress_date_update_grants.sql` 补 Project 进度 / 开始日期 update 权限，并执行 `0027_workstation_document_upload_grants.sql` 补 Workstation document upload finalize 所需的 Documents / Document Collections grant。等价权限范围包括：

```sql
grant select, insert, update on table public.projects to service_role;
grant select, insert, update on table public.knowledge_notes to service_role;
grant select, insert, update on table public.skills to service_role;
grant select on table public.document_collections to service_role;
grant update (file_count, total_size, updated_at) on table public.document_collections to service_role;
grant select, insert on table public.documents to service_role;
grant select, insert on table public.workstation_operation_logs to service_role;
```

当前表使用 UUID 默认值，不需要在本 checklist 中额外授予 sequence 权限。不要在文档、日志或聊天窗口中记录真实 key。`health` 的 `dataAccess` 只做 `select limit 1` 检查，能发现只读表级权限或配置问题，但不能完全证明 `insert` / `update` grant 可用。create / update 失败并出现 `permission denied for table ...` 时，应优先检查对应表的 `service_role` grant。

`workstation_operation_logs` 由 `0023_create_workstation_operation_logs.sql` 创建；`0024_workstation_update_service_role_grants.sql` 让日志 method 约束接受 PATCH，并补 Workstation update 所需的白名单字段 update grant；`0025_consolidate_workstation_service_role_grants.sql` 再把 Project / Knowledge / Skill list/create/update、Document Collections list 和 operation logs 写入所需权限一次性固化；`0026_workstation_project_progress_date_update_grants.sql` 只补 `projects.progress` / `projects.start_date` 两个既有字段的 update grant；`0027_workstation_document_upload_grants.sql` 只补 `documents` metadata insert / select 和 `document_collections` stats update。RLS 只允许 admin 读取，写入通过 server-side helper 使用 service role 完成。

验证 operation logs 的推荐方式：

1. 登录后台后打开只读页面：

```text
/dashboard/developer/workstation-logs
```

该页面展示最近 100 条日志，并支持 `status`、`action`、`target_type` 筛选。document upload 应能看到 `documents.upload_intent`、`documents.upload`、`documents.finalize`。

2. 如果本地没有登录 session，页面可能跳转 `/login`。这时至少确认本地 API route 返回 200/201 和响应里有 requestId；不要为了验收去打印 token、读取 `.env.local`、展示 service role key，或直连数据库绕过后台。

operation logs 不展示 token、Authorization header、service role key、signed URL、Storage path、Documents 正文、文件内容或完整请求体。

## Network And Proxy Notes

Node.js 的 `fetch` 不一定自动走 macOS 系统代理。访问 Vercel 生产 API 超时时，优先使用本地 fallback：

```bash
export WORKSTATION_API_URL="http://localhost:3000"
npm run dev
npm run workstation -- health
```

必要时可以使用本机临时 proxy shim 作为一次性排查 workaround，但不要把 proxy shim、代理地址、token 或 `/tmp` 辅助文件提交到仓库。本轮不引入代理依赖，也不新增 `WORKSTATION_PROXY`。

## Common Errors

`Missing WORKSTATION_API_TOKEN`

本地没有设置 token。先在当前 shell 设置 `WORKSTATION_API_TOKEN`，不要把 token 作为命令参数传入。

`UNAUTHORIZED`

token 缺失、错误，或服务端 `WORKSTATION_API_TOKEN` 与本地 token 不一致。不要在日志里打印 token；只检查本地环境和部署环境是否配置了同一枚 token。

v1.2.3 起，API 错误响应会包含 `requestId`，CLI 人类可读错误会显示：

```text
- requestId: wreq_...
```

可以用这个值到 `/dashboard/developer/workstation-logs` 查询对应调用摘要。

`Unable to connect to Workstation API`

CLI 无法连接 API。检查 `WORKSTATION_API_URL`，或在本地启动 `npm run dev` 后使用 `WORKSTATION_API_URL=http://localhost:3000` 测试。

`Workstation API data access is not configured.`

服务端缺少 Supabase service role data access。生产环境检查 Vercel server env；本地环境检查 `.env.local` 是否配置 `SUPABASE_SERVICE_ROLE_KEY`。不要把该 key 交给 CLI 或贴进聊天窗口。

`permission denied for table ...`

服务端能连接 Supabase，但目标表缺少 `service_role` grant。CLI 在 create 权限错误时会附加提示：`Hint: check Supabase service_role grants for the target table.`

如果 document upload 返回 `permission denied for table documents` 或 `permission denied for table document_collections`，通常说明 Supabase migration `0027_workstation_document_upload_grants.sql` 尚未应用。

`Collection not found`

上传目标 collection id 不存在或复制错误。先运行：

```bash
npm run workstation -- collection list --q "keyword"
```

`VALIDATION_ERROR`

输入字段不满足 Admin API schema，例如缺少标题、slug 不合法、tags 格式不符合预期、update 未传任何可更新字段，或尝试传入 public / unlisted visibility。

Document upload 的常见本地错误：

- `Upload file does not exist or cannot be read.`
- `Upload file must be a regular file, not a directory.`
- `Upload file must not be empty.`
- `Upload file is too large. Maximum size: 10 MB.`
- `Unsupported upload file type. Supported types: PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG, JPEG.`

这些错误在发起上传前本地拒绝，不会读取 Documents 正文、不会生成 Storage path，也不会上传文件。

`RATE_LIMITED`

同一 token hash + IP hash 在当前服务进程内触发 best-effort rate limit。当前限制为每分钟最多 60 次请求，POST / PATCH 写请求每分钟最多 20 次。Vercel serverless 环境下该限制不是强一致边界，但会返回 `RATE_LIMITED` 并记录 error log。

## Boundaries

v1.2.12 CLI / Codex skill wrapper 只支持单文件 document upload 到已有文档包，并只增强上传前 collection resolution、UX / safety 输出。当前不支持：

- collection create。
- collection update。
- collection delete。
- 批量 document upload。
- 目录 upload。
- 自动创建 collection。
- public 文件上传。
- delete。
- 非白名单 update。
- current_stage 字段。
- public publish。
- visibility manage。
- token 管理页面。
- token 表、token rotate / revoke UI。
- 既有内容表 RLS / Storage policy / bucket visibility 改动。
- public download route 改动。
- Documents 正文读取。
- Storage object body 读取。
- signed URL 生成。
- Supabase 直连或 service role key。
- MCP server、Agent CEO、Notion / 飞书 / Gmail 集成。
