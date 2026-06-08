# Known Issues

## Viewer magic link 登录问题

状态：冻结继续排查，后续单独 Hotfix。

当前状态：

- Phase 2E-B restricted 授权基础代码已实现。
- 已实现 `restricted` visibility、`content_access_grants`、`has_content_access()`、后台 Access Grants、viewer login 和 viewer callback。
- 已尝试 PR #19、PR #20 修复。
- 目前仍可能出现：
  - 授权邮箱无法发送 magic link。
  - magic link 成功但 viewer session 未稳定建立。
  - 已授权用户仍无法查看 restricted 内容。

当前影响：

- 不影响 public 内容浏览。
- 不影响管理员后台。
- 不影响 Documents 私密文件。
- 不影响访问申请提交与审批。
- 不影响公开站点 SEO 和 UI。

当前边界：

- 不继续扩展 Viewer login、viewer callback、restricted grants、RLS、Supabase Auth 或 Storage。
- Documents、signed URL 和 Storage 路径仍不得对 Viewer 或公开访客开放。
- restricted 内容基础代码保留，但不作为当前已验收稳定能力。

后续建议单独开启：

```text
Phase 2I: Viewer login and restricted access stabilization
```

该阶段应专项验证：

- 已授权邮箱可以稳定收到 magic link。
- magic link callback 可以稳定建立 viewer session。
- 授权用户只能只读访问被授权 restricted 内容。
- 撤销授权后访问失效。
- viewer 不能进入后台。
- viewer 不获得 Documents 或附件下载权限。
