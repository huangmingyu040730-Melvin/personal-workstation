# Viewer Restricted Access 访问流程

日期：2026-06-15

## 目标

Phase 2I / Hotfix 将访问申请、手动授权和 viewer magic link 串成 restricted 内容只读访问闭环。

目标不是开放新内容库，而是让管理员创建 Access Grant 后，指定邮箱可以通过 viewer 登录访问被授权的单条 restricted 内容。

## Access Request 与 Access Grant

Access Request 是访客提交的申请记录：

- 记录申请人、邮箱、申请目标、来源页面和理由。
- 状态为 `pending`、`approved` 或 `rejected`。
- approved 只代表人工处理结果，不代表已授权。
- 不自动创建 Access Grant。
- 不发送邮件。
- 不开放 Documents、附件或 signed URL。

Access Grant 是真实授权记录：

- 绑定一个邮箱。
- 绑定一个内容类型：Project、Publication、Knowledge 或 Skill。
- 绑定一条具体 restricted 内容 id。
- 状态为 `active` 或 `revoked`，可选过期时间。
- 由管理员在后台手动创建和撤销。

## 管理员如何创建 Access Grant

1. 确认目标 Project / Publication / Knowledge / Skill 的 `visibility = restricted`。
2. 进入 `/dashboard/access-grants/new`。
3. 输入被授权邮箱。
4. 选择内容类型。
5. 手动选择具体 restricted 内容。
6. 可选设置过期时间和内部备注。
7. 保存授权。

如果从 approved Access Request 跳转创建页，系统只预填邮箱、申请 id 和内容类型作为人工上下文。管理员仍必须手动选择具体 restricted 内容。

## 访客如何登录访问

支持路径：

```text
/viewer/login?next=/projects/[slug]
/viewer/login?next=/publications/[slug]
/viewer/login?next=/knowledge/[slug]
/viewer/login?next=/skills/[slug]
```

流程：

1. 访客打开 restricted 内容页。
2. 未登录或未授权时，页面显示安全 fallback，不展示正文，也不确认内容是否真实存在。
3. 访客点击“已获授权，邮箱登录”或直接打开 `/viewer/login?next=...`。
4. 输入被授权邮箱。
5. Server Action 调用 `can_request_viewer_login(email)`，确认该邮箱存在 active 且未过期的 Access Grant。
6. 通过 Supabase `signInWithOtp` 发送 magic link。
7. magic link 回到 `/viewer/callback?next=...`。
8. callback 使用 Supabase `exchangeCodeForSession` 写入 session cookie。
9. callback 验证 session user 后跳回 `next` 指向的公开内容路径。
10. 内容页通过当前 viewer session 和 Supabase RLS 读取 viewable 内容。

`next` 只允许 `/`、`/projects`、`/publications`、`/knowledge`、`/skills` 及其子路径。外部 URL、`/dashboard`、`/api`、`/documents`、`/public-files` 等路径会回退到 `/`。

## 四类 restricted 内容读取

公开详情页现在使用 viewable 查询：

- `/projects/[slug]` 使用 `getViewableProjectBySlug`。
- `/publications/[slug]` 使用 `getViewablePublicationBySlug`。
- `/knowledge/[slug]` 使用 `getViewableKnowledgeNoteBySlug`。
- `/skills/[slug]` 使用 `getViewableSkillBySlug`。

这些查询只请求 `visibility in ('public', 'restricted')`，真正能否读到 restricted row 由 Supabase RLS 和 `has_content_access()` 决定：

- 普通未登录访客只能读 public。
- 已登录 viewer 只能读自己邮箱被授权的具体 restricted 内容。
- 未授权 viewer 仍读不到 restricted。
- 管理员后台权限仍由 `public.is_admin()` 和 dashboard 保护控制。

## Viewer 能看到什么

被授权 viewer 可以看到：

- 被授权的单条 restricted Project 正文字段。
- 被授权的单条 restricted Publication 正文字段。
- 被授权的单条 restricted Knowledge 正文字段。
- 被授权的单条 restricted Skill 说明字段。
- 与页面相关的 public related content。

## Viewer 不能看到什么

即便有 Access Grant，viewer 仍不能访问：

- Dashboard。
- Access Requests 列表或详情。
- Access Grants 列表或详情。
- Documents。
- private attachments。
- zip 下载。
- Storage path。
- Storage bucket。
- signed URL。
- raw `document_asset_links`。
- `research_asset_links` 管理数据。
- private / unlisted / 未授权 restricted 内容。

Knowledge / Skill 公开或 restricted 详情页仍不展示 Documents。Skill package 仍不展示、不下载、不执行、不安装、不解析。

## Documents 与 public attachments 边界

Access Grant 只开放 restricted 正文，不开放 Documents。

Project / Publication 的公开附件仍必须满足原有 public attachment 规则：

- 文件 `documents.visibility = public`。
- 文件属于 private `workspace-files` bucket。
- 当前资产为 public。
- 文件关联当前 public 资产。
- 下载必须走 `/public-files/[id]/download`。
- 下载 route 服务端重新校验后才按需生成短时 signed URL。

如果资产本身是 restricted，即使 viewer 已授权，也不会因为 Access Grant 自动展示 Documents 或 private attachments。

## 访问申请提交修复

`/access-request` 公开提交仍只写入 `access_requests`，并强制：

- `status = pending`
- `admin_note = null`
- `reviewed_at = null`

为避免生产环境 anon insert policy / grant 漂移导致访客提交失败，Server Action 会优先使用服务端 `SUPABASE_SERVICE_ROLE_KEY` 写入经过 schema 校验的字段；如果该环境变量不存在，则回退到原有 anon client 和 RLS policy。

service role 只在服务端使用，不进入客户端、不写入页面、不记录 secret。提交失败日志只记录 `mode`、`error.code` 和 `error.message`。

## 已知限制状态

本阶段修复了代码层面的主要断点：

- 公开详情页从 public-only 查询切换到 RLS 保护的 viewable 查询。
- viewer callback 成功后验证 session user，再跳回安全 next。
- viewer login 始终生成 `/viewer/callback` redirect URL。
- `/access-request` 可通过服务端安全写入绕过生产 anon grant 漂移。

仍需要在 Vercel Preview 或生产环境用真实测试邮箱完成 magic link 端到端验收，因为本地自动测试无法收取和点击 Supabase 发送的邮件。

## 手动验收步骤

### Access Request 提交

1. 打开 `/access-request`。
2. 匿名提交一条申请。
3. 确认页面显示提交成功。
4. 登录 `/dashboard/access-requests`。
5. 确认后台能看到这条 `pending` 申请。
6. 如果失败，检查 Vercel log 中 `submitAccessRequestAction failed` 的 `mode`、`code` 和 `message`。

### Viewer Restricted Access

1. 创建或选择一个 `visibility = restricted` 的 Project。
2. 为测试邮箱创建 Access Grant。
3. 退出管理员或使用无痕窗口。
4. 打开 `/projects/[restricted-slug]`。
5. 确认未登录时显示安全 fallback，不展示正文。
6. 打开 `/viewer/login?next=/projects/[restricted-slug]`。
7. 输入被授权邮箱。
8. 点击收到的 magic link。
9. 确认 callback 后跳回 `/projects/[restricted-slug]`。
10. 确认可查看 restricted 正文。
11. 换未授权邮箱，确认仍看不到。
12. 撤销 Access Grant 后再次访问，确认权限失效。
13. 确认 viewer 不能访问 `/dashboard`。
14. 确认 viewer 不能访问 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL。

四类内容至少各验收一条：

- restricted Project
- restricted Publication
- restricted Knowledge
- restricted Skill

如某类没有测试内容，先在后台创建一条最小 restricted 记录，再创建对应 Access Grant。
