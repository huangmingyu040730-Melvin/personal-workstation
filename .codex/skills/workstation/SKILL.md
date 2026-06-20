---
name: "Personal Workstation CLI"
description: "Use the local Workstation CLI to save or query private Project, Knowledge, Skill, and document collection metadata through the Workstation Admin API."
---

# Personal Workstation CLI

Use this skill when the user wants Codex to save or query low-risk metadata in the personal workstation through the existing Workstation CLI.

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
- 查询工作台项目。
- 查询 Knowledge。
- 查询 Skill。
- 查询文档包 metadata。
- 查看 Workstation API health。
- 把一段文本沉淀为知识卡片。
- 把一段流程沉淀为 Skill。

Common intent mapping:

- "保存到我的工作台" usually means create a private Project, Knowledge, or Skill. Pick the asset type from the user's wording and content.
- "创建一个 Knowledge" means use `knowledge create`.
- "把这段内容沉淀成 Skill" means use `skill create`.
- "看看工作台是否可用" means use `health`.
- "查一下文档包" means use `collection list`.

## When Not To Use

Do not use this CLI for:

- Uploading files.
- Reading Documents body text.
- Reading Supabase Storage objects.
- Generating signed URLs.
- Deleting assets.
- Updating assets.
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
npm run workstation -- project create ...
```

Knowledge:

```bash
npm run workstation -- knowledge list
npm run workstation -- knowledge create ...
```

Skill:

```bash
npm run workstation -- skill list
npm run workstation -- skill create ...
```

Document collection metadata:

```bash
npm run workstation -- collection list
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
- Does not read Storage.
- Does not upload files.
- Does not delete.
- Does not update.
- Does not public publish.
- Only calls the Workstation Admin API.

Supported create operations create private metadata only. Public or unlisted publishing remains a manual admin workflow outside this CLI.

## Standard Workflow

1. Identify whether the user wants to create Project, Knowledge, Skill, or query assets.
2. If the environment is uncertain or this is the first Workstation call in the session, run `npm run workstation -- health`.
3. Organize the user's content into CLI arguments. Use a local text file only when the user explicitly provides or requests file-based content input.
4. Run the matching `npm run workstation -- ...` command.
5. On success, report the created or returned `id`, title/name, slug when available, and visibility when available.
6. On failure, report the error code, message, and `requestId` if present.
7. Do not modify code while performing ordinary Workstation CLI operations.
8. Do not commit or stage any env file.
9. Do not print tokens or secret values.

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
```

Query Knowledge by Project:

```bash
npm run workstation -- knowledge list --project-id "PROJECT_ID" --visibility private
```

## Error Handling

If the CLI returns an error, keep the useful diagnostic fields and avoid secrets:

- `UNAUTHORIZED`: local or server token is missing, invalid, or inconsistent.
- `INTERNAL_ERROR`: the server may have Supabase service-role or data-access configuration trouble.
- `RATE_LIMITED`: requests are too frequent; wait and retry later.
- `VALIDATION_ERROR`: command arguments or payload fields are invalid.

If the error output includes a request id, preserve it for the user:

```text
requestId: wreq_...
```

Never print the token while diagnosing errors.
