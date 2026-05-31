# Project Memory

## Current State

日期：2026-06-01

第一阶段前端 MVP 与 Hotfix 已合并到 `main`。当前 Phase 2A 正在建立 Supabase Auth、数据库 schema 与 RLS 权限基础。

已实现页面：

- 公开首页 `/`
- 登录页 `/login`
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
- Supabase SSR/Auth/RLS 基础设施

当前数据状态：

- 页面仍使用结构化 mock data。
- mock data 集中在 `src/lib/mock-data.ts`。
- 类型定义集中在 `src/lib/types.ts`。
- 核心实体保留 `visibility` 字段，取值为 `public`、`private` 或 `unlisted`。
- 公开首页只展示 `visibility = "public"` 的公开内容。

尚未接入：

- 真实 CRUD
- Supabase Storage 文件上传
- 登录后的真实数据读写
- 外部 API
- Skill 自动化执行

## Important Context

- 网站默认语言为中文。
- 项目风格参考 `docs/mockups/dashboard-reference.png`。
- 视觉方向为浅色背景、深蓝侧边栏、卡片化工作区、蓝紫强调色、专业克制的研究与 AI 工作台气质。
- Supabase 未配置时，后台页面保持 mock/development preview，确保本地 lint/build 不因缺少环境变量阻塞。
- Supabase 配置后，后台页面应通过 Auth 登录和 `admin_users` 管理员白名单保护。

## Recent Decisions

- 第一阶段采用 mock data first 的 Next.js 前端原型。
- Hotfix 修复了公开首页 private Skill 暴露风险和日历不存在日期问题。
- Phase 2A 只建立 Supabase Auth、数据库 schema、RLS 与文档基础，不做真实 CRUD 或上传。
- 管理员权限由 `public.admin_users` 与 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。

## Known Issues

- 当前所有页面数据仍为 mock data，不具备真实持久化能力。
- 文件中心只有列表和上传按钮样式，不支持真实上传。
- 日历为静态月历，不支持新增、编辑或提醒。
- 个人信息页面只有前端编辑样式，不保存修改。
- 真实登录端到端验证需要用户配置 Supabase 项目、环境变量、迁移和管理员账号。

## Next Steps

- 在 Supabase Dashboard 配置 Auth、运行迁移并插入管理员 UUID。
- 第二阶段后续接入 Supabase Auth 用户资料读取。
- Phase 2B 开始将 projects、publications、knowledge_notes、skills 等模块逐步切换到真实 CRUD。
- 接入 Supabase Storage，用于文件上传、成果附件、Skill 附件和头像。
- 完善 `public`、`private`、`unlisted` 对应的权限模型和前端提示。
- 为 Skill 增加运行日志、版本记录、平台链接和自动化状态。

## Stale Or Superseded Notes

- “第一阶段尚未接入 Supabase”已被 Phase 2A 的 Supabase 基础设施取代，但页面数据仍未切换到真实数据库。
