# Personal Workstation Skill Examples

These examples show how Codex should use the local Workstation CLI in real Personal Workstation tasks. They are invocation patterns, not new capabilities.

## 1. Save A Learning Note

User:

> 帮我把这段因子投资学习笔记保存到工作台。

Codex should:

1. Run `npm run workstation -- health` if the environment is uncertain.
2. Run `npm run workstation -- project list --q "因子投资" --limit 10` if the note likely belongs to an existing Project.
3. If an existing Project is clear, keep its id; if candidates are ambiguous, ask the user.
4. Write the long note body to `/tmp/workstation-note.md`.
5. Run `npm run workstation -- knowledge list --q "因子投资" --limit 10` to avoid creating a duplicate Knowledge note.
6. Run `npm run workstation -- knowledge create --title "..." --slug "..." --category "因子投资" --content-file "/tmp/workstation-note.md" --project-id "PROJECT_ID"`.
7. Read back with `knowledge show` when acceptance requires confirmation.
8. Report id, title, slug, visibility, and requestId only if there was an error.

Do not read Documents body, Storage object body, or any secret file to make the note.

## 2. Create A Research Project

User:

> 给“机器学习因子研究”创建一个研究项目。

Codex should:

1. Run `npm run workstation -- project list --q "机器学习因子研究" --limit 10`.
2. If a matching Project already exists, show it and ask whether to update instead of duplicating.
3. If no matching Project exists, run:

   ```bash
   npm run workstation -- project create \
     --title "机器学习因子研究" \
     --slug "machine-learning-factor-research" \
     --summary "围绕机器学习方法在因子研究中的应用沉淀长期研究资产" \
     --status "planning"
   ```

4. Report id, title, slug, and visibility.

Do not set public visibility or owner fields.

## 3. Update Project Progress

User:

> 把 machine-learning-factor-research 项目的进度更新到 25%，开始日期是 2026-06-16。

Codex should:

1. Run `npm run workstation -- project show --slug "machine-learning-factor-research"`.
2. Confirm this is the intended Project.
3. Run:

   ```bash
   npm run workstation -- project update \
     --slug "machine-learning-factor-research" \
     --progress 25 \
     --start-date "2026-06-16"
   ```

4. Report the resolved id, progress, start_date, and requestId if the update fails.

Do not invent `current_stage`; use existing summary/background/methodology fields for stage notes.

## 4. Upload A Local File

User:

> 把 ./factor-note.md 上传到 Memory Engineering 知识库的文档包。

Codex should:

1. Run `npm run workstation -- collection list --q "Memory"`.
2. If exactly one clear collection matches, optionally run `npm run workstation -- collection show --id "COLLECTION_ID"`.
3. If multiple candidates match, stop and ask the user to choose. Do not guess.
4. Confirm the path is one local regular file, not a directory, archive, script, installer, or executable.
5. Run:

   ```bash
   npm run workstation -- document upload \
     --collection-id "COLLECTION_ID" \
     --file "./factor-note.md" \
     --title "因子投资学习材料" \
     --category "research_material"
   ```

6. Report document id, title, visibility, and collection id.

Do not print the local absolute path, Storage path, signed URL, token, Authorization header, service role key, or file content.

## 5. Create A Reusable Skill

User:

> 把这个 PR 审查流程变成一个 Skill。

Codex should:

1. Run `npm run workstation -- skill list --q "PR 审查" --limit 10`.
2. If a matching Skill exists, show it and ask whether to update.
3. Write the long workflow body to `/tmp/workstation-skill.md`.
4. Run:

   ```bash
   npm run workstation -- skill create \
     --name "Codex PR 审查流程" \
     --slug "codex-pr-review-workflow" \
     --description "用于审查 Codex 开发 PR 的固定流程" \
     --category "workflow" \
     --platforms "codex,github" \
     --usage-file "/tmp/workstation-skill.md"
   ```

5. Report id, name, slug, status, and visibility if present.

Do not upload, execute, parse, install, or auto-run Skill packages.

## 6. Query A Document Collection

User:

> 找一下 Memory Engineering 的文档包 id。

Codex should:

1. Run `npm run workstation -- collection list --q "Memory" --limit 10`.
2. Show the full id, title, type, file_count, total_size, and updated_at from the CLI output.
3. If the target is clear, optionally run `npm run workstation -- collection show --id "COLLECTION_ID"`.
4. If more than one collection is plausible, ask the user which one to use.

Do not create a collection automatically.

## 7. Run A Weekly Review

User:

> 看一下这个工作站本周有哪些资产需要维护。

Codex should:

1. Run `npm run workstation -- review --period week`.
2. Summarize the total assets, recent updates, health ratios, and attention items without claiming that a threshold warning proves poor content quality.
3. If the user wants machine-readable output, rerun with `--json`.
4. Suggest opening the supplied Dashboard links or using the Project “记录阶段结论” flow; do not auto-create or update records.

Do not read Knowledge content, resume body, JD text/notes, Documents body, Storage objects, Storage paths, or signed URLs.

## 8. Handle Permission Denied Grant Errors

User:

> 上传失败了，报 permission denied for table documents。

Codex should:

1. Preserve the CLI error code, message, and requestId.
2. Explain that this usually means the corresponding Supabase migration or service_role grant has not been applied.
3. For document upload tables, point to `0027_workstation_document_upload_grants.sql`.
4. After the user confirms the migration/grant was applied, rerun the smallest relevant smoke.

Do not ask the user to paste service role key values, DB URLs, `.env.local`, Authorization headers, or token values.

## 9. Stop On Multiple Candidates

User:

> 把这份材料上传到“研究资料”文档包。

Codex should:

1. Run `npm run workstation -- collection list --q "研究资料" --limit 10`.
2. If multiple plausible collections appear, stop.
3. Ask the user to choose by title or provide the exact collection id.
4. Continue only after the target id is clear.

Do not guess the `collection_id`, create a new collection, or upload to the first row by convenience.
