# 黄铭语个人数字工作站

个人数字工作站网站前端原型，用于个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Mock data first，后续预留 Supabase 接入

## 本地启动

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

检查与构建：

```bash
npm run lint
npm run build
```

## 页面

- `/` 公开首页
- `/dashboard` 工作台
- `/projects` 研究项目
- `/publications` 学术成果
- `/knowledge` 知识库
- `/skills` Skill 库
- `/calendar` 日历
- `/documents` 文件中心
- `/profile` 个人信息
- `/settings` 设置
- `/automations` 自动化占位

## 数据说明

第一阶段所有示例内容集中在 `src/lib/mock-data.ts`，并预留 `visibility` 字段，取值为 `public`、`private` 或 `unlisted`。本阶段不包含真实登录、Supabase、文件上传或外部 API 调用。
