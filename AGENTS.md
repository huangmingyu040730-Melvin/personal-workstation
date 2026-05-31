# AGENTS.md

## Project

项目名称：个人工作站开发

项目目标：

- 建立一个可长期接续的个人工作站开发项目。
- 将项目目标、技术栈、协作规则、决策和阶段状态沉淀到项目内文档。
- 让后续 Codex 会话可以先读取项目记忆，再继续开发或整理工作。

当前状态：

- 状态：新项目初始化。
- 来源：用户在 2026-05-31 明确要求初始化 Memory Engineering。
- 验证要求：后续实际技术栈、目录结构、运行命令和产品目标应以项目文件为准重新验证。

## Tech Stack

技术栈：

已验证事实：

- 项目目录：`/Users/zhanglaoshiliaojiaoyu/Documents/个人工作站开发`
- 当前是 Git 仓库，尚无首次提交。
- 网站默认语言为中文。
- 使用 Next.js App Router、TypeScript、Tailwind CSS 和 Lucide React。

待补充内容：

- 数据存储、桌面端、后端、前端或自动化工具边界。

## Commands

启动：

```bash
npm run dev
```

检查：

```bash
npm run lint
```

构建：

```bash
npm run build
```

常用检查：

```bash
git status --short --branch
```

## Working Rules

- 开始新任务前，先读取本文件，再读取 `docs/memory.md` 和 `docs/decisions.md`。
- 修改前先理解现有结构，优先遵循项目已有模式。
- 不要改动无关文件，不要回滚用户或其他工具产生的未说明改动。
- 组件需要可复用，页面优先组合基础组件，不在页面中堆重复样式。
- 示例数据集中管理，不要把大量 mock data 散落在组件中。
- 预留未来 Supabase 接入位置，但本阶段不要因为数据库配置阻塞页面开发。
- 对可能影响用户数据、配置、权限、外部服务或系统状态的变更，先说明风险并验证当前状态。
- 技术栈、命令和运行状态属于容易变化的信息，使用前必须重新验证。
- 对未知信息保持显式标记，不把推测写成已验证事实。
- 输出以中文为主，除非代码、命令、错误信息或用户要求需要英文。
- 不提交敏感信息、真实密钥或环境变量。
- 每轮代码修改完成后运行 lint 和 build，并修复发现的问题。

## Memory Rules

- 用户明确要求“memory engineering”“长期记忆”“更新记忆”“沉淀记忆”等时，执行完整 Memory Engineering SOP。
- SOP 来源：`/Users/zhanglaoshiliaojiaoyu/Documents/Codex/2026-05-25/memory-engineering/docs/memory-engineering-sop.md`
- 项目阶段状态和交接信息写入 `docs/memory.md`。
- 关键决策、原因、日期、影响和替代关系写入 `docs/decisions.md`。
- 稳定协作规则、项目约束和启动前必读规则写入本文件。
- 未来如出现可重复操作步骤，创建或更新 `docs/workflows.md`。
- 过时或被替代的记忆必须标记为 stale 或 superseded，不要静默覆盖重要历史。
- 不保存密码、API key、token、SMTP 授权码、私钥、私人通信原文或其他敏感数据。
- 明确区分已验证事实、用户偏好、项目决策、工作流、失败经验和未验证信息。

## Continuation

新对话接续本项目时，推荐这样说：

```text
继续 /Users/zhanglaoshiliaojiaoyu/Documents/个人工作站开发 项目。
请先读取 AGENTS.md、docs/memory.md 和 docs/decisions.md。
当前目标是：<写下本轮任务>。
```

接续时 Agent 应：

- 先确认当前工作目录和 Git 状态。
- 读取项目记忆和决策。
- 验证与本轮任务相关的文件和命令是否仍然存在。
- 只加载当前任务需要的上下文，避免把 docs 当成聊天记录垃圾桶。
