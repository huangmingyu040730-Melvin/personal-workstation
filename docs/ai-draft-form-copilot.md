# AI Draft Form Copilot

日期：2026-06-15

## 阶段定位

Phase 3A-R 是后台表单 AI 草稿助手，当前只完整支持 Project 新建 / 编辑表单：

- `/dashboard/projects/new`
- `/dashboard/projects/[id]/edit`

本阶段取代 #118 的详情页事后点评式 AI 方向。#118 不合并，原因是它更像内容创建完成后的点评助手，不能直接提升新建或编辑草稿时的效率。

## 解决的问题

管理员在创建或编辑 Project 时，常常已经写了一部分标题、简介、研究背景或研究问题，但还需要补齐摘要、方法、标签、研究流程和阶段计划。

AI Draft Form Copilot 的目标是：

1. 根据当前表单草稿补全未填写字段。
2. 优化已有字段表达。
3. 生成标签建议。
4. 生成研究流程 / 实验流程。
5. 生成阶段计划。
6. 给出 public / private 风险提示。
7. 给出下一步完善建议。

## 输入字段白名单

客户端只提交结构化白名单字段，不提交任意 prompt。

Project 当前允许输入：

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

这些字段来自当前浏览器表单草稿，不要求 Project 已经保存到数据库。

AI 不读取：

- Documents。
- Storage object。
- `storage_path`。
- `file_path`。
- `owner_id`。
- raw relation rows。
- private file metadata。
- signed URL。
- API key。
- Supabase service role key。

## 输出结构

AI 必须返回 JSON object，结构如下：

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

含义：

- `summary_draft`：根据标题和已填信息生成或优化简介。
- `background_draft`：补充研究背景建议。
- `research_question_draft`：优化研究问题。
- `methodology_draft`：补充研究方法 / 分析路径。
- `tag_suggestions`：标签建议。
- `research_flow_steps`：研究流程 / 实验流程。
- `milestone_suggestions`：阶段任务或研究推进计划。
- `public_readiness_notes`：公开准备度提示。
- `sensitive_risks`：敏感信息风险。
- `next_steps`：下一步完善建议。

如果模型返回非 JSON 文本，页面只展示原始文本并提示人工复核，不自动写入表单。

## 采用建议到表单

Project 表单内支持：

- 复制建议。
- 将 summary / background / research_question / methodology 建议采用到对应表单字段。
- 将标签建议采用到 `tags` 字段。
- 将阶段计划采用到 `milestones` 字段。

采用建议只更新浏览器中的表单字段：

- 不自动提交表单。
- 不自动保存数据库。
- 不自动创建 Project。
- 不自动修改 `visibility`。
- 不自动公开内容。

管理员仍需人工复核后点击保存。

## Prompt 边界

Prompt 要求模型：

- 使用中文。
- 风格专业、克制、研究型。
- 不编造事实、论文、客户案例、产品数据、学历、经历或研究结论。
- 不生成业绩承诺、收益暗示或夸大营销文案。
- 信息不足时只生成建议草稿或待补充方向。
- 涉及客户、内部资料、未脱敏数据或产品敏感信息时，建议保持 private。
- 明确 AI 输出仅供管理员人工确认。

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

- Project 新建 / 编辑表单仍正常显示。
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
- 不自动创建 Project。
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

## 后续方向

Publication / Knowledge / Skill 表单 AI 草稿助手可以在后续阶段扩展，但本阶段不为了覆盖四类资产增加复杂度。当前优先把 Project 新建 / 编辑表单体验做扎实。
