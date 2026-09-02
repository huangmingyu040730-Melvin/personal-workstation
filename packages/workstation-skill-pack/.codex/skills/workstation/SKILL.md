---
name: Personal Workstation
description: Use this skill when the user wants to save to Personal Workstation, create, update, query, review, or upload private assets through the cross-project Workstation CLI. Supports weekly review, Project, Knowledge note, Skill, document collection, document upload, private asset workflows, project progress, start date, and Codex execution through npm run workstation.
---

# Personal Workstation

Use this Skill when Codex should operate Personal Workstation from this target project through the installed Workstation CLI.

For resume, JD analysis, application pipeline, interview status, or other 求职中心 work, use the installed `personal-career-center` Skill. Both Skills share the same standalone Workstation client, but Career privacy and deletion rules are stricter.

The CLI entrypoint is:

```bash
npm run workstation -- <command>
```

This Skill Pack is repo-level inside the target project. It does not guarantee global Codex slash menu visibility in every project. It only helps Codex discover Personal Workstation when these files are installed in the current project.

If `/Personal Workstation` is not visible, confirm Codex opened this target project directory, confirm `.codex/skills/workstation/SKILL.md` exists, confirm the frontmatter name is `Personal Workstation`, reload Codex, and try a natural-language trigger such as "用 Personal Workstation 帮我查一下项目列表". If Codex can read this Skill and run `npm run workstation`, the repo-level setup is usable even if the slash menu does not immediately show it.

More examples live in:

```text
.codex/skills/workstation/examples.md
```

## When To Use

Use this skill when the user asks to:

- save something to the personal workstation
- create or update a Project
- update Project progress or start date
- create or update a Knowledge note
- create or update a reusable Skill
- query Workstation assets
- find a document collection id
- upload one local file to an existing document collection
- check Workstation API health
- review weekly Workstation asset health and follow-up metadata
- troubleshoot a Workstation requestId or permission error

Chinese trigger wording:

- “保存到工作台”
- “沉淀到知识库”
- “上传到文档包”
- “记录到项目里”
- “更新项目进度”
- “设置项目开始日期”
- “把这个流程变成 Skill”
- “找一下文档包 id”
- “做一次工作站周报 / 周度复盘”

## Never Do

Never:

- ask the user to paste `WORKSTATION_API_TOKEN`
- ask the user to paste `SUPABASE_SERVICE_ROLE_KEY`
- print `.env.local`
- print Authorization headers
- pass tokens through CLI flags
- connect directly to Supabase
- save service role keys in this target project
- change visibility
- publish assets publicly
- delete assets or files
- create public links
- generate signed public URLs
- read private document bodies
- read Supabase Storage object bodies
- modify Storage policy
- make any bucket public
- upload directories
- upload batches
- upload zip, exe, sh, dmg, app, installer, script, archive, or executable files
- auto-create a document collection for upload
- guess a `collection_id`
- generate Storage paths in the CLI
- add MCP server, Agent CEO, Notion, Feishu, Gmail, or other external integration as part of Workstation CLI work
- modify `package.json` automatically as part of Skill Pack installation

If the user asks for one of those operations, stop and explain that the current Workstation CLI does not support it.

## Environment And Secrets

The installed CLI reads only:

```text
WORKSTATION_API_URL
WORKSTATION_API_TOKEN
```

Rules:

- Keep `WORKSTATION_API_TOKEN` in the local shell, local secret manager, or ignored local env setup.
- Do not commit `.env.local`.
- Do not write token values into docs, examples, PR bodies, issue comments, logs, shell history, or chat.
- Do not copy `SUPABASE_SERVICE_ROLE_KEY` into the target project.
- If the token is missing, stop and tell the user to configure `WORKSTATION_API_TOKEN` locally. Do not ask for the value.

## Standard Commands

Health:

```bash
npm run workstation -- health
```

Weekly review:

```bash
npm run workstation -- review --period week
npm run workstation -- review --period week --json
```

Weekly review is read-only, supports only `week`, and returns threshold-based metadata. It must not read Knowledge content, resume bodies, JD text/notes, Documents bodies, Storage objects, Storage paths, or signed URLs, and it must not auto-update status, auto-create checkpoints, or publish assets.

Project:

```bash
npm run workstation -- project list --q "keyword" --limit 10
npm run workstation -- project show --slug "slug"
npm run workstation -- project create --title "..." --slug "..." --summary "..." --status "planning"
npm run workstation -- project update --slug "..." --progress 25 --start-date "2026-06-16"
```

Knowledge:

```bash
npm run workstation -- knowledge list --q "keyword" --limit 10
npm run workstation -- knowledge create --title "..." --slug "..." --category "..." --content-file "/tmp/note.md"
npm run workstation -- knowledge update --slug "slug" --content-file "/tmp/note.md"
```

Skill:

```bash
npm run workstation -- skill list --q "keyword" --limit 10
npm run workstation -- skill create --name "..." --slug "..." --description "..." --category "workflow" --usage-file "/tmp/skill.md"
npm run workstation -- skill update --slug "slug" --usage-file "/tmp/skill.md"
```

Collection and document upload:

```bash
npm run workstation -- collection list --q "keyword" --limit 10
npm run workstation -- collection show --id "COLLECTION_ID"
npm run workstation -- document upload --collection-id "COLLECTION_ID" --file "./file.md" --title "..." --category "research_material"
```

## Workflow Rules

1. Run `npm run workstation -- health` when the environment is uncertain.
2. Run list/show before create/update when duplicates are possible.
3. Use temporary files for long text:
   - Knowledge: `--content-file`
   - Skill: `--usage-file`
   - Project: `--background-file`, `--research-question-file`, `--methodology-file`
4. For document upload, resolve the collection first:
   - If the user did not provide `collection_id`, run `collection list --q "keyword"`.
   - If multiple candidates are plausible, do not guess; ask the user to choose.
   - If one candidate is clear, use the full id and optionally run `collection show --id`.
5. Upload only one local regular file to one existing collection.
6. Report useful success metadata only:
   - id
   - title/name
   - slug when relevant
   - visibility when relevant
   - collection id for uploads
7. On failure, report error code, message, and requestId if present.
8. If the error is `permission denied for table ...`, stop and explain that the related Supabase migration or service_role grant may not be applied.

## Error Hints

- `UNAUTHORIZED`: token missing, invalid, or inconsistent.
- `permission denied for table projects`, `knowledge_notes`, or `skills`: likely missing Workstation service_role grants.
- `permission denied for table documents` or `document_collections`: likely missing `0027_workstation_document_upload_grants.sql`.
- `Document collection not found`: run `npm run workstation -- collection list --q "keyword"` and retry with a real id.
- Unsupported upload type: supported types are PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG, JPEG.
- Upload too large: maximum size is 10 MB.

Preserve requestId exactly when present:

```text
requestId: wreq_...
```
