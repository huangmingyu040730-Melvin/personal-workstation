# Project Memory

## Current State

日期：2026-05-31

第一阶段前端 MVP 已实现，代码已进入 PR #1。

已实现内容：

- 公开首页 `/`
- 工作台 `/dashboard`
- 研究项目 `/projects`
- 学术成果 `/publications`
- 知识库 `/knowledge`
- Skill 库 `/skills`
- 日历 `/calendar`
- 文件中心 `/documents`
- 个人信息 `/profile`
- 设置 `/settings`
- 自动化占位页 `/automations`

当前技术栈：

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React

当前数据状态：

- 页面仍使用结构化 mock data。
- mock data 集中在 `src/lib/mock-data.ts`。
- 类型定义集中在 `src/lib/types.ts`。
- 核心实体保留 `visibility` 字段，取值为 `public`、`private` 或 `unlisted`。

尚未接入：

- 真实登录
- Supabase 数据库
- 文件上传
- 文件存储
- 外部 API
- Skill 自动化执行

## Important Context

- 网站默认语言为中文。
- 项目风格参考 `docs/mockups/dashboard-reference.png`。
- 视觉方向为浅色背景、深蓝侧边栏、卡片化工作区、蓝紫强调色、专业克制的研究与 AI 工作台气质。
- 当前阶段重点是前端信息架构、页面浏览体验和组件结构。

## Recent Decisions

- 第一阶段采用 mock data first 的前端原型。
- 示例数据集中管理，避免散落在页面组件中。
- 保留 Supabase 接入空间，但不在第一阶段配置真实数据库。
- PR #1 用于合并第一阶段前端 MVP。

## Known Issues

- 当前所有数据均为 mock data，不具备真实持久化能力。
- 文件中心只有列表和上传按钮样式，不支持真实上传。
- 日历为静态月历，不支持新增、编辑或提醒。
- 个人信息页面只有前端编辑样式，不保存修改。

## Next Steps

- 第二阶段接入 Supabase Auth。
- 设计并创建项目、成果、笔记、Skill、文件和个人资料的数据表。
- 接入 Supabase Storage 用于文件上传和资料归档。
- 建立 `public`、`private`、`unlisted` 对应的权限模型。
- 为 Skill 增加运行日志、版本记录、平台链接和自动化状态。

## Stale Or Superseded Notes

- 无。
