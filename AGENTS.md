# AGENTS.md

## Project

项目名称：黄铭语个人数字工作站 / Mingyu Personal Workstation

项目定位：

- 面向个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理的网站。
- 网站默认语言为中文。
- 当前产品定位为“公开研究工作站 + 私密数字资产后台”。
- Phase 2B 起接入 Projects、Knowledge Base、Skills Library 的真实 Supabase CRUD；Phase 2C 接入 Publications、Documents 与 private Storage；Phase 2E-B 建立 restricted 内容授权基础；Phase 2P 起 Documents 成为 Project / Publication / Knowledge / Skill 的统一私密附件底座。
- Phase 2O-A 后主线收口为研究资产沉淀、公开展示、文件 / 知识管理和求职闭环维护；Market Brief / 市场简报模块已弃用，不恢复产品入口、API、runner、素材包、数据探针或推荐环境变量。

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React

## Commands

启动开发服务器：

```bash
npm run dev
```

代码检查：

```bash
npm run lint
```

生产构建：

```bash
npm run build
```

## Working Rules

- 保持组件可复用，页面优先组合基础组件，不在页面中堆重复样式。
- 示例数据集中维护在 `src/lib/mock-data.ts`，仅用于尚未接入真实数据的页面或未配置 Supabase 时的开发预览。
- Projects、Knowledge Base、Skills Library、Publications、Documents、Access Requests 与 Access Grants 的查询逻辑集中在 `src/lib/queries/`，校验逻辑集中在 `src/lib/validations/`，写入逻辑集中在 `src/actions/`。
- Supabase 写操作必须在 Server Action 中验证当前用户为管理员，并继续依赖 RLS 作为数据库权限边界。
- Documents 和 Storage 始终保持私密；公开页面、viewer 页面、sitemap、robots 不得输出附件下载入口、Storage 路径或 signed URL。
- Documents 上传继续使用两阶段浏览器直传 Supabase Storage；Server Action 只处理管理员验证、metadata 校验、安全路径生成和 finalize 写库，不接收文件二进制。
- Documents 的 `storage_path` 必须保持 ASCII-safe object key；中文文件名和文件夹名只保存在显示字段中。
- Skill 包、代码包和压缩包只作为私密文件存储，不执行、不解析、不安装。
- 不提交密钥、`.env`、API token、私钥或任何敏感文件。
- 保留 `.gitignore` 对 `.env`、`node_modules`、`.next`、`dist`、`out` 等文件的忽略规则。
- 每轮代码修改后运行 `npm run lint` 和 `npm run build`，并修复发现的问题。
- 修改前先理解现有结构，优先遵循项目已有模式。
- 不要改动无关文件，不要回滚用户或其他工具产生的未说明改动。

## Memory Rules

- 新一轮开发前优先阅读 `AGENTS.md`、`docs/memory.md`、`docs/decisions.md`；涉及阶段交接或路线判断时继续阅读 `docs/current-status.md`、`docs/roadmap.md`、`docs/known-issues.md` 和 `docs/supabase-setup.md`。
- 重要阶段状态写入 `docs/memory.md`；关键产品、权限、数据模型和流程取舍写入 `docs/decisions.md`；可重复操作步骤写入 `docs/workflows.md`。
- 过时信息必须在文档中标记为 stale / superseded，不要静默覆盖会影响后续判断的历史。
- 记忆文件不得保存密码、API key、token、SMTP 授权码、管理员邮箱、Auth UUID、signed URL、Storage 内部路径或私人通信原文。
