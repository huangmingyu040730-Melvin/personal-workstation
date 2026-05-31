# Decisions

## 2026-05-31 - Use Chinese As Default Website Language

类型：decision

决策：

- 网站默认语言为中文。

原因：

- 项目服务于“黄铭语个人数字工作站”，核心内容、导航和工作流说明均面向中文使用场景。

影响：

- 页面文案、导航、mock data 和项目文档默认使用中文。
- 代码标识、命令、依赖名和外部 API 名称按技术语境保留英文。

## 2026-05-31 - Build Phase 1 With Mock Data First

类型：decision

决策：

- 第一阶段实现本地可运行的 Next.js 前端原型。
- 使用 App Router、TypeScript、Tailwind CSS 和 Lucide React。
- 示例内容集中放在 `src/lib/mock-data.ts`，类型放在 `src/lib/types.ts`。
- 所有核心实体预留 `visibility` 字段。
- 本阶段不接入真实登录、数据库、文件上传或外部 API。

原因：

- 第一阶段目标是先完成视觉完整、主要页面可浏览的网站前端原型。
- mock data first 可以先稳定信息架构、页面布局和组件结构，方便第二阶段接入真实数据。

影响：

- 页面应优先组合复用组件。
- 新增示例内容时优先更新 `src/lib/mock-data.ts`。
- 未来接入 Supabase 时应保持页面组件和数据访问层分离。

## 2026-05-31 - Connect Supabase In Phase 2

类型：decision

决策：

- 第二阶段再接入 Supabase Auth、数据库、Storage 和权限模型。

原因：

- 第一阶段不需要真实登录、数据库和上传能力。
- 先完成前端 MVP 可以减少后端设计前的信息架构不确定性。

影响：

- 当前页面中的编辑、上传、日历和自动化能力只作为 UI 原型存在。
- 第二阶段需要补充数据模型、权限边界、错误处理和真实保存逻辑。
