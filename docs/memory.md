# Project Memory

## Current State

日期：2026-05-31

类型：fact

内容：

- 项目 `个人工作站开发` 已完成第一阶段 MVP 前端原型。
- 项目路径为 `/Users/zhanglaoshiliaojiaoyu/Documents/个人工作站开发`。
- 当前目录是 Git 仓库，尚无首次提交。
- 已建立 Next.js App Router、TypeScript、Tailwind CSS、Lucide React 工程。
- 已实现公开首页、工作台、研究项目、学术成果、知识库、Skill 库、日历、文件中心、个人信息、设置和自动化占位页面。
- 示例内容集中在 `src/lib/mock-data.ts`，类型定义在 `src/lib/types.ts`。
- Dashboard 参考图位于 `docs/mockups/dashboard-reference.png`。

来源：

- 用户明确请求开发“黄铭语个人数字工作站”第一阶段 MVP。
- 本轮实现后运行 `npm run lint` 和 `npm run build` 均通过。
- 本轮使用本地浏览器打开 `http://localhost:3000` 和 `/dashboard` 验证页面可渲染。

验证要求：

- 运行状态、依赖安全通告和第三方包版本属于易变信息，后续使用前必须重新验证。
- 当前 `npm audit --omit=dev` 仍报告 Next 内部 PostCSS 相关 moderate advisory；当前 build/lint 可用，后续升级 Next 时应重新评估。

影响范围：

- 后续会话应以本文件作为项目交接入口之一。

## Important Context

### Project Goal

类型：fact

内容：

- 这个项目定位为“黄铭语个人数字工作站”。
- 用于个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理。
- 第一阶段目标是本地可运行、视觉完整、主要页面可浏览的网站前端原型。

来源：

- 用户本轮开发请求。

### Collaboration Rules

类型：preference

内容：

- 使用中文进行项目协作。
- 网站默认语言为中文。
- 优先执行项目已有脚本、文档和规则，而不是凭空重建流程。
- 不把猜测写成事实；未知信息必须标记为待确定。
- 重要变更应更新项目内记忆，而不是只留在聊天上下文中。

来源：

- 用户请求和项目级 Memory Engineering 初始化要求。

### Tech Stack

类型：fact

内容：

- 使用 Next.js App Router、TypeScript、Tailwind CSS、Lucide React。
- 当前脚本：`npm run dev`、`npm run lint`、`npm run build`。
- 本阶段不接入 Supabase、真实登录、真实文件上传或外部 API。

来源：

- 用户本轮开发要求。
- 当前 `package.json`。

### Memory System

类型：workflow

内容：

- 本项目使用文件化记忆：`AGENTS.md + docs/memory.md + docs/decisions.md + docs/workflows.md`。
- 阶段状态写入 `docs/memory.md`。
- 关键决策写入 `docs/decisions.md`。
- 可重复操作流程写入 `docs/workflows.md`。
- 如果后续接入 MCP Memory 或向量数据库，应在本文件记录接入方式、范围和验证要求。

来源：

- Memory Engineering SOP。

### Mockup Assets

类型：workflow

内容：

- Dashboard 参考图的规范目标路径是 `docs/mockups/dashboard-reference.png`。
- 图片即使暂时位于仓库根目录也可以接受；后续可让 Codex 移动到规范路径。

来源：

- 用户在 2026-05-31 明确说明。

## Recent Decisions

- 2026-05-31：采用项目文件化 Memory Engineering 最小方案作为起点。
- 2026-05-31：后续接续入口固定为先读 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`。
- 2026-05-31：Dashboard 参考图最终归档到 `docs/mockups/dashboard-reference.png`，临时放在仓库根目录也可接受。
- 2026-05-31：第一阶段采用 mock data first 的 Next.js 前端原型，不接入 Supabase 或真实外部服务。

详情见 `docs/decisions.md`。

## Known Issues

### npm audit moderate advisory

类型：failure or blocker

内容：

- `npm audit --omit=dev` 报告 Next 内部 PostCSS 相关 moderate advisory。
- 已升级到 Next 16.2.6，lint 和 build 均通过。

验证要求：

- 后续发布或部署前重新运行 audit，并根据 Next 官方可用修复版本升级。

### 真实数据和权限尚未接入

类型：unverified

内容：

- 当前页面使用 mock data，不包含真实登录、数据库、文件上传、Skill 运行或外部 API。

验证要求：

- 第二阶段接入 Supabase 和真实服务时重新设计数据模型、权限和错误处理。

## Next Steps

- 第二阶段接入 Supabase Auth、数据库表、文件存储和权限模型。
- 为项目、成果、笔记、Skill、文件建立 CRUD 和真实编辑保存能力。
- 为 Skill 增加运行日志、版本、平台链接和自动化状态。
- 部署前重新评估依赖 audit、环境变量和权限设置。

## Stale Or Superseded Notes

- 旧记忆“技术栈未确定”已被 2026-05-31 第一阶段 MVP 实现替代；当前技术栈见本文件 Tech Stack 和 `package.json`。
