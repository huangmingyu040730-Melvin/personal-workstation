# Personal Career Center Skill

日期：2026-07-11

## Purpose

`personal-career-center` lets Codex operate the existing private Career Center through the same controlled Workstation boundary used by Project, Knowledge, Skill, Collection, and Document Upload.

```text
Codex Skill
-> standalone workstation CLI
-> token-protected Workstation Career API
-> server-side service_role data access
-> Resume / JD / application metadata
-> operation logs
```

The CLI never connects directly to Supabase and never reads a service role key.

## Covered Workflows

- Career overview metrics.
- Resume item list, show, create, update, and explicitly confirmed delete.
- Resume version list, show, create, update, quality report, structured preview, Word export, and explicitly confirmed delete.
- JD review/application list, show, manual create, update, and explicitly confirmed delete.
- Server-side AI JD analysis that saves a private review/application record.
- Application pipeline status maintenance for `draft`, `reviewed`, `ready`, `submitted`, `interview`, `rejected`, `offer`, and `archived`.

Application Board is a view over `resume_jd_reviews`; it does not need a second database model. `career application` CLI commands use the same controlled records as `career jd`.

## API Surface

```text
GET    /api/workstation/career/overview
GET    /api/workstation/career/resume-items
POST   /api/workstation/career/resume-items
GET    /api/workstation/career/resume-items/[id]
PATCH  /api/workstation/career/resume-items/[id]
DELETE /api/workstation/career/resume-items/[id]
GET    /api/workstation/career/resume-versions
POST   /api/workstation/career/resume-versions
GET    /api/workstation/career/resume-versions/[id]
PATCH  /api/workstation/career/resume-versions/[id]
DELETE /api/workstation/career/resume-versions/[id]
GET    /api/workstation/career/resume-versions/[id]/quality
GET    /api/workstation/career/resume-versions/[id]/preview
GET    /api/workstation/career/resume-versions/[id]/export
GET    /api/workstation/career/jd-reviews
POST   /api/workstation/career/jd-reviews
GET    /api/workstation/career/jd-reviews/[id]
PATCH  /api/workstation/career/jd-reviews/[id]
DELETE /api/workstation/career/jd-reviews/[id]
POST   /api/workstation/career/jd-reviews/analyze
```

Every route requires the Workstation token, capability authorization, rate limiting, requestId, and metadata-only operation logs.

Capabilities:

- `read_career`
- `manage_career`
- `analyze_career`
- `export_career`
- `delete_career`

DELETE requires both `delete_career` and JSON `{ "confirm": true }`. The CLI exposes it only with `--confirm-delete`.

## CLI Surface

```bash
npm run workstation -- career overview
npm run workstation -- career item list --q "keyword"
npm run workstation -- career item create --data-file /tmp/resume-item.json
npm run workstation -- career version quality --id "VERSION_ID"
npm run workstation -- career version preview --id "VERSION_ID" --json
npm run workstation -- career version export --id "VERSION_ID" --output ./resume.docx
npm run workstation -- career jd analyze --version-id "VERSION_ID" --jd-file /tmp/job-description.txt
npm run workstation -- career application update --id "REVIEW_ID" --status interview
```

Complete item/version payloads use temporary JSON files. JD text and long notes use temporary text files. This keeps long private content out of shell history and operation-log summaries.

## Global Skill

Install the Skill and standalone client globally on the current machine:

```bash
npm run workstation:install-global-skill -- --dry-run
npm run workstation:install-global-skill -- --force
npm run workstation:install-global-skill -- --check
```

The global installer writes:

```text
${CODEX_HOME:-$HOME/.codex}/skills/personal-career-center/
$HOME/.local/share/personal-workstation/workstation.mjs
$HOME/.local/bin/workstation-cli
```

It does not copy token values, service role keys, `.env.local`, AI keys, or shell profile settings. The wrapper uses the existing local Keychain environment loader when present. Reload Codex after installation so the global catalog can rediscover the Skill.

The repo-level cross-project installer now copies both `workstation` and `personal-career-center` Skills plus the standalone client.

## Safety Boundaries

- New resume items and versions are always private through the Career API.
- The Career API does not update visibility or publish a resume.
- AI analysis is advisory and never updates resume items or versions automatically.
- Codex must not invent experience, metrics, dates, grades, employers, roles, certificates, or skills.
- The Skill does not submit applications, email employers, schedule interviews, or claim external progress without user confirmation.
- Human-readable `jd show` output omits full JD text and raw AI JSON. Structured `--json` output is available only when explicitly requested.
- Operation logs record ids, field names, counts, status, and content presence/length only. They do not record resume bodies, full JD text, contact information, token values, keys, Authorization headers, local file contents, or AI credentials.
- Deleting a resume version may cascade version-item links and JD reviews. The user must explicitly request deletion after reviewing the record and impact.

## Database Impact

`0028_workstation_career_center_grants.sql` adds only the exact `service_role` table/column grants required by Career routes and expands the operation-log method constraint to include DELETE. It does not change RLS, Storage policy, bucket visibility, public routes, public resume behavior, or existing data.

The migration must be applied and the application deployed before production global-Skill commands can use the new Career endpoints.
