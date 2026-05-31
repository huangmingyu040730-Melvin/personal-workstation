# Workflows

## Local Development

日期：2026-05-31

类型：workflow

用途：

- 本地运行、检查和构建个人数字工作站前端。

步骤：

1. 安装依赖：

```bash
npm install
```

2. 启动本地开发服务器：

```bash
npm run dev
```

3. 访问：

```text
http://localhost:3000
```

4. 修改完成后运行：

```bash
npm run lint
npm run build
```

验证要求：

- 每轮代码修改后运行 lint 和 build。
- 如涉及视觉布局，至少打开首页和对应工作台页面确认可渲染。

## Mock Data Update

日期：2026-05-31

类型：workflow

用途：

- 更新第一阶段页面展示内容。

步骤：

1. 在 `src/lib/types.ts` 中确认或补充类型。
2. 在 `src/lib/mock-data.ts` 中更新示例数据。
3. 页面组件从 mock data 引用数据，不在页面中散落大量示例内容。
4. 保留 `visibility` 字段，值为 `public`、`private` 或 `unlisted`。

验证要求：

- 更新后运行 `npm run lint` 和 `npm run build`。
