# Workstation CLI Usage

日期：2026-06-20

## Status

v1.2.1 新增本地 Workstation CLI MVP，入口为：

```bash
npm run workstation -- <command>
```

CLI 是薄层：只解析命令、读取本地环境变量、调用 Workstation Admin API 并展示结果。它不直接连接 Supabase，不读取或保存 Supabase service role key，不读取 Documents 正文，不读取 Storage object，不生成 signed URL。

## Environment

生产 API 默认地址：

```bash
export WORKSTATION_API_URL="https://personal-workstation.vercel.app"
```

如果不设置 `WORKSTATION_API_URL`，CLI 会使用上面的默认值。本地测试可改为：

```bash
export WORKSTATION_API_URL="http://localhost:3000"
```

token 必须从本地环境变量读取：

```bash
export WORKSTATION_API_TOKEN="your-local-workstation-token"
```

不要把真实 token 写进仓库、GitHub issue / PR、聊天窗口、日志或命令参数。CLI 不支持 `--token`，避免 token 进入 shell history。

## Health

```bash
npm run workstation -- health
npm run workstation -- health --json
```

成功时会显示 API 版本和 capability，例如 `read_assets, create_assets`。

## Project

查询：

```bash
npm run workstation -- project list
npm run workstation -- project list --q "factor" --visibility private --limit 10
npm run workstation -- project list --json
```

创建 private Project：

```bash
npm run workstation -- project create \
  --title "因子投资学习计划" \
  --slug "factor-investing-learning-plan" \
  --summary "围绕因子投资方法论、机器学习工具和量化研究流程的长期学习项目" \
  --status "in_progress" \
  --tags "factor,quant,learning"
```

CLI 不发送 public / unlisted visibility。传入 `--visibility public` 或 `--visibility unlisted` 会在本地被拒绝。

## Knowledge

查询：

```bash
npm run workstation -- knowledge list
npm run workstation -- knowledge list --q "多因子" --category "因子投资" --limit 10
```

创建 private Knowledge：

```bash
npm run workstation -- knowledge create \
  --title "多因子模型的核心逻辑" \
  --slug "multi-factor-model-core-logic" \
  --category "因子投资" \
  --excerpt "解释多因子模型如何通过多个风险因子刻画股票截面收益差异" \
  --content-file "./note.md" \
  --tags "factor,model,quant"
```

`--content` 和 `--content-file` 二选一；同时传入会报错。`--content-file` 只读取本地文本文件，不读取 Documents 或 Storage。

## Skill

查询：

```bash
npm run workstation -- skill list
npm run workstation -- skill list --category "workflow" --platform codex
```

创建 private Skill：

```bash
npm run workstation -- skill create \
  --name "Codex PR 审查流程" \
  --slug "codex-pr-review-workflow" \
  --description "用于审查 Codex 开发 PR 的固定流程" \
  --category "workflow" \
  --platforms "codex,github" \
  --usage-file "./skill-usage.md"
```

未传 `--platforms` 时默认使用 `codex`。`--usage` 和 `--usage-file` 二选一；CLI 不上传 Skill package，不执行、不解析、不安装 Skill。

## Collections

查询文档包 metadata：

```bash
npm run workstation -- collection list
npm run workstation -- collection list --q "resume" --related-type project --related-id "project-id"
npm run workstation -- collection list --json
```

Collection list 只展示 metadata，不返回 Storage path、signed URL，不读取 Documents 正文，也不上传文件。

## Common Errors

`Missing WORKSTATION_API_TOKEN`

本地没有设置 token。先在当前 shell 设置 `WORKSTATION_API_TOKEN`，不要把 token 作为命令参数传入。

`UNAUTHORIZED`

token 缺失、错误，或服务端 `WORKSTATION_API_TOKEN` 与本地 token 不一致。不要在日志里打印 token；只检查本地环境和部署环境是否配置了同一枚 token。

`Unable to connect to Workstation API`

CLI 无法连接 API。检查 `WORKSTATION_API_URL`，或在本地启动 `npm run dev` 后使用 `WORKSTATION_API_URL=http://localhost:3000` 测试。

`VALIDATION_ERROR`

输入字段不满足 Admin API schema，例如缺少标题、slug 不合法、tags 格式不符合预期，或尝试传入 public / unlisted visibility。

## Boundaries

v1.2.1 CLI 明确不支持：

- document upload。
- upload-intent / finalize。
- delete。
- update。
- public publish。
- visibility manage。
- token 管理页面。
- operation logs 落库。
- migration。
- RLS / Storage policy / bucket visibility 改动。
- public download route 改动。
- Documents 正文读取。
- Storage object 读取。
- signed URL 生成。
- Supabase 直连或 service role key。
- MCP server、Agent CEO、Notion / 飞书 / Gmail 集成。
