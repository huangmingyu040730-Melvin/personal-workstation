#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash packages/workstation-skill-pack/install.sh /path/to/target-project [--force]
  bash packages/workstation-skill-pack/install.sh /path/to/target-project [--dry-run]
  bash packages/workstation-skill-pack/install.sh /path/to/target-project [--check]
  bash packages/workstation-skill-pack/install.sh --force /path/to/target-project
  bash packages/workstation-skill-pack/install.sh --dry-run /path/to/target-project
  bash packages/workstation-skill-pack/install.sh --check /path/to/target-project
EOF
}

print_script_suggestion() {
  cat <<'EOF'
Suggested package.json script:
{
  "scripts": {
    "workstation": "node scripts/workstation.mjs"
  }
}
EOF
}

has_workstation_script() {
  local package_json="$1"
  node -e '
const fs = require("node:fs");
const packagePath = process.argv[1];
try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  process.exit(packageJson?.scripts?.workstation ? 0 : 1);
} catch {
  process.exit(1);
}
' "$package_json"
}

print_package_status() {
  local target="$1"
  local package_json="$target/package.json"

  if [ ! -f "$package_json" ]; then
    cat <<'EOF'
No package.json found in target project.
Create one or add a workstation script manually if this is a Node project.
EOF
    print_script_suggestion
    return
  fi

  if has_workstation_script "$package_json"; then
    echo "package.json already has scripts.workstation."
    return
  fi

  cat <<'EOF'
package.json found, but scripts.workstation is missing.
Add:
"workstation": "node scripts/workstation.mjs"
EOF
  print_script_suggestion
}

check_target_exists() {
  local target="$1"

  if [ ! -e "$target" ]; then
    echo "Target path does not exist: $target" >&2
    exit 1
  fi

  if [ ! -d "$target" ]; then
    echo "Target path is not a directory: $target" >&2
    exit 1
  fi
}

print_check() {
  local target="$1"
  local dest_skill="$target/.codex/skills/workstation/SKILL.md"
  local dest_examples="$target/.codex/skills/workstation/examples.md"
  local dest_client="$target/scripts/workstation.mjs"
  local package_json="$target/package.json"

  echo "Check: Personal Workstation Skill Pack install"
  echo "Target:"
  echo "- $target"
  echo "Status:"
  if [ -e "$target" ]; then
    echo "- target path: exists"
  else
    echo "- target path: missing"
  fi

  if [ -d "$target" ]; then
    echo "- target directory: yes"
  else
    echo "- target directory: no"
  fi

  for file in "$dest_skill" "$dest_examples" "$dest_client"; do
    local rel="${file#$target/}"
    if [ -f "$file" ]; then
      echo "- $rel: exists"
    else
      echo "- $rel: missing"
    fi
  done

  if [ -f "$package_json" ]; then
    echo "- package.json: exists"
    if has_workstation_script "$package_json"; then
      echo "- package.json scripts.workstation: exists"
    else
      echo "- package.json scripts.workstation: missing"
      print_script_suggestion
    fi
  else
    echo "- package.json: missing"
    echo "- package.json scripts.workstation: missing"
    print_script_suggestion
  fi
}

print_dry_run() {
  local target="$1"

  cat <<EOF
Dry run: Personal Workstation Skill Pack install
Target:
- $target
Would create:
- .codex/skills/workstation/
- scripts/
Would copy:
- .codex/skills/workstation/SKILL.md
- .codex/skills/workstation/examples.md
- scripts/workstation.mjs
Would not copy:
- .env.local
- WORKSTATION_API_TOKEN
- SUPABASE_SERVICE_ROLE_KEY
- Storage credentials
- shell profile settings
Would not modify:
- package.json
EOF
  print_package_status "$target"
}

force=0
dry_run=0
check_only=0
target=""

for arg in "$@"; do
  case "$arg" in
    --force)
      force=1
      ;;
    --dry-run)
      dry_run=1
      ;;
    --check)
      check_only=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [ -n "$target" ]; then
        echo "Unexpected argument: $arg" >&2
        usage >&2
        exit 1
      fi
      target="$arg"
      ;;
  esac
done

if [ -z "$target" ]; then
  echo "Missing target project path." >&2
  usage >&2
  exit 1
fi

if [ "$dry_run" -eq 1 ] && [ "$check_only" -eq 1 ]; then
  echo "Use only one of --dry-run or --check." >&2
  usage >&2
  exit 1
fi

check_target_exists "$target"

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

src_skill="$script_dir/.codex/skills/workstation/SKILL.md"
src_examples="$script_dir/.codex/skills/workstation/examples.md"
src_client="$script_dir/scripts/workstation.mjs"

dest_skill="$target/.codex/skills/workstation/SKILL.md"
dest_examples="$target/.codex/skills/workstation/examples.md"
dest_client="$target/scripts/workstation.mjs"

for src in "$src_skill" "$src_examples" "$src_client"; do
  if [ ! -f "$src" ]; then
    echo "Skill Pack source file is missing: $src" >&2
    exit 1
  fi
done

if [ "$check_only" -eq 1 ]; then
  print_check "$target"
  exit 0
fi

if [ "$dry_run" -eq 1 ]; then
  print_dry_run "$target"
  exit 0
fi

existing=()

for dest in "$dest_skill" "$dest_examples" "$dest_client"; do
  if [ -e "$dest" ] && [ "$force" -ne 1 ]; then
    existing+=("$dest")
  fi
done

if [ "${#existing[@]}" -gt 0 ]; then
  echo "Refusing to overwrite existing file(s):" >&2
  for file in "${existing[@]}"; do
    echo "- $file" >&2
  done
  echo "Pass --force to overwrite Skill Pack files." >&2
  exit 1
fi

mkdir -p "$target/.codex/skills/workstation" "$target/scripts"

cp "$src_skill" "$dest_skill"
cp "$src_examples" "$dest_examples"
cp "$src_client" "$dest_client"

chmod 0644 "$dest_skill" "$dest_examples" "$dest_client"

cat <<'EOF'
Installed Personal Workstation Skill Pack.
This installer never copies .env.local, WORKSTATION_API_TOKEN, SUPABASE_SERVICE_ROLE_KEY, Storage credentials, or shell profile settings.
Configure WORKSTATION_API_URL and WORKSTATION_API_TOKEN locally.
EOF

print_package_status "$target"

cat <<'EOF'
Next steps:
1. Configure WORKSTATION_API_URL and WORKSTATION_API_TOKEN in your local environment.
2. Run:
   npm run workstation -- health
EOF
