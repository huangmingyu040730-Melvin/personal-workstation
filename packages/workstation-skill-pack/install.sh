#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash packages/workstation-skill-pack/install.sh /path/to/target-project [--force]
  bash packages/workstation-skill-pack/install.sh --force /path/to/target-project
EOF
}

force=0
target=""

for arg in "$@"; do
  case "$arg" in
    --force)
      force=1
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

if [ ! -e "$target" ]; then
  echo "Target path does not exist: $target" >&2
  exit 1
fi

if [ ! -d "$target" ]; then
  echo "Target path is not a directory: $target" >&2
  exit 1
fi

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
Next steps:
1. Add this script to package.json if needed:
   "workstation": "node scripts/workstation.mjs"
2. Configure WORKSTATION_API_URL and WORKSTATION_API_TOKEN in your local environment.
3. Run:
   npm run workstation -- health
EOF
