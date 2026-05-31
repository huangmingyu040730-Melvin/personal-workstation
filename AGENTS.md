# AGENTS.md

## Project

项目名称：黄铭语个人数字工作站 / Mingyu Personal Workstation

项目定位：

- 面向个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理的网站。
- 网站默认语言为中文。
- 第一阶段是本地可运行的前端 MVP，后续逐步接入真实数据和权限系统。

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React

## Commands

启动开发服务器：

```bash
npm run dev
```

代码检查：

```bash
npm run lint
```

生产构建：

```bash
npm run build
```

## Working Rules

- 保持组件可复用，页面优先组合基础组件，不在页面中堆重复样式。
- 示例数据集中维护在 `src/lib/mock-data.ts`，类型集中维护在 `src/lib/types.ts`。
- 后续预留 Supabase 接入，但当前阶段不要因为数据库配置阻塞页面开发。
- 不提交密钥、`.env`、API token、私钥或任何敏感文件。
- 保留 `.gitignore` 对 `.env`、`node_modules`、`.next`、`dist`、`out` 等文件的忽略规则。
- 每轮代码修改后运行 `npm run lint` 和 `npm run build`，并修复发现的问题。
- 修改前先理解现有结构，优先遵循项目已有模式。
- 不要改动无关文件，不要回滚用户或其他工具产生的未说明改动。
