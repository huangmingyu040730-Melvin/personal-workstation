# AI Content Copilot

日期：2026-06-15

用途：

- 记录 Phase 3A 后台 AI 内容助手的功能定位、输入字段白名单、输出结构、安全边界、环境变量和验收步骤。

## 功能定位

AI Content Copilot 是管理员后台的低风险内容整理助手，用于辅助整理 Project、Publication、Knowledge 和 Skill 的公开摘要、标签、内容结构和 public readiness 风险提示。

它只生成建议：

- 不自动保存数据库。
- 不自动公开内容。
- 不修改 `visibility`。
- 不读取 Documents 文件正文。
- 不读取 Storage object。
- 不生成 signed URL。
- 不面向公开访客。

AI 输出仅供管理员参考，由管理员人工复制、采纳、修改或忽略。

## 支持的资产类型

当前支持：

1. Project。
2. Publication。
3. Knowledge。
4. Skill。

入口位于四类资产的后台详情页，靠近 public readiness checklist。

## 输入字段白名单

Server Action 只接收 `asset_type` 和 `asset_id`，然后在服务端按白名单重新读取当前资产字段。客户端不能提交任意 prompt 或完整资产内容。

### Project

允许字段：

- `title`
- `summary`
- `background`
- `research_question`
- `methodology`
- `tags`
- `status`
- `visibility`

### Publication

允许字段：

- `title`
- `publication_type`
- `summary`
- `abstract`
- `tags`
- `visibility`
- `published_on`

不读取历史 `file_path`、`cover_url` 或附件关系。

### Knowledge

允许字段：

- `title`
- `category`
- `excerpt`
- `content`
- `tags`
- `visibility`

### Skill

允许字段：

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

Skill package、Documents、附件、代码包和 Storage object 不进入 AI 输入。

## 输出结构

模型被要求输出 JSON object。UI 会做 parse fallback，避免模型格式错误导致页面崩溃。

当前结构：

```json
{
  "title_suggestions": [],
  "summary_suggestions": [],
  "tag_suggestions": [],
  "public_readiness_notes": [],
  "sensitive_risks": [],
  "missing_fields": [],
  "next_steps": []
}
```

如果模型返回非 JSON 文本，后台会以原始文本方式展示，并提示管理员人工复核。

## 安全边界

必须保持：

- AI 功能只在管理员后台出现。
- 公开页面不出现 AI 按钮或 AI 输出。
- AI 不自动保存、不自动公开、不修改 visibility。
- AI 不读取 Documents 文件正文。
- AI 不读取 Storage object。
- AI 不生成 signed URL。
- AI 不修改 Documents 上传、删除、zip 下载。
- AI 不修改 `/public-files/[id]/download`。
- AI 不修改 RLS 或 Storage policy。
- AI 不恢复 access request、viewer、Access Grants 或 restricted 外部授权。
- AI 不恢复 `/dashboard/network` 或 Market Brief。

Prompt 要求模型使用中文、专业、克制、研究型表达，不编造事实、论文、客户案例、产品数据、学历、经历或研究结论，不生成业绩承诺或夸大营销文案。

## 环境变量

复用现有 OpenAI-compatible / DeepSeek 配置：

- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

兼容旧 OpenAI 配置：

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

未配置 API key 时，后台页面仍可打开，AI 面板显示“AI 内容助手尚未配置”，不会崩溃。

不要把完整 key 粘贴到文档、PR、日志或客户端代码中。

## 验收步骤

1. 未配置 AI 环境变量时，后台页面不崩溃，并显示安全降级提示。
2. 管理员登录后，在 Project 详情页可以看到 AI 内容助手。
3. 管理员登录后，在 Publication 详情页可以看到 AI 内容助手。
4. 管理员登录后，在 Knowledge 详情页可以看到 AI 内容助手。
5. 管理员登录后，在 Skill 详情页可以看到 AI 内容助手。
6. 点击生成建议后，AI 只返回建议，不自动保存。
7. AI 建议不自动修改 visibility。
8. AI 不读取 Documents。
9. AI 不生成 signed URL。
10. 公开页面没有 AI 按钮或 AI 输出。
11. `npm run smoke:public` 仍通过。
12. Documents、public attachment 下载、sitemap 和 robots 不受影响。

## 明确不做

本阶段不做：

- 公开 AI 聊天。
- 访客 AI 功能。
- AI 文档问答。
- OCR。
- PDF 解析。
- 向量搜索。
- 全文搜索。
- 自动摘要公开发布。
- 自动修改数据库。
- 自动改 visibility。
- 自动创建 Project / Publication / Knowledge / Skill。
- 读取 Documents 文件正文。
- 读取 Storage object。
- 生成 signed URL。
- public zip 下载。
- 支付 / 会员 / 外部授权访问。
