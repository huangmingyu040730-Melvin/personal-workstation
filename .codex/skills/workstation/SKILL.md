---
name: "Personal Workstation CLI"
description: "Use the local Workstation CLI to save, update, query, or upload a single file into Project, Knowledge, Skill, and document collection workflows through the Workstation Admin API."
---

# Personal Workstation CLI

Use this skill when the user wants Codex to save, update, query low-risk metadata, or upload a single local file to an existing document collection in the personal workstation through the existing Workstation CLI.

v1.2.13 notes: Workstation CLI / Codex operations now have an experience-based runbook at `docs/workstation-codex-runbook.md`. Use that runbook as the operational source of truth for real Codex workflows, stop conditions, PR checks, asset operations, collection resolution, document upload, and grant troubleshooting. `document upload` remains allowed only for one local regular file, an existing document collection, default private metadata, and the Workstation Admin API flow `upload-intent -> upload -> finalize`. Non-JSON upload output shows a safe preflight summary and three progress steps; JSON output remains pure finalize JSON. Use `collection list --q` and optionally `collection show --id` before upload when the collection id is not already certain. `docs/workstation-document-upload-design.md` remains the boundary document for anything beyond that MVP.

The command entrypoint is:

```bash
npm run workstation -- <command>
```

## When To Use

Use the Workstation CLI when the user asks Codex to:

- 保存内容到个人工作台。
- 创建研究项目或创建 Project。
- 创建 Knowledge。
- 创建 Skill。
- 补充或修正已有 Project / Knowledge / Skill 的白名单 metadata。
- 按 id 或 slug 查询工作台 Project。
- 按 id 或 slug 查询 Knowledge。
- 按 id 或 slug 查询 Skill。
- 查询文档包 metadata。
- 上传单个本地文件到已有文档包。
- 查看 Workstation API health。
- 把一段文本沉淀为知识卡片。
- 把一段流程沉淀为 Skill。

Common intent mapping:

- "保存到我的工作台" usually means create a private Project, Knowledge, or Skill. Pick the asset type from the user's wording and content.
- "创建一个 Knowledge" means use `knowledge create`.
- "把这段内容沉淀成 Skill" means use `skill create`.
- "看看工作台是否可用" means use `health`.
- "查一下文档包" means use `collection list`, optionally with `--q`.
- "查看这个文档包" means use `collection show --id`.
- "上传文件到文档包" means use `document upload` only when the user provides or clearly identifies an existing collection id and a local regular file path. If the id is not certain, run `collection list --q "keyword"` first. If there are multiple candidates, ask the user to confirm. If there is one clear candidate, use that id and optionally run `collection show --id` before uploading. Do not guess ids.
- For operational sequencing, stop conditions, PR review, grant troubleshooting, and real run habits, follow `docs/workstation-codex-runbook.md`.

## When Not To Use

Do not use this CLI for:

- Uploading files outside the single-file document upload MVP.
- Uploading more than one file.
- Uploading directories.
- Uploading zip, exe, sh, dmg, app, installer, script, archive, or executable files.
- Creating a document collection during upload.
- Uploading public files.
- Reading Documents body text.
- Reading Supabase Storage object body.
- Generating signed URLs.
- Deleting assets.
- Updating fields outside the Project / Knowledge / Skill update whitelist.
- Public publishing.
- Changing visibility.
- Bulk operations.
- Changing user permissions.
- Operating Supabase directly.
- Reading or writing the service role key.
- Creating, printing, rotating, or managing tokens.
- Feishu / Lark, Notion, Gmail, or other external app operations.
- Agent CEO automatic execution.

If the user asks for one of those operations, explain that the current Workstation CLI does not support it and keep the boundary intact.

## Commands

Health:

```bash
npm run workstation -- health
```

Project:

```bash
npm run workstation -- project list
npm run workstation -- project show --id "PROJECT_ID"
npm run workstation -- project show --slug "PROJECT_SLUG"
npm run workstation -- project create ...
npm run workstation -- project update --id "PROJECT_ID" ...
npm run workstation -- project update --slug "PROJECT_SLUG" ...
```

Knowledge:

```bash
npm run workstation -- knowledge list
npm run workstation -- knowledge show --id "KNOWLEDGE_ID"
npm run workstation -- knowledge show --slug "KNOWLEDGE_SLUG"
npm run workstation -- knowledge create ...
npm run workstation -- knowledge update --id "KNOWLEDGE_ID" ...
npm run workstation -- knowledge update --slug "KNOWLEDGE_SLUG" ...
```

Skill:

```bash
npm run workstation -- skill list
npm run workstation -- skill show --id "SKILL_ID"
npm run workstation -- skill show --slug "SKILL_SLUG"
npm run workstation -- skill create ...
npm run workstation -- skill update --id "SKILL_ID" ...
npm run workstation -- skill update --slug "SKILL_SLUG" ...
```

Document collection metadata:

```bash
npm run workstation -- collection list
npm run workstation -- collection list --limit 10
npm run workstation -- collection list --q "keyword"
npm run workstation -- collection show --id "COLLECTION_ID"
```

Document upload:

```bash
npm run workstation -- document upload \
  --collection-id "COLLECTION_ID" \
  --file "./report.pdf" \
  --title "因子投资学习材料" \
  --category "research_material"
```

## Environment Variables

The CLI reads only local environment variables:

- `WORKSTATION_API_URL`
- `WORKSTATION_API_TOKEN`

Rules:

- Do not ask the user to paste the token into chat.
- Do not print the token.
- Do not read, display, or summarize `.env.local`.
- Do not write the token into code, docs, logs, PRs, commits, examples, or shell history.
- Do not add or use a `--token` argument.
- If the token is missing, only tell the user to configure `WORKSTATION_API_TOKEN` in their local environment.

`SUPABASE_SERVICE_ROLE_KEY` is for the Next.js server only. The CLI must not read it, print it, store it, or pass it around.

## Safety Boundaries

The Workstation CLI:

- Does not connect to Supabase directly.
- Does not read the service role key.
- Does not read Documents body text.
- Does not read Storage object body.
- Uploads only one local regular file to an existing collection through the controlled Workstation API upload flow.
- Does not delete.
- Does not public publish.
- Does not update visibility.
- Only updates Project / Knowledge / Skill whitelist fields.
- Project update whitelist includes `progress` and `start_date`, but not `current_stage`.
- Allows Project / Knowledge / Skill show by id or slug.
- Allows update by slug only through CLI-side resolution to the existing update-by-id API.
- Only calls the Workstation Admin API.

Supported create operations create private metadata only. Supported update operations modify existing Project / Knowledge / Skill whitelist metadata only. Public or unlisted publishing remains a manual admin workflow outside this CLI.

The document upload MVP requires `upload_documents`, uploads only to an existing collection, defaults metadata to private, uses a server-generated ASCII-safe Storage path, and avoids reading Documents body text, Storage object body, or generating public links. The CLI must never generate Storage paths itself.

Before uploading a document, confirm the collection id with the user or by running `npm run workstation -- collection list --q "keyword"`. If there are multiple plausible candidates, do not guess; ask the user to confirm. If there is one clear candidate, you may use that id and optionally run `npm run workstation -- collection show --id "COLLECTION_ID"` to verify safe metadata. Do not create a collection as part of upload.

For Project / Knowledge / Skill operations, list or show before create/update when there is any risk of duplication. Do not create a second asset when the user meant to update an existing one. Use temporary local files for long text arguments, and do not commit those temporary files.

## Standard Workflow

1. Identify whether the user wants to create Project, Knowledge, Skill, show an asset by id or slug, update whitelist metadata, upload a single file to an existing document collection, or query assets.
2. If the environment is uncertain or this is the first Workstation call in the session, run `npm run workstation -- health`.
3. For create/update tasks, list or show first when the target may already exist. Do not duplicate Project / Knowledge / Skill records.
4. For long Project / Knowledge / Skill text, use a temporary local file and pass `--background-file`, `--research-question-file`, `--methodology-file`, `--content-file`, or `--usage-file`.
5. For document upload, confirm the local path is a single regular file and the collection id is real. If the user did not provide a collection id, run `collection list --q "keyword"` using a user-provided or obvious title keyword. If multiple candidates appear, ask the user to choose. If exactly one candidate clearly matches, use its full id and optionally run `collection show --id` to confirm safe metadata. Do not upload directories, zip/exe/sh/dmg/app files, or guessed collection ids.
6. Run the matching `npm run workstation -- ...` command.
7. On document upload success, report the document id, title, visibility, and collection id. Do not report Storage path, signed URL, token, service role key, local absolute path, or file content.
8. On create/update/show success, report the created, updated, or returned `id`, title/name, slug when available, visibility when available, and updated fields when the command was an update. If update used `--slug`, mention the resolved id but never print tokens.
9. On failure, report the error code, message, and `requestId` if present.
10. If the error is `permission denied for table ...`, stop and tell the user this usually means the corresponding Supabase migration or service_role grant has not been applied.
11. Do not modify code while performing ordinary Workstation CLI operations.
12. Do not commit or stage any env file.
13. Do not print tokens or secret values.

## Examples

Create a private Project:

```bash
npm run workstation -- project create \
  --title "因子投资学习计划" \
  --slug "factor-investing-learning-plan" \
  --summary "围绕因子投资方法论、机器学习工具和量化研究流程的长期学习项目" \
  --status "planning" \
  --tags "factor,quant,learning"
```

Create a private Knowledge item:

```bash
npm run workstation -- knowledge create \
  --title "多因子模型的核心逻辑" \
  --slug "multi-factor-model-core-logic" \
  --category "因子投资" \
  --excerpt "解释多因子模型如何通过多个风险因子刻画股票截面收益差异" \
  --content-file "./note.md" \
  --tags "factor,model,quant" \
  --project-id "PROJECT_ID"
```

Create a private Skill:

```bash
npm run workstation -- skill create \
  --name "Codex PR 审查流程" \
  --slug "codex-pr-review-workflow" \
  --description "用于审查 Codex 开发 PR 的固定流程" \
  --category "workflow" \
  --platforms "codex,github" \
  --usage-file "./skill-usage.md"
```

Query document collection metadata:

```bash
npm run workstation -- collection list
npm run workstation -- collection list --q "Memory"
npm run workstation -- collection show --id "COLLECTION_ID"
```

Upload one private document into an existing collection:

```bash
npm run workstation -- document upload \
  --collection-id "COLLECTION_ID" \
  --file "./report.pdf" \
  --title "因子投资学习材料" \
  --category "research_material"
```

Query Knowledge by Project:

```bash
npm run workstation -- knowledge list --project-id "PROJECT_ID" --visibility private
```

Show Project by slug:

```bash
npm run workstation -- project show --slug "factor-investing-learning-plan"
```

Update Project whitelist metadata:

```bash
npm run workstation -- project update \
  --id "PROJECT_ID" \
  --progress 25 \
  --start-date "2026-06-16" \
  --background "围绕因子投资与机器学习方法建立长期学习背景" \
  --research-question "如何把机器学习基础稳健地连接到因子研究流程？" \
  --methodology "按章节学习、复现实验、沉淀笔记并定期复盘" \
  --tags "factor,quant,learning"
```

Update Project whitelist metadata by slug:

```bash
npm run workstation -- project update \
  --slug "factor-investing-learning-plan" \
  --status "in_progress" \
  --progress 25 \
  --start-date "2026-06-16" \
  --summary "围绕因子投资、机器学习工具和量化研究流程持续沉淀学习资产"
```

Update Knowledge whitelist metadata:

```bash
npm run workstation -- knowledge update \
  --id "KNOWLEDGE_ID" \
  --excerpt "更新摘要" \
  --content-file "./note.md" \
  --project-id "PROJECT_ID"
```

Update Skill whitelist metadata:

```bash
npm run workstation -- skill update \
  --id "SKILL_ID" \
  --usage-file "./skill-usage.md" \
  --platforms "codex,github"
```

Update whitelist:

- Project: `title`, `summary`, `status`, `progress`, `start_date`, `tags`, `background`, `research_question`, `methodology`.
- Knowledge: `title`, `category`, `excerpt`, `content`, `tags`, `project_id`.
- Skill: `name`, `description`, `category`, `platforms`, `status`, `content`, `usage_guide`, `input_description`, `output_description`, `current_version`, `repository_url`.

Never use update for `visibility`, `current_stage`, owner/user/created_by fields, Documents, Storage, public publish, delete, or bulk operations.

Use `npm run workstation -- document upload ...` only for one local regular file, an existing collection id, default private metadata, and the controlled API flow. Do not use it for directories, batches, public files, visibility changes, delete, OCR, vector indexing, AI summaries, signed URLs, or Storage inspection.

For document upload, do not upload zip, exe, sh, dmg, app, installer, script, archive, or executable files. Do not read the file body to summarize it. The CLI may read bytes only as part of the explicit upload command after local file checks.

## Error Handling

If the CLI returns an error, keep the useful diagnostic fields and avoid secrets:

- `UNAUTHORIZED`: local or server token is missing, invalid, or inconsistent.
- `INTERNAL_ERROR`: the server may have Supabase service-role or data-access configuration trouble.
- `RATE_LIMITED`: requests are too frequent; wait and retry later.
- `VALIDATION_ERROR`: command arguments or payload fields are invalid.
- `permission denied for table documents` or `permission denied for table document_collections`: likely means `0027_workstation_document_upload_grants.sql` has not been applied.
- `Document collection not found`: run `npm run workstation -- collection list --q "keyword"` and retry with a real id.
- Unsupported upload type: supported types are PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG, JPEG.
- Upload too large: maximum size is 10 MB.

If the error output includes a request id, preserve it for the user:

```text
requestId: wreq_...
```

Never print the token while diagnosing errors.
