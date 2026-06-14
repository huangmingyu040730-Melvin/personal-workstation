# AGENTS.md

## Project

项目名称：黄铭语个人数字工作站 / Mingyu Personal Workstation

项目定位：

- 面向个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理的网站。
- 网站默认语言为中文。
- 当前产品定位为“公开研究工作站 + 私密数字资产后台”。
- Phase 2B 起接入 Projects、Knowledge Base、Skills Library 的真实 Supabase CRUD；Phase 2C 接入 Publications、Documents 与 private Storage；Phase 2E-B 建立 restricted 内容授权基础；Phase 2P 起 Documents 成为 Project / Publication / Knowledge / Skill 的统一默认私密附件底座；Phase 2R-A-4A 起支持管理员显式公开单个文件，并通过安全下载路由在相关公开内容页展示公开附件。
- Phase 2O-A 后主线收口为研究资产沉淀、公开展示、文件 / 知识管理和求职闭环维护；Market Brief / 市场简报模块已弃用，不恢复产品入口、API、runner、素材包、数据探针或推荐环境变量。
- Phase 2R-A 起公开首页与公开导航进入“黄铭语研究工作站”展示 polish；首页 H1 使用“个人研究工作站”，站点身份仍可在品牌、metadata、footer 或 eyebrow 中保留“黄铭语研究工作站”。公开页面只展示 public 内容，访问申请用于处理未公开或受限材料请求。
- Phase 2R-A-2 起公开首页 hero 可使用轻量 CSS 背景装饰表达金融、量化、研究和学术氛围；H1 文案仍为“个人研究工作站”，只使用系统字体栈，不提交字体文件或外部字体服务。
- Phase 2R-A-3 起公开 Projects / Publications / Knowledge / Skills 列表页作为正式研究内容索引维护，使用统一 listing header、轻量筛选、公开卡片和空状态；仍只展示 public 内容。
- Phase 2R-A-4A 起公开 Project / Publication 详情页可展示显式公开文件附件；文件必须 `documents.visibility = 'public'` 且关联到当前 public 资产，下载经 `/public-files/[id]/download` 短时签名路由校验，不把 signed URL 写入页面 HTML。
- `0021_public_attachment_service_role_grants.sql` 是 2R-A-4A 的权限 hotfix：只给 server-side `service_role` 补公开附件查询 / 下载校验所需表的 `select` 权限，不修改 RLS、Storage policy、bucket public 状态或文件数据。
- Phase 2R-A-4B 起公开 Project / Publication / Knowledge / Skill 详情页统一为正式公开研究详情体验；详情页只读取 public 详情查询，Project / Publication 可展示 2R-A-4A 的公开附件，Knowledge / Skill 不展示 Documents。
- Phase 2R-B-1 起访问申请与未公开内容 fallback 进入正式访客闭环：公开详情页“申请访问”按钮带 `content_type`、`slug`、公开标题和来源 query，上下文只来自当前公开页面已展示字段；访问申请不等于授权，不自动开放 Documents、private attachments、signed URL 或 restricted/private 正文，不新增邮件服务或 migration。
- Phase 2R-C-1 起公开 SEO、分享卡片、sitemap 和 robots 作为正式公开研究工作站体验维护；metadata 使用“黄铭语研究工作站”站点模板，sitemap 只收录 public 内容和公开静态入口，robots 允许公开页面并阻止 dashboard、API、viewer、public-files 和后台下载入口。

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React

## Commands

启动开发服务器：

```bash
npm run dev
```

代码检查：

```bash
npm run lint
```

生产构建：

```bash
npm run build
```

## Working Rules

- 保持组件可复用，页面优先组合基础组件，不在页面中堆重复样式。
- 示例数据集中维护在 `src/lib/mock-data.ts`，仅用于尚未接入真实数据的页面或未配置 Supabase 时的开发预览。
- Projects、Knowledge Base、Skills Library、Publications、Documents、Access Requests 与 Access Grants 的查询逻辑集中在 `src/lib/queries/`，校验逻辑集中在 `src/lib/validations/`，写入逻辑集中在 `src/actions/`。
- Supabase 写操作必须在 Server Action 中验证当前用户为管理员，并继续依赖 RLS 作为数据库权限边界。
- 公开首页和公开导航面向普通访客，主入口应保持为首页、研究项目、学术成果、知识库、Skill 库、访问申请和轻量“管理员登录”；不要在公开导航中加入后台菜单、文件中心或全局关系图谱入口。
- 公开首页 hero 采用左侧个人定位 / 标签 / CTA 与右侧公开统计卡片结构；Knowledge / Skill 首页预览使用紧凑卡片展示更多 public 条目，公开列表页卡片设计不必随首页联动。
- 公开首页 hero 视觉 polish 应保持浅色、克制和专业；可使用抽象网格、图表面板、散点、曲线或公式片段等自绘 CSS / 轻量 SVG 元素，但不得使用真实行情、具体股票代码、外部图片、图表库、动画库或字体文件。
- 公开列表页筛选只能基于已有公开字段和 URL query params，不新增数据库字段、全文搜索、外部搜索服务、Documents 读取、文件内容读取或内部关系读取。
- 公开详情页应使用统一公开阅读骨架、SEO metadata 和 related public content；相关内容只可来自 public 记录或公开字段推导，不展示 private / restricted / unlisted 内容，不把后台字段表样式搬到公开页面。
- 公开详情页和未公开内容 fallback 的访问申请 CTA 应使用 slug 与公开标题带上下文；不得使用 private id 作为公开申请依据，不得在 fallback 中确认 private / restricted 内容是否真实存在。
- 公开页面 metadata、Open Graph、Twitter card、sitemap 和 robots 不得读取或输出 private / restricted / unlisted 内容、Storage path、signed URL、`file_path`、raw Documents link rows、`research_asset_links` 管理数据或 owner_id；`/public-files/[id]/download` 不进入 sitemap。
- `workspace-files` bucket 始终保持 private；Documents 上传默认写入 `visibility = 'private'`。只有管理员显式设为 `public`，且文件关联到 public Project / Publication / Knowledge / Skill 时，公开页面才可展示安全附件摘要和 `/public-files/[id]/download` 入口。
- 公开 Project / Publication / Knowledge / Skill 页面不得展示 Documents 原始多资产 link rows、relation notes、`research_asset_links` 管理能力、`file_path`、Storage path、Storage bucket、owner_id 或 signed URL；Publication 公开查询应避免把历史附件字段作为展示数据使用。
- public 文件下载路由必须在服务端重新校验：文件为 public、Storage bucket 为 `workspace-files`、当前资产为 public 且文件确实关联该资产；路由只能按需生成 60 秒短时 signed URL 或重定向，不得把 signed URL 写入页面 HTML。
- public 附件查询与下载 route 的 server-side service-role client 只用于重新校验 public 文件、public 资产和文件关联；不得把 service role key 暴露到客户端、日志、文档或公开页面。
- Documents 上传继续使用两阶段浏览器直传 Supabase Storage；Server Action 只处理管理员验证、metadata 校验、安全路径生成和 finalize 写库，不接收文件二进制。
- Documents 的 `storage_path` 必须保持 ASCII-safe object key；中文文件名和文件夹名只保存在显示字段中。
- `research_asset_links` 只用于 Project / Knowledge / Skill / Publication 之间的管理员后台显式关系；Documents 与文档包不得混入该表。
- Documents 与文档包的多资产关联使用专用 `document_asset_links` / `document_collection_asset_links`；`documents.related_type / related_id` 与 `document_collections.related_type / related_id` 仅保留为 legacy primary relation、路径 fallback 与兼容筛选输入。
- Documents 关联 chips 需要做展示归一化：同一 `asset_type + asset_id` 已有 `deliverable`、`supporting_material` 等具体关系时，隐藏同一资产的 legacy `related` fallback；只有完全没有该资产 link row 时才展示 legacy `related`，不得通过删除数据或新增 migration 处理。
- Documents 多关联选择器应使用清晰的 checkbox / chips UI，避免在上传页、文件详情页、文档包详情页或批量添加关联中重新引入原生 `<select multiple>`；文件中心权限列使用轻量状态标签，不改权限语义。
- 新增、移除或同步 Documents 关联时不得移动、重命名或重写 Storage object，不得修改既有 `storage_path` 生成规则。
- 编辑 `research_asset_links` 时只允许修改 `relation_type` 和 `note`；如需更换 source / target，应删除后重新创建，不新增 schema 或迁移来绕过该边界。
- 全局研究资产关系图谱页面已取消并移除；不要恢复 `/dashboard/network`、Network View、force graph 或其它可视化网络入口。`research_asset_links` 显式关系系统仍保留在 Project / Knowledge / Skill / Publication 后台详情页的 AssetLinksPanel 中，Documents 不纳入显式关系表。
- Skill 包、代码包和压缩包只作为文件存储，不执行、不解析、不安装。
- 不提交密钥、`.env`、API token、私钥或任何敏感文件。
- 保留 `.gitignore` 对 `.env`、`node_modules`、`.next`、`dist`、`out` 等文件的忽略规则。
- 每轮代码修改后运行 `npm run lint` 和 `npm run build`，并修复发现的问题。
- 修改前先理解现有结构，优先遵循项目已有模式。
- 不要改动无关文件，不要回滚用户或其他工具产生的未说明改动。

## Memory Rules

- 新一轮开发前优先阅读 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`；涉及阶段交接或路线判断时继续阅读 `docs/current-status.md`、`docs/roadmap.md`、`docs/known-issues.md` 和 `docs/supabase-setup.md`。
- 重要阶段状态写入 `docs/memory.md`；关键产品、权限、数据模型和流程取舍写入 `docs/decisions.md`；可重复操作步骤写入 `docs/workflows.md`。
- 过时信息必须在文档中标记为 stale / superseded，不要静默覆盖会影响后续判断的历史。
- 记忆文件不得保存密码、API key、token、SMTP 授权码、管理员邮箱、Auth UUID、signed URL、Storage 内部路径或私人通信原文。
