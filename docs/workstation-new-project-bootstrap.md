# Workstation New Project Bootstrap Guide

> v1.2.19 update: repo-level Skill Pack installation also includes `personal-career-center`. Users who want Career Center available in every Codex project can instead use `npm run workstation:install-global-skill -- --force` from personal-workstation, then reload Codex. Global installation does not copy token values or edit the new project's business code.

日期：2026-06-22

本文档是新项目接入 Personal Workstation 的 5 分钟手册。目标是让一个全新的 Codex / Node 项目在不修改业务代码、不复制 secret、不直连 Supabase 的前提下，获得同一套 Workstation CLI、Codex Skill 和跨项目资产沉淀能力。

v1.2.18 只新增这份接入标准文档，不新增 API route、CLI command、migration、RLS、Storage policy、bucket visibility、public download route 或任何上传 / 删除 / 公开发布能力。

## What This Gives A New Project

接入完成后，新项目会有：

- repo-level `Personal Workstation` Codex Skill discovery 文件。
- standalone `scripts/workstation.mjs` client。
- `npm run workstation -- ...` 命令入口。
- 通过 Workstation API 操作 personal-workstation 中的 Project / Knowledge / Skill / Collection / Document Upload。

接入不会让新项目拥有：

- Supabase service role key。
- `.env.local` 或真实 token。
- Storage policy / RLS / bucket 配置。
- 本地数据库或 Workstation 数据副本。
- delete / public publish / visibility manage / batch upload / directory upload 等额外能力。

## Standard Directory Shape

推荐的新项目结构：

```text
new-project/
  .codex/
    skills/
      workstation/
        SKILL.md
        examples.md
  scripts/
    workstation.mjs
  package.json
```

`SKILL.md` 和 `examples.md` 只帮助 Codex 在当前项目中发现并正确调用 Personal Workstation。真正执行仍通过 `npm run workstation -- ...`。

## Step 1: Create A New Project

示例：

```bash
mkdir new-project
cd new-project
npm init -y
```

如果新项目不是 Node 项目，也可以安装 Skill Pack；但若要使用标准 `npm run workstation -- ...` 入口，仍建议保留一个最小 `package.json`。

## Step 2: Install The Workstation Skill Pack

从 `personal-workstation` 仓库运行安装器：

```bash
npm run workstation:install-skill -- /path/to/new-project
```

建议先用只读模式检查：

```bash
npm run workstation:install-skill -- /path/to/new-project --check
npm run workstation:install-skill -- /path/to/new-project --dry-run
```

安装模式是默认行为；当前没有单独的 `--install` flag：

```bash
npm run workstation:install-skill -- /path/to/new-project
```

安装器只复制：

```text
.codex/skills/workstation/SKILL.md
.codex/skills/workstation/examples.md
scripts/workstation.mjs
```

安装器不会复制：

- `.env.local`
- `WORKSTATION_API_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- Storage credentials
- shell profile settings
- migrations
- RLS files
- Storage policy files
- uploaded files
- personal-workstation app source unrelated to the standalone client

安装器不会自动修改目标项目 `package.json`。

## Step 3: Add The CLI Script

在新项目 `package.json` 中手动添加：

```json
{
  "scripts": {
    "workstation": "node scripts/workstation.mjs"
  }
}
```

如果 `package.json` 已有其他 scripts，只添加 `workstation` 这一项即可。

安装器会检查并提示 `scripts.workstation` 是否存在，但不会自动写入。

## Step 4: Configure Local Environment

只在本地 shell、本机 secret manager、或项目外的安全本地配置中设置：

```bash
export WORKSTATION_API_URL="https://personal-workstation.vercel.app"
export WORKSTATION_API_TOKEN="your-local-token"
```

安全规则：

- 不要把真实 token 写入仓库。
- 不要提交 `.env.local`。
- 不要把 token 写入 `SKILL.md`、`examples.md`、README、PR、issue、日志或聊天。
- 不要把 `SUPABASE_SERVICE_ROLE_KEY` 带到新项目。
- 不要通过 CLI flag 传 token，避免进入 shell history。
- 新项目 CLI 只持有 Workstation token；Supabase service role key 只属于 personal-workstation server-side 环境。

## Step 5: Verify The Connection

进入新项目目录：

```bash
cd /path/to/new-project
```

运行：

```bash
npm run workstation -- health
npm run workstation -- project list --limit 5
npm run workstation -- collection list --limit 5
```

预期：

- `health` 返回 auth、capabilities 和 dataAccess diagnostics。
- `project list` 返回安全 Project metadata。
- `collection list` 返回安全 document collection metadata 和完整 id。

如果当前 shell 没有配置 `WORKSTATION_API_TOKEN`，`health` 应该 fail closed，并提示缺少本地环境变量。

## Minimal Integration Principles

- 不修改业务代码即可接入 Workstation。
- Skill Pack 只是 Codex 使用入口说明，不是全局系统安装。
- CLI 是唯一执行通道。
- CLI 只调用 Workstation API，不直连 Supabase。
- 所有资产仍写入 personal-workstation。
- 新项目不存储 Workstation 数据副本。
- 新项目不保存 service role key。
- 新项目不保存真实 Workstation token。
- 新项目不读取 Documents 正文或 Storage object。
- 新项目不新增 delete / public publish / visibility manage 能力。

## Troubleshooting

### Missing WORKSTATION_API_TOKEN

症状：

```text
Missing WORKSTATION_API_TOKEN. Set it in your local environment before using the Workstation CLI.
```

处理：

- 不要让用户把 token 发给 Codex。
- 不要把 token 写入仓库。
- 不要读取或展示 `.env.local`。
- 让用户在本地 shell、secret manager 或已有本地 wrapper 中配置 `WORKSTATION_API_TOKEN`。
- 配置后重新运行 `npm run workstation -- health`。

### Personal Workstation Skill Does Not Show In Slash Menu

症状：

```text
Codex / 菜单不显示 Personal Workstation
```

说明：

- 这通常是 Codex 产品环境、当前项目加载目录、分支、reload 状态或 UI 行为导致。
- Skill Pack 安装成功不保证 slash menu 立即显示。
- 这不是 Workstation API 或 installer 后端能力问题。

排查：

1. 确认 Codex 打开的就是目标项目目录。
2. 确认目标项目存在 `.codex/skills/workstation/SKILL.md`。
3. 确认 `SKILL.md` frontmatter `name` 是 `Personal Workstation`。
4. 重启或重新加载 Codex 项目。
5. 用自然语言触发：`用 Personal Workstation 帮我查一下项目列表`。
6. 如果 slash menu 不显示，但 Codex 能读取 Skill 并运行 `npm run workstation -- health`，该项目仍可视为已接入。

### Install Fails Or Looks Incomplete

先检查：

```bash
npm run workstation:install-skill -- /path/to/new-project --check
```

再预览：

```bash
npm run workstation:install-skill -- /path/to/new-project --dry-run
```

常见情况：

- target path missing：目标目录不存在，先创建目录。
- target path is not a directory：路径不是目录，换成项目根目录。
- Skill Pack files already exist：默认拒绝覆盖，确认后再使用 `--force`。
- `package.json scripts.workstation` missing：手动添加 `"workstation": "node scripts/workstation.mjs"`。

不要为排查安装问题复制 token、写 `.env.local`、写 shell profile、修改 Storage policy、修改 RLS 或直连 Supabase。

## Bootstrap Checklist

完成接入前确认：

- [ ] 新项目目录存在。
- [ ] `npm run workstation:install-skill -- /path/to/new-project --check` 已检查。
- [ ] `npm run workstation:install-skill -- /path/to/new-project --dry-run` 已预览。
- [ ] Skill Pack 文件已安装。
- [ ] `package.json` 已手动添加 `scripts.workstation`。
- [ ] 本地 shell 已配置 `WORKSTATION_API_URL` 和 `WORKSTATION_API_TOKEN`。
- [ ] `npm run workstation -- health` 通过。
- [ ] `npm run workstation -- project list --limit 5` 通过。
- [ ] `npm run workstation -- collection list --limit 5` 通过。
- [ ] 没有把 `.env.local`、token 或 service role key 写入新项目。

## Never Do During Bootstrap

不要：

- 新增 Workstation API route。
- 新增 Workstation CLI command。
- 新增 migration。
- 修改 RLS。
- 修改 Storage policy。
- 修改 bucket visibility。
- 修改 public download route。
- 自动创建 collection。
- 批量上传或目录上传。
- 删除文件或资产。
- 公开发布或修改 visibility。
- 读取 Documents 正文。
- 读取 Storage object。
- 做 OCR、vector indexing 或 AI summary。
- 新增 MCP / Agent CEO / Notion / Feishu / Gmail 集成。
- 发布 npm 包。
- 自动写 `.env.local`。
- 自动修改业务代码。
