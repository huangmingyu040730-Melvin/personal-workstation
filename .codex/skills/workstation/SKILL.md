---
name: Personal Workstation
description: Use this skill when the user wants to save to workstation, create, update, query, or upload private assets in the personal workstation using the Workstation CLI. Supports project, knowledge note, skill, document collection, document upload, private asset workflows, project progress, start date, and Codex execution through the workstation CLI.
---

# Personal Workstation

Use this skill when Codex should operate the local Personal Workstation through the existing Workstation CLI.

For resume, JD analysis, application pipeline, interview status, or other 求职中心 work, delegate to the dedicated `personal-career-center` Skill. Do not improvise Career database operations through the generic asset commands.

The CLI is the capability entrypoint. This Skill is only Codex's discovery and invocation guide.

Use `docs/workstation-codex-runbook.md` as the operational source of truth for sequencing, stop conditions, PR review, grant troubleshooting, asset workflows, collection resolution, document upload, and safety boundaries.

Cross-project usage now has a minimal Skill Pack installer. See `docs/workstation-cross-project-skill-pack.md` and `packages/workstation-skill-pack/README.md`. The installer supports `--check` and `--dry-run`, and reports target `package.json` / `scripts.workstation` status, but it still does not edit `package.json`. This repo-level Skill does not make Personal Workstation globally visible in every Codex project; target projects must install the Skill Pack and configure `WORKSTATION_API_URL` / `WORKSTATION_API_TOKEN` locally.

For a brand-new project bootstrap, use `docs/workstation-new-project-bootstrap.md` as the standard 5-minute onboarding checklist. It is documentation only; do not change installer behavior, publish packages, or add global installation when following it.

Command entrypoint:

```bash
npm run workstation -- <command>
```

## When To Use This Skill

Use this skill when the user asks to:

- save something to the personal workstation
- create a project
- update a project
- update project progress
- set or update a project start date
- save a learning note or research note
- create or update a knowledge note
- create or update a reusable skill
- upload a local file to a document collection
- find a document collection
- query workstation assets
- preserve project memory
- check Workstation API health
- resolve a Workstation CLI requestId
- troubleshoot a Workstation migration or grant error

Chinese trigger wording:

- 用户说“保存到工作台”。
- 用户说“沉淀到知识库”。
- 用户说“上传到文档包”。
- 用户说“记录到项目里”。
- 用户说“更新项目进度”。
- 用户说“设置项目开始日期”。
- 用户说“把这个流程变成 Skill”。
- 用户说“查一下工作台里的项目 / 知识 / Skill”。
- 用户说“找一下文档包 id”。
- 用户说“把这段长期记忆保存到工作台”。
- 用户说“让一个新项目接入 Personal Workstation”。

Common intent mapping:

- "保存到我的工作台" usually means create a private Project, Knowledge note, or Skill. Pick the asset type from the user's wording and content.
- "创建一个 Project / 项目" means use `project create` after checking for existing candidates.
- "更新这个项目" means use `project show` first, then `project update`.
- "更新项目进度" means use `project update --progress ...`; use `--start-date` only when a start date is requested or provided.
- "创建一个 Knowledge / 知识笔记" means use `knowledge create`, usually with `--content-file` for long text.
- "把这段内容沉淀成 Skill" means use `skill create`, usually with `--usage-file` for long usage text.
- "查一下文档包" means use `collection list`, usually with `--q`.
- "查看这个文档包" means use `collection show --id`.
- "上传文件到文档包" means use `document upload` only for one local regular file, one existing document collection, and default private metadata.
- "新项目接入 Workstation" means follow `docs/workstation-new-project-bootstrap.md`: install the Skill Pack, add the npm script manually, configure local env, and verify with health/list commands.

## Never Do

Never:

- ask the user to paste `WORKSTATION_API_TOKEN`
- ask the user to paste `SUPABASE_SERVICE_ROLE_KEY`
- print `.env.local`
- print Authorization headers
- directly connect the CLI to Supabase
- change visibility
- publish assets publicly
- delete assets
- create public links
- generate signed public URLs
- read private document bodies
- read Supabase Storage object bodies
- modify Storage policy
- make bucket public
- upload directories
- upload batches
- upload zip, exe, sh, dmg, app, installer, script, archive, or executable files
- auto-create a document collection for upload
- guess a `collection_id`
- generate Storage paths in the CLI
- save service role keys in the CLI
- copy Workstation token values, `.env.local`, service role keys, Storage credentials, migrations, RLS files, or Storage policy files into another project when installing the Skill Pack
- add MCP server, Agent CEO, Notion, Feishu, Gmail, or other external integration as part of Workstation CLI work
- modify a target project's `package.json` automatically while installing the Skill Pack

If the user asks for one of those operations, stop and explain that the current Workstation CLI does not support it. Keep the boundary intact unless the user explicitly requests a separate safety design.

## Cross-project Skill Pack

v1.2.16 adds a minimal installable Skill Pack:

```bash
npm run workstation:install-skill -- /path/to/target-project
npm run workstation:install-skill -- /path/to/target-project --check
npm run workstation:install-skill -- /path/to/target-project --dry-run
# or
bash packages/workstation-skill-pack/install.sh /path/to/target-project
bash packages/workstation-skill-pack/install.sh --check /path/to/target-project
bash packages/workstation-skill-pack/install.sh --dry-run /path/to/target-project
```

The installer copies only:

- `.codex/skills/workstation/SKILL.md`
- `.codex/skills/workstation/examples.md`
- `scripts/workstation.mjs`

It does not copy token values, `.env.local`, service role keys, Storage credentials, migrations, RLS files, Storage policy files, uploaded files, `node_modules`, or app source. It refuses to overwrite existing target files unless `--force` is passed, and it prints the package script to add manually instead of editing `package.json`.

v1.2.17 adds installer UX checks:

- `--check` reports whether Skill Pack files, `package.json`, and `scripts.workstation` exist.
- `--dry-run` previews directories and files that would be created or copied.
- normal install reports package script status after copying files.
- none of these modes modifies `package.json`.

Target projects must configure `WORKSTATION_API_URL` and `WORKSTATION_API_TOKEN` in their local environment. Do not ask the user to paste token values into chat. Skill Pack installation does not guarantee slash menu visibility immediately; if `/Personal Workstation` is not visible, confirm the target project directory, Skill file, frontmatter name, and Codex reload state. Natural-language triggering is acceptable when Codex can read the Skill and run `npm run workstation`.

## Standard Invocation Patterns

### Project

```bash
npm run workstation -- project list --q "keyword"
npm run workstation -- project show --slug "slug"
npm run workstation -- project create --title "..." --slug "..." --summary "..." --status "planning"
npm run workstation -- project update --slug "..." --progress 25 --start-date "2026-06-16"
```

Project update whitelist:

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

- Run list or show before create/update when duplicates are possible.
- `progress` must be an integer from 0 to 100.
- `start_date` must be a valid `YYYY-MM-DD` date.
- Do not use `current_stage`; put stage text in `summary`, `background`, `methodology`, or a related Knowledge note.
- Do not update `visibility`.

### Knowledge

```bash
npm run workstation -- knowledge list --q "keyword"
npm run workstation -- knowledge create --title "..." --slug "..." --category "..." --content-file "/tmp/note.md"
```

Knowledge update pattern:

```bash
npm run workstation -- knowledge show --slug "slug"
npm run workstation -- knowledge update --slug "slug" --content-file "/tmp/note.md"
```

Knowledge update whitelist:

- `title`
- `category`
- `excerpt`
- `content`
- `tags`
- `project_id`

Rules:

- Use `--content-file` for long notes.
- Do not read Documents or Storage to generate the note.
- Do not create a new Knowledge note when the user asked to update an existing one.

### Skill

```bash
npm run workstation -- skill list --q "keyword"
npm run workstation -- skill create --name "..." --slug "..." --description "..." --category "..." --usage-file "/tmp/skill.md"
```

Skill update pattern:

```bash
npm run workstation -- skill show --slug "slug"
npm run workstation -- skill update --slug "slug" --usage-file "/tmp/skill.md"
```

Skill update whitelist:

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

- Use `--usage-file` for long workflow text.
- Do not upload, execute, parse, install, or auto-run Skill packages.
- Do not create duplicate Skill records if an existing slug or matching name already exists.

### Collection / Document Upload

```bash
npm run workstation -- collection list --q "keyword"
npm run workstation -- collection show --id "COLLECTION_ID"
npm run workstation -- document upload --collection-id "COLLECTION_ID" --file "./file.md" --title "..." --category "research_material"
```

Rules:

- Upload only one local regular file.
- Upload only to an existing document collection.
- Use `collection list --q` when the collection id is missing.
- If multiple candidates appear, do not guess; ask the user to choose.
- If exactly one candidate clearly matches, use the full id and optionally run `collection show --id`.
- Default metadata remains private.
- Do not display local absolute paths, Storage paths, signed URLs, upload credentials, token values, Authorization headers, service role keys, or file content.
- `--json` upload output must remain pure JSON.
- On success, report document id, title, visibility, and collection id.

## Standard Workflow

1. Identify whether the user wants Project, Knowledge note, Skill, collection metadata, document upload, health, or troubleshooting.
2. If the environment is uncertain, run:

   ```bash
   npm run workstation -- health
   ```

3. For create/update tasks, list or show first when a matching asset may already exist.
4. Use temporary files for long text:
   - Project: `--background-file`, `--research-question-file`, `--methodology-file`
   - Knowledge: `--content-file`
   - Skill: `--usage-file`
5. Run the matching `npm run workstation -- ...` command.
6. After create/update/upload, read back when the task is an acceptance check or the user asked for confirmation.
7. On success, report useful metadata only:
   - id
   - title/name
   - slug when relevant
   - visibility when relevant
   - updated fields when relevant
   - collection id for document uploads
8. On failure, report:
   - error code
   - message
   - requestId if present
9. If the error is `permission denied for table ...`, stop and tell the user this usually means the corresponding Supabase migration or service_role grant has not been applied.
10. Do not modify code while performing ordinary Workstation CLI asset operations.

## Environment And Secret Handling

The CLI may read only local environment variables provided by the existing project environment:

- `WORKSTATION_API_URL`
- `WORKSTATION_API_TOKEN`

`SUPABASE_SERVICE_ROLE_KEY` is server-only. The CLI must not read it, print it, store it, or pass it around.

Rules:

- Do not ask the user to paste token or service role key values into chat.
- Do not print token values.
- Do not read, display, summarize, or commit `.env.local`.
- Do not write secrets into docs, examples, PR bodies, shell history, logs, or memory.
- Do not add or use a `--token` CLI flag.
- If the token is missing, tell the user to configure their local Workstation token or use the existing local wrapper flow. Do not ask for the value.

## Error Handling

If the CLI returns an error, preserve useful diagnostics and avoid secrets:

- `UNAUTHORIZED`: local or server token is missing, invalid, or inconsistent.
- `INTERNAL_ERROR`: server data access or service-role configuration may be wrong.
- `RATE_LIMITED`: requests are too frequent; wait before retrying.
- `VALIDATION_ERROR`: command arguments or payload fields are invalid.
- `permission denied for table projects`: likely missing Workstation service-role grants.
- `permission denied for table knowledge_notes`: likely missing Workstation service-role grants.
- `permission denied for table skills`: likely missing Workstation service-role grants.
- `permission denied for table documents` or `permission denied for table document_collections`: likely means `0027_workstation_document_upload_grants.sql` has not been applied.
- `Document collection not found`: run `npm run workstation -- collection list --q "keyword"` and retry with a real id.
- Unsupported upload type: supported types are PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG, JPEG.
- Upload too large: maximum size is 10 MB.

If the error output includes a request id, preserve it:

```text
requestId: wreq_...
```

## Examples

More invocation examples live in:

```text
.codex/skills/workstation/examples.md
```

Use those examples when deciding whether to create a Project, create/update a Knowledge note, create/update a reusable Skill, upload a local file to an existing collection, query collections, handle permission-denied grant errors, or stop when multiple candidates exist.
