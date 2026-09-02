# Personal Workstation Skill Pack

This package is the cross-project and global Skill Pack for using Personal Workstation and Personal Career Center from Codex.

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
      personal-career-center/
        SKILL.md
        agents/openai.yaml
        references/commands.md
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

Preview the install without copying files:

```bash
bash packages/workstation-skill-pack/install.sh /path/to/target-project --dry-run
```

Check a target project's current install status without copying files:

```bash
bash packages/workstation-skill-pack/install.sh /path/to/target-project --check
```

Flags can appear before or after the target path:

```bash
bash packages/workstation-skill-pack/install.sh --check /path/to/target-project
bash packages/workstation-skill-pack/install.sh --dry-run /path/to/target-project
bash packages/workstation-skill-pack/install.sh --force /path/to/target-project
```

The repo-level installer:

- checks that the target path exists and is a directory
- creates `.codex/skills/workstation/`, `.codex/skills/personal-career-center/`, and `scripts/`
- copies both Skills, Career command references, and `scripts/workstation.mjs`
- refuses to overwrite existing target files unless `--force` is passed
- checks whether `package.json` exists
- checks whether `scripts.workstation` already exists
- prints next steps for adding the package script and configuring local env
- never modifies `package.json`

The installer never copies `.env.local`, `WORKSTATION_API_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, Storage credentials, shell profile settings, migrations, RLS files, Storage policy files, uploaded files, or token values.

## Global Install

Install `personal-career-center` into the global Codex Skill catalog and install a cwd-independent standalone wrapper:

```bash
npm run workstation:install-global-skill -- --dry-run
npm run workstation:install-global-skill -- --force
npm run workstation:install-global-skill -- --check
```

Global files:

```text
${CODEX_HOME:-$HOME/.codex}/skills/personal-career-center/
$HOME/.local/share/personal-workstation/workstation.mjs
$HOME/.local/bin/workstation-cli
```

The wrapper may source the existing local Keychain loader, but the installer never copies or writes token values. It does not edit shell profiles. On Node 24 it enables the built-in environment-proxy support: explicit `HTTP_PROXY` / `HTTPS_PROXY` values take priority; otherwise macOS can supply its currently enabled system proxy through `scutil --proxy`. The wrapper never hardcodes or prints the proxy endpoint, and localhost remains in `NO_PROXY`. Set `NODE_USE_ENV_PROXY=0` before invocation to opt out. Reload Codex after installation so the global Skill catalog is refreshed.

Configure `WORKSTATION_API_URL` and `WORKSTATION_API_TOKEN` locally.

## Check Mode

`--check` reports whether the target has:

- `.codex/skills/workstation/SKILL.md`
- `.codex/skills/workstation/examples.md`
- `.codex/skills/personal-career-center/SKILL.md`
- `.codex/skills/personal-career-center/agents/openai.yaml`
- `.codex/skills/personal-career-center/references/commands.md`
- `scripts/workstation.mjs`
- `package.json`
- `package.json` `scripts.workstation`

It does not copy files and does not edit `package.json`. If `scripts.workstation` is missing, it prints this suggested snippet:

```json
{
  "scripts": {
    "workstation": "node scripts/workstation.mjs"
  }
}
```

## Dry Run Mode

`--dry-run` prints the target path, directories that would be created, files that would be copied, files and secrets that would not be copied, and package script status.

It does not copy files and does not edit `package.json`.

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

If `scripts/workstation.mjs` was manually edited after installation, inspect it before deleting it.

If you added a `workstation` script to `package.json`, remove that script manually.

The installer never writes token values, so uninstalling does not involve token cleanup. Do not delete unrelated target project files.

## Codex Discovery Troubleshooting

Skill Pack installed successfully does not guarantee the Codex slash menu will immediately show `Personal Workstation`.

Discovery may depend on the Codex product environment, current repository, branch, reload state, and UI behavior.

If `/Personal Workstation` is not visible:

1. Confirm Codex opened the target project directory, not a parent or sibling directory.
2. Confirm the target project has `.codex/skills/workstation/SKILL.md`.
3. Confirm the `SKILL.md` frontmatter name is `Personal Workstation`.
4. Restart or reload the Codex project.
5. Try a natural-language trigger such as: "用 Personal Workstation 帮我查一下项目列表".
6. If the slash menu still does not show it, but Codex can read the Skill and run `npm run workstation`, the cross-project setup is still usable.

## FAQ

### Does this make Personal Workstation globally visible in Codex?

No. This is a repo-level Skill Pack. It helps projects that install the files; it does not guarantee global slash menu visibility across all Codex projects.

### Does the target project need Supabase credentials?

No. The target project only needs `WORKSTATION_API_URL` and `WORKSTATION_API_TOKEN`. Supabase service role keys stay server-side in Personal Workstation.

### Can the installer update package.json automatically?

No. The installer checks `package.json` and reports whether `scripts.workstation` is present, but it intentionally leaves `package.json` untouched.

### Can this upload directories or public files?

No. Document upload remains one local regular file, existing collection only, default private, with no public link or signed public URL.
