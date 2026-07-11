#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash packages/workstation-skill-pack/install-global.sh [--check]
  bash packages/workstation-skill-pack/install-global.sh [--dry-run]
  bash packages/workstation-skill-pack/install-global.sh [--force]
EOF
}

force=0
dry_run=0
check_only=0

for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    --dry-run) dry_run=1 ;;
    --check) check_only=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unexpected argument: $arg" >&2; usage >&2; exit 1 ;;
  esac
done

if [ "$dry_run" -eq 1 ] && [ "$check_only" -eq 1 ]; then
  echo "Use only one of --dry-run or --check." >&2
  exit 1
fi

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
codex_home="${CODEX_HOME:-$HOME/.codex}"
data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
bin_home="$HOME/.local/bin"

src_career="$script_dir/.codex/skills/personal-career-center"
src_client="$script_dir/scripts/workstation.mjs"
dest_career="$codex_home/skills/personal-career-center"
dest_client="$data_home/personal-workstation/workstation.mjs"
dest_wrapper="$bin_home/workstation-cli"

for src in "$src_career/SKILL.md" "$src_career/agents/openai.yaml" "$src_career/references/commands.md" "$src_client"; do
  if [ ! -f "$src" ]; then
    echo "Global Skill source file is missing: $src" >&2
    exit 1
  fi
done

print_status() {
  echo "Global Personal Career Center Skill:"
  for file in "$dest_career/SKILL.md" "$dest_career/agents/openai.yaml" "$dest_career/references/commands.md" "$dest_client" "$dest_wrapper"; do
    if [ -f "$file" ]; then
      echo "- $file: exists"
    else
      echo "- $file: missing"
    fi
  done
}

if [ "$check_only" -eq 1 ]; then
  print_status
  exit 0
fi

if [ "$dry_run" -eq 1 ]; then
  cat <<EOF
Dry run: global Personal Career Center Skill install
Would install Skill files under:
- $dest_career
Would install the standalone client at:
- $dest_client
Would install the keychain-aware wrapper at:
- $dest_wrapper
Would not copy or write token values, service role keys, .env.local, AI keys, or shell profile settings.
EOF
  exit 0
fi

existing=()
for file in "$dest_career/SKILL.md" "$dest_career/agents/openai.yaml" "$dest_career/references/commands.md" "$dest_client" "$dest_wrapper"; do
  if [ -e "$file" ] && [ "$force" -ne 1 ]; then
    existing+=("$file")
  fi
done

if [ "${#existing[@]}" -gt 0 ]; then
  echo "Refusing to overwrite existing global file(s):" >&2
  for file in "${existing[@]}"; do
    echo "- $file" >&2
  done
  echo "Pass --force after reviewing the existing installation." >&2
  exit 1
fi

mkdir -p "$dest_career/agents" "$dest_career/references" "$(dirname -- "$dest_client")" "$bin_home"
cp "$src_career/SKILL.md" "$dest_career/SKILL.md"
cp "$src_career/agents/openai.yaml" "$dest_career/agents/openai.yaml"
cp "$src_career/references/commands.md" "$dest_career/references/commands.md"
cp "$src_client" "$dest_client"

cat > "$dest_wrapper" <<'EOF'
#!/usr/bin/env zsh
set -euo pipefail

env_file="$HOME/.local/share/personal-workstation/env.zsh"
requested_api_url="${WORKSTATION_API_URL:-}"
if [ -f "$env_file" ]; then
  source "$env_file"
fi

if [ -n "$requested_api_url" ]; then
  export WORKSTATION_API_URL="$requested_api_url"
else
  unset WORKSTATION_API_URL
fi
unset requested_api_url

if [ -z "${WORKSTATION_API_TOKEN:-}" ]; then
  echo "Missing WORKSTATION_API_TOKEN in the local environment or macOS Keychain."
  exit 1
fi

certifi_path="$(python3 -c 'import certifi; print(certifi.where())' 2>/dev/null || true)"
if [ -n "$certifi_path" ]; then
  export NODE_EXTRA_CA_CERTS="$certifi_path"
fi
unset certifi_path

exec node "$HOME/.local/share/personal-workstation/workstation.mjs" "$@"
EOF

chmod 0644 "$dest_career/SKILL.md" "$dest_career/agents/openai.yaml" "$dest_career/references/commands.md" "$dest_client"
chmod 0755 "$dest_wrapper"

cat <<'EOF'
Installed global Personal Career Center Skill.
No token, service role key, .env.local, AI key, or shell profile setting was copied.
Reload Codex so the global Skill catalog can discover personal-career-center.
EOF
print_status
