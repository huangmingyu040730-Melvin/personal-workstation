# Workstation CLI Usage

日期：2026-06-20

## Status

v1.2.1 新增本地 Workstation CLI MVP，v1.2.2 补充诊断输出和 Knowledge 查询过滤，v1.2.3 补充 requestId、operation logs、轻量 rate limit 和后台日志页，v1.2.4 新增 Codex Skill wrapper，v1.2.5 新增 Project / Knowledge / Skill 白名单 update，并通过 `0025_consolidate_workstation_service_role_grants.sql` 固化既有 list/create/update/log 所需的 service_role 最小权限。v1.2.6 新增 Project / Knowledge / Skill `show --id|--slug`、CLI update `--slug` 本地解析和 list 人类可读输出中的完整 `id`。入口为：

```bash
npm run workstation -- <command>
```

CLI 是薄层：只解析命令、读取本地环境变量、调用 Workstation Admin API 并展示结果。它不直接连接 Supabase，不读取或保存 Supabase service role key，不读取 Documents 正文，不读取 Storage object，不生成 signed URL。

v1.2.6 后，Project / Knowledge / Skill 支持按 id 或 slug 查看安全字段；update 仍只调用既有 PATCH by id route，CLI 在收到 `--slug` 且没有 `--id` 时会先通过 show API 解析真实 id，再执行 update。`--id` 和 `--slug` 互斥。

v1.2.3 后，Workstation API 成功 / 失败响应都会包含 `requestId`。CLI 人类可读错误输出会显示该 requestId，便于到后台 `/dashboard/developer/workstation-logs` 查看最近审计摘要。成功输出默认不额外显示 requestId；`--json` 会原样输出 API JSON。

v1.2.4 后，Codex 使用 Workstation CLI 的项目内说明为：

```text
.codex/skills/workstation/SKILL.md
```

该 skill 只指导 Codex 何时调用既有 CLI、如何组织命令、如何处理 requestId 错误以及哪些事情不能做；它不新增任何真实命令或权限。

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
capabilities: read_assets, create_assets, update_assets
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
  --background "长期研究背景" \
  --research-question "核心研究问题" \
  --methodology "阶段性学习和实验方法" \
  --tags "factor,quant,learning"
```

也可以用 slug 更新，CLI 会先解析为 id，再调用既有 update-by-id API：

```bash
npm run workstation -- project update \
  --slug "factor-investing-learning-plan" \
  --summary "更新后的项目摘要"
```

允许字段：`title`、`summary`、`status`、`tags`、`background`、`research_question`、`methodology`。也可以使用 `--background-file`、`--research-question-file`、`--methodology-file` 读取用户显式传入的本地文本文件。

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
npm run workstation -- collection list --json
```

Collection list 只展示 metadata，不返回 Storage path、signed URL，不读取 Documents 正文，也不上传文件。

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
- 不上传文件，不读取 Documents 正文，不读取 Storage object，不生成 signed URL。
- 只允许 Project / Knowledge / Skill 白名单 update。
- 查询和 update 可使用 id 或 slug；slug update 只由 CLI 本地解析到 id 后调用既有 update-by-id API。
- 不 delete，不 public publish，不修改 visibility。
- 不操作 Supabase、token、用户权限、Feishu / Lark、Notion、Gmail、MCP server 或 Agent CEO。

失败时 Codex 应向用户返回 error code、message 和 `requestId`，例如：

```text
requestId: wreq_...
```

但不得输出 token 或 secret。

## Production Data Access Checklist

Workstation Admin API 使用 server-side service role client 作为受控 API 的数据访问方式。Codex / CLI 不直接持有 service role key，但 Vercel Production / Preview 或本地 Next.js server 需要配置服务端 data access。

生产 Supabase 应执行 `0025_consolidate_workstation_service_role_grants.sql` 固化 Workstation Admin API 已需的最小 grant。等价权限范围包括：

```sql
grant select, insert, update on table public.projects to service_role;
grant select, insert, update on table public.knowledge_notes to service_role;
grant select, insert, update on table public.skills to service_role;
grant select on table public.document_collections to service_role;
grant select, insert on table public.workstation_operation_logs to service_role;
```

当前表使用 UUID 默认值，不需要在本 checklist 中额外授予 sequence 权限。不要在文档、日志或聊天窗口中记录真实 key。`health` 的 `dataAccess` 只做 `select limit 1` 检查，能发现只读表级权限或配置问题，但不能完全证明 `insert` / `update` grant 可用。create / update 失败并出现 `permission denied for table ...` 时，应优先检查对应表的 `service_role` grant。

`workstation_operation_logs` 由 `0023_create_workstation_operation_logs.sql` 创建；`0024_workstation_update_service_role_grants.sql` 让日志 method 约束接受 PATCH，并补 Workstation update 所需的白名单字段 update grant；`0025_consolidate_workstation_service_role_grants.sql` 再把 Project / Knowledge / Skill list/create/update、Document Collections list 和 operation logs 写入所需权限一次性固化。RLS 只允许 admin 读取，写入通过 server-side helper 使用 service role 完成。后台只读页面：

```text
/dashboard/developer/workstation-logs
```

该页面展示最近 100 条日志，并支持 `status`、`action`、`target_type` 筛选；不展示 token、Authorization header、service role key、signed URL、Storage path、Documents 正文或完整请求体。

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

`VALIDATION_ERROR`

输入字段不满足 Admin API schema，例如缺少标题、slug 不合法、tags 格式不符合预期、update 未传任何可更新字段，或尝试传入 public / unlisted visibility。

`RATE_LIMITED`

同一 token hash + IP hash 在当前服务进程内触发 best-effort rate limit。当前限制为每分钟最多 60 次请求，POST / PATCH 写请求每分钟最多 20 次。Vercel serverless 环境下该限制不是强一致边界，但会返回 `RATE_LIMITED` 并记录 error log。

## Boundaries

v1.2.5 CLI / API / Codex skill wrapper 仍明确不支持：

- document upload。
- upload-intent / finalize。
- delete。
- 非白名单 update。
- public publish。
- visibility manage。
- token 管理页面。
- token 表、token rotate / revoke UI。
- 既有内容表 RLS / Storage policy / bucket visibility 改动。
- public download route 改动。
- Documents 正文读取。
- Storage object 读取。
- signed URL 生成。
- Supabase 直连或 service role key。
- MCP server、Agent CEO、Notion / 飞书 / Gmail 集成。
