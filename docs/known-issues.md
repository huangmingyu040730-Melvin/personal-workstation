# Known Issues

## 2026-06-15 - Viewer / restricted external access retired

状态：已退役，不再作为待修问题。

Phase 2R-Z 明确移除了外部访问申请、Viewer magic link、Access Grants 和 restricted 外部授权链路。旧的 viewer magic link 不稳定问题不再进入 Phase 2I 或 hotfix 路线。

当前边界：

- 公开站点只展示 `visibility = 'public'` 的内容。
- private / unlisted / 历史 restricted 内容不会在公开页面确认是否存在。
- `/access-request`、`/viewer/login`、`/viewer/callback`、`/dashboard/access-requests` 和 `/dashboard/access-grants` 不再作为产品入口。
- 0022 迁移会把历史 `restricted` 内容回写为 `private`，并删除旧访问申请 / 授权表和授权函数。
- Documents、Storage policy、public 文件下载 route、后台内容管理和管理员登录不受本次退役影响。
