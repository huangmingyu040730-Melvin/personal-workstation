# Decisions

## 2026-05-31 - Initialize File-Based Memory Engineering

类型：decision

决策：

- 为新项目创建最小 Memory Engineering 文件体系：
  - `AGENTS.md`
  - `docs/memory.md`
  - `docs/decisions.md`

原因：

- 用户明确要求初始化 Memory Engineering。
- 当前项目还是空 Git 仓库，尚无技术栈和代码结构。
- 文件化最小方案可以先提供稳定接续入口，避免未来会话依赖长聊天记录。

影响：

- 后续 Agent 开始项目任务前应先读取 `AGENTS.md`、`docs/memory.md` 和本文件。
- 关键状态进入 `docs/memory.md`。
- 关键决策进入本文件。
- 稳定协作规则进入 `AGENTS.md`。

来源：

- 用户请求：初始化 Memory Engineering，并创建 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`。
- SOP 来源：`/Users/zhanglaoshiliaojiaoyu/Documents/Codex/2026-05-25/memory-engineering/docs/memory-engineering-sop.md`

替代或废弃：

- 无。

## 2026-05-31 - Keep Tech Stack Explicitly Undetermined

类型：decision

决策：

- 暂不指定技术栈、启动命令、测试命令或构建命令。
- 在文档中把这些内容标记为“待确定”。

原因：

- 当前项目目录没有源代码、依赖清单、README、构建文件或运行脚本。
- 编造技术栈会污染长期记忆，并影响后续接续判断。

影响：

- 后续实现阶段必须先根据实际文件或用户确认更新技术栈。
- 与技术栈相关的记忆在使用前都要重新验证。

来源：

- 当前项目文件检查。

替代或废弃：

- 已被 2026-05-31 的 Next.js 前端原型技术栈决策替代。

## 2026-05-31 - Use Chinese As Default Collaboration Language

类型：decision

决策：

- 本项目协作默认使用中文。

原因：

- 用户本轮请求使用中文。
- 项目文件名和上下文也使用中文。

影响：

- 后续文档、交接说明和普通回复默认中文。
- 代码、命令、错误信息、库名和外部接口按实际语言保留。

来源：

- 用户本轮请求。

替代或废弃：

- 如用户后续明确要求改用英文或双语，再记录新的替代决策。

## 2026-05-31 - Build Phase 1 With Mock Data First

类型：decision

决策：

- 第一阶段实现本地可运行的 Next.js 前端原型。
- 使用 App Router、TypeScript、Tailwind CSS 和 Lucide React。
- 示例内容集中放在 `src/lib/mock-data.ts`，类型放在 `src/lib/types.ts`。
- 所有核心实体预留 `visibility` 字段。
- 本阶段不接入 Supabase、真实登录、真实文件上传或外部 API。

原因：

- 用户要求第一阶段先完成视觉完整、主要页面可浏览的网站前端原型。
- mock data first 可以先稳定信息架构和组件结构，方便第二阶段接入真实数据。

影响：

- 页面应优先组合复用组件。
- 新增示例内容时优先更新 `src/lib/mock-data.ts`。
- 未来接入 Supabase 时应保持页面组件和数据访问层分离。

来源：

- 用户本轮开发需求。
- 当前代码实现。

替代或废弃：

- 替代“技术栈未确定”的早期初始化记录。
