# v1.0 / v1.1 Maintenance Playbook

日期：2026-06-17

用途：

- 记录 v1.0 / v1.1 稳定维护阶段的日常内容维护、附件公开、安全检查、部署验收和故障排查流程。
- 帮助后续管理员优先补真实内容，而不是继续扩展复杂功能。

## 日常维护原则

当前项目已经进入 v1.0 稳定维护阶段。后续默认优先补充真实 Project、Publication、Knowledge 和 Skill 内容，持续打磨摘要、标签、正文、公开附件和公开展示质量。

维护原则：

1. 公开站点只展示明确设为 `public` 的内容。
2. 后台只供管理员自己使用。
3. Documents 默认保持 `private`。
4. public attachment 只用于 public Project / Publication。
5. Knowledge / Skill 公开详情页不展示 Documents。
6. Documents 首页保持文档包优先；独立文件只展示 `collection_id IS NULL` 的文件。
7. 已有文档包可从详情页继续追加单个文件；文件仍默认 private。
8. 个人资料当前优先通过文档包组织，不新增 Profile 真实文件关联。
9. 不恢复 access request、viewer、grants 或 restricted 外部授权。
10. 不恢复 `/dashboard/network`。
11. 不恢复 Market Brief。
12. 不为了内容运营新增数据库字段、migration、RLS 或 Storage policy。
13. 不大改首页、About、公开列表、公开详情或后台主结构。
14. AI 草稿助手只用于管理员新建 / 编辑 Project、Publication、Knowledge 和 Skill 时补全、优化或检查表单草稿，不自动保存、不自动公开、不读取 Documents / Storage。
15. AI 草稿实验室只用于把原始素材转换为结构化草稿；可以通过当前浏览器 `sessionStorage` 带入新建表单做人工确认预填，但不自动创建资产、不保存数据库、不提交表单、不读取 Documents / Storage。
16. Resume 照片当前只通过 basic 个人信息素材 `photo_url` 或 Profile `avatar_url` 引用；不做照片上传、裁剪、美颜、Storage 写入或公开头像系统。

暂时跳过 public content sprint。已有 public 内容可以继续在线展示，后续新内容由管理员在后台逐步手动补充、整理和发布。

## v1.1 Personal Asset Intranet maintenance checklist

每个后续小 PR 默认复查：

1. 公开页面只展示 `public` 内容。
2. private / unlisted / 历史 restricted 内容不进入公开列表、详情、sitemap 或 metadata。
3. Documents 不读取文件正文，不输出 Storage path、Storage bucket、owner_id、signed URL 或 raw link rows。
4. public attachment 下载必须带当前 asset context；缺少或非法 `asset_type` / `asset_id` 返回 404。
5. public attachment 继续要求 document public、bucket 为 `workspace-files`、当前 asset public 且 document 关联当前 asset。
6. Sidebar 不恢复“自动化”或“设置”假入口。
7. Topbar 不恢复通知或主题假按钮。
8. AI Draft Lab 不读取 Documents / Storage，不自动保存数据库，不自动创建资产，不自动修改 visibility。
9. AI Draft Lab 到新建表单 prefill 只使用浏览器临时 handoff；点击“填入表单”才写入字段，点击“忽略并清除”只清理 handoff。
10. 后台搜索保持 metadata-only，不升级为 AI 搜索、OCR、向量搜索或 Documents 正文读取。
11. Documents 首页默认先展示文档包区域，再展示独立文件；独立文件区域不重复展示已加入文档包的文件。
12. 文档包详情页的追加上传入口只进入现有单文件上传页，使用 `collection_id` 加入已有文档包，不创建新文档包。
13. 390px 移动端无横向滚动；长标题、长标签、长文件名、文档包标题、筛选区和底部按钮自然换行。
14. Resume 照片导出小修只允许 URL-first 链路：basic `details.photo_url` 优先、Profile `avatar_url` fallback；Word 导出图片获取失败不能阻断导出，且不得读取 Documents / Storage object、Supabase Storage object URL 或生成 signed URL。
15. 每个 PR 运行 `npm run lint`、`npm run build`、运行中站点的 `npm run smoke:public`、`git diff --check` 和暂存后的 `git diff --cached --check`。
16. 每个 PR 做 stale reference 搜索，确认 Agent CEO、自动化中心、任务中心、Market Brief、access request、viewer、Access Grants 和 restricted 相关词只出现在已暂停 / 已退役 / 不恢复语境中。

v1.1 之后默认进入稳定使用期：优先录入真实资产，观察 Project / Publication / Knowledge / Skill 分类、AI Draft Lab handoff、搜索、Documents 和移动端体验。只有明确 bug、明显 UX polish、文档同步或安全边界复查进入近期 PR。

## 新增 public 内容流程

管理员后续新增公开内容时，按以下流程操作：

1. 如果素材还只是会议摘录、临时备忘或粗糙想法，可先进入 `/dashboard/ai-drafts` 生成结构化草稿。
2. 复制 AI 草稿实验室输出的字段或完整 Markdown，或点击“带入新建表单”把草稿临时保存到当前浏览器 `sessionStorage` 并跳转到对应新建页。
3. 新建页出现“检测到 AI 草稿”提示时，先点击“填入表单”再人工检查；也可以点击“忽略并清除”放弃本次 handoff。
4. 初始 `visibility` 先设为 `private`。
5. 补齐标题、slug、摘要、标签、正文或说明。
6. 新建或编辑 Project、Publication、Knowledge 或 Skill 时，可以使用表单内 AI 草稿助手根据当前草稿生成摘要、正文、说明、标签、结构、公开准备度和风险提示；可按场景选择补全空字段、优化已有内容或公开风险检查模式。
7. AI 建议只复制、预填或采用到浏览器表单，公开风险检查也只作为人工复核提示，管理员必须人工复核后手动保存。
8. 在详情页检查 public readiness checklist。
9. 确认 public 字段没有敏感信息、内部路径、私人联系信息、未公开客户信息或后台说明。
10. 确认内容确实适合公开展示后，再把 `visibility` 设为 `public`。
11. 打开对应 public 页面检查展示效果。
12. 打开 `/sitemap.xml`，确认该 public 内容已经被收录。
13. 启动本地服务后运行 `PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public`。

发布前不要自动公开内容，也不要因为 checklist 缺项而绕过人工判断。Checklist 只是提示，不阻止保存。

AI 草稿助手和 AI 草稿实验室同样只是提示：不会自动保存数据库，不会自动提交新建表单，不会自动修改 `visibility`，不会读取 Documents / Storage 或生成下载链接。公开风险检查模式输出的风险项不能替代管理员发布前判断。

## 新增附件流程

public attachment 继续沿用显式公开和服务端校验边界：

1. 通过 Documents 上传文件。
2. 上传后默认保持 `private`。
3. 将文件关联到对应 Project 或 Publication。
4. 人工确认文件内容适合公开。
5. 只有适合公开的文件才把 document visibility 设为 `public`。
6. 只有 public Project / Publication 页面允许展示公开附件。
7. Knowledge / Skill 不展示 Documents。
8. 下载必须走 `/public-files/[id]/download`。
9. public HTML 不应出现 signed URL、`storage_path` 或 `storage_bucket`。

公开附件必须同时满足：

- document 为 `public`。
- document 位于 private `workspace-files` bucket。
- asset 为 public Project 或 public Publication。
- document 关联到当前 public Project / Publication。
- 下载 route 在服务端重新校验后才生成短时 signed URL。

不要把 bucket 改成 public，不要把 signed URL 写入页面 HTML，不要新增 public zip 下载。

## 每次部署前检查

运行时先与仓库基线对齐：Node.js `24.20.0`、npm 11；升级或切换 Node 后执行 `npm ci`，不要沿用旧运行时生成的 `node_modules`。依赖升级后必须确认依赖审计为零漏洞：

```bash
node --version
npm --version
npm ci
npm audit
```

每次部署或合并前运行：

```bash
npm run lint
npm run build
PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public
git diff --check
git diff --cached --check
```

当前项目没有独立 `typecheck` script；`npm run build` 会覆盖 Next.js / TypeScript 构建检查。如果未来新增 `typecheck` script，也运行：

```bash
npm run typecheck
```

运行 smoke 前需要先启动本地服务，例如：

```bash
npm run dev
```

或使用生产构建：

```bash
npm run build
npm run start
```

涉及搜索、列表或移动端 polish 时，额外在 390px 宽度检查：

1. `/dashboard/search` 搜索框、筛选 chips、结果卡片和长摘要。
2. `/dashboard/projects`、`/dashboard/publications`、`/dashboard/knowledge`、`/dashboard/skills` 的长标题、长标签和 visibility / status badge。
3. `/dashboard/documents` 的文档包卡片、独立文件区域、筛选区、批量工具栏、小屏文件卡片和长文件名。
4. `/projects`、`/publications`、`/knowledge`、`/skills` 的搜索 / 筛选控件、公开卡片和长标签。

搜索和列表维护只允许基于现有 metadata 与 public 查询做展示优化；不要新增 AI 搜索、OCR、向量搜索、Documents 正文读取、数据库字段、RLS、Storage policy 或 public download route 改动。

涉及 Documents collection-first polish 时，额外确认：

1. `/dashboard/documents` 默认先显示文档包。
2. 文档包卡片点击进入现有 `/dashboard/documents/collections/[id]`。
3. 独立文件区域只显示未加入文档包的文件。
4. 文档包详情页显示“上传文件到此文档包”，并跳转到现有上传页的单文件模式。
5. 上传页验证 `collection_id` 后显示“本次上传会加入文档包”提示，并通过 hidden `collection_id` 写入已有文档包。
6. 普通 `/dashboard/documents/upload` 的单文件上传和批量创建文档包逻辑不受影响。
7. 个人资料只通过文档包组织，不新增 Profile relation、数据库枚举或 resolver。
8. 不读取 Documents 正文，不读取 Storage object，不生成 signed URL，不修改 public download route。

涉及 Resume photo export polish 时，额外确认：

1. basic 类型简历素材可以维护“简历照片 URL”。
2. 照片来源顺序为 basic `details.photo_url`，其次 Profile `avatar_url`。
3. Preview 在 `show_photo = true` 时显示照片或“照片”占位，`show_photo = false` 时不显示照片区。
4. Word 导出在照片 URL 可安全获取时嵌入照片；data URL / HTTPS URL 以外的来源降级，不阻断导出。
5. Word 图片获取限制 2 MB、jpeg / png / webp、HTTPS 重定向、Supabase Storage object URL 和私网 / 保留地址访问。
6. 不新增照片上传、Profile avatar upload、图片裁剪 / 美颜 / 压缩、Storage policy、public download route 或 signed URL 能力。

## 每次部署后检查

部署后至少检查：

1. 首页 `/`。
2. About `/about`。
3. `/projects`。
4. `/publications`。
5. `/knowledge`。
6. `/skills`。
7. 一个 public Project 详情页。
8. 一个 public Publication 详情页。
9. 一个 public Knowledge 详情页。
10. 一个 public Skill 详情页。
11. `/sitemap.xml`。
12. `/robots.txt`。
13. `/public-files/[id]/download`，仅在有 public attachment 时测试。
14. `/dashboard` 登录入口。

同时确认公开导航没有 access request、viewer login、Access Grants、Documents 或后台菜单入口。

## 安全检查

检查 public 页面 HTML 不出现：

- signed URL。
- `storage_path`。
- `storage_bucket`。
- `file_path`。
- `owner_id`。
- raw document links。
- backend relation rows。
- API key。
- Supabase service role key。
- Vercel env value。
- private Documents。
- AI 草稿助手输出被误发布为未经复核的事实。
- AI 草稿实验室输出被误认为已经保存或已经公开。

推荐检查范围：

1. 首页。
2. About 页面。
3. 四类公开列表页。
4. 四类公开详情页。
5. sitemap。
6. robots。
7. 未公开或不存在 slug 的 fallback 页面。

## 已永久退役功能

不要恢复：

- Access Request。
- Access Grants。
- Viewer magic link。
- restricted 外部授权访问。
- `/dashboard/network`。
- Market Brief 产品入口。
- public zip 下载。
- AI 摘要。
- 详情页事后点评式 AI Content Copilot。
- 自动公开或自动保存 AI 草稿建议。
- AI 草稿实验室自动创建资产或草稿表。
- OCR。
- 向量搜索。
- 全文搜索。
- PDF 在线预览。
- 支付 / 会员 / 外部授权访问。

如未来确实需要其中某项能力，应作为独立新阶段重新提出，并重新评估权限、安全和运维成本。

## 出问题时的排查顺序

### 公开页面空白或报错

1. 先看 Vercel deployment logs。
2. 再看 Supabase 查询错误。
3. 检查该内容是否 `visibility = public`。
4. 检查 slug 是否正确。
5. 检查 fallback 是否仍然不确认 private / unlisted 内容存在。
6. 不要直接放宽 RLS。

### public attachment 不显示

1. 检查 document 是否 `public`。
2. 检查 asset 是否 `public`。
3. 检查 document 是否关联当前 Project / Publication。
4. 检查目标环境是否执行 `0021_public_attachment_service_role_grants.sql` 所需 `select` grant。
5. 检查 Knowledge / Skill 页面是否被误期待展示 Documents。
6. 不要把 bucket 改 public。

### 下载失败

1. 检查 `/public-files/[id]/download` route 日志。
2. 检查 bucket 是否为 `workspace-files`。
3. 检查 `storage_path` 对应 object 是否存在。
4. 检查 document public、asset public、document linked to current asset 三重条件。
5. 检查 Supabase service role key 是否只存在于 server-side 环境。
6. 不要把 signed URL 写到页面 HTML。

### 后台打不开

1. 检查 Supabase Auth 是否正常。
2. 检查 `admin_users` 是否包含当前管理员用户。
3. 检查 `/login?next=/dashboard` 登录后跳转。
4. 检查 Vercel 环境变量是否缺失公开 Supabase 配置变量名。
5. 不要绕过管理员校验。

## 后续维护节奏

建议后续每次小版本维护都先判断属于哪类工作：

1. 内容维护：管理员后台手动新增或完善 public 内容。
2. 文档维护：更新当前状态、路线、决策或工作流。
3. 安全维护：复查 public-only、Documents private、public attachment route 和退役路由。
4. 小 bug 修复：只修明确问题，不顺手扩功能。

默认不做框架级大改。首页精选区不从 #115 继续，public content sprint 暂时跳过。
