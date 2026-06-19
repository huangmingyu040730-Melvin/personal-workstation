# Workstation API / CLI Design

日期：2026-06-20

版本：v1.1.4 Workstation API/CLI design；v1.2.0 Workstation Admin API MVP 已开始落地

状态：v1.1.4 完成设计；v1.2.0 已新增第一批低风险 Workstation Admin API route。当前仍不实现 CLI、文件上传、token 管理页面、token 表、operation_logs 表、migration、RLS 或 Storage policy。

## 1. 为什么要做 Workstation API / CLI

个人数字工作站已经承担 Personal Asset Intranet 的角色：研究项目、学术成果、知识、Skill、Documents 文档包和求职资产都在同一套后台里沉淀。后台网页适合人工整理和复核，但 Codex 这类本地 agent 更适合用命令完成低风险、结构化、可审计的日常操作。

Workstation API / CLI 的目标是让 Codex 能通过受控接口操作个人工作站，而不是直接接触 Supabase 或绕过网站业务逻辑。第一版重点服务：

- 快速新增 Project / Knowledge / Skill 草稿。
- 查询已有 Project / Knowledge / Skill / Document Collection。
- 把本地文件上传到已有文档包。
- 为后续 Resume、会议纪要、市场报告、任务管理等模块预留一致扩展方式。

这个能力的核心价值不是“开放数据库”，而是把现有后台能力包装成最小权限、可撤销、可审计的本地操作入口。

## 2. 架构关系

推荐架构：

```text
User / Codex
  ↓
Workstation CLI
  ↓
Workstation Admin API
  ↓
Existing business validation / server-side logic
  ↓
Supabase Auth / RLS / Storage
```

职责边界：

| 层级 | 职责 | 明确不做 |
| --- | --- | --- |
| User / Codex | 发起命令、提供本地文件路径、阅读结果 | 不直接持有 Supabase service role key |
| Workstation CLI | 解析命令、读取本地文件、调用 Admin API、格式化输出 | 不直接连接 Supabase，不写数据库，不生成 signed URL |
| Workstation Admin API | 校验 token、权限、输入 schema、调用现有 server-side 业务逻辑、写 operation log | 不绕过现有业务校验，不开放高风险动作 |
| Existing server-side logic | 复用当前 Server Actions、validations、queries、Storage helper 的规则 | 不为 CLI 单独复制一套更宽松逻辑 |
| Supabase Auth / RLS / Storage | 作为最终数据和文件权限边界 | 不把 bucket 改 public，不放宽 RLS |

第一版设计应尽量复用当前项目模式：

- 四类资产写入继续遵循现有 `src/actions/` 里的管理员校验、Zod 校验、`revalidatePath()` 和 activity log 思路。
- 查询逻辑继续参考 `src/lib/queries/`。
- Documents 上传继续沿用“两阶段准备 + 客户端直传 + finalize 写库”的安全模型。
- Supabase server client 继续使用 publishable key 与用户上下文；`service_role` 只保留在已有 server-side public attachment 校验等极少数受控场景，不交给 CLI。

## 3. 第一版 CLI 命令范围

第一版 CLI 只设计低风险、可恢复、可人工复核的命令。

| 命令 | 用途 | 所需权限 | 备注 |
| --- | --- | --- | --- |
| `workstation health` | 检查 Admin API 是否可达、当前 token capability、版本兼容性 | token 存在即可 | 不返回敏感环境信息 |
| `workstation project list` | 查询 Project metadata 列表 | `read_assets` | 支持分页、搜索、visibility filter；不读 Documents 正文 |
| `workstation project create` | 创建 Project 草稿或 private 记录 | `create_assets` | 默认 private，不自动 public |
| `workstation knowledge list` | 查询 Knowledge metadata 列表 | `read_assets` | 只返回必要字段 |
| `workstation knowledge create` | 创建 Knowledge 草稿或 private 记录 | `create_assets` | 默认 private |
| `workstation skill list` | 查询 Skill metadata 列表 | `read_assets` | Skill package 只展示 metadata |
| `workstation skill create` | 创建 Skill 草稿或 private 记录 | `create_assets` | 不安装、不解析、不执行 Skill 包 |
| `workstation collection list` | 查询 Document Collection metadata | `read_assets` | 不列出 Storage path，不读文件正文 |
| `workstation document upload` | 上传本地文件到已有文档包 | `upload_documents` | v1.2.0 暂不实现；后续单独 PR 做 upload-intent / finalize |

第一版 create 命令建议支持 `--json` 或 `--from-file` 读取结构化输入，同时保留常用 flags：

```bash
workstation project create --title "..." --summary "..." --visibility private
workstation knowledge create --title "..." --category "..." --content-file note.md
workstation skill create --name "..." --category "workflow" --platform "codex"
workstation document upload --collection-id "<id>" --file ./paper.pdf --category research_material
```

示例中的 `<id>` 是占位符，不应在文档或代码中放真实 token、真实私密路径或完整敏感标识。

## 4. 第一版明确不支持的高风险能力

第一版不开放以下能力：

- `delete_assets`
- `manage_visibility`
- `manage_users`
- `read_private_document_body`
- `bulk_update`
- `public_publish`
- 创建新文档包
- 批量删除文件或文档包
- 批量公开或批量修改权限
- 修改 RLS、Storage policy、bucket visibility
- 创建 signed URL 或读取 Storage object
- 读取 Documents 正文、解析 PDF / Word / Excel / zip、OCR、向量索引
- 恢复 Market Brief、Access Request、Viewer、Access Grants 或 restricted 外部授权链路
- 新增 Agent CEO、MCP server、自动化中心或外部集成

这些限制应同时体现在 token capability、API route、后端 schema 校验、operation log 和 CLI 帮助文本中。

## 5. Admin API 路由设计

所有路由建议放在 `/api/workstation/*` 下，并从第一版开始带版本与 capability 观念。可以先用 response 中的 `apiVersion` / `capabilities` 暴露能力；如果后续出现破坏性变更，再引入 `/api/workstation/v2/*`。

统一要求：

- 每个请求必须校验 Workstation token。
- 每个写请求必须校验具体 capability。
- 每个写请求必须复用或封装现有 server-side validation。
- 每个写请求必须记录 operation log。
- 响应不得包含 service role key、Supabase key、signed URL、Storage path、owner_id 或完整私密文件正文。

| Method | Route | 用途 | 输入 | 输出 | 权限 | 风险与控制 |
| --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/api/workstation/health` | 检查 API 可用性、版本、token capability | 无或轻量 query | `apiVersion`、`cliMinVersion`、`capabilities`、server time | token 有效 | 不返回环境变量、数据库 URL 或内部配置 |
| `GET` | `/api/workstation/projects` | 查询 Project metadata | `q`、`visibility`、`limit`、`cursor` | Project 列表与分页 | `read_assets` | 不返回 private Documents、raw relation rows 或附件正文 |
| `POST` | `/api/workstation/projects` | 创建 Project | title、slug、summary、status、tags、visibility 等白名单字段 | 新 Project 的安全摘要 | `create_assets` | 默认 private；不允许 public publish；复用 project schema |
| `GET` | `/api/workstation/knowledge` | 查询 Knowledge metadata | `q`、`category`、`visibility`、`limit`、`cursor` | Knowledge 列表与分页 | `read_assets` | 不读取 Documents 或 Storage |
| `POST` | `/api/workstation/knowledge` | 创建 Knowledge | title、slug、category、excerpt、content、tags、project_id、visibility | 新 Knowledge 摘要 | `create_assets` | 默认 private；不自动公开 |
| `GET` | `/api/workstation/skills` | 查询 Skill metadata | `q`、`category`、`platform`、`visibility`、`limit`、`cursor` | Skill 列表与分页 | `read_assets` | 不返回 Skill package 文件正文 |
| `POST` | `/api/workstation/skills` | 创建 Skill | name、slug、description、category、platforms、usage fields、visibility | 新 Skill 摘要 | `create_assets` | 不执行、不安装、不解析上传包 |
| `GET` | `/api/workstation/document-collections` | 查询文档包 metadata | `q`、`related_type`、`related_id`、`limit`、`cursor` | 文档包列表与统计 | `read_assets` | 不返回 Storage path、bucket、signed URL |
| `POST` | `/api/workstation/documents/upload-intent` | 为已有文档包生成受控上传意图 | collection_id、file name、mime、size、category、checksum 可选 | upload id、受控上传信息、finalize payload 摘要 | `upload_documents` | v1.2.0 暂不实现；后续单独 PR 做安全审查 |
| `POST` | `/api/workstation/documents/finalize` | 上传完成后写入 documents metadata | upload id、文件校验摘要、finalize payload | 新 Document 安全摘要 | `upload_documents` | v1.2.0 暂不实现；后续单独 PR 做安全审查 |

v1.2.0 已新增 health、Project / Knowledge / Skill list/create、Document Collections list 这些第一批真实 API route。Documents upload-intent / finalize 仍是后续阶段，不在 v1.2.0 中实现。

## 6. CLI 命令设计

CLI 应保持薄层：

- 从环境变量或本地安全配置读取 token。
- 解析命令、flags 和本地文件路径。
- 对本地文件做基础存在性、大小、MIME / 扩展名提示。
- 调用 Admin API。
- 输出人类可读摘要，必要时支持 `--json`。
- 遇到失败时显示 error code、message 和 request id，但不打印 token。

建议全局选项：

| Option | 用途 |
| --- | --- |
| `--api-url` | 覆盖默认 Admin API base URL |
| `--token-env` | 指定读取 token 的环境变量名 |
| `--json` | 输出 JSON |
| `--verbose` | 输出 request id、耗时和非敏感调试信息 |
| `--dry-run` | 本地校验输入并展示将调用的 route；第一版 create / upload 可支持 |

命令设计原则：

- 旧命令尽量保持兼容，不频繁破坏 flag 名称和输出字段。
- 新功能优先以新增模块命令扩展，例如 `workstation resume list`，而不是把所有能力塞进一个通用 `call` 命令。
- CLI 使用 semver 管理版本；Admin API 返回 capability list 以支持兼容性检查。
- CLI 不应在错误日志、shell history 建议或帮助文本中要求用户粘贴完整 token。

## 7. 统一响应格式

成功：

```json
{
  "ok": true,
  "data": {},
  "message": "Created successfully"
}
```

失败：

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required"
  }
}
```

推荐所有响应额外带非敏感追踪字段：

```json
{
  "ok": true,
  "data": {},
  "message": "Created successfully",
  "requestId": "req_...",
  "apiVersion": "v1"
}
```

常见 error code：

| Code | 含义 |
| --- | --- |
| `UNAUTHORIZED` | token 缺失、无效或已撤销 |
| `FORBIDDEN` | token 有效但缺少 capability |
| `VALIDATION_ERROR` | 输入字段不满足 schema |
| `NOT_FOUND` | 目标资产或文档包不存在，或当前 token 不可访问 |
| `UPLOAD_FAILED` | 文件上传或 finalize 失败 |
| `RATE_LIMITED` | 超出 token 或 IP 速率限制 |
| `INTERNAL_ERROR` | 服务端未知错误 |

## 8. Token / 权限设计

第一版 token 只用于 Workstation Admin API，不是 Supabase key，也不是管理员登录密码。

v1.2.0 当前权限：

| Capability | 含义 | 适用命令 |
| --- | --- | --- |
| `read_assets` | 读取资产 metadata 和文档包 metadata | list / health |
| `create_assets` | 创建 Project / Knowledge / Skill 草稿或 private 记录 | create |

后续文件上传阶段再开放：

| Capability | 含义 | 适用命令 |
| --- | --- | --- |
| `upload_documents` | 上传文件到已有文档包 | document upload |

第一版不开放：

- `delete_assets`
- `manage_visibility`
- `manage_users`
- `read_private_document_body`
- `bulk_update`
- `public_publish`

token 存储与生命周期：

- token 只保存在本地环境变量、系统钥匙串或本机安全配置中。
- token 不写入仓库、不写入 `.env.example` 的真实值、不写入 docs 示例。
- CLI 帮助文本只展示占位变量名，例如 `WORKSTATION_TOKEN`，不要求用户粘贴完整 token 到对话中。
- token 应有创建时间、最后使用时间、可选过期时间、capability 列表和撤销状态。
- token 泄露后的风险是被调用允许范围内的 Admin API；因此第一版只给低风险 capability，并提供撤销机制。
- 后续应支持 token rotate、单 token 禁用、按 capability 缩权和使用日志查询。

v1.2.0 先使用服务端环境变量 `WORKSTATION_API_TOKEN` 作为静态 token，不新增 token 表或管理页面。后续如果实现数据库 token，应只保存 token hash，不保存明文 token；服务端只在创建时显示一次明文，并提示用户本地保存。

## 9. 操作日志设计

operation logs 用于记录 Codex / CLI 做了什么，和现有 `activity_logs` 的人工后台日志形成互补。第一版设计可以先不建表，但 v1.2.2 应该落地。

建议字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 日志 ID |
| `actor_type` | `workstation_cli`、`admin_user`、`system` |
| `actor_name` | token 显示名或调用来源摘要 |
| `token_id` | token 记录 ID，不记录明文 token |
| `action` | `project.create`、`document.upload` 等 |
| `target_type` | project、knowledge、skill、document、collection |
| `target_id` | 目标 ID，可为空 |
| `request_summary` | 非敏感请求摘要 |
| `status` | success、failed、blocked |
| `created_at` | 创建时间 |
| `ip_hash` | 可选，哈希后的 IP |
| `user_agent_hash` | 可选，哈希后的 user agent |
| `error_code` | 失败时的 error code |

日志原则：

- 能看到 Codex / CLI 做了什么。
- 支持排查错误、撤销或人工复盘。
- 不记录完整 secret、Authorization header、cookie、API key、Supabase key。
- 不记录大段私密文件正文、Documents 正文、Storage path 或 signed URL。
- `request_summary` 只存标题、目标类型、目标 id、文件名摘要、大小、category、collection id 等必要信息。

## 10. 文件上传设计

第一版文件上传只能上传到已有文档包，不支持创建新文档包，不支持 public visibility，不支持读取 Documents 正文。

推荐流程：

1. CLI 校验本地文件存在、大小、扩展名，并读取必要 metadata。
2. CLI 调用 `POST /api/workstation/documents/upload-intent`。
3. 后端校验 token、`upload_documents` capability、collection 是否存在、文件类型 / 大小、category 是否有效。
4. 后端生成受控上传信息：upload id、bucket、object key 或上传目标、finalize 所需的短期上下文。
5. CLI 按后端返回的受控信息上传文件。
6. CLI 调用 `POST /api/workstation/documents/finalize`。
7. 后端重新校验 token、upload id、collection、文件 metadata 和上传状态。
8. 后端写入 `documents` metadata，文件默认 `private`。
9. 后端刷新文档包 stats。
10. 后端记录 operation log。
11. CLI 输出上传成功的 document id、collection id、文件名、大小和 category。

关键边界：

- CLI 不直接写 Storage。
- CLI 不直接写数据库。
- CLI 不生成 signed URL。
- 文件默认 private。
- 只能上传到已有文档包。
- 第一版不支持创建新文档包。
- 第一版不支持 public visibility。
- 第一版不支持读取 Documents 正文。
- 第一版不支持批量删除、批量公开或权限修改。
- 后端生成的 object key 必须沿用 ASCII-safe storage path 规则。
- 上传的代码包、Skill 包和压缩包只作为文件存储，不执行、不安装、不解析。

失败处理：

| 场景 | 处理 |
| --- | --- |
| `upload-intent` 失败 | CLI 不上传文件，直接展示 error code 和 message |
| 文件上传失败 | CLI 展示 `UPLOAD_FAILED`，可提示重试；后端不写 documents metadata |
| `finalize` 失败但文件已上传 | 后端应尽力清理已上传 object；如果清理失败，operation log 标记需要人工复核 |
| collection 不存在 | 返回 `NOT_FOUND`，不泄露其它 private 资产信息 |
| 文件类型 / 大小不合法 | 返回 `VALIDATION_ERROR` |
| token 缺权限 | 返回 `FORBIDDEN` |

如果后续使用 Supabase signed upload URL 或类似机制，也应由 Admin API 生成短期、单文件、单 collection 范围的上传授权；CLI 仍不接触 service role key。

## 11. 后续扩展方式

CLI 后续变多时应按模块扩展：

```bash
workstation resume list
workstation resume export
workstation meeting create
workstation market-report create
workstation task create
```

扩展原则：

- 新模块先设计 capability，再设计 API route，最后设计 CLI 命令。
- 老命令尽量保持兼容；必要破坏性变更通过 major version 或 API version 管理。
- Admin API `health` 或 `capabilities` 返回服务端支持能力，让 CLI 可以判断是否兼容。
- 每个模块默认从只读或低风险创建开始，不直接开放删除、公开、权限、批量修改。
- 每个模块都要定义不读取哪些私密内容、不输出哪些敏感字段、是否写 operation log。
- Market Brief 已退役，示例中的 `market-report create` 只代表未来可能的独立重新设计，不恢复旧 Market Brief runner、素材包、数据探针或入口。

## 12. 推荐版本路线图

| 版本 | 范围 | 明确不做 |
| --- | --- | --- |
| v1.1.4 Workstation API/CLI design | 新增本文档，同步状态与路线；做可行性和安全边界设计 | 不新增 API route、CLI、token、migration、RLS、Storage policy |
| v1.2.0 Workstation Admin API MVP | 实现最小 Admin API、静态 token 校验、health、Project / Knowledge / Skill list/create、Document Collections list | 不实现 CLI、文件上传、删除、公开、权限管理 |
| v1.2.1 Workstation CLI MVP | 实现 CLI 薄层、health、list、create | 不直接连接 Supabase，不保存 service role key，不实现文件上传 |
| v1.2.2 Operation logs and permission hardening | 落地 operation logs、rate limit、token rotate / revoke、审计视图 | 不扩展高风险 capability |
| v1.2.x 后续文件上传 PR | 单独实现 upload-intent / finalize 与 `upload_documents` capability | 不绕过 Storage 安全边界，不开放公开或批量删除 |
| v1.3.x MCP Server / Agent CEO Workbench exploration | 探索 MCP server 或更高层 agent workbench | 不绕过 Admin API，不恢复已退役 access / viewer / Market Brief |

进入 v1.2.0 前建议先确认：

后续进入 v1.2.1 / v1.2.2 / 文件上传阶段前建议继续确认：

- token 数据模型与撤销流程。
- operation log 是否复用 `activity_logs` 还是新增专用表。
- 文件上传采用哪种短期上传授权机制。
- rate limit 与 request id 方案。

## 13. 本轮确认未做事项

v1.2.0 已实现第一批低风险 Admin API route。本轮确认仍不做：

- 不新增数据库表。
- 不新增 migration。
- 不新增文件上传 API。
- 不新增 CLI 可执行文件。
- 不新增 npm bin。
- 不新增 token 生成页面。
- 不新增真实 token。
- 不修改 Supabase RLS。
- 不修改 Storage policy。
- 不修改 bucket visibility。
- 不修改 public download route。
- 不读取 Documents 正文。
- 不读取 Storage objects。
- 不生成 signed URL。
- 不开放删除、公开发布、visibility 管理、用户管理或批量更新。
- 不新增 Agent CEO。
- 不新增 MCP server。
- 不新增 Notion / 飞书 / Gmail 集成。
- 不新增自动化中心。
- 不恢复 access request、viewer、access grants、restricted 外部授权或 Market Brief。
- 不把 service role key 放进代码、文档或示例。
