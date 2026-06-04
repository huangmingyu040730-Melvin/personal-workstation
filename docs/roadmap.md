# Product Roadmap

## Product Positioning

黄铭语个人数字工作站的长期定位为：

> 公开研究工作站 + 私密管理后台 + 未来受限访问体系。

网站不再只是个人后台工具或展示主页。它需要同时承担：

- 对外公开展示研究方向、公开项目、学术成果、知识文章和 AI Skill。
- 对内管理全部项目、知识、成果、文件、日历与自动化。
- 未来允许外部用户申请查看特定受限内容，并由管理员审批。

Notion 可以作为草稿整理、临时研究笔记、日常记录、协作辅助和自动化中间存储，但正式公开门户、权限系统、私密资产库和统一浏览体验继续由个人网站承担。

## Access Layers

### Public Research Workstation

所有访客无需登录即可访问公开内容：

- 个人介绍与研究方向。
- 公开研究项目。
- 公开学术成果。
- 公开 Skill。
- 公开知识文章。
- 最近公开更新。
- 精选内容与公开统计。

公开页面不得展示：

- private 或 restricted 内容。
- 后台新增、编辑、删除入口。
- 文件上传入口。
- 私密附件下载入口。
- Activity Logs。
- 管理设置、内部任务或私密日历。
- signed URL、Storage 内部路径或长期文件链接。

### Private Admin Backend

只有管理员本人可以进入后台，用于：

- 查看全部 public / unlisted / restricted / private 内容。
- 新建、编辑和删除内容。
- 上传与管理私密文件。
- 控制内容可见范围。
- 查看 Activity Logs。
- 后续管理 Calendar、Profile、自动化与访问申请。

管理员身份继续由 Supabase Auth、`public.admin_users` 和 `public.is_admin()` 控制，不在代码中硬编码邮箱、UUID 或密码。

### Future Restricted Access

未来允许外部用户申请查看特定受限内容，并由管理员审批：

- 只按具体内容授权，不授权查看整个后台。
- 受邀查看者只有只读权限。
- 附件下载权限与正文查看权限分离。
- 授权可设置有效期并可撤回。
- 管理员权限始终仅保留给本人。

## Visibility Model

| 可见性 | 含义 | 公开列表展示 | 访问方式 |
| --- | --- | --- | --- |
| public | 所有人可浏览 | 是 | 无需登录 |
| unlisted | 不公开列出，但拥有链接者可查看 | 否 | 通过链接 |
| restricted | 只有经管理员审批授权的用户可查看 | 否 | 登录 + 审批授权 |
| private | 仅管理员本人可查看 | 否 | 管理员后台 |

当前生产功能已支持 `public`、`unlisted`、`private` 的基础字段与公开过滤。`restricted` 属于后续规划，尚未进入真实 schema、RLS、UI 和审批流程。

文件附件默认比正文更严格。即使 Publication 或其他内容设置为 public，关联 Documents 默认仍保持 private，不在公开页面提供下载入口。未来如需开放附件，应单独审批并使用短时访问机制。

## Route Direction

当前部分后台管理页面仍位于公开候选路径，例如 `/projects`、`/knowledge`、`/skills`、`/publications` 和 `/documents`。后续需要逐步分离公开只读页面与后台管理页面。

推荐最终公开路由：

```text
/
/about
/projects
/projects/[slug]
/publications
/publications/[slug]
/skills
/skills/[slug]
/knowledge
/knowledge/[slug]
```

推荐最终后台路由：

```text
/dashboard
/dashboard/projects
/dashboard/projects/new
/dashboard/projects/[id]
/dashboard/projects/[id]/edit
/dashboard/publications
/dashboard/publications/new
/dashboard/publications/[id]
/dashboard/publications/[id]/edit
/dashboard/knowledge
/dashboard/knowledge/new
/dashboard/knowledge/[id]
/dashboard/knowledge/[id]/edit
/dashboard/skills
/dashboard/skills/new
/dashboard/skills/[id]
/dashboard/skills/[id]/edit
/dashboard/documents
/dashboard/calendar
/dashboard/profile
/dashboard/access-requests
/dashboard/settings
```

路由迁移必须在单独 Phase 中谨慎实施。迁移期间应保持已有后台能力可用，必要时为旧后台路径提供受保护 redirect 或过渡方案。

## Phase Status

### Phase 1 - Frontend MVP

已完成并合并。建立了 Next.js App Router、TypeScript、Tailwind CSS、Lucide React 的前端原型和主要页面。

### Phase 2A - Supabase Auth And RLS Foundation

已完成并合并。建立 Supabase Auth、RLS、管理员登录、后台路由保护与 Vercel 部署基础。

### Phase 2B - Core Content CRUD

已完成并通过生产验收。Projects、Knowledge Base、Skills Library、Skill 最小版本记录、Dashboard 真实读取与公开首页 public + featured 展示已经接入真实 Supabase 数据。

### Phase 2C - Publications And Secure Documents

已完成并通过生产验收。Publications 真实 CRUD、Documents 私密文件上传/下载/删除、private `workspace-files` bucket、Publication 附件关联、删除保护、Dashboard 成果统计与 Activity Logs 已完成。

### Phase 2D - Public Research Workstation

下一阶段最高优先级。目标：

1. 建立公开项目列表页与公开项目详情页。
2. 建立公开成果列表页与公开成果详情页。
3. 建立公开 Skill 列表页与公开 Skill 详情页。
4. 建立公开知识文章列表页与公开知识详情页。
5. 将公开首页升级为只读版个人研究工作台。
6. 公开页面只读取 `visibility = "public"` 内容。
7. private 与 unlisted 内容不得出现在公开列表或公开详情访问中。
8. 附件继续保持 private，不在公开页面开放下载。
9. 制定后台管理路由迁移到 `/dashboard/...` 的安全方案。

Phase 2D 初期可以先增加公开页面，不必一次性迁移所有后台路径。若路由冲突导致必须迁移，应单独设计兼容策略并审核。

### Phase 2E - Restricted Access And Approval

公开浏览体系稳定后再实现：

- `restricted` 可见性。
- 外部用户账号与登录。
- 申请查看指定内容。
- 管理员审批页面。
- 按项目、成果、Skill、知识文章授权。
- 授权有效期。
- 撤销授权。
- 附件下载单独审批与控制。
- 审计日志。

审批通过不代表查看全部后台；外部用户默认只读，不开放新增、编辑、删除或设置权限。

### Later Phases

在公开展示与授权体系稳定后，再依次推进：

- Profile 真实编辑。
- Calendar CRUD。
- Google Calendar 集成。
- 自动化任务。
- Notion 辅助同步。
- AI 摘要、项目总结与智能研究能力。
