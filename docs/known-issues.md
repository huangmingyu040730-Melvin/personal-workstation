# Known Issues

## Viewer magic link 登录问题

状态：Phase 2I / Hotfix 已完成代码层面修复，仍需在 Vercel Preview 或生产环境用真实测试邮箱完成 magic link 端到端验收。

当前状态：

- Phase 2E-B restricted 授权基础代码已实现。
- 已实现 `restricted` visibility、`content_access_grants`、`has_content_access()`、后台 Access Grants、viewer login 和 viewer callback。
- 已尝试 PR #19、PR #20 修复，但尚未形成稳定验收结论。
- Phase 2I / Hotfix 修复了公开详情页仍使用 public-only 查询的问题，四类详情页现在通过 RLS 保护的 viewable 查询读取 public 或已授权 restricted 内容。
- Viewer login 会通过 `can_request_viewer_login(email)` 检查 active grant 后发送 magic link，并始终生成 `/viewer/callback?next=...` redirect URL。
- Viewer callback 会交换 code、写入 session cookie、验证 session user，再跳回安全 `next` 路径。
- `/access-request` 提交已改为优先使用服务端 service-role 安全写入申请记录，避免生产 anon insert policy / grant 漂移导致访客提交失败。

当前影响：

- 不影响 public 内容浏览。
- 不影响管理员后台。
- 不影响 Documents 私密文件。
- 不影响公开站点 SEO 和 UI。

当前边界：

- 不扩展 restricted grants、RLS、Supabase Auth 或 Storage 的权限边界。
- Documents、signed URL 和 Storage 路径仍不得对 Viewer 或公开访客开放。
- Access Grant 只开放被授权的单条 restricted 正文，不开放 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL。
- sitemap / robots 仍不收录 restricted、viewer、dashboard、api 或 public-files。

仍需人工验收：

- 已授权邮箱可以稳定收到 Supabase magic link。
- magic link callback 可以稳定建立 viewer session 并跳回 `next`。
- 授权用户只能只读访问被授权的 restricted Project / Publication / Knowledge / Skill。
- 撤销授权后访问失效。
- viewer 不能进入后台。
- viewer 不获得 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL。
