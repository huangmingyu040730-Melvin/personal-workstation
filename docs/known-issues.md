# Known Issues

## 2026-06-17 - Resume Word photo export gap

状态：已在 v1.1.2 小修中解决。

此前 Resume Preview 已支持 `show_photo` 和 `photo_url`，但 Word `.docx` 导出没有嵌入照片。v1.1.2 已补齐 URL-first 链路：

- basic 个人信息素材的 `details.photo_url` 优先。
- Profile `avatar_url` 作为 fallback。
- Preview 和 Word 导出都尊重 `show_photo`。
- Word 导出只尝试读取 data URL 或安全 HTTPS 图片 URL，并限制 2 MB、图片 MIME type、HTTPS 重定向、Supabase Storage object URL 和私网地址。

当前边界：

- 不新增照片上传 API。
- 不新增 Profile avatar upload。
- 不上传照片到 Storage。
- 不生成 signed URL。
- 不修改数据库、RLS、Storage policy 或 public download route。

## 2026-06-15 - Viewer / restricted external access retired

状态：已退役，不再作为待修问题。

Phase 2R-Z 明确移除了外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权链路。旧的 viewer magic link 不稳定问题不再进入 Phase 2I 或 hotfix 路线。

当前边界：

- 公开站点只展示 `visibility = 'public'` 的内容。
- private / unlisted / 历史 restricted 内容不会在公开页面确认是否存在。
- `/access-request`、`/viewer/login`、`/viewer/callback`、`/dashboard/access-requests` 和 `/dashboard/access-grants` 不再作为产品入口。
- 0022 迁移会把历史 `restricted` 内容回写为 `private`，并删除旧访问申请 / 授权表和授权函数。
- Documents、Storage policy、public 文件下载 route、后台内容管理和管理员登录不受本次退役影响。

## 2026-06-15 - Homepage featured content polish PR closed

状态：已关闭，不作为 v1.0 待合并项。

PR #115（Phase 2R-F-2 public homepage featured content polish）已关闭且不合并。该版首页精选内容改动不符合当前预期，v1.0 保持当前 `main` 首页原样。

当前边界：

- 不继续推进 Phase 2R-F-2。
- 不重做首页精选区。
- 不大改首页主结构。
- 后续进入 v1.0 final QA / release notes，只做检查、文档收口和明确小 bug 修复。
