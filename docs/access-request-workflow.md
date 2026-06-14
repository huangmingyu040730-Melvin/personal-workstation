# 访问申请后台处理流程

日期：2026-06-15

## 目标

访问申请用于收集外部访客对研究资料、未公开内容或受限材料的访问意向，并帮助管理员人工判断后续是否需要联系申请人或创建 Access Grant。

本流程只 polish 后台处理体验：

- 让待处理申请更容易筛选。
- 让申请目标、来源、slug、公开路径和理由更清楚。
- 让管理员可以记录内部备注和处理状态。
- 在 approved 后提示管理员单独创建 Access Grant。

访问申请不是授权系统本身。`approved` 只代表申请处理状态，不代表申请人已经获得 restricted 内容访问权限。

## 后台列表

入口：

```text
/dashboard/access-requests
```

列表页用于快速处理队列：

- 按状态查看全部、待处理、已同意、已拒绝。
- 按目标类型筛选 Project、Publication、Knowledge、Skill 或未知 / 通用申请。
- 每条申请展示申请人、邮箱、目标标题、内容类型、slug、来源页面、公开路径、提交时间、处理时间和备注状态。
- 申请理由只显示摘要；完整内容在详情页复核。

建议处理顺序：

1. 优先查看 `pending`。
2. 核对申请目标和来源页面。
3. 阅读申请理由。
4. 进入详情页记录处理结果。

## 详情页人工审核工作台

入口：

```text
/dashboard/access-requests/[id]
```

详情页用于人工判断：

- 申请人信息：姓名、邮箱、机构 / 身份。
- 申请目标：内容类型、目标标题、slug、来源页面、公开路径和原始申请链接。
- 申请理由：完整保留访客提交内容。
- 当前处理记录：状态、更新时间、处理时间和内部备注。
- 人工处理区：更新 `pending` / `approved` / `rejected` 和内部备注。
- Access Grant 引导：仅在 approved 后提示可以手动创建授权。

管理员应把申请目标当作上下文线索，而不是自动授权依据。公开 CTA 只携带公开标题、slug 和来源，不携带 private id。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `pending` | 待人工审核，不开放任何内容。 |
| `approved` | 申请处理上已同意，但仍未授权。 |
| `rejected` | 申请已拒绝，记录保留用于追踪。 |

状态更新只写入 `access_requests`。它不会：

- 创建 Access Grant。
- 创建 viewer 账号。
- 发送邮件或通知。
- 开放 restricted / private 正文。
- 开放 Documents、private attachments、zip 或 signed URL。

## 内部备注

`admin_note` 只在后台可见，用于记录人工处理说明，例如：

- 申请人身份是否可信。
- 后续是否需要邮件联系。
- 是否适合创建 Access Grant。
- 拒绝原因或暂缓原因。

不要在内部备注中保存密码、API key、授权码、完整私人通信原文、Storage path、signed URL、管理员邮箱、Auth UUID 或其他敏感信息。

## Access Grant 边界

如需真正开放 restricted 内容，管理员必须单独进入 Access Grants 创建授权：

```text
/dashboard/access-grants/new
```

从 approved 申请进入创建页时，可以预填：

- 申请邮箱。
- 申请记录 id。
- 内容类型。

仍必须由管理员手动选择具体 restricted 内容。系统不会自动选择 private id，也不会自动把申请目标转成授权对象。

## Documents 与公开附件边界

访问申请不会改变 Documents 权限。

必须保持：

- `workspace-files` bucket 为 private。
- Documents 上传默认 private。
- 公开 Project / Publication 附件只展示显式 public 文件，且文件必须关联到当前 public 资产。
- 公开下载仍只走 `/public-files/[id]/download`。
- 下载 route 必须服务端校验 public 文件、public 资产和文件关联。
- signed URL 不写入页面 HTML。
- Knowledge / Skill 公开详情页不展示 Documents。
- Skill 不展示 package、不下载、不执行、不安装、不解析文件。

## 访问申请上下文边界

公开详情页进入申请时，只允许使用公开页面已经展示的信息：

- `content_type`
- slug
- 公开标题
- 来源路径

未公开 fallback 不能确认 private / restricted / unlisted 内容是否真实存在，也不能输出正文、摘要、附件、Storage path、Storage bucket、signed URL、`file_path`、raw link rows 或后台关系数据。

## 发布前 QA

修改访问申请后台流程后，至少执行：

```bash
npm run lint
npm run build
git diff --check
```

如果本地服务可用，继续执行：

```bash
PUBLIC_SMOKE_BASE_URL=http://localhost:3000 npm run smoke:public
```

手动验收：

1. 打开 `/dashboard/access-requests`，确认状态筛选和目标类型筛选可用。
2. 确认列表展示来源、slug、公开路径、理由摘要和备注状态。
3. 打开 `/dashboard/access-requests/[id]`，确认详情页可查看完整申请和内部处理记录。
4. 修改状态和内部备注，确认保存后不创建 Access Grant。
5. approved 申请进入 Access Grant 创建页时，确认只预填邮箱、申请 id 和内容类型，不自动选择具体内容。
6. 公开 `/access-request`、sitemap、robots 和未公开 fallback 仍通过 smoke。

## 本阶段未改变的安全边界

Phase 2R-E-1 不新增 migration，不新增数据库字段，不修改 RLS，不修改 Storage policy，不修改 Documents 上传 / 删除 / zip 下载，不修改 public file download route，不修改 Access Grants 核心权限。

本阶段也不新增邮件、自动审批、自动授权、AI 判断、OCR、向量搜索、支付、会员或在线文件预览。
