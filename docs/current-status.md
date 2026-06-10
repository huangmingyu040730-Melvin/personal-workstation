# Current Status

日期：2026-06-10

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
- Calendar 站内日程 CRUD。
- Market Briefs 市场简报后台手工 CRUD、Markdown 主内容、站内预览、多格式下载、mock / external runner 生成模式与生成任务记录。
- Resume 履历素材库基础 CRUD。
- Resume 简历版本组合与后台预览。
- Resume 分区式素材管理、A4 中文简历模板化预览与浏览器打印 PDF。
- Resume 简历质量检查、完整度评分和投递版本提示。
- Resume AI JD 简历优化建议，支持 OpenAI-compatible Provider 与 DeepSeek。
- Resume JD 分析历史与投递记录。
- Resume 投递看板与求职 Pipeline 管理。
- Career Center / 求职中心导航整合。
- Resume Word `.docx` 即时导出。
- Resume Preview 与 Word 导出共用 20260523 风格模板模型。
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
- `0007_profile_public_fields.sql`
- `0008_calendar_events.sql`

Phase 2K-A 合并后需要继续执行：

- `0009_resume_items.sql`

Phase 2K-B 合并后需要继续执行：

- `0010_resume_versions.sql`

Phase 2K-C 合并后需要继续执行：

- `0011_resume_template_fields.sql`

Phase 2K-H 合并后需要继续执行：

- `0012_resume_jd_reviews.sql`

Phase 2L-B 合并后需要继续执行：

- `0014_market_brief_artifacts.sql`

Phase 2L-C 不新增 migration，依赖 0014 中已有的生成状态和 Markdown artifact 字段。

Phase 2L-D-A 合并后需要继续执行：

- `0015_market_brief_generation_jobs.sql`

该 migration 新增 `market_brief_generation_jobs`，用于记录市场简报生成任务、runner 输入、数据快照、结果 payload、关联简报和运行状态。

Phase 2L-D-B 不新增 migration，继续复用 0015 的 `market_brief_generation_jobs`。

规则：

- 已执行过的 migration 不应修改。
- 执行 0015 后，后续数据库变更应新增 `0016_*`。
- 不得重跑旧 migration。
- 不得放宽 Storage / RLS。
- 不得提交 `.env.local`、Supabase key、管理员邮箱、密码、Auth UUID、signed URL 或 `service_role`。

## Known Issue

Viewer magic link 登录仍未稳定。Phase 2E-B restricted 授权基础代码保留，但当前不继续排查，不影响 public 内容浏览、管理员后台、Documents 私密文件、访问申请提交与审批、公开站点 SEO 和 UI。

Resume 预览页中 summary / 素材概述里的 bullet-like 文本自动拆行仍有生产验收遗留问题。该问题当前冻结，不纳入 Phase 2K-D 的质量检查开发范围；后续如继续处理，应单独开 hotfix。

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

- Profile 真实编辑已完成。
- Calendar 站内 CRUD 已完成。
- Dashboard 近期日程已接入。
- Google Calendar 同步与提醒系统尚未实现。

### Phase 2K - Resume 履历素材库与简历生成

目标：

- Phase 2K-A：Resume 履历素材库，维护教育、实习、项目、研究、Skill、证书和奖项等结构化素材。
- Phase 2K-B：简历版本组合生成与后台预览。
- Phase 2K-C：分区式素材管理、A4 中文简历模板化预览与浏览器打印 PDF。
- Phase 2K-D：规则化简历质量检查、完整度评分、缺失项提示和投递方向提醒。
- Phase 2K-E：AI JD 简历优化建议。
- Phase 2K-F：Word `.docx` 即时导出。
- Phase 2K-G：Preview 与 Word 导出对齐到 20260523 风格模板。
- Phase 2K-H：JD 分析历史与投递记录。
- Phase 2K-I：投递看板与求职 Pipeline 管理。
- Phase 2K-J：Career Center / 求职中心导航整合。
- Hotfix：AI JD 页面“版本内容概览”和模型输入复用统一 Resume AI 输入模型。
- Phase 2L-A：Market Briefs / 市场简报后台手工 CRUD。
- Phase 2L-B：Market Brief artifact / Markdown 主内容、站内预览和多格式下载。
- Phase 2L-C：Market Brief mock generation / 获取今日市场动态按钮。
- Phase 2L-D-A：Market Brief Skill Runner jobs / 生成任务、数据快照和私有结果回写接口。
- Phase 2L-D-B：External Market Brief Runner / external 模式、claim/fail API 和外部 runner 脚本骨架。

Phase 2K-A 当前新增 `resume_items` 数据模型和后台 `/dashboard/resume` 管理入口。Phase 2K-B 新增 `resume_versions`、`resume_version_items` 和 `/dashboard/resume/versions` 管理入口，用于组合素材、排序、分区和后台预览。Phase 2K-C 进一步补充 `resume_items.details`、`resume_versions.profile_fields`、`resume_versions.section_order`、`resume_versions.template_options` 和 `resume_version_items.visible_fields`，把素材库从混合条目列表升级为按个人信息、教育、实习、在校、项目、研究、技能等区块维护，并将预览页调整为更接近上传 PDF 的中文 A4 简历排版。Phase 2K-D 新增基于规则的简历质量检查，检查姓名、联系方式、教育、实习、项目/研究、技能、目标岗位、bullet 数量、量化表达和一页过长风险。Phase 2K-E 新增 `/dashboard/resume/versions/[id]/jd-review`，管理员可粘贴目标岗位 JD 并获取 AI 生成的匹配摘要、关键词差距、经历强化建议和 bullet 改写草稿；该能力通过 `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` 支持 DeepSeek 等 OpenAI-compatible Provider，并继续兼容 `OPENAI_API_KEY` / `OPENAI_MODEL`。Hotfix 新增 `src/lib/resume-ai-input.ts`，复用 `resume-template-model` 生成 AI JD 输入和页面“版本内容概览”，避免教育、实习、项目、研究、技能等结构化字段被旧摘要逻辑漏掉；AI JD 分析只发送当前版本已选且可见的 Profile/basic 与正文素材、目标岗位设置和 JD，不发送 Documents、Storage 路径、signed URL、Access Requests 或 Access Grants，也不会自动覆盖原始简历数据。Phase 2K-F 新增 `/dashboard/resume/versions/[id]/export/docx`，管理员可即时下载 Word `.docx` 简历；导出只包含当前版本已选并展示的素材，尊重顶部个人字段开关和逐条素材可见字段，不写入 Storage、不创建长期下载链接、不新增 migration。Phase 2K-G 新增统一 `resume-template-model`，让 A4 Preview 和 Word 导出共享同一套 20260523 风格模板结构，包括照片位置、模块标题视觉符号、左侧时间列、右侧学校/公司/项目内容和正式简历条目布局。Phase 2K-H 新增 `/dashboard/resume/jd-reviews`，管理员可以保存 AI JD 分析结果、公司/岗位、关键词缺口、风险、下一步行动和投递状态，并在简历版本详情页查看最近记录；分析历史为后台私密数据，不自动修改 Resume Items 或 Resume Versions。Phase 2K-I 新增 `/dashboard/resume/applications` 投递看板，基于 `resume_jd_reviews.application_status` 按状态分组展示求职 pipeline，提供看板视图、列表视图、公司/岗位搜索、状态/版本/方向/渠道筛选、快速改状态和投递统计；该页面仍为后台私密数据，不展示 JD 原文，不自动投递，不发送邮件，不读取 Documents / Storage，不新增 migration。Phase 2K-J 新增 `/dashboard/career` 求职中心首页，侧边栏只保留一个“求职中心”入口，并通过统一 Career tabs 进入 `/dashboard/resume`、`/dashboard/resume/versions`、`/dashboard/resume/applications` 和 `/dashboard/resume/jd-reviews`；原有子模块路径保持兼容，不新增 migration。Phase 2L-A 新增 `market_briefs` 表和 `/dashboard/market-briefs` 后台模块，支持手工新建、编辑、详情、删除、搜索筛选、状态/市场/标签管理和 Dashboard 最近简报。Phase 2L-B 新增 `markdown_content`、`generation_status`、`generated_at`、`generator_name`、`source_snapshot` 和 `artifact_files` 字段，市场简报以 Markdown 为主内容源，支持 `/dashboard/market-briefs/[id]/preview` 站内预览、Markdown / HTML / JSON / Word 即时下载和浏览器打印 / 保存 PDF。Phase 2L-C 在 `/dashboard/market-briefs` 新增“获取今日市场动态”按钮，调用 `manual-skill-mock` 生成器创建今日 A 股 Markdown 草稿并保存到 `market_briefs`，重复生成时跳转已有预览页。Phase 2L-D-A 新增 `market_brief_generation_jobs`、`/dashboard/market-briefs/jobs` 和 `/api/market-briefs/skill-result`，按钮会先创建生成任务并通过 mock runner 同步写入简报，外部 Skill Runner 可通过 server secret 回写结构化 source snapshot 和 Markdown 结果。Phase 2L-D-B 新增 `MARKET_BRIEF_GENERATOR=external` 模式、`/api/market-briefs/skill-jobs/claim`、`/api/market-briefs/skill-jobs/fail` 和 `scripts/market-brief-runner/` 骨架；external 模式下站内按钮只创建 queued job，外部 runner 领取后 mock 生成并回写 result。当前不做自动抓取、AkShare/Tushare/Wind、AI 自动生成、邮件发送、Notion 同步、定时任务、公开简报页、图表、股票推荐或投资建议。

### Phase 2L - 自动化与市场简报

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
