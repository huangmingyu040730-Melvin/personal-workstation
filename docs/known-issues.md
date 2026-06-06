# Known Issues

## 2026-06-06 - Viewer Magic Link 登录仍不稳定

状态：待后续单独 Hotfix 排查。

现象：

- Phase 2E-B 已实现 `restricted` visibility、`content_access_grants`、Viewer 邮箱 magic link 登录入口和受限内容读取基础代码。
- 生产验证中，已授权邮箱在 `/viewer/login` 仍可能出现“发送登录链接失败”。
- 已确认该问题不影响公开 public 内容展示、后台管理员 CRUD、Documents 私密文件中心或 Phase 2F 的 sitemap / robots / SEO 工作。

当前边界：

- 不继续扩展 Viewer login、viewer callback、restricted grants、RLS、Supabase Auth 或 Storage。
- Documents、signed URL 和 Storage 路径仍不得对 Viewer 或公开访客开放。
- 后续应单独开 Hotfix，通过 Supabase Auth 日志和 Vercel Function 日志定位 magic link 发送失败的真实原因。

临时处理：

- Phase 2F 继续推进公开站点运营体验、SEO 和内容发现。
- restricted 内容授权功能保留基础代码，但不作为 Phase 2F 的验收依赖。
