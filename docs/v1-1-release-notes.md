# v1.1 Release Notes - Personal Asset Intranet Polish

日期：2026-06-16

## 版本定位

v1.1 不是功能扩张版本，而是 Personal Asset Intranet 的收口 polish。

当前项目定位为：

> 黄铭语的个人长期资产沉淀主基地 / Personal Asset Intranet。

本轮重点是让已有资产模块更清楚、更可信、更适合长期使用：公开站点只展示 public 内容，后台继续作为私密管理区域，Documents 继续作为统一私密附件底座。

Agent CEO / 自动化扩张线暂停；不新增自动化中心、任务中心、runner 或外部集成主线。

## 已完成 polish

### 1. Boundary polish

- 收紧 public attachment download route，公开下载必须带当前资产上下文。
- 缺少或非法 `asset_type` / `asset_id` 时返回 404。
- 公开附件必须同时满足 document public、bucket 为 `workspace-files`、Storage path 安全、当前 asset public、document 与当前 asset 直接关联或通过 `document_asset_links` 关联。
- 移除无资产上下文时通过任意 public asset association 放行的分支。
- 清理 Dashboard 侧边栏的自动化 / 设置假入口，以及 Topbar 通知 / 主题占位按钮。
- 根级历史 `/automations` / `/settings` 占位页不再暗示未来自动化、主题或外部集成能力，只说明当前已暂停且不作为主入口维护。
- `.env.example` 删除 Market Brief 旧变量，并支持 `NEXT_PUBLIC_SITE_URL`。

### 2. Asset model clarity

- 明确 Project / Publication / Knowledge / Skill 四类资产定义。
- 新建 / 编辑表单、列表空状态和 AI Draft Lab 目标类型说明保持一致。
- Project 用于持续推进的研究、业务、开发或个人项目主题。
- Publication 用于已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容。
- Knowledge 用于可复用笔记、框架、概念解释、方法论和个人学习记录。
- Skill 用于可复用流程、Prompt 模板、操作手册、自动化方法和能力包。

### 3. Form consistency and AI prefill

- 复查 AI Draft Lab 到四类新建表单的 `sessionStorage` handoff。
- 预填提示条明确说明这是浏览器临时草稿：只预填，不自动保存、不自动创建资产、不自动公开。
- “填入表单”由管理员点击后才写入当前浏览器表单字段。
- “忽略并清除”只清除 handoff，不改表单。
- visibility 继续保持默认安全状态。

### 4. Search, listing, and mobile polish

- 打磨 `/dashboard/search` 的 metadata-only 搜索体验。
- 优化 Project / Publication / Knowledge / Skill 后台列表的信息层级、长标题、长摘要和标签换行。
- 优化 Documents 列表的小屏文件名、筛选区和批量工具栏可读性。
- 优化四类公开列表页的长文本、标签和 390px 移动端可用性。
- 搜索仍不读取 Documents 文件正文，不读取 Storage object，不做 OCR、AI 搜索或向量搜索。

### 5. v1.1.1 Documents collection-first polish

- `/dashboard/documents` 首页调整为文档包优先，先展示 document collections metadata，再展示独立文件。
- 独立文件定义为 `collection_id IS NULL`；已加入文档包的文件进入对应文档包详情页维护，不在默认首页重复展开。
- 文档包卡片展示标题、类型、文件数量、总大小、更新时间、根目录和关联摘要，并跳转现有文档包详情页。
- 签证、身份、生活、求职、合同等个人资料当前建议先通过文档包组织。
- Profile 真实文件关联暂不实现，不新增数据库类型、resolver、Profile 页面或权限边界。
- 本轮只查询 Documents / document collections metadata，不读取 Documents 文件正文，不读取 Storage object，不生成 signed URL，也不修改 public download route。

## 安全边界

v1.1 / v1.1.1 不包含以下改动：

- 不新增数据库表。
- 不新增 migration。
- 不修改 RLS。
- 不修改 Storage policy。
- 不修改 Supabase bucket visibility。
- 不把 `workspace-files` bucket 改 public。
- 不读取 Documents 文件正文。
- 不读取 Storage object。
- 不生成新的公开 signed URL 能力。
- 不新增 AI 搜索、OCR、向量搜索或 Documents 问答。
- 不新增 Agent CEO 页面。
- 不新增自动化中心、任务中心或复盘中心。
- 不恢复 Market Brief。
- 不恢复 `/access-request`、`/viewer/login`、`/viewer/callback`、Access Grants、Viewer magic link 或 restricted 外部访问。
- 不恢复 sidebar 的自动化 / 设置假入口。
- 不恢复 topbar 通知 / 主题假按钮。
- 不引入新的 secret。

历史文档中如果出现 Market Brief、Access Grants、Viewer、restricted、Agent CEO 或自动化扩张相关词，应按“已退役 / 已暂停 / 不恢复”语境理解；不要把它们作为当前功能或近期路线。

## 后续建议

v1.1 之后建议进入稳定使用期：

1. 持续录入真实 Project / Publication / Knowledge / Skill 资产。
2. 观察四类资产分类是否足够清楚，再做小范围文案或 helper text 修正。
3. 继续使用 AI Draft Lab 处理原始想法、会议摘录和研究笔记，但保持人工检查与手动保存。
4. 继续观察搜索、Documents 文件中心和 390px 移动端体验。
5. 后续 PR 默认只做 bugfix、明显 UX polish、文档同步和安全边界复查。
6. Agent CEO / 自动化 / Notion / 飞书 / Gmail 等外部集成不进入近期路线。

## 收尾 QA

每次相关 PR 继续运行：

```bash
npm run lint
npm run build
PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public
git diff --check
git diff --cached --check
```

同时复查：

- 公开页面只展示 public 内容。
- Dashboard 仍需登录。
- Sidebar 不显示自动化 / 设置假入口。
- Topbar 不显示通知 / 主题假按钮。
- AI Draft Lab 不读取 Documents / Storage。
- AI Draft Lab handoff 只预填，不保存、不创建资产、不修改 visibility。
- public attachment 下载必须带合法当前资产上下文。
- 390px 移动端无横向滚动。
