# Access Grants 后台授权管理流程

日期：2026-06-15

## 目标

Access Grant 是 restricted 内容的真实授权记录，用于允许指定邮箱访问一条具体 restricted Project、Publication、Knowledge 或 Skill。

本流程只 polish 后台授权管理体验：

- 让管理员更容易按状态和内容类型筛选授权。
- 让授权对象、内容标题、slug、有效期和撤销状态更清楚。
- 让创建页明确要求手动选择具体 restricted 内容。
- 让撤销操作明确只撤销 restricted 访问，不影响申请、内容或 Documents。

Access Request 和 Access Grant 必须分开理解：

- Access Request 是访客提交的申请和管理员处理记录。
- Access Grant 是管理员手动创建的 restricted 内容授权记录。

申请 `approved` 不等于授权。只有 Access Grant 才会进入 restricted 访问判断。

## 后台列表

入口：

```text
/dashboard/access-grants
```

列表页用于检查和维护授权：

- 按状态查看全部、有效、已过期、已撤销。
- 按内容类型筛选 Project、Publication、Knowledge 或 Skill。
- 每条授权展示邮箱、内容类型、内容标题、slug、当前 visibility、创建时间、过期时间、撤销时间提示和内部备注状态。
- 每条授权提供进入授权详情页和目标内容后台页的操作入口。

状态说明：

| 状态 | 含义 |
| --- | --- |
| `active` | 数据库状态为 active，且未超过 `expires_at`。 |
| `expired` | 数据库状态仍为 active，但 `expires_at` 已经过期。 |
| `revoked` | 数据库状态为 revoked。 |

当前 schema 只有 `status` 和 `expires_at`。`expired` 是应用层根据有效期计算出来的状态，不是新的数据库枚举值。

## 创建授权

入口：

```text
/dashboard/access-grants/new
```

创建授权时必须由管理员人工确认：

1. 输入或核对被授权邮箱。
2. 选择内容类型。
3. 手动选择一条具体 restricted 内容。
4. 可选填写有效期和内部备注。
5. 提交后创建 Access Grant。

创建页只列出 `visibility = restricted` 的内容候选。创建授权不会自动修改内容 visibility，也不会自动公开附件。

如果从 approved Access Request 跳转到创建页，只允许把以下信息作为人工核对线索：

- 邮箱。
- 申请记录 id。
- 内容类型。

系统不会自动选择 private id、content id、Document、Storage object、附件、zip 或 signed URL。管理员仍必须手动选择具体 restricted 内容。

## 授权详情

入口：

```text
/dashboard/access-grants/[id]
```

详情页用于复核单条授权：

- 被授权邮箱。
- 当前有效状态。
- 数据库状态。
- 创建时间、更新时间、过期时间。
- 内容类型、标题、slug、visibility 和后台内容链接。
- 内部备注。
- 撤销操作和安全边界。

当前 `content_access_grants` schema 不记录 `request_id`，因此列表和详情页不能持久展示来源 Access Request。申请 id 只在从申请页跳转到创建页时作为人工上下文出现。

当前 schema 也没有独立 `revoked_at` 字段；当状态为 revoked 时，后台只能把 `updated_at` 作为撤销时间线索展示。

## 撤销授权

撤销只更新 Access Grant 的 `status = revoked`。

撤销不会：

- 删除 Access Request。
- 删除 Project、Publication、Knowledge 或 Skill。
- 修改内容 visibility。
- 删除 Documents。
- 修改 Documents visibility。
- 修改 public attachments 规则。
- 删除 Storage object。
- 生成或撤销 signed URL。
- 发送邮件或通知。

已过期的 active 授权也可以手动撤销，以便后台状态更清楚。

## Documents 与公开附件边界

Access Grant 只控制 restricted 正文访问，不开放 Documents 或私密附件。

必须保持：

- `workspace-files` bucket 为 private。
- Documents 上传默认 private。
- Private Documents、private attachments、zip、Storage path、Storage bucket 和 signed URL 不随 Access Grant 开放。
- 公开 Project / Publication 附件只展示显式 public 文件，且文件必须关联到当前 public 资产。
- 公开下载仍只走 `/public-files/[id]/download`，并由服务端重新校验 public 文件、public 资产和文件关联。
- Knowledge / Skill 公开详情页不展示 Documents。
- Skill 不展示 package、不下载、不执行、不安装、不解析文件。

## 发布前 QA

修改 Access Grants 后台管理体验后，至少执行：

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

1. 打开 `/dashboard/access-grants`，确认状态筛选和内容类型筛选可用。
2. 确认列表展示邮箱、内容类型、内容标题、slug、有效期、撤销状态和操作入口。
3. 打开 `/dashboard/access-grants/new`，确认只能手动选择具体 restricted 内容。
4. 从 approved Access Request 进入创建页，确认只预填邮箱、申请 id 和内容类型，不自动选择内容。
5. 打开 `/dashboard/access-grants/[id]`，确认授权详情、安全边界和撤销区展示清楚。
6. 撤销一条测试授权，确认只影响该授权状态，不删除申请、内容或 Documents。
7. 确认公开页面、sitemap、robots 和 public 下载 route 没有被改变。

## 本阶段未改变的安全边界

Phase 2R-E-2 不新增 migration，不新增数据库字段，不修改 RLS，不修改 Storage policy，不修改 Documents 上传 / 删除 / zip 下载，不修改 public file download route，不修改 Access Grants 核心权限。

本阶段也不新增邮件、自动授权、自动选择内容、自动审批、AI 判断、OCR、向量搜索、支付、会员或在线文件预览。
