# Public Content Operations

日期：2026-06-14

## 公开内容运营目标

Phase 2R-D-1 的目标是让公开研究工作站进入可持续运营状态：管理员在后台整理 Project、Publication、Knowledge 和 Skill 时，可以快速判断一条内容是否已经适合设为 `public`。

本阶段只新增后台轻量 checklist 和文档说明。checklist 基于现有字段与既有附件关联数量判断，只提示、不阻止保存、不自动修改 `visibility`，也不自动公开正文或附件。

## 什么内容适合 public

适合公开展示的内容通常满足：

- 已有清晰标题、slug、摘要或公开说明。
- 内容本身适合陌生访客理解，不依赖后台上下文。
- 标签、分类、成果类型、状态或日期等 metadata 足够帮助访客判断范围。
- Project 能说明研究问题、背景、方法和进展。
- Publication 能说明成果类型、摘要、发布日期或更新时间，并尽量关联来源 Project。
- Knowledge 能提供分类、摘要和正文说明。
- Skill 能说明用途、适用场景和使用说明，但不把文件包当成公开下载能力。

## 什么内容应该 private / restricted

应保持 `private` 或 `restricted` 的内容包括：

- 尚未整理、摘要不足、结论未确认或不适合对外展示的草稿。
- 含有私人身份信息、内部备注、未公开合作信息、敏感研究材料或不可公开数据来源的内容。
- 仅供授权访客查看的正文，可考虑 `restricted`，但仍不自动开放 Documents。
- 附件、数据文件、代码包、Skill package、原始资料和文档包默认保持 private。

`unlisted` 当前仍保持保守，不作为公开列表内容运营目标。

## Project 公开发布检查清单

发布 Project 前建议检查：

- `visibility` 是否为 `public`。
- 是否有稳定 slug、标题和公开摘要。
- 是否有标签。
- 是否填写研究问题、研究背景和研究方法。
- 是否有状态和进度说明。
- 是否有关联 Publication、Knowledge 或 Skill，帮助访客理解研究脉络。
- 如需展示附件，是否存在与当前 Project 关联且 `visibility = 'public'` 的文件。
- public 字段中是否避免写入私密信息、Storage 路径、owner_id 或内部备注。

## Publication 公开发布检查清单

发布 Publication 前建议检查：

- `visibility` 是否为 `public`。
- 是否有稳定 slug、标题、成果类型和摘要。
- 是否有 abstract 或足够的成果说明。
- 是否有发布日期或更新时间。
- 是否有标签。
- 是否关联来源 Project。
- 如需展示论文、报告或补充材料，是否存在与当前 Publication 关联且 `visibility = 'public'` 的文件。
- public 字段中是否避免写入历史 `file_path`、Storage 路径、signed URL、owner_id 或内部备注。

## Knowledge 公开发布检查清单

发布 Knowledge 前建议检查：

- `visibility` 是否为 `public`。
- 是否有稳定 slug、标题、分类和摘要。
- 是否有足够正文或公开说明。
- 是否有标签或清晰分类。
- 是否关联来源 Project。
- 是否明确：Knowledge 公开详情页不展示 Documents。
- public 字段中是否避免写入私密资料、Storage 路径、owner_id 或内部备注。

## Skill 公开发布检查清单

发布 Skill 前建议检查：

- `visibility` 是否为 `public`。
- 是否有稳定 slug、名称、分类和公开说明。
- 是否有使用说明或公开正文。
- 是否说明适用场景、平台、输入或输出。
- 是否明确这是公开说明页，不是 Skill 包下载页。
- 是否明确 Skill 文件不展示、不下载、不执行、不安装、不解析。
- public 字段中是否避免写入私密配置、路径、密钥、内部备注或不可公开提示词。

## 公开附件发布边界

公开附件只适用于 Project / Publication 公开详情页。

必须同时满足：

- 内容记录本身为 `public`。
- 文件记录 `documents.visibility = 'public'`。
- 文件属于 private `workspace-files` bucket。
- 文件通过 `document_asset_links` 或 legacy `related_type / related_id` 关联到当前 public Project / Publication。
- 公开页面只展示安全摘要字段和 `/public-files/[id]/download` 入口。
- 下载 route 在服务端重新校验 public 文件、public 资产和关联关系，然后按需生成短时 signed URL。

Knowledge / Skill 公开详情页不展示 Documents。Skill package、代码包和压缩包只作为后台资料存储，不公开下载、不执行、不安装、不解析。

## 访问申请处理边界

访问申请用于表达访客希望查看更多研究材料，不等于授权。

- 公开详情页和 fallback 只能使用内容类型、slug、公开标题和来源 URL 生成申请上下文。
- fallback 不确认 private / restricted / unlisted 内容是否真实存在。
- 申请提交后状态为 `pending`，不会自动创建 Access Grant。
- `approved` 只代表申请处理状态，不自动开放 restricted/private 正文。
- 访问申请不开放 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL。
- 如需授权 restricted 内容，管理员仍需在后台手动创建 Access Grant。

## 发布前 QA 步骤

发布公开内容前建议：

1. 在后台详情页查看“公开发布准备度” checklist。
2. 补齐标题、slug、摘要、分类、标签、正文或说明。
3. 确认 `visibility` 是否确实应设为 `public`。
4. 检查 public 字段不包含私密信息、Storage 路径、signed URL、owner_id 或内部备注。
5. Project / Publication 如需附件，确认文件为 public 且关联当前 public 内容。
6. 打开对应公开详情页，确认展示内容和访问申请 CTA 正常。
7. 运行 `npm run lint`、`npm run build`、`git diff --check`。
8. 发布前启动本地服务并运行 `npm run smoke:public`，确认公开主链路、fallback、sitemap 和 robots 仍通过。

## 本阶段没有改变的安全边界

Phase 2R-D-1 没有新增数据库字段、migration、RLS、Storage policy、邮件服务、审批流、AI 摘要、OCR、向量搜索、全文索引、PDF 预览、public zip 下载、支付或会员能力。

本阶段没有修改：

- Documents 上传、删除、zip 下载。
- `/public-files/[id]/download` route。
- Access Grants 核心权限。
- public 页面查询边界。
- `workspace-files` private bucket。
- Knowledge / Skill 公开详情页不展示 Documents 的规则。
- Skill 不展示 package、不下载、不执行、不安装、不解析文件的规则。
