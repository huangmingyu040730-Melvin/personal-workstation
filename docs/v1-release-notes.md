# v1.0 Release Notes

日期：2026-06-15

## 版本定位

v1.0 将个人数字化工作台收口为：

- 公开研究工作站：对外展示明确设为 `public` 的研究项目、学术成果、知识笔记、Skill / 工作流和个人简介。
- 管理员私密后台：只供管理员本人维护内容、文件、日程、Profile、Resume / Career 等工作流。
- Documents 私密文件中心：作为 Project / Publication / Knowledge / Skill 的统一默认私密附件底座。
- public 内容展示：公开首页、About、四类公开列表页和四类公开详情页只读展示 public 内容。
- Project / Publication public attachments 安全下载：仅在符合公开附件边界时展示，并通过 `/public-files/[id]/download` 服务端校验后短时下载。

v1.0 不合并 PR #115，不推进 Phase 2R-F-2 homepage featured content polish，首页保持当前 `main` 的主结构。

## 公开站点能力

- 首页 `/`：公开研究工作站入口，展示站点定位、研究方向、公开内容预览和公开导航。
- About `/about`：正式公开个人简介页，展示个人定位、研究方向、工作站说明、技能 / 工具方向、公开内容导航和保守联系方式。
- Projects `/projects` 与 `/projects/[slug]`：公开研究项目列表和详情。
- Publications `/publications` 与 `/publications/[slug]`：公开学术成果列表和详情。
- Knowledge `/knowledge` 与 `/knowledge/[slug]`：公开知识库列表和详情。
- Skills `/skills` 与 `/skills/[slug]`：公开 Skill / 工作流列表和详情。
- SEO / sitemap / robots / metadata / OG：公开页面使用统一站点模板、canonical、Open Graph / Twitter card 和公开安全图片；sitemap 只收录公开静态入口和 public 详情页；robots 阻止敏感路径。
- 公开附件展示：仅限 public Project / Publication 详情页，且只展示安全摘要和 `/public-files/[id]/download` 入口。

## 后台能力

- Dashboard：管理员工作台概览。
- Projects 管理：真实 CRUD、研究项目中枢、相关 Knowledge / Publication、私密附件和显式资产关系。
- Publications 管理：真实 CRUD、成果中枢、关联 Project、私密材料、同项目 Knowledge 和显式资产关系。
- Knowledge 管理：真实 CRUD、知识节点详情、关联 Project、私密资料和显式资产关系。
- Skills 管理：真实 CRUD、能力包 / 工作流包详情、版本记录、私密资料和显式资产关系。
- Documents 文件中心：私密文件上传、metadata 维护、批量操作、删除和临时 zip 下载。
- 多资产文件关联：文件和文档包可关联 Project / Publication / Knowledge / Skill，并保留 legacy primary relation 兼容。
- 文档包：支持多文件 / 文件夹上传、文档包详情、整体关联迁移 / 同步和文档包 zip。
- public readiness checklist：四类后台详情页提供公开发布准备度提示，只提示、不阻止保存、不自动公开内容或附件。
- Profile / Calendar / Career / Resume：Profile 公开字段维护、站内日程、Resume 素材与版本、AI JD 建议、投递看板和 Career Center 维持现有稳定能力。

## 安全边界

- 公开页面只展示 `visibility = 'public'` 的内容。
- private / unlisted 内容不公开；未公开 slug fallback 不确认内容是否真实存在。
- restricted 外部授权功能已移除；历史 restricted 内容通过 0022 迁移回写 private。
- Access Request 已移除。
- Access Grants 已移除。
- Viewer magic link 已移除。
- Documents 默认 private。
- `workspace-files` bucket 保持 private。
- Knowledge / Skill 公开详情页不展示 Documents。
- Skill package 不展示、不下载、不执行、不安装、不解析。
- public file download route 不把 signed URL 写入页面 HTML。
- public attachment 必须同时满足：
  - document 为 public。
  - asset 为 public。
  - document 关联当前 asset。
  - bucket 是 `workspace-files`。
  - 服务端校验通过后生成短时 signed URL。

公开页面不得输出 Storage path、`storage_path`、`file_path`、`owner_id`、signed URL、raw document links、后台关系管理数据或 secret。

## 已退役功能

以下能力在 v1.0 中明确退役，不作为后续 hotfix 或默认路线恢复：

- Market Brief 产品入口、API、runner、素材包、数据探针和推荐环境变量。
- `/dashboard/network` 全局关系图谱页面。
- Access Request。
- Access Grants。
- Viewer magic link。
- restricted 外部授权访问。

## 当前不做的事项

v1.0 不包含：

- AI 摘要。
- OCR。
- 向量搜索。
- 全文搜索。
- PDF 在线预览。
- public zip 下载。
- 外部会员 / 支付 / 授权访问。
- 恢复 access request / viewer / grants。
- 恢复 dashboard network。
- 恢复 market brief。
- 重做首页精选区或推进 Phase 2R-F-2。

## v1.0 验收清单

发布前可复制以下 checklist：

- [ ] 首页 `/` 正常，保持当前 `main` 首页主结构。
- [ ] About `/about` 正常。
- [ ] `/projects`、`/publications`、`/knowledge`、`/skills` 四类 public 列表正常。
- [ ] 四类 public 详情页正常。
- [ ] 不存在或非 public slug fallback 不确认 private / unlisted 内容真实存在。
- [ ] public Project / Publication 附件展示与 `/public-files/[id]/download` 下载正常。
- [ ] Knowledge / Skill 公开详情页不展示 Documents。
- [ ] Skill package 不展示、不下载、不执行、不安装、不解析。
- [ ] sitemap 包含 `/`、`/about`、四类公开列表和 public 详情页。
- [ ] sitemap 不包含 `/access-request`、`/viewer`、`/dashboard`、`/api`、`/public-files`、private / unlisted 内容、signed URL 或 Storage path。
- [ ] robots 阻止 `/dashboard`、`/api`、`/viewer`、`/access-request`、`/public-files`、`/login`、`/storage` 和 `/signed`。
- [ ] public HTML 不出现 signed URL、`storage_path`、`file_path`、`owner_id` 或 raw document links。
- [ ] 后台 Dashboard 正常。
- [ ] Documents 文件中心正常。
- [ ] Project / Publication / Knowledge / Skill 后台详情页 public readiness checklist 正常。
- [ ] `/access-request`、`/viewer/login`、`/viewer/callback`、`/dashboard/access-requests`、`/dashboard/access-grants` 不作为产品入口存在。
- [ ] Documents、Storage policy、RLS、public download route 未被本轮修改。

## 本轮 Final QA

Phase 2R-G-1 的本轮 QA 重点：

- PR #115 已关闭且未合并。
- 本轮不改首页主结构、不重构公开页、不新增功能。
- 公开 smoke 覆盖公开入口、fallback、sitemap、robots、公开详情和退役路由不可用性。
- 本地构建验证继续使用 `npm run lint`、`npm run build`、运行中站点的 `npm run smoke:public`、`git diff --check` 和 `git diff --cached --check`。
