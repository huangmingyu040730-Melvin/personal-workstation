# AI Draft Form Copilot

日期：2026-06-16

## 阶段定位

AI Draft Form Copilot 是管理员后台表单内的草稿补全助手，不是公开 AI 聊天，也不是详情页事后点评工具。

阶段状态：

- Phase 3A-R：Project 新建 / 编辑表单已完成。
- Phase 3A-S：Publication / Knowledge / Skill 新建 / 编辑表单已完成。
- Phase 3A-T：四类表单助手已支持生成模式切换：补全空字段、优化已有内容、公开风险检查。
- #118 的详情页事后点评式 AI Content Copilot 已关闭且不合并；后续不要恢复该方向。

与 Phase 3B AI 草稿实验室的区别：

- AI Draft Form Copilot 运行在 Project / Publication / Knowledge / Skill 新建与编辑表单内，读取当前浏览器表单的字段白名单，并可把建议采用到当前表单。
- AI 草稿实验室运行在独立后台页面 `/dashboard/ai-drafts`，只接收 `targetType` 与一段管理员粘贴的 `rawText`，输出结构化草稿；Phase 3B-1 起可把结果临时保存到当前浏览器 `sessionStorage`，由管理员确认后预填对应新建表单。
- 两者都不自动提交表单、不保存数据库、不创建资产、不自动公开、不读取 Documents / Storage，也不修改 public download route。

支持入口：

- `/dashboard/projects/new`
- `/dashboard/projects/[id]/edit`
- `/dashboard/publications/new`
- `/dashboard/publications/[id]/edit`
- `/dashboard/knowledge/new`
- `/dashboard/knowledge/[id]/edit`
- `/dashboard/skills/new`
- `/dashboard/skills/[id]/edit`

## 解决的问题

管理员在创建或编辑研究资产时，常常已经写了一部分标题、摘要、正文或说明，但还需要补齐结构化字段、标签、公开准备度和风险提示。

AI Draft Form Copilot 的目标是：

1. 根据当前浏览器表单草稿补全未填写字段。
2. 优化已有字段表达。
3. 生成标签、结构和下一步建议。
4. 给出 public / private 风险提示。
5. 让管理员可以复制建议，或采用到浏览器表单字段。

采用建议只更新浏览器表单：

- 不自动提交表单。
- 不自动保存数据库。
- 不自动创建内容。
- 不自动修改 `visibility`。
- 不自动公开内容。

## 生成模式

Phase 3A-T 后，每个助手都在同一个右侧面板内提供三种模式。切换模式只改变 AI 生成策略和进度文案，不改动当前表单、不自动保存，也不新增任何数据库或权限行为。

| mode | 中文名称 | 适用场景 | 输出重点 |
| --- | --- | --- | --- |
| `complete_missing` | 补全空字段 | 新建内容或草稿字段不完整 | 优先补缺口，完整字段只轻微优化，同时保留公开准备度和风险提示 |
| `improve_existing` | 优化已有内容 | 管理员已经写了较多内容，需要语言和结构 polish | 保留原意，优化表达、结构和清晰度，不新增未经提供的事实 |
| `public_safety_check` | 公开风险检查 | 准备把内容设为 public 前做人工复核 | 优先输出公开准备度、敏感信息风险和下一步整改建议；正文草稿字段可以为空 |

默认模式是 `complete_missing`。Server Action request schema 对 `mode` 提供默认值，因此旧调用仍会按补全空字段处理。

`public_safety_check` 模式会在结果区优先展示：

- 公开准备度提示。
- 敏感信息风险。
- 下一步完善建议。

风险检查重点包括客户信息、内部资料、未脱敏数据、产品敏感信息、业绩承诺、收益暗示、未验证金融数据、文件路径、secret、API key 和内部链接。AI 只提供人工复核提示；是否保持 private、继续脱敏或公开仍由管理员判断。

## 输入字段白名单

客户端只提交 `mode` 与结构化白名单字段，不提交任意 prompt。`mode` 只能是 `complete_missing`、`improve_existing` 或 `public_safety_check`。

### Project

- `title`
- `summary`
- `background`
- `research_question`
- `methodology`
- `tags`
- `status`
- `visibility`
- `milestones`
- `progress`
- `start_date`
- `end_date`

### Publication

- `title`
- `publication_type`
- `summary`
- `abstract`
- `tags`
- `visibility`
- `published_on`
- `project_id`

不读取 `file_path`、`cover_url`、Documents、Storage、signed URL、raw relation rows、owner_id 或 private attachment metadata。

### Knowledge

- `title`
- `category`
- `excerpt`
- `content`
- `tags`
- `visibility`
- `project_id`

不读取 Documents、Storage object、raw relation rows、owner_id 或 private attachment metadata。

### Skill

- `name`
- `description`
- `category`
- `content`
- `input_description`
- `output_description`
- `usage_guide`
- `platforms`
- `current_version`
- `visibility`
- `status`

不读取 Skill package、Documents、uploaded code、zip 内容、Storage object、signed URL 或 raw attachment metadata。

## 输出结构

AI 必须返回 JSON object，不使用 Markdown 代码围栏。

### Project

```json
{
  "summary_draft": "",
  "background_draft": "",
  "research_question_draft": "",
  "methodology_draft": "",
  "tag_suggestions": [],
  "research_flow_steps": [],
  "milestone_suggestions": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

### Publication

```json
{
  "title_suggestions": [],
  "summary_draft": "",
  "abstract_draft": "",
  "tag_suggestions": [],
  "publication_positioning": [],
  "structure_suggestions": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

### Knowledge

```json
{
  "title_suggestions": [],
  "excerpt_draft": "",
  "content_outline": [],
  "content_draft": "",
  "tag_suggestions": [],
  "category_suggestions": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

### Skill

```json
{
  "name_suggestions": [],
  "description_draft": "",
  "content_draft": "",
  "input_description_draft": "",
  "output_description_draft": "",
  "usage_guide_draft": "",
  "platform_suggestions": [],
  "current_version_suggestion": "",
  "workflow_steps": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

如果模型返回非 JSON 文本，页面只展示原始文本并提示人工复核，不自动写入表单。

## 采用建议到表单

Project 支持采用：

- `summary`
- `background`
- `research_question`
- `methodology`
- `tags`
- `milestones`

Publication 支持采用：

- `title`
- `summary`
- `abstract`
- `tags`

Knowledge 支持采用：

- `title`
- `excerpt`
- `content`
- `tags`
- `category`，仅在建议值能匹配当前表单 select option 时写回。

Skill 支持采用：

- `name`
- `description`
- `content`
- `input_description`
- `output_description`
- `usage_guide`
- `platforms`，只写回当前表单已有 checkbox 平台。
- `current_version`，仅来自 `current_version_suggestion` 且由管理员点击采用。

所有模块都不自动修改：

- `visibility`
- 关联 Project。
- Documents / attachment。
- `is_featured`。
- `status`。

## Prompt 边界

Prompt 要求模型：

- 使用中文。
- 风格专业、克制、研究型。
- 按当前 `mode` 调整生成策略：补缺、优化或公开风险检查。
- 不编造事实、论文、客户案例、产品数据、学历、经历或研究结论。
- 不生成业绩承诺、收益暗示或夸大营销文案。
- 信息不足时只生成建议草稿或待补充方向。
- 涉及客户、内部资料、未脱敏数据或产品敏感信息时，建议保持 private。
- 明确 AI 输出仅供管理员人工确认。
- 不提及 Documents、Storage、signed URL、下载链接、API key 或 service role key。

## 环境变量

复用现有 OpenAI-compatible Provider 配置：

- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

兼容旧变量：

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

未配置 API key 时：

- 新建 / 编辑表单仍正常显示。
- 生成模式控件仍可显示，但不会触发 AI 请求。
- AI 草稿助手显示“尚未配置”。
- 生成按钮禁用。
- 页面不崩溃。

## 安全边界

本阶段不做：

- 不做公开 AI 聊天。
- 不做访客 AI 功能。
- 不做 AI 文档问答。
- 不做 OCR。
- 不做 PDF 解析。
- 不做向量搜索。
- 不做全文搜索。
- 不做自动发布。
- 不自动保存数据库。
- 不自动改 `visibility`。
- 不自动创建内容。
- 不把公开风险检查结果作为自动发布依据。
- 不读取 Documents 文件正文。
- 不读取 Storage object。
- 不生成 signed URL。
- 不修改 Documents 上传 / 删除 / zip 下载。
- 不修改 `/public-files/[id]/download`。
- 不新增 migration。
- 不改 RLS。
- 不改 Storage policy。
- 不恢复 access request。
- 不恢复 viewer login。
- 不恢复 Access Grants。
- 不恢复 restricted 外部授权。
- 不恢复 `/dashboard/network`。
- 不恢复 Market Brief。
- 不重做首页。

## 验收

验证命令：

```bash
npm run lint
npm run build
PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public
git diff --check
git diff --cached --check
```

当前项目没有独立 `typecheck` script；`npm run build` 覆盖 Next.js / TypeScript 构建检查。
