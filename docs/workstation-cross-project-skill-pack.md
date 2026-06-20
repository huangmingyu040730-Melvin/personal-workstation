# Cross-project Workstation Skill Pack Design

日期：2026-06-21

本文档是 v1.2.15 的设计记录。目标是设计一个未来可复用的 Cross-project Workstation Skill Pack，让其他 Codex 项目可以轻量接入 Personal Workstation，并通过 Workstation API / CLI 把项目、知识笔记、Skill、文档包查询和私密单文件上传写回 personal-workstation。

本轮只做设计，不实现安装器，不创建真实 package 目录，不复制到其他项目，不新增 API / CLI 能力。

## 1. Why The Current Skill Is Repo-level

当前 `.codex/skills/workstation/SKILL.md` 位于 personal-workstation 仓库内：

```text
.codex/skills/workstation/SKILL.md
.codex/skills/workstation/examples.md
```

这意味着：

- Codex 在当前 personal-workstation 项目中可以发现 repo-level Skill。
- 其他项目如果没有同样的 `.codex/skills/workstation/` 文件，就不能依赖这个仓库内 Skill 被自动发现。
- 当前 `npm run workstation -- ...` 入口依赖 personal-workstation 仓库自己的 `package.json` 和 `scripts/workstation.mjs`。
- 其他项目没有本地 `scripts/workstation.mjs`、`package.json` script 或 Skill metadata 时，即使用户语义上说“保存到工作台”，Codex 也可能不知道该调用 Personal Workstation。
- repo-level Skill 不等于全局 Skill；不能承诺 Codex slash menu 在所有项目中都自动显示它。

因此，v1.2.14 已强化当前仓库内 Skill discovery，但它仍然是 repo-level。

## 2. Why Cross-project Skill Pack

用户在其他 Codex 项目中也会遇到需要沉淀资产的场景：

- 把当前项目的学习笔记保存到 Personal Workstation。
- 为某个外部项目创建或更新 Workstation Project。
- 把一段操作流程沉淀为 reusable Skill。
- 查询已有 document collection id。
- 上传一个本地资料文件到已有 document collection。
- 更新项目进度或开始日期。

如果每个项目都手写一份 Skill / CLI wrapper，容易出现：

- Skill 触发语义不一致。
- 安全边界漂移。
- token 被误写进仓库。
- CLI 误直连 Supabase。
- collection id 被猜测。
- public / delete / visibility manage 等高风险能力被顺手加入。

Cross-project Workstation Skill Pack 的目标是把“发现、调用、边界、示例、安装”做成轻量可复制单元，同时仍然只调用 personal-workstation 的 Workstation API。

## 3. Design Goals

- 让其他项目能通过项目内 Skill 发现 Personal Workstation。
- 让目标项目有一个轻量 `npm run workstation -- ...` 入口。
- 复用现有 Workstation API 安全边界。
- 不要求目标项目是 Next.js 项目。
- 不要求目标项目安装 Supabase SDK。
- 不把 service role key 带到目标项目。
- 不把 token 写入 Skill、README、examples、package 或 Git。
- 不自动创建 document collection。
- 不扩大当前 Workstation CLI 能力边界。

Non-goals：

- 不提供全局 Codex slash menu 安装保证。
- 不新增 MCP server。
- 不新增 Agent CEO。
- 不新增 Notion / 飞书 / Gmail 集成。
- 不实现批量上传、目录上传、delete、public publish、visibility manage、OCR、vector indexing 或 AI summary。

## 4. Future Skill Pack Structure

建议未来设计目录如下：

```text
packages/workstation-skill-pack/
  README.md
  .codex/
    skills/
      workstation/
        SKILL.md
        examples.md
  scripts/
    workstation-client.mjs
  install.sh
```

本轮不创建该目录。上述结构仅作为未来实现目标。

### File Responsibilities

`README.md`

- 面向目标项目使用者的接入说明。
- 说明如何安装 Skill Pack、配置本地环境变量、运行 health / list smoke。
- 必须只使用占位符，不写真实 token。
- 必须明确不提交 `.env.local`、不提交 token、不带 service role key。

`.codex/skills/workstation/SKILL.md`

- Codex discovery 和 invocation 说明。
- 包含 `Personal Workstation` metadata、description 关键词、When To Use、Never Do、Standard Invocation Patterns。
- 明确目标项目 CLI 只调用 Workstation API，不直连 Supabase。
- 明确跨项目 Skill Pack 不让 Codex 全局可见；它只让安装了该 Skill Pack 的目标项目更容易发现。

`.codex/skills/workstation/examples.md`

- 常见调用例子。
- 覆盖保存学习笔记、创建项目、更新项目进度、创建 Skill、查询 collection、上传单个文件、处理 permission denied、多个候选停止。
- 不包含真实 token、service role key、Storage path、signed URL 或私密文件内容。

`scripts/workstation-client.mjs`

- 跨项目轻量 CLI client。
- 只读取 `WORKSTATION_API_URL` / `WORKSTATION_API_TOKEN`。
- 只调用 Workstation API。
- 不依赖 Next.js 项目结构。
- 不依赖 Supabase SDK。
- 不读取 service role key。
- 不读取 `.env.local`。
- 不生成 Storage path。
- 不生成 signed URL。
- 不上传目录或批量文件。
- 不公开文件、不删除文件、不修改 visibility。

`install.sh`

- 未来安装脚本。
- 把 Skill Pack 文件复制到目标项目。
- 检查目标项目是否存在。
- 避免覆盖用户已有文件，除非显式 `--force`。
- 不复制 token、`.env.local`、service role key、node_modules、构建产物或 personal-workstation 源码。

## 5. Target Project Shape

安装后的目标项目建议结构：

```text
target-project/
  .codex/
    skills/
      workstation/
        SKILL.md
        examples.md
  scripts/
    workstation.mjs
  package.json
```

目标项目 `package.json` 需要有：

```json
{
  "scripts": {
    "workstation": "node scripts/workstation.mjs"
  }
}
```

这样其他项目中的 Codex 可以运行：

```bash
npm run workstation -- health
npm run workstation -- project list --limit 5
npm run workstation -- collection list --limit 5
```

## 6. Environment And Token Safety

目标项目只需要两个本地环境变量：

```text
WORKSTATION_API_URL
WORKSTATION_API_TOKEN
```

规则：

- `WORKSTATION_API_URL` 可以指向生产 Personal Workstation API。
- `WORKSTATION_API_TOKEN` 只放在本地 shell、本机安全配置或用户已有的 secret manager / keychain wrapper 中。
- 不提交 `.env.local`。
- 不把 token 写进 Skill。
- 不把 token 写进 README。
- 不把 token 写进 examples。
- 不把 token 写进 package scripts。
- 不把 token 写进 command line flag。
- 不把 `SUPABASE_SERVICE_ROLE_KEY` 带到目标项目。
- 目标项目 CLI 只持有 Workstation token，不持有 Supabase key。
- 如果 token 缺失，CLI / Codex 应停止，并提示用户在本地环境配置 `WORKSTATION_API_TOKEN`；不要让用户把 token 粘贴到聊天里。

Production-oriented target setup example should use placeholders only:

```bash
export WORKSTATION_API_URL="https://personal-workstation.vercel.app"
export WORKSTATION_API_TOKEN="<set-this-only-in-your-local-shell>"
npm run workstation -- health
```

上面的 `<set-this-only-in-your-local-shell>` 是占位符，不是可提交配置。

## 7. Copy Matrix

Allowed to copy into a target project:

- `.codex/skills/workstation/SKILL.md`
- `.codex/skills/workstation/examples.md`
- `scripts/workstation.mjs` generated from the standalone client
- optional `README.md` instructions

Do not copy:

- `.env.local`
- `WORKSTATION_API_TOKEN` value
- `SUPABASE_SERVICE_ROLE_KEY` value
- any Supabase anon / service key
- Storage paths
- signed URLs
- local private files
- uploaded document contents
- `node_modules`
- `.next`
- `dist`
- `out`
- Supabase migrations
- RLS or Storage policy files
- personal-workstation app source unrelated to the standalone client

## 8. Future Installer Design

Future command options:

```bash
npm run workstation:install-skill -- --target /path/to/target-project
```

or:

```bash
bash packages/workstation-skill-pack/install.sh /path/to/target-project
```

Installer responsibilities:

1. Check the target path exists.
2. Check the target path is a directory.
3. Create:

   ```text
   .codex/skills/workstation/
   scripts/
   ```

4. Copy `SKILL.md` and `examples.md`.
5. Copy standalone client as `scripts/workstation.mjs`.
6. Detect whether `package.json` exists.
7. If `package.json` exists, either:
   - print an instruction to add `"workstation": "node scripts/workstation.mjs"`, or
   - optionally update it only in a future explicit implementation.
8. If target files already exist, stop unless `--force` is passed.
9. Print post-install verification commands.

Installer must not:

- copy token values
- copy `.env.local`
- copy service role key
- copy Storage credentials
- create or modify Supabase config
- create migrations
- modify RLS
- modify Storage policy
- make any bucket public
- create public links
- run document upload automatically
- run delete/public publish/visibility manage

## 9. Cross-project CLI Client Design

The future `scripts/workstation-client.mjs` should be a standalone client extracted from current CLI behavior.

Required properties:

- Node-only script.
- Uses built-in `fetch`, `fs`, `path`, `FormData` / `Blob` where available.
- Reads only:

  ```text
  WORKSTATION_API_URL
  WORKSTATION_API_TOKEN
  ```

- Calls only Workstation API routes.
- Keeps `npm run workstation -- <command>` interface.
- Supports the same safe command surface as current Workstation CLI:
  - `health`
  - `project list/create/show/update`
  - `knowledge list/create/show/update`
  - `skill list/create/show/update`
  - `collection list/show`
  - `document upload`
- Preserves requestId in errors.
- Preserves safe upload output behavior.
- Does not require target project dependencies beyond a compatible Node runtime.

It must not:

- import Next.js files from personal-workstation
- import Supabase SDK
- read `SUPABASE_SERVICE_ROLE_KEY`
- read `.env.local`
- connect to Supabase directly
- decide final Storage paths
- read Documents body
- read Storage object body
- generate signed URLs
- upload directories
- upload batches
- create collection
- delete assets/files
- public publish
- change visibility

Current `scripts/workstation.mjs` may contain assumptions from the personal-workstation repo layout and package environment. Future implementation should audit it and extract a smaller standalone client rather than copying unnecessary app-specific code.

## 10. Verification Flow In Target Projects

After installing the future Skill Pack into a target project:

```bash
npm run workstation -- health
npm run workstation -- project list --limit 5
npm run workstation -- collection list --limit 5
```

Expected success:

- `health` returns auth ok, capabilities, and dataAccess diagnostics.
- `project list` returns safe Project metadata.
- `collection list` returns safe document collection metadata with full ids.

If token is missing:

- CLI should return `UNAUTHORIZED` or a local token-missing error.
- Codex should tell the user to configure `WORKSTATION_API_TOKEN` in their local environment.
- Codex should not ask the user to paste token values into chat.

If dataAccess is degraded:

- Preserve requestId.
- Treat permission denied as a migration/grant prerequisite.
- Do not request service role key.
- Do not print `.env.local`.

## 11. Expected Cross-project Codex Flow

When working in another project after installing the Skill Pack:

1. User says: “把这段学习笔记保存到工作台。”
2. Codex sees target project `.codex/skills/workstation/SKILL.md`.
3. Codex runs `npm run workstation -- health` if environment is uncertain.
4. Codex searches existing assets with `project list` / `knowledge list`.
5. Codex writes long text to a temporary local file when needed.
6. Codex calls `knowledge create` or `project update`.
7. Codex reports id/title/visibility and requestId on failure.

This still writes to Personal Workstation through Workstation API; it does not make the target project a database owner or Storage operator.

## 12. Current v1.2.15 Boundary

v1.2.15 only designs the Cross-project Workstation Skill Pack.

This PR should not create:

- `packages/workstation-skill-pack/`
- `packages/workstation-skill-pack/install.sh`
- `packages/workstation-skill-pack/scripts/workstation-client.mjs`
- target project files
- npm script `workstation:install-skill`

This PR should not modify:

- Workstation API routes
- current CLI commands
- migrations
- RLS
- Storage policy
- bucket visibility
- public download route
- token handling implementation

Future implementation should be a separate PR with its own verification.
