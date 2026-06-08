# Current Status

日期：2026-06-09

## Product Positioning

本项目当前定位为：

> 黄铭语的公开研究工作站与私密数字资产后台。

当前网站包括：

1. 面向外部访客的公开研究工作站。
2. 管理员本人使用的私密后台。
3. 私密文件中心。
4. 访问申请与审批。
5. restricted 内容授权基础。
6. 未来可继续扩展 Viewer 受限访问、Calendar、自动化、Notion / Google Calendar 等能力。

## Completed Capabilities

### Public Site

已完成：

- 公开首页 `/`。
- About 页面 `/about`。
- 公开 Projects 列表与详情 `/projects`、`/projects/[slug]`。
- 公开 Publications 列表与详情 `/publications`、`/publications/[slug]`。
- 公开 Skills 列表与详情 `/skills`、`/skills/[slug]`。
- 公开 Knowledge 列表与详情 `/knowledge`、`/knowledge/[slug]`。
- 公开内容只展示 `visibility = "public"` 的记录。
- `public` / `private` / `unlisted` / `restricted` 的边界已经形成。
- `sitemap.xml`。
- `robots.txt`。
- SEO metadata。
- 公共页 UI 已完成蓝白清爽研究工作站风格优化。
- 大屏左右留白已改善。
- 卡片和按钮动效已增强。

公开页面不得展示 Documents、signed URL、Storage 路径、后台操作入口、Activity Logs 或非 public 内容。

### Admin Backend

已完成：

- `/dashboard` 管理工作台。
- Projects 后台 CRUD。
- Publications 后台 CRUD。
- Knowledge 后台 CRUD。
- Skills 后台 CRUD。
- Documents 文件中心。
- Access Requests 访问申请管理。
- Access Grants 授权管理基础。
- Profile 个人公开信息编辑基础。
- 管理后台 UI 已优化。
- 后台新建 / 编辑 / 上传 / 授权页已调整为更平衡的工作台布局。

后台仍只允许管理员访问。后台写入继续通过 Server Actions 验证管理员身份，并依赖 Supabase RLS 作为数据库权限边界。

### Documents And Storage

已完成：

- private Supabase Storage bucket：`workspace-files`。
- 管理员上传。
- 管理员下载。
- signed URL 短时下载。
- 文件关联 Publication / Project / Skill。
- Publication 有附件时禁止直接删除。
- 公开页面不展示 Documents。
- 公开页面不展示 signed URL。
- 公开页面不展示 Storage 路径。

文件上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。Documents 不对外开放。

### Access Requests

已完成：

- 公开 `/access-request`。
- 访客提交申请。
- 后台查看申请。
- `pending` / `approved` / `rejected` 状态。
- 管理员备注。
- Dashboard 待处理申请提示。

申请审批状态不等同于内容授权。访问授权通过 Access Grants 单独创建和撤销。

### Restricted Access Foundation

已完成代码层面基础能力：

- `restricted` visibility。
- `content_access_grants` 表。
- `has_content_access()`。
- 授权列表。
- 创建 / 撤销授权。
- viewer 登录入口。
- viewer callback。
- 未授权 restricted 内容不展示正文。

真实 viewer magic link 登录体验仍存在已知问题，详见 `docs/known-issues.md`。

## Permission Boundary

| 区域 | 谁可访问 |
| --- | --- |
| public 内容 | 所有人 |
| unlisted 内容 | 不出现在公开列表，当前能力保持保守 |
| restricted 内容 | 管理员可见，viewer 授权基础已实现但登录链路待修 |
| private 内容 | 仅管理员 |
| dashboard | 仅管理员 |
| documents | 仅管理员 |
| signed URL | 仅管理员流程生成 |
| access requests 提交 | 访客可提交 |
| access requests 管理 | 仅管理员 |
| access grants 管理 | 仅管理员 |

重要边界：

- `robots.txt` 和 `sitemap.xml` 不是安全边界。
- 真正安全边界依赖 Supabase Auth、RLS、Storage policy 和后台路由保护。
- Documents 不对外开放。
- restricted 内容不得出现在公开列表或 sitemap 中。
- private / unlisted / restricted 内容不得被公开页面泄露标题、ID、Storage 路径或 signed URL。

## Migration State

当前生产项目已按顺序执行：

- `0001_initial_schema.sql`
- `0002_grant_api_table_privileges.sql`
- `0003_publications_documents_storage.sql`
- `0004_access_requests.sql`
- `0005_restricted_content_access.sql`
- `0006_viewer_login_grant_check.sql`

Phase 2J-A 合并后需要继续执行：

- `0007_profile_public_fields.sql`

规则：

- 已执行过的 migration 不应修改。
- 执行 0007 后，后续数据库变更应新增 `0008_*`。
- 不得重跑旧 migration。
- 不得放宽 Storage / RLS。
- 不得提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL 或 `service_role`。

## Known Issue

Viewer magic link 登录仍未稳定。Phase 2E-B restricted 授权基础代码保留，但当前不继续排查，不影响 public 内容浏览、管理员后台、Documents 私密文件、访问申请提交与审批、公开站点 SEO 和 UI。

建议后续单独开启：

- Phase 2I: Viewer login and restricted access stabilization

## Next Recommended Phases

### Phase 2I - Viewer 登录与 restricted 访问专项修复

目标：

- 稳定 viewer magic link。
- 验证授权邮箱登录。
- 验证 restricted 内容只读访问。
- 验证撤销授权后失效。
- 确认 viewer 不能进后台。
- 不开放 Documents 附件。

### Phase 2J - Calendar / Profile 基础能力

目标：

- Profile 真实编辑。
- Calendar CRUD。
- Dashboard 展示近期日程。

### Phase 2K - 自动化与市场简报

目标：

- 每日 A 股市场收评。
- 邮件发送。
- 网站 / Knowledge / Publications 归档。
- 未来接入 Notion。

### Phase 2L - Notion / Google Calendar / AI 辅助研究

目标：

- Notion 辅助同步。
- Google Calendar 集成。
- AI 摘要。
- 项目阶段总结。
- 文件和知识自动关联。
