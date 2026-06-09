# Project Memory

日期：2026-06-09

## Current State

项目定位：

> 黄铭语的公开研究工作站与私密数字资产后台。

已完成阶段：

- Phase 1：前端原型。
- Phase 2A：Supabase Auth、RLS、管理员登录、后台保护。
- Phase 2B：Projects / Knowledge / Skills 真实 CRUD。
- Phase 2C：Publications / Documents / private Storage。
- Phase 2D：公开研究工作站、公开内容路由、公开内容填充。
- Phase 2E-A：访问申请表单与后台审批。
- Phase 2E-B：restricted 授权基础能力已实现，但 viewer magic link 登录仍存在已知问题。
- Phase 2F：SEO 基础、sitemap、robots、metadata。
- Phase 2G-A：公共页 UI 优化。
- Phase 2G-B：管理后台 UI 优化。
- Phase 2J-A：Profile 真实编辑。
- Phase 2J-B / 2J-C：Calendar CRUD 与月视图。
- Phase 2K-A：Resume 履历素材库基础数据模型与后台管理入口。
- Phase 2K-B：Resume 简历版本组合与后台预览。

当前网站包括：

- 面向外部访客的公开研究工作站。
- 管理员本人使用的私密后台。
- 私密文件中心。
- 访问申请与审批。
- restricted 内容授权基础。
- Resume 履历素材库。
- Resume 简历版本管理。

详细当前状态见 `docs/current-status.md`。

## Important Context

- 网站默认语言为中文。
- 技术栈：Next.js App Router、TypeScript、Tailwind CSS、Lucide React、Supabase Auth / Database / RLS / Storage。
- 查询逻辑集中在 `src/lib/queries/`。
- 校验逻辑集中在 `src/lib/validations/`。
- 写入逻辑集中在 `src/actions/`。
- 后台写操作必须在 Server Action 中验证登录和管理员身份，并继续依赖 RLS。
- 公开页面只展示 `visibility = "public"` 的内容。
- private / restricted / unlisted 内容不得进入公开列表、公开首页或 sitemap。
- Documents 始终保持管理员私密文件，不对外开放。
- signed URL 只由管理员流程短时生成，不保存到数据库，不输出到公开页面。
- `robots.txt` 和 `sitemap.xml` 不是安全边界；真正安全边界依赖 Supabase Auth、RLS、Storage policy 和后台路由保护。
- 不提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL、Storage 内部路径或 `service_role`。

## Recent Decisions

- 公开研究工作站与私密后台已经分离：公开只读路由为 `/projects`、`/publications`、`/skills`、`/knowledge`；后台管理路由为 `/dashboard/...`。
- 文件附件默认比正文更严格。即使内容 public，关联 Documents 仍保持 private。
- Publication 有关联附件时禁止直接删除，要求先处理附件。
- Documents 上传采用浏览器直传 Supabase Storage 的两阶段流程，文件二进制不经过 Vercel Function。
- Phase 2E-B 的 restricted 基础代码保留，但 Viewer 登录问题冻结，后续单独 Hotfix。
- Phase 2F / 2G 只优化公开站点运营体验、SEO 和 UI，不扩展权限系统。
- Phase 2K-A 采用统一 `resume_items` 表 + `item_type` 区分素材类型，不为教育、经历、证书等一开始拆多张表。
- Phase 2K-B 采用 `resume_versions` + `resume_version_items` 保存版本和素材选择关系，不在本阶段生成 PDF / Word，也不创建公开简历页面。

## Known Issues

### Viewer magic link 登录问题

状态：冻结继续排查。

现象：

- 已授权邮箱仍可能无法发送 magic link。
- magic link 成功后 viewer session 可能未稳定建立。
- 已授权用户仍可能无法查看 restricted 内容。

影响：

- 不影响 public 内容浏览。
- 不影响管理员后台。
- 不影响 Documents 私密文件。
- 不影响访问申请提交与审批。
- 不影响公开站点 SEO 和 UI。

详见 `docs/known-issues.md`。

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

## Migration State

生产 Supabase 已执行：

- `0001_initial_schema.sql`
- `0002_grant_api_table_privileges.sql`
- `0003_publications_documents_storage.sql`
- `0004_access_requests.sql`
- `0005_restricted_content_access.sql`
- `0006_viewer_login_grant_check.sql`
- `0007_profile_public_fields.sql`
- `0008_calendar_events.sql`

Phase 2K-A 合并后需执行：

- `0009_resume_items.sql`

Phase 2K-B 合并后需执行：

- `0010_resume_versions.sql`

规则：

- 已执行 migration 不应修改或重跑。
- 执行 0010 后，后续数据库变更应新增 `0011_*`。
- 不得放宽 RLS、Storage policies 或 Documents 访问边界。

## Next Steps

建议顺序：

1. Phase 2I：Viewer 登录与 restricted 访问专项修复。
2. Phase 2K-C：PDF / Word 导出。
3. Phase 2K-D：AI JD 优化。
5. Phase 2K-E：自动化与市场简报。
6. Phase 2L：Notion / Google Calendar / AI 辅助研究。

## Stale Or Superseded Notes

- “页面数据仍保持 mock data 预览”已过时。Projects、Knowledge、Skills、Publications、Documents、Access Requests、Access Grants、Profile 与 Calendar 已使用真实 Supabase 数据或真实表结构；公开 `/calendar` 仍保留占位展示，真实管理入口为 `/dashboard/calendar`。
- “restricted 属于后续规划，尚未进入 schema / RLS / UI”已过时。restricted 基础代码和 migration 已完成，但 viewer 登录链路仍待修。
- “后台页面仍位于公开候选路径”已过时。主要后台管理页面已迁移到 `/dashboard/...`。
