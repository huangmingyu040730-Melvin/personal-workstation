# Workflows

## Local Development

日期：2026-05-31

类型：workflow

用途：

- 本地运行、检查和构建个人数字工作站前端。

步骤：

1. 安装依赖：

```bash
npm install
```

2. 启动本地开发服务器：

```bash
npm run dev
```

3. 访问：

```text
http://localhost:3000
```

4. 修改完成后运行：

```bash
npm run lint
npm run build
```

验证要求：

- 每轮代码修改后运行 lint 和 build。
- 如涉及视觉布局，至少打开首页和对应工作台页面确认可渲染。

## Mock Data Update

日期：2026-05-31

类型：workflow

用途：

- 更新第一阶段页面展示内容。

步骤：

1. 在 `src/lib/types.ts` 中确认或补充类型。
2. 在 `src/lib/mock-data.ts` 中更新示例数据。
3. 页面组件从 mock data 引用数据，不在页面中散落大量示例内容。
4. 保留 `visibility` 字段，值为 `public`、`private` 或 `unlisted`。

验证要求：

- 更新后运行 `npm run lint` 和 `npm run build`。

## Supabase Foundation Update

日期：2026-06-01

类型：workflow

用途：

- 维护 Phase 2A 的 Supabase Auth、RLS 和 schema 基础。

步骤：

1. 前端运行时只使用 publishable key，不引入 `service_role`。
2. 环境变量只提交 `.env.example` 占位，不提交 `.env.local`。
3. 数据库结构变更放入 `supabase/migrations/`。
4. 后台权限通过 Supabase Auth、`admin_users` 和 `public.is_admin()` 控制。
5. 页面数据接入真实 CRUD 前，保留 `src/lib/mock-data.ts` 作为展示来源。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 检查没有 `.env`、密钥、`node_modules` 或 `.next` 被加入提交。

## Core Content CRUD Update

日期：2026-06-03

类型：workflow

用途：

- 维护 Projects、Knowledge Base、Skills Library 的真实 Supabase CRUD。

步骤：

1. 查询逻辑放在 `src/lib/queries/`。
2. 表单校验放在 `src/lib/validations/`，使用 Zod 和中文错误提示。
3. 写入、更新、删除放在 `src/actions/`，使用 Server Actions。
4. 每个 Server Action 必须创建 Supabase server client、验证登录、验证 `public.is_admin()`，再执行写入。
5. mutation 后使用 `revalidatePath()` 刷新相关列表、详情、Dashboard 和公开首页。
6. 核心操作写入 `activity_logs`，只记录标题、slug、版本等后台摘要，不记录密码、密钥或完整敏感正文。
7. Markdown 详情页使用安全文本渲染，不使用未经清理的原始 HTML。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 无密码验证公开首页可访问、后台路由未登录跳 `/login`。
- 管理员 CRUD 验证需要用户本人输入账号密码完成。

## Publications And Documents Storage Update

日期：2026-06-03

类型：workflow

用途：

- 维护 Publications 真实 CRUD、Documents 文件中心与 Supabase Storage 私密文件能力。

步骤：

1. 查询逻辑放在 `src/lib/queries/publications.ts` 和 `src/lib/queries/documents.ts`。
2. 表单校验放在 `src/lib/validations/publication.ts` 和 `src/lib/validations/document.ts`。
3. 写入、更新、删除、上传放在 `src/actions/`，每个 Server Action 都必须验证登录与管理员权限。
4. 文件类型、大小、文件名清理、Storage path 和 signed URL 配置集中在 `src/lib/storage/documents.ts`。
5. Storage 变更必须新增 migration，不修改已在生产执行过的 0001/0002。
6. 本轮使用 private bucket `workspace-files`，不创建 public bucket。
7. 文件上传使用两阶段流程：Server Action 准备 metadata 和路径，浏览器直接上传到 Supabase Storage，Server Action 最终确认并写入数据库。
8. 文件上传必须使用服务端生成路径和 `upsert: false`，失败时尽力清理已上传对象或异常记录。
9. 文件下载只为管理员生成 60 秒 signed URL，不保存 signed URL，不输出到公开页面。
10. Publication 删除前检查关联 documents；存在附件时阻止删除。
11. Activity Logs 只记录后台摘要，不记录文件内容、signed URL、完整 Storage 路径、密码、密钥或 Auth UUID。

验证要求：

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 检查 0003 migration 只包含 private bucket 和最小 Storage policies。
- 检查公开首页不展示 private/unlisted Publications，也不展示任何附件下载入口。
- PR 合并并执行生产 0003 前，不对生产 Supabase 做 Storage 写入测试。
- 管理员真实上传、下载、关联和删除验收需要用户本人登录完成。
