# Product Roadmap

## Product Positioning

黄铭语个人数字工作站当前定位为：

> 黄铭语的公开研究工作站与私密数字资产后台。

网站同时承担：

- 对外公开展示研究方向、公开项目、学术成果、知识文章和 AI Skill。
- 对内管理全部项目、知识、成果、文件、访问申请与授权基础。
- 未来继续扩展受限访问、Calendar、Profile、自动化、Notion / Google Calendar 和 AI 辅助研究能力。

Notion 可作为草稿、临时研究笔记、日常记录和自动化中间层，但正式公开门户、权限系统、私密资产库和统一浏览体验继续由个人网站承担。

## Access Layers

### Public Research Workstation

所有访客无需登录即可访问：

- 公开首页。
- About 页面。
- 公开 Projects / Publications / Skills / Knowledge 列表与详情。
- 访问申请表单。
- 公开统计、精选内容和 SEO 页面。

公开页面不得展示：

- private、restricted 或 unlisted 内容。
- 后台新增、编辑、删除入口。
- Documents、附件下载入口、signed URL 或 Storage 路径。
- Activity Logs、私密日历、内部任务或管理设置。

### Private Admin Backend

只有管理员本人可以进入后台，用于：

- 查看全部 public / unlisted / restricted / private 内容。
- 新建、编辑和删除 Projects、Publications、Knowledge、Skills。
- 上传与管理私密 Documents。
- 管理访问申请与访问授权基础。
- 查看 Dashboard、公开内容维护提示和 Activity Logs。

管理员身份继续由 Supabase Auth、`public.admin_users` 和 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。

### Restricted Access Foundation

已实现基础代码：

- `restricted` visibility。
- `content_access_grants`。
- `has_content_access()`。
- 后台 Access Grants。
- viewer login 和 callback。

但 Viewer magic link 登录仍不稳定，restricted 访问体验尚未完成真实稳定验收。该问题已冻结，后续单独进入 Phase 2I。

## Visibility Model

| 可见性 | 含义 | 公开列表展示 | 当前状态 |
| --- | --- | --- | --- |
| public | 所有人可浏览 | 是 | 已稳定使用 |
| unlisted | 不公开列出，当前保持保守 | 否 | 字段与后台管理已具备，公开访问保持保守 |
| restricted | 管理员可见，未来授权 viewer 只读 | 否 | 基础代码已实现，viewer 登录待修 |
| private | 仅管理员本人可查看 | 否 | 已稳定使用 |

文件附件默认比正文更严格。即使 Publication 或其他内容设置为 public，关联 Documents 仍保持 private，不在公开页面提供下载入口。即使未来 viewer 可以查看 restricted 正文，也不自动获得 Documents 权限。

## Phase Status

### Phase 1 - Frontend MVP

已完成并合并。建立 Next.js App Router、TypeScript、Tailwind CSS、Lucide React 的前端原型和主要页面。

### Phase 2A - Supabase Auth And RLS Foundation

已完成并合并。建立 Supabase Auth、RLS、管理员登录、后台路由保护与 Vercel 部署基础。

### Phase 2B - Core Content CRUD

已完成并通过生产验收。Projects、Knowledge Base、Skills Library、Skill 最小版本记录、Dashboard 真实读取与公开首页 public + featured 展示已经接入真实 Supabase 数据。

### Phase 2C - Publications And Secure Documents

已完成并通过生产验收。Publications 真实 CRUD、Documents 私密文件上传/下载/删除、private `workspace-files` bucket、Publication 附件关联、删除保护、Dashboard 成果统计与 Activity Logs 已完成。

### Phase 2D - Public Research Workstation

已完成。公开首页、About、公开 Projects / Publications / Skills / Knowledge 列表与详情、公开内容填充、公开详情展示质量和后台公开内容运营提示已建立。

### Phase 2E-A - Access Requests

已完成。公开访问申请表单、后台申请管理、pending / approved / rejected 状态、管理员备注和 Dashboard 待处理申请提示已建立。

### Phase 2E-B - Restricted Access Foundation

基础代码已完成。`restricted` visibility、访问授权表、授权管理、viewer login 和 viewer callback 已建立。

未完成：Viewer magic link 登录仍不稳定，详见 `docs/known-issues.md`。

### Phase 2F - Public Site Operations And SEO

已完成。动态 sitemap、robots、公开页面 metadata、canonical / Open Graph 基础信息、公开内容发现体验和 About 页面说明已完善。

### Phase 2G-A - Public Site UI Polish

已完成。公共页 UI 调整为蓝白清爽研究工作站风格，大屏左右留白改善，卡片和按钮动效增强。

### Phase 2G-B - Admin UI Polish

已完成。管理后台 UI 优化，Dashboard、Sidebar、Topbar、列表页、详情页、新建 / 编辑 / 上传 / 授权页视觉统一；表单页改为更平衡的工作台布局。

## Next Phases

### Phase 2I - Viewer 登录与 restricted 访问专项修复

目标：

- 稳定 viewer magic link。
- 验证授权邮箱登录。
- 验证 restricted 内容只读访问。
- 验证撤销授权后失效。
- 确认 viewer 不能进后台。
- 不开放 Documents 附件。

范围边界：

- 可修复 viewer login / callback / grant check。
- 不开放 Documents、Storage 或 signed URL 给外部用户。
- 如需数据库变更，应使用当前最新编号之后的新 migration，不修改已执行的旧 migration。

### Phase 2J - Calendar / Profile 基础能力

目标：

- Profile 真实编辑与 About 公开读取。
- Calendar 站内 CRUD。
- Dashboard 近期日程。

Phase 2J-A 已完成 Profile 真实编辑：后台 `/dashboard/profile` 维护公开资料，公开 `/about` 只读取 `is_public = true` 且 `visibility = "public"` 的 Profile 字段。Phase 2J-B 已完成站内 Calendar CRUD：后台 `/dashboard/calendar` 管理私密为默认的站内日程，Dashboard 展示近期日程。Google Calendar 同步与提醒系统仍留待后续阶段。

### Phase 2K - Resume 履历素材库与简历生成

目标：

- Phase 2K-A：新增 Resume 履历素材库，维护基本信息、教育经历、实习 / 工作经历、项目经历、研究经历、Skill / AI 工作流经历、证书、奖项、技能标签和简历 bullet。
- Phase 2K-B：基于履历素材组合生成不同版本简历，并提供后台预览。
- Phase 2K-C：将素材库升级为分区式简历管理，将后台预览优化为贴近参考 PDF 的 A4 中文简历模板，并支持浏览器打印 / 另存为 PDF。
- Phase 2K-D：新增规则化简历质量检查、完整度评分、缺失项提示和投递方向提醒。
- Phase 2K-E：AI JD 简历优化助手，基于当前版本和粘贴的 JD 生成匹配分析、关键词差距和 bullet 改写建议；支持 DeepSeek 等 OpenAI-compatible Provider，并继续兼容旧 OpenAI 环境变量。
- Phase 2K-F：Word `.docx` 即时导出，基于当前简历版本生成可下载 Word 文件。
- Phase 2K-G：Preview 与 Word 导出严格对齐 20260523 风格模板，使用统一模板模型。
- Phase 2K-H：JD 分析历史与投递记录，保存单次 JD 分析、岗位信息、关键词缺口、风险、下一步行动和投递状态。
- Phase 2K-I：投递看板与求职 Pipeline 管理，基于 JD 分析记录按状态管理草稿、已分析、准备投递、已投递、面试中、被拒、Offer 和已归档记录。
- Phase 2K-J：Career Center / 求职中心导航整合，将简历素材、简历版本、投递看板和 JD 分析记录收拢为一个侧边栏入口。
- Hotfix：AI JD 输入和页面“版本内容概览”复用统一 Resume AI 输入模型，与当前版本已选且可见内容保持一致。

Phase 2K-A 只建立数据模型与后台素材 CRUD，不做 PDF 导出、Word 导出、AI 生成、模板系统、公开简历页或英文简历。Phase 2K-B 增加简历版本和素材选择关系，支持按区块排序、展示开关、版本语言/模板标记和后台预览。Phase 2K-C 补充更细的简历字段结构、个人信息展示开关、逐条素材可见字段控制和更贴近中文 PDF 简历的 A4 预览；导出仍采用浏览器打印，不引入后端 PDF 服务、Word 导出或公开简历页面。Phase 2K-D 只做规则检查，不调用 AI，辅助判断简历是否具备投递基础。Phase 2K-E 在此基础上增加 AI JD 优化建议，AI 调用支持 `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` 通用配置，推荐 DeepSeek 配置为 `AI_PROVIDER=deepseek`、`AI_BASE_URL=https://api.deepseek.com`、`AI_MODEL=deepseek-v4-flash`，并继续兼容 `OPENAI_API_KEY` / `OPENAI_MODEL`；该功能不自动写回 Resume Items / Resume Versions，不做 Word 导出、公开简历页或自动投递。AI JD 输入 hotfix 已将页面“版本内容概览”和模型 prompt 统一到 `resume-template-model` 派生的 `resume-ai-input`，继续尊重 `profile_fields` 与 `visible_fields`，避免只发送摘要或漏发教育、技能等结构化字段。Phase 2K-F 只做管理员后台 `.docx` 即时导出，不保存文件、不上传 Storage、不创建公开简历页或分享链接。Phase 2K-G 将 Preview 和 Word 导出统一到同一套模板模型，补充照片位置、模块标题视觉符号、左时间 / 右内容布局和正式简历条目；仍不新增 migration、不提交模板原文件或字体文件。Phase 2K-H 在 AI JD 建议基础上增加后台私密分析历史和投递状态管理；保存记录不自动覆盖简历素材，不创建公开简历页面，不读取 Documents / Storage / signed URL。Phase 2K-I 复用 `resume_jd_reviews` 和 `application_status` 建立 `/dashboard/resume/applications` 投递看板，提供看板/列表视图、搜索筛选、快速改状态和投递统计；不新增 migration，不自动投递，不发送邮件，不做 Notion 同步，不开放公开访问。Phase 2K-J 新增 `/dashboard/career` 求职中心，并将侧边栏中的简历素材、简历版本、投递看板和 JD 分析记录收拢为一个“求职中心”入口；四个原有路径继续可访问，并通过统一 Career tabs 互相切换。

### Phase 2K-K - Application Workflow Enhancements

目标：

- 面试记录。
- 面试复盘。
- 日历提醒。
- 投递提醒。
- Offer 对比。
- 投递邮件草稿。
- Notion 同步。
- 数据统计图表。
- 后续如有需要，再设计确认后写回简历素材的半自动流程。

### Phase 2L - 自动化与市场简报

目标：

- Phase 2L-A：Market Briefs / 市场简报后台管理，新增 `market_briefs` 表和 `/dashboard/market-briefs` 手工 CRUD，支持日期、市场、状态、标签、数据来源、摘要和模块化正文，并在 Dashboard 展示最近 3 条。
- Phase 2L-B：Market Brief artifact / 文件化与站内预览，新增 Markdown 主内容、生成状态和 artifact 元数据字段，支持 `/dashboard/market-briefs/[id]/preview`、Markdown / HTML / JSON / Word 即时下载和浏览器打印 / 保存 PDF。
- Phase 2L-C：新增“获取今日市场动态”按钮，当前使用 `manual-skill-mock` 生成器创建今日 A 股 Markdown 草稿并保存到 `market_briefs`；若今日同市场简报已存在则跳转已有预览页，不重复创建。
- Phase 2L-D-A：新增 `market_brief_generation_jobs`、`/dashboard/market-briefs/jobs` 和私有 `/api/market-briefs/skill-result`，把“获取今日市场动态”改成先创建任务、记录 request/source/result payload，再同步运行 mock runner 并写入简报。
- Phase 2L-D-B：新增 `MARKET_BRIEF_GENERATOR=external`、claim/fail 私有 API 和 `scripts/market-brief-runner/` 外部 runner 骨架；external 模式下站内按钮只创建 queued job，外部 runner 通过 API 领取并回写 mock 结果。
- Phase 2L-D-C：新增 Python AkShare runner，第一版接入宽基指数、市场宽度、行业板块和热点方向，生成稳定 `source_snapshot` 与 Markdown，并通过 claim/result/fail API 回写网站。
- Phase 2L-D-D：真实行情源不可用时生成 fallback / partial 待复核简报，不让任务因 AkShare / 东方财富不稳定而长期卡住。
- Phase 2L-D-E：新增 `MARKET_BRIEF_DATA_MODE=multi`、轻量 HTTP 指数源和指定日期历史补生成；今日与历史生成都先校验 A 股交易日，周末、节假日、未来日期不创建 job。
- 后续：每日 A 股市场收评自动生成。
- 后续：AkShare / Tushare / Wind 等数据源接入。
- 后续：扩展稳定历史行情、资金流、新闻和交易所日历刷新源。
- 后续：AI 自动生成、邮件发送、网站 / Knowledge / Publications 归档、Notion 同步和定时任务。
- 当前 2L-D-E 不做 AI、新闻爬虫、邮件、Notion、公开市场简报页、复杂图表、股票推荐或投资建议；外部 runner 只通过 `WORKSTATION_BASE_URL` 和 `MARKET_BRIEF_RUNNER_SECRET` 调网站 API，不需要 Supabase key。

### Phase 2L - Notion / Google Calendar / AI 辅助研究

目标：

- Notion 辅助同步。
- Google Calendar 集成。
- AI 摘要。
- 项目阶段总结。
- 文件和知识自动关联。
