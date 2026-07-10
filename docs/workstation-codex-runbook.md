# Workstation Codex Runbook

日期：2026-06-21

本文档是基于本项目真实 Codex 执行经验沉淀的 Workstation CLI / Codex Skill 操作手册。它不是理想流程设计，而是 v1.2.0-v1.2.12 中已经反复跑过、验证过、踩过权限问题并写进 PR 的做法。

v1.2.18 note：跨项目使用 Personal Workstation 已有最小 Skill Pack 安装器，详见 `docs/workstation-cross-project-skill-pack.md` 和 `packages/workstation-skill-pack/README.md`。安装器支持 `--check` / `--dry-run`，并会检查目标 `package.json` / `scripts.workstation` 状态，但仍不会自动修改 `package.json`。全新项目接入优先参考 `docs/workstation-new-project-bootstrap.md`。当前 `.codex/skills/workstation/SKILL.md` 仍是 repo-level Skill；不要假设其他 Codex 项目已经安装该 Skill，也不要承诺 slash menu 全局可见。目标项目必须安装 Skill Pack，并在本地配置 `WORKSTATION_API_URL` / `WORKSTATION_API_TOKEN`。

v1.2.19 note：求职中心使用独立 `personal-career-center` Skill，见 `docs/workstation-career-center-skill.md`。全局安装后优先调用 `$HOME/.local/bin/workstation-cli career ...`；repo-level 安装仍可用 `npm run workstation -- career ...`。Resume/JD/Application 属于私密个人数据：先 list/show，再 create/update；AI 建议必须人工复核；删除必须由用户明确要求并在 show 后使用 `--confirm-delete`；不得自动公开、投递、发送雇主邮件或编造经历。

证据来源：

- PR #137-v1.2.0：Admin API MVP。
- PR #138-v1.2.1：CLI MVP。
- PR #139-v1.2.2：health diagnostics、dataAccess、grant checklist。
- PR #140-v1.2.3：requestId、operation logs、rate limit、日志页。
- PR #142-v1.2.4：Codex Skill wrapper。
- PR #143-#146：show/update、service_role grants、progress/start_date。
- PR #147-#151：document upload design/API/uploader/UX/collection resolution。
- `docs/current-status.md`、`docs/memory.md`、`docs/roadmap.md`、`docs/decisions.md`、`docs/workstation-cli-usage.md` 和 `.codex/skills/workstation/SKILL.md`。

## 1. Core Principles

- Treat Workstation CLI as a controlled thin client. It calls the Workstation Admin API; it does not connect to Supabase directly.
- Keep every PR tightly scoped. If the request is design-only, do not implement API/CLI/migration. If the request is CLI polish, do not add new backend capability.
- Treat new-project bootstrap as documentation and checklist work unless the user explicitly asks for installer implementation changes.
- Preserve the private-by-default model. Project / Knowledge / Skill create uses private metadata; document upload writes private documents.
- Use existing capability boundaries: `read_assets`, `create_assets`, `update_assets`, `upload_documents`.
- Prefer list/show before create/update/upload. Avoid duplicate assets and wrong collection ids.
- Use requestId as the debugging handle. Do not compensate by printing secrets or reading `.env.local`.
- Operation logs are metadata-only. They must not contain token, Authorization header, service role key, Storage path, signed URL, Documents body, file content, or long user content.
- If a task touches public files, visibility, delete, Storage policy, RLS, bucket visibility, signed URL, or public download route, stop unless the user explicitly asked for that scope and a separate safety design exists.
- Treat cross-project Skill Pack work as a minimal installer surface. The installer may check, dry-run, or copy Skill Pack files to a user-provided target directory, but it must not copy secrets, auto-edit target `package.json`, or perform real Workstation asset operations during installation.

## 2. Default Development Workflow

1. Start from latest `origin/main` after confirming prior PRs are merged.
2. Create a branch with the `codex/` prefix, for example:

   ```bash
   git switch -c codex/v1-2-13-workstation-codex-runbook origin/main
   ```

3. Read project context before editing:

   ```bash
   sed -n '1,220p' AGENTS.md
   sed -n '1,220p' docs/memory.md
   sed -n '1,160p' docs/decisions.md
   sed -n '1,120p' docs/current-status.md
   sed -n '1,120p' docs/roadmap.md
   ```

4. Identify the allowed file surface before writing:
   - API/API-helper work usually touches `src/app/api/workstation/...`, `src/lib/workstation/...`, docs, and sometimes a minimal migration.
   - CLI work usually touches `scripts/workstation.mjs`, docs, and `.codex/skills/workstation/SKILL.md`.
   - Docs/Skill work should not touch `src/`, `scripts/`, `supabase/migrations`, Storage, RLS, or public download route.
5. Before edits, name the boundary in plain language: what this PR does and what it explicitly does not do.
6. Use `apply_patch` for manual edits.
7. Keep status docs synchronized when the task changes Workstation behavior:
   - `docs/current-status.md`
   - `docs/memory.md`
   - `docs/roadmap.md`
   - `docs/decisions.md`
   - `docs/workstation-cli-usage.md`
   - `.codex/skills/workstation/SKILL.md`
   - feature-specific docs such as `docs/workstation-document-upload-design.md`
8. Run validation matching the blast radius:
   - Always run `npm run lint`.
   - Always run `npm run build`.
   - Always run `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`.
   - Always run `git diff --check`.
   - If `scripts/workstation.mjs` changed, run `node --check scripts/workstation.mjs`.
   - If CLI behavior changed, run CLI smoke for success and failure paths.
9. Inspect the diff before committing:

   ```bash
   git diff --name-only
   git diff --stat
   git diff --check
   ```

10. Confirm boundary files did not change unless the user explicitly requested them:

    ```bash
    git diff --name-only | rg 'supabase/migrations|public-files|storage|rls|bucket|download'
    ```

11. Write PR summaries in the pattern that worked in #137-#151:
    - What changed.
    - What safety boundary was preserved.
    - Whether migration was added.
    - Whether API/CLI commands were added.
    - Validation commands and smoke results.
    - Honest caveats for any smoke that could not be run.
12. Open a non-draft PR and do not merge it yourself.

## 3. Default Asset Operation Workflow

1. Run health first when the environment is uncertain:

   ```bash
   npm run workstation -- health
   ```

2. Use list/show before create/update:
   - Search for existing assets before creating new ones.
   - Show the existing asset before updating it.
   - Use slug where useful, but remember update-by-slug is CLI-side resolution to update-by-id.
3. Use temporary files for long text:
   - Project: `--background-file`, `--research-question-file`, `--methodology-file`.
   - Knowledge: `--content-file`.
   - Skill: `--usage-file`.
   - Prefer `/tmp/workstation-*.md` for one-off content and do not commit those files.
4. After create/update, read back with show or list when the task is an acceptance check.
5. On success, report only useful metadata:
   - id
   - title/name
   - slug when relevant
   - visibility
   - updated fields
6. On failure, report:
   - error code
   - message
   - requestId if present
7. Never ask the user to paste `WORKSTATION_API_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `.env.local`, or DB URLs into chat.

## 4. Project Workflow

Use Project for ongoing research, development, business, or personal project themes.

Before create:

```bash
npm run workstation -- project list --q "keyword" --limit 10
```

Create:

```bash
npm run workstation -- project create \
  --title "..." \
  --slug "..." \
  --summary "..." \
  --status "planning" \
  --tags "tag-a,tag-b"
```

Before update:

```bash
npm run workstation -- project show --id "PROJECT_ID"
# or
npm run workstation -- project show --slug "PROJECT_SLUG"
```

Allowed update fields:

- `title`
- `summary`
- `status`
- `progress`
- `start_date`
- `tags`
- `background`
- `research_question`
- `methodology`

Rules:

- Use `--progress` only with integers from 0 to 100.
- Use `--start-date` or `--start_date` only with a valid `YYYY-MM-DD` date.
- Do not use `current_stage`; put stage text in `summary`, `background`, `methodology`, or a related Knowledge note.
- Do not update `visibility`.
- Do not create duplicates if a matching Project already exists; update the existing Project instead.

## 5. Knowledge Workflow

Use Knowledge for reusable notes, frameworks, explanations, and study records.

Before create:

```bash
npm run workstation -- knowledge list --q "keyword" --limit 10
npm run workstation -- knowledge list --project-id "PROJECT_ID" --limit 10
```

Create:

```bash
npm run workstation -- knowledge create \
  --title "..." \
  --slug "..." \
  --category "..." \
  --excerpt "..." \
  --content-file "/tmp/workstation-knowledge.md" \
  --tags "tag-a,tag-b" \
  --project-id "PROJECT_ID"
```

Before update:

```bash
npm run workstation -- knowledge show --id "KNOWLEDGE_ID"
# or
npm run workstation -- knowledge show --slug "KNOWLEDGE_SLUG"
```

Allowed update fields:

- `title`
- `category`
- `excerpt`
- `content`
- `tags`
- `project_id`

Rules:

- Use `--content-file` for long content.
- Do not read Documents or Storage to generate the note.
- Do not create a new Knowledge item when the user asked to update an existing one.
- If `project_id` is wrong or missing, list/show the Project first.

## 6. Skill Workflow

Use Skill for reusable workflows, prompt templates, operation manuals, and capability packages.

Before create:

```bash
npm run workstation -- skill list --q "keyword" --limit 10
npm run workstation -- skill list --category "workflow" --platform codex
```

Create:

```bash
npm run workstation -- skill create \
  --name "..." \
  --slug "..." \
  --description "..." \
  --category "workflow" \
  --platforms "codex,github" \
  --usage-file "/tmp/workstation-skill-usage.md"
```

Before update:

```bash
npm run workstation -- skill show --id "SKILL_ID"
# or
npm run workstation -- skill show --slug "SKILL_SLUG"
```

Allowed update fields:

- `name`
- `description`
- `category`
- `platforms`
- `status`
- `content`
- `usage_guide`
- `input_description`
- `output_description`
- `current_version`
- `repository_url`

Rules:

- Use `--usage-file` for long usage text.
- Do not upload, execute, parse, or install Skill packages.
- Do not create duplicate Skill records if an existing slug or matching name already exists.

## 7. Document Upload Workflow

Use document upload only for one local regular file and an existing document collection.

Preflight:

1. Confirm the target collection id.
2. Confirm the path is one local regular file.
3. Confirm the file is not empty and is within 10 MB.
4. Confirm the extension is supported: PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG, JPEG.
5. Reject zip, exe, sh, dmg, app, installer, script, archive, or executable files.

Command:

```bash
npm run workstation -- document upload \
  --collection-id "COLLECTION_ID" \
  --file "./file.md" \
  --title "..." \
  --category "research_material"
```

Expected non-JSON output:

```text
Preparing document upload:
- file: file.md
- size: ... bytes
- mime_type: ...
- collection_id: ...
- visibility: private
1/3 Created upload intent.
2/3 Uploaded file to private storage.
3/3 Finalized document metadata.
Uploaded document:
- title: ...
- id: ...
- visibility: private
- collection_id: ...
```

Rules:

- Do not read the file body for summary or analysis.
- Do not show the local absolute path.
- Do not show Storage path, signed URL, upload credential, token, Authorization header, service role key, or file content.
- `--json` output must remain pure JSON; do not add progress lines.
- Uploads are default private.
- Do not create collection automatically.
- Do not upload directories or batches.
- After success, report document id, title, visibility, and collection id.
- If finalize or upload fails, report requestId and do not pretend the upload succeeded.

## 8. Collection Resolution Workflow

Use collection resolution before document upload whenever collection id is not already certain.

Search:

```bash
npm run workstation -- collection list --q "keyword"
```

Filter when relation is known:

```bash
npm run workstation -- collection list --related-type project --related-id "PROJECT_ID"
npm run workstation -- collection list --related-type knowledge --related-id "KNOWLEDGE_ID"
```

Confirm:

```bash
npm run workstation -- collection show --id "COLLECTION_ID"
```

Rules:

- If there are zero candidates, stop and ask the user for a better keyword or an existing collection id.
- If there are multiple plausible candidates, stop and ask the user to choose.
- If there is one clear candidate, use its full id and optionally run `collection show`.
- Do not guess collection ids.
- Do not auto-create collections.
- Do not read Documents body or Storage object body to decide.
- Do not return public download links or signed URLs.

## 9. Migration / Grant Troubleshooting

Known real failure patterns from v1.2.x:

- `permission denied for table skills`
- `permission denied for table projects`
- `permission denied for table documents`
- `permission denied for table document_collections`
- operation log method constraint missing PATCH before `0024`
- missing document upload grants before `0027`

Triage:

1. Preserve the requestId.
2. Identify the table in the error message.
3. Check whether the related migration is expected:
   - `0023_create_workstation_operation_logs.sql`
   - `0024_workstation_update_service_role_grants.sql`
   - `0025_consolidate_workstation_service_role_grants.sql`
   - `0026_workstation_project_progress_date_update_grants.sql`
   - `0027_workstation_document_upload_grants.sql`
4. If the migration is missing, stop and report that deployment prerequisite.
5. Offer the minimum SQL or migration name needed; do not request a full DB URL or service role key.
6. After the migration/grant is applied, rerun the smallest relevant smoke:
   - health dataAccess
   - list/show
   - one create/update
   - one upload intent/upload/finalize chain when upload grants were involved

Rules:

- Do not print `.env.local`.
- Do not ask the user to paste `SUPABASE_SERVICE_ROLE_KEY`.
- Do not add broad grants when column-scoped grants are enough.
- Do not change RLS or Storage policy just because service_role grants are missing.
- Do not direct-query the database merely to bypass an unauthenticated dashboard logs page.

## 10. PR Review Checklist

When reviewing a Workstation PR, check:

- Is the PR non-draft?
- Is the branch based on latest `main`?
- Is the PR mergeable, or does GitHub show conflicts?
- Do changed files match the stated scope?
- Are there unexpected files under:
  - `supabase/migrations`
  - `src/app/public-files`
  - public download routes
  - Storage helpers or policies
  - RLS-related SQL
  - `.env*`
- Did the PR add API routes or CLI commands? If yes, were they explicitly requested?
- Did the PR add migration? If yes, is it minimal and named with the next number?
- Did it add delete, public publish, visibility manage, batch upload, directory upload, MCP, Agent CEO, Notion, Feishu, Gmail, or Supabase-direct CLI access?
- Did it keep operation log summaries safe?
- Did it avoid token, Authorization, service role key, signed URL, Storage path, Documents body, file content, and `.env.local` leakage?
- Were validations run:
  - `node --check scripts/workstation.mjs` when CLI changed
  - `npm run lint`
  - `npm run build`
  - `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`
  - `git diff --check`
- Did the PR summary honestly state blocked smoke or local caveats?
- If operation logs UI was inaccessible due to login, did the author avoid reading `.env.local` or direct-querying the database?

## 11. Stop Conditions

Stop and ask or report a blocker when:

- `WORKSTATION_API_TOKEN` is missing. Do not guess and do not ask the user to paste it into chat.
- The API returns `UNAUTHORIZED`. Do not print token values.
- A document upload lacks `collection_id`, and `collection list --q` returns multiple plausible candidates. Ask the user to choose.
- `collection show` returns `NOT_FOUND` or `VALIDATION_ERROR`. Ask for a real existing collection id.
- A command would create a duplicate Project / Knowledge / Skill. Show the existing candidate and ask whether to update it.
- A write returns `permission denied for table ...`. Treat it as a migration/grant prerequisite until proven otherwise.
- The task requires service role key, full DB URL, `.env.local`, Storage credentials, or signed URL inspection. Do not request or print secrets.
- The task touches public publish, visibility manage, delete, RLS, Storage policy, bucket visibility, public download route, batch upload, directory upload, OCR, vector indexing, AI summary, or external integrations without explicit scope and safety design.
- Local operation logs UI redirects to login. Do not bypass with direct DB reads unless the user explicitly asks for a separate admin/database investigation and secret-safe path exists.
- The user is in another Codex project and asks to use Personal Workstation, but that project has no Workstation Skill Pack installed. Do not assume global Skill availability; explain that the project must install the Skill Pack or use a user-provided safe local CLI path. Use `install.sh --check` or `--dry-run` first when the user wants a non-destructive install preview.
- The user asks how to connect a brand-new project to Workstation. Start from `docs/workstation-new-project-bootstrap.md`; do not add new API, CLI, installer behavior, npm package publishing, or global installation unless separately requested and designed.

## 12. Never Do

- Never print `WORKSTATION_API_TOKEN`.
- Never print `SUPABASE_SERVICE_ROLE_KEY`.
- Never read or show `.env.local` contents.
- Never pass token through a CLI flag.
- Never commit `.env.local`, DB URLs, tokens, keys, signed URLs, or Storage paths.
- Never let the CLI connect directly to Supabase.
- Never let the CLI save service role key.
- Never generate Storage paths in the CLI.
- Never read Documents body text through Workstation CLI.
- Never read Supabase Storage object body through Workstation CLI.
- Never generate public links or signed public URLs through Workstation CLI.
- Never upload directories or batches through current document upload.
- Never upload zip, exe, sh, dmg, app, installer, script, archive, or executable files.
- Never auto-create a document collection for upload.
- Never guess collection ids.
- Never delete files or assets through Workstation CLI.
- Never public publish or change visibility through Workstation CLI.
- Never add MCP server, Agent CEO, Notion, Feishu, Gmail, or other external integration as part of Workstation CLI work unless a separate explicitly requested design exists.
- Never copy `WORKSTATION_API_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `.env.local`, Storage credentials, migrations, RLS files, or Storage policy files into a target project as part of cross-project Skill Pack work.
