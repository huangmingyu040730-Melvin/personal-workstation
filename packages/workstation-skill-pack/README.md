# Personal Workstation Skill Pack

This package is the cross-project Skill Pack for using Personal Workstation from another Codex project.

It installs a repo-level Codex Skill and a lightweight `scripts/workstation.mjs` client into a target project. It does not make the Skill globally visible in every Codex workspace; Codex discovery still depends on the target project containing `.codex/skills/workstation/SKILL.md` and on the Codex product environment.

## What Gets Installed

The installer copies these files into the target project:

```text
target-project/
  .codex/
    skills/
      workstation/
        SKILL.md
        examples.md
  scripts/
    workstation.mjs
```

It does not edit `package.json`. Add this script yourself if the target project wants the standard npm entrypoint:

```json
{
  "scripts": {
    "workstation": "node scripts/workstation.mjs"
  }
}
```

## Install

From the `personal-workstation` repository:

```bash
bash packages/workstation-skill-pack/install.sh /path/to/target-project
```

Overwrite previously installed Skill Pack files only when you intend to replace them:

```bash
bash packages/workstation-skill-pack/install.sh /path/to/target-project --force
```

The installer:

- checks that the target path exists and is a directory
- creates `.codex/skills/workstation/` and `scripts/`
- copies `SKILL.md`, `examples.md`, and `scripts/workstation.mjs`
- refuses to overwrite existing target files unless `--force` is passed
- prints next steps for adding the package script and configuring local env

The installer never copies token values, `.env.local`, Supabase keys, Storage credentials, migrations, RLS files, Storage policy files, or uploaded files.

## Environment

Configure these only in your local shell, local secret manager, or project-local ignored environment setup:

```bash
export WORKSTATION_API_URL="https://personal-workstation.vercel.app"
export WORKSTATION_API_TOKEN="<local-only-workstation-token>"
```

`<local-only-workstation-token>` is a placeholder. Do not commit a real token value.

Do not:

- commit `WORKSTATION_API_TOKEN`
- commit `.env.local`
- copy `SUPABASE_SERVICE_ROLE_KEY` into the target project
- put a service role key in the target project
- put token values in `SKILL.md`, `examples.md`, README files, PR bodies, issue comments, logs, or chat
- pass token values through CLI flags

The target project client only calls the Workstation API. It does not connect to Supabase directly and does not need Supabase SDK.

## Verify

After adding the npm script and configuring local env:

```bash
npm run workstation -- health
npm run workstation -- project list --limit 5
npm run workstation -- collection list --limit 5
```

If the token is missing, do not paste it into chat. Configure `WORKSTATION_API_TOKEN` locally and rerun `health`.

## Common Examples

List Projects:

```bash
npm run workstation -- project list --limit 5
```

Find a document collection:

```bash
npm run workstation -- collection list --q "Memory" --limit 10
npm run workstation -- collection show --id "COLLECTION_ID"
```

Upload one private document to an existing collection:

```bash
npm run workstation -- document upload \
  --collection-id "COLLECTION_ID" \
  --file "./note.md" \
  --title "Research note" \
  --category "research_material"
```

Document upload remains single-file, existing-collection-only, and private by default.

## Safety Boundaries

The Skill Pack supports the existing safe Workstation CLI surface:

- `health`
- `project list/show/create/update`
- `knowledge list/show/create/update`
- `skill list/show/create/update`
- `collection list/show`
- `document upload`

It does not add:

- API routes
- CLI commands beyond the copied client
- migrations
- RLS changes
- Storage policy changes
- bucket visibility changes
- public download route changes
- batch upload
- directory upload
- collection create/update/delete
- delete
- public publish
- visibility manage
- OCR, vector indexing, or AI summary
- MCP server, Agent CEO, Notion, Feishu, Gmail, or other external integrations

The client must not print token values, Authorization headers, service role keys, full Storage paths, signed URLs, local absolute upload paths, or file contents.

## Uninstall

Remove the installed files from the target project:

```bash
rm -rf .codex/skills/workstation
rm -f scripts/workstation.mjs
```

If you added a `workstation` script to `package.json`, remove that script manually.

Do not delete unrelated target project files.

## FAQ

### Does this make Personal Workstation globally visible in Codex?

No. This is a repo-level Skill Pack. It helps projects that install the files; it does not guarantee global slash menu visibility across all Codex projects.

### Does the target project need Supabase credentials?

No. The target project only needs `WORKSTATION_API_URL` and `WORKSTATION_API_TOKEN`. Supabase service role keys stay server-side in Personal Workstation.

### Can the installer update package.json automatically?

No. v1.2.16 intentionally prints the script to add and leaves `package.json` untouched.

### Can this upload directories or public files?

No. Document upload remains one local regular file, existing collection only, default private, with no public link or signed public URL.
