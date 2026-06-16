# AI Raw Note Draft Lab

日期：2026-06-16

## 阶段定位

Phase 3B 新增 AI 草稿实验室，用于把一段原始想法、研究笔记、会议摘录或粗糙文本转换成结构化后台内容草稿。

它不是表单内 AI Draft Form Copilot。区别是：

- AI Draft Form Copilot：在 Project / Publication / Knowledge / Skill 新建或编辑表单内，读取当前浏览器表单白名单字段，帮助补全或优化当前表单。
- AI Raw Note Draft Lab：在独立后台页面 `/dashboard/ai-drafts` 中，读取管理员粘贴的一段原始文本，输出可复制的结构化草稿。

两者共同边界：

- 不自动保存数据库。
- 不自动创建内容记录。
- 不自动修改 `visibility`。
- 不自动公开内容。
- 不读取 Documents 或 Storage。
- 不生成 signed URL 或下载链接。
- 不向公开访客开放。

## 页面入口

后台页面：

- `/dashboard/ai-drafts`

后台入口：

- 侧边栏 `AI 工作空间` 下的 `AI 草稿`。
- Dashboard 快速入口 `AI 草稿`。

公开导航、sitemap 和 robots 不新增 AI 草稿入口。

## 输入白名单

Server Action 只接受：

```json
{
  "targetType": "project",
  "rawText": ""
}
```

`targetType` 只能是：

- `project`
- `publication`
- `knowledge`
- `skill`

`rawText` 最多 10000 个字符，最少 20 个字符。

服务端会拦截明显包含以下内容的 rawText：

- `service_role`
- `api key`
- `secret`
- `signed URL`
- `storage_path`
- `storage_bucket`
- `owner_id`
- `file_path`
- `workspace-files`
- `/public-files/`
- 常见 API key 形态

页面同时提示管理员不要粘贴客户敏感信息、API key、runner secret、Supabase service role key、未脱敏内部资料、Storage path、signed URL 或私密文件正文。

## 输出结构

### Project

```json
{
  "title": "",
  "summary": "",
  "background": "",
  "research_question": "",
  "methodology": "",
  "tags": [],
  "milestones": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

### Publication

```json
{
  "title": "",
  "publication_type_suggestion": "",
  "summary": "",
  "abstract": "",
  "tags": [],
  "structure_suggestions": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

### Knowledge

```json
{
  "title": "",
  "category_suggestion": "",
  "excerpt": "",
  "content_outline": [],
  "content_draft": "",
  "tags": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

### Skill

```json
{
  "name": "",
  "category_suggestion": "",
  "description": "",
  "content": "",
  "input_description": "",
  "output_description": "",
  "usage_guide": "",
  "platforms": [],
  "workflow_steps": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "next_steps": []
}
```

如果模型返回非 JSON 文本，页面只展示原始文本并提示人工复核，不自动写入任何表单或数据库。

## Phase 3B-1 表单预填

Phase 3B-1 后，结构化草稿结果区增加“带入新建表单”按钮：

- Project：带入新建 Project 表单。
- Publication：带入新建 Publication 表单。
- Knowledge：带入新建 Knowledge 表单。
- Skill：带入新建 Skill 表单。

按钮行为：

1. 把当前结构化草稿保存到当前浏览器标签页的 `sessionStorage`。
2. 跳转到对应新建页：`/dashboard/projects/new`、`/dashboard/publications/new`、`/dashboard/knowledge/new` 或 `/dashboard/skills/new`。
3. 新建页显示“检测到 AI 草稿”提示条。
4. 管理员点击“填入表单”后，草稿才会写入浏览器表单字段。
5. 填入后立即清除 `sessionStorage` 中这份 handoff，避免刷新后重复误填。
6. 管理员仍需人工检查并手动点击保存。

提示条文案应明确这是 AI Draft Lab 带入的浏览器临时草稿；点击“填入表单”只预填当前浏览器表单字段，不自动保存、不自动创建资产、不自动公开内容。

管理员也可以点击“忽略并清除”，清除 `sessionStorage` 且不改动表单。

字段映射：

- Project：`title`、`summary`、`background`、`research_question`、`methodology`、`tags`、`milestones`。
- Publication：`title`、`summary`、`abstract`、`tags`；`publication_type_suggestion` 只有能匹配现有 option value 或 label 时才填入，匹配时允许大小写或多余空格差异。
- Knowledge：`title`、`excerpt`、`content_draft` 到 `content`、`tags`；`category_suggestion` 只有能匹配现有分类 option 时才填入，匹配时允许大小写或多余空格差异。
- Skill：`name`、`description`、`content`、`input_description`、`output_description`、`usage_guide`、`platforms`；`category_suggestion` 和 `platforms` 只有能匹配现有选项时才填入，匹配时允许大小写或多余空格差异。

不映射：

- `public_readiness_notes`
- `sensitive_risks`
- `next_steps`
- `visibility`
- Project relation
- status
- Skill package
- Documents

## Prompt 边界

Prompt 要求模型：

- 使用中文。
- 风格专业、克制、研究型。
- 只基于管理员提供的 `rawText` 生成草稿。
- 不编造事实、论文、客户案例、产品数据、学历、经历、研究结论或业绩。
- 不生成收益暗示、业绩承诺或夸大营销文案。
- 信息不足时，只能写“建议补充”或留空，不能伪装成已验证事实。
- 如原文含客户、内部资料、未脱敏数据、产品敏感信息，应在 `sensitive_risks` 中提示。
- AI 输出仅供管理员人工确认。
- 不自动保存、不自动公开。

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

- `/dashboard/ai-drafts` 正常显示。
- 页面显示“AI 草稿实验室尚未配置”。
- 生成按钮禁用。
- 不影响其他后台页面。

## 安全边界

本阶段不做：

- 不自动创建数据库记录。
- 不自动保存草稿。
- 不自动提交新建表单。
- 不通过 prefill 自动保存或自动创建资产。
- 不新增草稿表。
- 不新增 migration。
- 不改 RLS。
- 不改 Storage policy。
- 不读取 Documents 文件正文。
- 不读取 Storage object。
- 不生成 signed URL。
- 不修改 `/public-files/[id]/download`。
- 不做公开 AI 聊天。
- 不做访客 AI 功能。
- 不做 AI 文档问答。
- 不做 OCR。
- 不做 PDF 解析。
- 不做向量搜索。
- 不做全文搜索。
- 不恢复 access request。
- 不恢复 viewer login。
- 不恢复 Access Grants。
- 不恢复 restricted 外部授权。
- 不恢复 `/dashboard/network`。
- 不恢复 Market Brief。
- 不恢复 #118 详情页 AI Content Copilot。
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
