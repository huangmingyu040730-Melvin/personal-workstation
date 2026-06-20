# Workstation Document Upload Design

日期：2026-06-20

状态：v1.2.8 design only。本文只冻结 Workstation document upload 的后续实现设计，不新增真实 API route、CLI 命令、migration、RLS、Storage policy、bucket visibility、public download route，也不上传、读取或解析任何文件。

## Why Document Upload

Workstation API / CLI 已支持 Project / Knowledge / Skill 的 list、create、update、show，并已有 requestId、rate limit、dataAccess diagnostics 和 operation logs。下一步高风险能力是让 Codex 或本地 CLI 把本地文件放入已有文档包，例如：

```bash
npm run workstation -- document upload \
  --collection-id "..." \
  --file "./report.pdf" \
  --title "因子投资学习材料"
```

这个能力的价值是把本地研究材料、学习资料、报告草稿和轻量附件沉淀到既有 document collection，避免管理员先手动进入后台上传再回到 CLI 维护 metadata。

安全目标比便利性更重要。未来实现必须保证：

- 默认 `private`。
- 只上传到已有 document collection。
- 不自动公开文件。
- 不读取 Documents 正文。
- 不生成 public link。
- 不绕过 Supabase Storage、RLS、后台 server-side validation 或 Workstation API 的安全边界。
- 不让 CLI 持有 Supabase service role key。
- 不让 CLI 自己拼接最终 Storage path。

## First Version Scope

第一版只支持：

- 上传单个本地文件。
- 上传到已有 `document_collections` 记录。
- 文件 metadata 默认 `visibility = "private"`。
- 写入 `documents` metadata。
- 刷新目标 collection 的 `file_count` / `total_size`。
- 写入 Workstation operation logs。

第一版不支持：

- 批量上传。
- 上传目录。
- 自动创建 collection。
- public 文件。
- visibility 修改。
- 文件删除。
- 文件正文读取。
- OCR。
- 向量索引。
- 自动摘要。
- signed public URL。
- public download route 变更。
- Supabase Storage bucket 公开化。

## Flow

目标流程：

```text
Workstation CLI
-> POST /api/workstation/documents/upload-intent
-> controlled upload
-> POST /api/workstation/documents/finalize
-> insert documents metadata
-> refresh collection stats
-> operation logs
```

设计原则：

1. CLI 先做本地文件存在性、大小和扩展名初检。
2. CLI 调用 `upload-intent`，后端校验 token、capability、collection、文件大小、MIME type 和扩展名。
3. 后端生成 `upload_id` 和 ASCII-safe `storage_path`，并返回受控上传所需的最小信息。
4. CLI 只把文件上传到后端允许的目标，不自行生成 path。
5. CLI 调用 `finalize`。
6. 后端重新校验 upload intent、collection、storage_path、文件 metadata 和幂等状态。
7. 后端写入 `documents` metadata，默认 private，刷新 collection stats，并记录 operation log。

## API Design

### `POST /api/workstation/documents/upload-intent`

输入建议：

```json
{
  "collection_id": "...",
  "filename": "report.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 123456,
  "title": "因子投资学习材料",
  "category": "research_material"
}
```

输出建议：

```json
{
  "upload_id": "wup_...",
  "storage_path": "controlled/path/...",
  "max_size_bytes": 10485760,
  "allowed_mime_type": "application/pdf"
}
```

`storage_path` 必须由服务端生成。CLI 不得把 `collection_id`、原始文件名或本地路径拼接成最终 object key。

`upload-intent` 需要校验：

- token 认证成功。
- token 具有 `upload_documents` capability。
- `collection_id` 指向已有 document collection。
- 文件大小不超过第一版限制。
- MIME type 和扩展名同时允许。
- `filename` 仅作为 metadata 输入，不作为 Storage path 核心。
- `title` / `category` 满足 documents 现有 metadata 约束。

### Controlled Upload

受控上传的具体实现留到后续 PR 决定，可选方向包括：

- server-side upload route，由 Next.js server 代为写入 private bucket；
- 或 Supabase Storage 的短时受控 upload token / signed upload 机制。

无论选择哪种方式，第一版必须保持：

- 不生成 signed public URL。
- 不生成 public download link。
- 不改变 `workspace-files` bucket private 状态。
- 不把 service role key、Storage credential、完整 Storage path 或 upload credential 写入日志、PR、文档示例或用户可见错误。

### `POST /api/workstation/documents/finalize`

输入建议：

```json
{
  "upload_id": "wup_...",
  "collection_id": "...",
  "storage_path": "...",
  "title": "因子投资学习材料",
  "filename": "report.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 123456
}
```

输出建议：

```json
{
  "id": "...",
  "title": "...",
  "visibility": "private",
  "collection_id": "..."
}
```

`finalize` 需要重新校验：

- token 认证成功。
- token 具有 `upload_documents` capability。
- `upload_id` 存在、未过期，并绑定当前 token / request scope 的安全摘要。
- `collection_id` 与 intent 中的 collection 一致。
- `storage_path` 与 intent 中服务端生成的 path 一致。
- Storage object 已存在且大小 / MIME type 与 intent 一致，或后端上传流程已确认写入成功。
- 文件仍写入 `documents.visibility = "private"`。
- collection stats 刷新成功或失败可明确返回。

## Capability Design

后续实现新增 capability：

```text
upload_documents
```

Capability 分工：

| capability | 用途 |
| --- | --- |
| `read_assets` | 查询 Project / Knowledge / Skill 和 document collection metadata |
| `create_assets` | 创建 Project / Knowledge / Skill |
| `update_assets` | 更新 Project / Knowledge / Skill 白名单 metadata |
| `upload_documents` | 上传文件到已有 document collection |

`upload_documents` 不应隐含 `create_assets`、`update_assets`、`visibility manage`、delete、public publish 或读取 Documents 正文的能力。

## Storage Path Design

原则：

- CLI 不决定最终 Storage path。
- 后端生成 path。
- path 必须 ASCII-safe。
- path 应包含 `collection_id` / `upload_id` 或二者的安全片段，便于后续排查和清理。
- 避免把原始中文文件名、本地路径或用户可控标题作为 path 核心。
- 原始 `filename` 只保存在 `documents` metadata 中，用于后台展示。
- `storage_path` 不进入 operation log request_summary，不进入公开页面，不进入 sitemap，不进入 robots，也不进入 public download route HTML。

路径示例只表达结构，不作为实现约束：

```text
workstation-uploads/collections/{collection_id}/uploads/{upload_id}/file.pdf
```

后续实现可对 `collection_id` 做短 hash 或 UUID 规范化，但不得使用未清理的原始文件名或本地路径。

## File Limits

第一版建议限制：

- 最大文件大小：10 MB。若真实研究材料经常超过 10 MB，可在实现 PR 中评审是否改为 20 MB。
- 允许类型：PDF、DOCX、XLSX、CSV、TXT、MD、PNG、JPG / JPEG。
- 禁止可执行文件。
- 禁止 zip / rar / 7z 等压缩包第一版上传。
- MIME type 和扩展名必须同时校验。
- 扩展名大小写归一化后比较。
- MIME type 不能只信任 CLI 猜测，后端需要重新校验 intent 输入和实际上传结果。

建议允许清单：

| 扩展名 | MIME type |
| --- | --- |
| `.pdf` | `application/pdf` |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `.csv` | `text/csv` |
| `.txt` | `text/plain` |
| `.md` | `text/markdown` 或 `text/plain` |
| `.png` | `image/png` |
| `.jpg` / `.jpeg` | `image/jpeg` |

## Operation Logs

新增 action 设计：

```text
documents.upload_intent
documents.finalize
```

`request_summary` 只记录：

```json
{
  "collection_id": "...",
  "filename_ext": ".pdf",
  "mime_type": "application/pdf",
  "size_bytes": 123456,
  "category": "research_material"
}
```

不得记录：

- token。
- Authorization header。
- service role key。
- signed URL。
- upload credential。
- 完整 Storage path。
- Documents 正文。
- 文件内容。
- 本地绝对路径。
- 原始文件名中可能含有的敏感路径片段。

成功 finalize 的 operation log 可以记录 `target_type = "document"` 和新建 document id。失败日志应保留 `requestId`、错误 code、HTTP status 和安全摘要，便于在 `/dashboard/developer/workstation-logs` 排障。

## Failure Handling

需要覆盖的失败场景：

- `upload-intent` 成功但实际上传失败。
- 上传成功但 `finalize` 失败。
- `finalize` 重复提交。
- collection 不存在。
- 文件太大。
- MIME type 或扩展名不允许。
- Storage 上传失败。
- intent 过期。
- `storage_path` 与 intent 不匹配。
- collection stats 刷新失败。

处理原则：

- `finalize` 必须幂等或可安全拒绝重复提交。
- 如果同一个 `upload_id` 已 finalize，重复提交可以返回既有 document metadata，或返回明确的 conflict / already finalized 错误；不得创建重复 document 记录。
- `upload-intent` 成功但上传失败时，不写 `documents` metadata。
- 上传成功但 `finalize` 失败时，可能产生 orphan object；后续可通过清理任务按 `upload_id` / age 处理。
- 不自动公开。
- 不自动删除用户已有文件。
- 清理任务只处理 Workstation upload intent 产生且未 finalize 的 orphan object，不扫描或删除普通后台已有 Documents。
- 对用户可见错误返回 code、message、requestId，不返回 secret、完整 Storage path 或 upload credential。

## CLI Design

未来命令设计：

```bash
npm run workstation -- document upload \
  --collection-id "..." \
  --file "./report.pdf" \
  --title "因子投资学习材料" \
  --category "research_material"
```

CLI 负责：

- 检查本地文件存在。
- 确认目标是普通文件，不是目录。
- 读取文件大小。
- 根据扩展名和本地能力猜测 MIME type。
- 调用 `upload-intent`。
- 按后端返回的受控目标上传文件。
- 调用 `finalize`。
- 显示 document id / title / visibility / collection_id。
- 在失败时显示 code、message、requestId。

CLI 不负责：

- 生成 Storage path。
- 读取文件正文。
- 自动摘要。
- OCR。
- 向量索引。
- 公开发布。
- 创建 collection。
- 删除文件。
- 修改 visibility。
- 读取或保存 service role key。
- 生成 public link 或 signed public URL。

## Database / RLS / Storage Impact

本轮只设计，不新增 migration。

后续实现可能需要：

- `service_role` insert `documents`。
- `service_role` update `document_collections` stats。
- Storage upload policy 或 server-side signed upload design。
- operation logs action 约束扩展，允许 `documents.upload_intent` 和 `documents.finalize`。
- upload intent 的短期状态存储方案，可能是数据库表、签名 payload 或只允许短窗口内 finalize 的服务端记录。
- collection stats 刷新逻辑复用或封装。

后续实现不得默认修改：

- 既有 RLS 语义。
- `workspace-files` bucket private 状态。
- public download route。
- public attachment 展示逻辑。
- Documents public visibility 管理流程。

## Explicit Non-Goals For v1.2.8

本轮严格不做：

- 不新增 API route。
- 不新增 CLI upload 命令。
- 不新增 migration。
- 不修改 RLS。
- 不修改 Storage policy。
- 不修改 bucket visibility。
- 不修改 public download route。
- 不实现 `upload-intent`。
- 不实现 `finalize`。
- 不上传文件。
- 不读 Documents 正文。
- 不读 Storage object。
- 不生成 signed URL。
- 不新增 OCR / vector / AI summary。
- 不新增 delete / public publish / visibility manage。
- 不写入 token / service role key / `.env.local`。
