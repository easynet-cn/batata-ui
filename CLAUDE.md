# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

batata-ui 是一个基于 Vue 3 + TypeScript + Tailwind CSS 4 构建的 Nacos 管理控制台前端。

**核心功能:**

- 服务管理 - 服务的注册、发现、实例管理
- 配置管理 - 配置的创建、编辑、版本控制
- 命名空间 - 多环境配置隔离
- 集群管理 - 节点状态监控和健康检查
- 仪表板 - 系统概览和关键指标展示

**技术栈:**

- 前端框架: Vue 3.5 + TypeScript
- 样式: Tailwind CSS 4 (无 UI 组件库)
- 状态管理: Pinia
- 路由: Vue Router
- 图表: ECharts + Vue-ECharts
- HTTP 客户端: Axios
- Mock: MockJS
- 构建工具: Vite (rolldown-vite)

## Development Commands

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 类型检查
pnpm type-check

# 构建生产版本
pnpm build

# 运行单元测试
pnpm test:unit

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## Architecture

### Frontend (src/)

```
src/
├── api/                    # API 接口层
│   └── nacos.ts           # Nacos API 封装
├── assets/                # 静态资源和样式
│   └── main.css          # 主样式入口
├── components/            # 通用组件
│   └── Modal.vue         # 模态框组件
├── i18n/                  # 国际化
│   ├── index.ts          # i18n 配置
│   └── translations.ts   # 翻译文本
├── layout/               # 布局组件
│   └── NacosLayout.vue   # 主布局
├── mock/                 # Mock 数据
│   ├── index.ts         # Mock 入口
│   ├── data.ts          # Mock 数据
│   └── modules/         # Mock 模块
├── router/              # 路由配置
│   └── index.ts        # 路由定义
├── stores/             # Pinia 状态管理
│   └── nacos.ts       # Nacos 状态
├── types/             # TypeScript 类型定义
│   └── index.ts      # 类型导出
├── views/            # 页面组件
│   ├── DashboardView.vue      # 仪表板
│   ├── ServiceListView.vue    # 服务列表
│   ├── ConfigListView.vue     # 配置列表
│   ├── NamespaceListView.vue  # 命名空间列表
│   ├── ClusterListView.vue    # 集群列表
│   ├── UserListView.vue       # 用户列表
│   ├── RoleListView.vue       # 角色列表
│   ├── PermissionListView.vue # 权限列表
│   └── LoginView.vue          # 登录页
├── App.vue           # 根组件
└── main.ts          # 应用入口
```

## Style Guide

### Design System (Material Design 风格)

**主题色 (Primary - Indigo)**

- `--color-primary`: #4f46e5 (主色)
- `--color-primary-hover`: #4338ca (悬浮)
- `--color-primary-active`: #3730a3 (激活)
- `--color-primary-light`: #e0e7ff (浅色背景)
- `--color-primary-lighter`: #eef2ff (更浅背景)

**语义色**

- Success: #10b981 (绿色)
- Warning: #f59e0b (橙色)
- Danger: #ef4444 (红色)
- Info: #3b82f6 (蓝色)

**中性色 (Slate 灰色调)**

- 文本主色: #0f172a
- 文本次色: #64748b
- 边框色: #e2e8f0
- 背景主色: #ffffff
- 背景次色: #f8fafc

### CSS 变量使用

优先使用 CSS 变量而非硬编码颜色值：

```css
/* 正确 */
color: var(--color-primary);
background: var(--color-bg-secondary);
box-shadow: var(--shadow-md);
border-radius: var(--radius-lg);
transition: all var(--transition-normal) var(--ease-default);

/* 避免 */
color: #4f46e5;
background: #f8fafc;
```

**阴影 (Elevation)**

- `--shadow-xs` ~ `--shadow-2xl`: 6 级阴影
- `--shadow-primary`: 带主题色的悬浮阴影

**圆角**

- `--radius-sm`: 4px
- `--radius-md`: 6px
- `--radius-lg`: 8px
- `--radius-xl`: 12px
- `--radius-full`: 9999px (圆形)

**过渡**

- `--transition-fast`: 0.15s
- `--transition-normal`: 0.2s
- `--transition-slow`: 0.3s

### Tailwind CSS 规范

- 使用 Tailwind CSS v4
- 优先使用 Tailwind 工具类，复杂样式使用 scoped CSS
- 颜色使用 Tailwind 内置调色板 (slate, indigo, etc.)
- 常用类名模式:

  ```html
  <!-- 按钮 -->
  <button
    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
  >
    <!-- 输入框 -->
    <input
      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />

    <!-- 卡片 -->
    <div class="p-4 bg-white rounded-xl shadow-sm border border-slate-200"></div>
  </button>
  ```

### Vue 组件样式规范

- 使用 `<style scoped>` 避免样式污染
- 深度选择器使用 `:deep(.class-name)`
- 组件内样式按功能分组，添加注释分隔
- 复杂状态样式使用 computed 计算类名：
  ```typescript
  const buttonClasses = computed(() => {
    const classes = ['btn', `btn-${props.type}`, `btn-${props.size}`]
    if (props.disabled) classes.push('btn-disabled')
    return classes
  })
  ```

### 响应式设计

- 断点: 768px (移动端)
- 使用 Tailwind 响应式前缀: `sm:`, `md:`, `lg:`, `xl:`
- 工具栏等组件需处理窄屏滚动

### 图标规范

- 使用 Lucide Vue Next 图标库
- 默认尺寸: `class="w-4 h-4"` 或 `class="w-5 h-5"`
- 导入方式:
  ```typescript
  import { IconName } from 'lucide-vue-next'
  ```

## Testing

Vitest is configured (`vitest.config.ts`). Run tests with `pnpm test:unit`.
