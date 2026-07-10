---
name: personal-career-center
description: Operate the private Personal Workstation Career Center through its token-protected CLI. Use when the user asks Codex to review or manage resume items, build resume versions, run resume quality checks, preview or export a resume, analyze a job description, inspect JD review history, or update application pipeline status. Also use for Chinese requests mentioning 求职中心、简历素材、简历版本、JD 分析、投递记录、面试进度 or Offer.
---

# Personal Career Center

Operate the existing Career Center through the Workstation CLI. Treat resume, JD, and application data as private personal information.

## Select The Entrypoint

Prefer the global wrapper when it exists:

```bash
"$HOME/.local/bin/workstation-cli" <command>
```

Otherwise use the current project's installed client:

```bash
npm run workstation -- <command>
```

Never ask the user to paste a token. If the wrapper or local environment reports a missing token, stop and ask the user to configure it locally.

## Core Workflow

1. Run `career overview` when the current state is unknown.
2. Run the relevant `list` command before creating a likely duplicate.
3. Run `show --id` before updating or deleting.
4. Put complete resume item/version/JD payloads in temporary JSON files. Put JD text and long notes in temporary text files.
5. Execute the smallest matching command.
6. Read back the affected record after create/update/analyze when confirmation matters.
7. Report the record id, title or company/role, application status, resume version id, and `requestId` on failure.

Read [commands.md](references/commands.md) for command forms and payload examples.

## Capability Rules

### Resume Items

- Query, create, update, and explicitly delete structured education, experience, project, research, skill, certification, award, language, basic, or other items.
- Keep new records private. Do not use this Skill to publish resume data or change visibility.
- Never invent organizations, roles, dates, grades, achievements, metrics, certificates, or skills.

### Resume Versions

- Query, create, update, quality-check, preview, export, and explicitly delete versions.
- Use item ids returned by `career item list`; never guess an id.
- Treat the structured preview as private because it may contain contact information.
- Export only to the path requested by the user and report only the output basename, not unrelated local paths.

### JD Analysis And Applications

- Use `career jd analyze` with a local JD text file. The server saves the result as a private JD/application record.
- Treat AI output as advice. Verify every claim against the real resume and JD before updating resume data.
- Use `career application update` for company, role, channel, notes, or pipeline status.
- Supported statuses are `draft`, `reviewed`, `ready`, `submitted`, `interview`, `rejected`, `offer`, and `archived`.
- Do not send applications, email employers, schedule interviews, or claim an application was submitted unless the user confirms the real-world event.

## Destructive Actions

Delete only when the user explicitly asks to delete the identified record in the current conversation. Show the record first, explain cascade impact for resume versions, then use `--confirm-delete`.

Never interpret cleanup, archive, reject, hide, or replace as permission to delete. Prefer `archived` for old application records.

## Privacy And Safety

Never:

- print or request `WORKSTATION_API_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, Authorization headers, `.env.local`, or AI provider keys
- connect the CLI directly to Supabase
- make resume or application records public
- generate a public or signed resume link
- upload or read Documents/Storage objects as part of Career operations
- log or echo full JD text, resume bodies, contact information, or temporary file contents
- fabricate experience or silently apply AI rewrites
- auto-submit applications, send messages, or contact employers

For `permission denied` on Career tables, stop and report that migration `0028_workstation_career_center_grants.sql` may be unapplied. Preserve the API `requestId`.
