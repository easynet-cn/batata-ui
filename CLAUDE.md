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
│   └── batata.ts          # Batata API 封装
├── assets/                # 静态资源和样式
│   └── main.css          # 主样式入口 (theme tokens, dark mode, component classes)
├── components/            # 通用组件
│   └── feedback/
│       └── ToastMessage.vue  # Toast 通知组件
├── composables/           # 组合式函数
│   ├── useTheme.ts       # 主题切换 (light/dark)
│   ├── useProvider.ts    # Provider 切换 (batata/consul)
│   ├── useNotifications.ts # 通知管理
│   └── useWebSocket.ts   # WebSocket 连接
├── i18n/                  # 国际化
│   ├── index.ts          # i18n 配置
│   └── translations.ts   # 翻译文本
├── layout/               # 布局组件
│   └── BatataLayout.vue  # 主布局 (sidebar + header + content)
├── mock/                 # Mock 数据
│   ├── index.ts         # Mock 入口
│   ├── data.ts          # Mock 数据
│   └── modules/         # Mock 模块
├── router/              # 路由配置
│   └── index.ts        # 路由定义
├── stores/             # Pinia 状态管理
│   └── batata.ts      # Batata 状态
├── types/             # TypeScript 类型定义
│   └── index.ts      # 类型导出
├── views/            # 页面组件 (按功能分目录)
│   ├── dashboard/    # 仪表板
│   ├── config/       # 配置管理
│   ├── service/      # 服务管理
│   ├── namespace/    # 命名空间
│   ├── cluster/      # 集群管理
│   ├── datacenter/   # 多数据中心
│   ├── auth/         # 用户/角色/权限
│   ├── ai/           # MCP/Agent 管理
│   ├── audit/        # 审计日志
│   ├── tracing/      # 链路追踪
│   ├── plugin/       # 插件管理
│   ├── settings/     # 系统设置
│   ├── LoginView.vue
│   └── RegisterView.vue
├── App.vue           # 根组件
└── main.ts          # 应用入口
```

## Style Guide

### Design System

**Primary Color: Blue-600 (`#2563eb`)**

Provider-based accent colors:

- Batata provider: Blue-600 (`#2563eb`)
- Consul provider: Fuchsia-600 (`#c026d3`)

**Font:** System font stack (Inter-like): `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif`

**Dark Mode:** Class-based using Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))`. Stored in `localStorage('batata_theme')`.

### Color Tokens

**Light Mode:**

- Background: `bg-white`, content area: `bg-gray-50`
- Text: `text-gray-900` (primary), `text-gray-600` (secondary), `text-gray-500` (tertiary)
- Border: `border-gray-200`
- Hover: `hover:bg-gray-100`

**Dark Mode:**

- Background: `dark:bg-gray-900` / `dark:bg-gray-950`
- Text: `dark:text-gray-100` (primary), `dark:text-gray-400` (secondary), `dark:text-gray-500` (tertiary)
- Border: `dark:border-gray-800`
- Hover: `dark:hover:bg-gray-800`

### Layout

**Sidebar (Light theme):**

- Background: `bg-white dark:bg-gray-950`
- Width: `w-60` (240px), collapsed: `w-16` (64px)
- Border: `border-r border-gray-200 dark:border-gray-800`
- Logo: `w-8 h-8` rounded-lg box with provider color, brand name `text-base font-extrabold text-gray-900`
- Section headers: `text-[11px] font-bold text-gray-400 uppercase tracking-wider`
- Menu items: `text-sm font-semibold`, icon size `20px`, spacing `px-3 py-2.5 rounded-xl`
- Inactive items: `text-gray-500 hover:bg-gray-100 hover:text-gray-900`
- Active items: Provider bg color + `text-white shadow-md`
- Group spacing: `space-y-6`, item spacing: `space-y-1`

**Header:**

- Height: `h-14`
- Background: `bg-white dark:bg-gray-900`
- Border: `border-b border-gray-200 dark:border-gray-800`

**Content Area:**

- Background: `bg-gray-50 dark:bg-gray-950`
- Padding: `p-4 md:p-5`
- Max width: `max-w-7xl mx-auto`

### Component Patterns (Tailwind Classes)

**Buttons:**

```html
<button
  class="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
></button>
```

**Inputs:**

```html
<input
  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
/>
```

**Cards:**

```html
<div
  class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
></div>
```

**Tables:**

```html
<th
  class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400"
></th>
<td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800"></td>
```

**Badges:**

```html
<span
  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
></span>
```

**Modals:**

```html
<div
  class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800"
></div>
```

### Typography

- Headings: `font-extrabold`
- Sidebar menu: `text-sm font-semibold`
- Sidebar section headers: `text-[11px] font-bold uppercase tracking-wider`
- Buttons: `text-sm font-bold`
- Labels: `font-bold uppercase tracking-wider`
- Body: `font-medium`

### Spacing

- Buttons: `px-5 py-2`
- Inputs: `px-4 py-2.5`
- Card body: `p-6`
- Table cells: `px-6 py-5`
- Sidebar items: `px-3 py-2.5`
- Sidebar nav padding: `py-4 px-3`

### Border Radius

- Cards: `rounded-2xl`
- Modals: `rounded-3xl`
- Inputs/Buttons: `rounded-xl`
- Sidebar items: `rounded-xl`
- Badges: `rounded-lg`

### Shadows

- Cards: `shadow-sm`
- Sidebar: `shadow-sm`
- Modals: `shadow-2xl`
- Active sidebar item: `shadow-md` + provider shadow
- Provider-tinted: `shadow-lg shadow-blue-500/10`

### Provider System

The app supports Batata and Consul providers (visual only):

- Provider is stored in `localStorage('batata_provider')`
- Sidebar active color and logo change based on provider
- Use `useProvider()` composable for provider-aware styling
- Provider switcher in header: segmented BATATA / CONSUL buttons

### Theme System

- Use `useTheme()` composable for theme state
- Theme stored in `localStorage('batata_theme')`, values: `'light'` | `'dark'`
- `toggleTheme()` to switch, `isDark` computed for state
- Moon/Sun icon toggle in header

### Responsive Design

- Breakpoints: 768px (mobile)
- Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

### Icons

- Library: Lucide Vue Next
- Sidebar icons: `:size="20"`
- Header/toolbar icons: `:size="16"` or `:size="13"`
- Import: `import { IconName } from 'lucide-vue-next'`

## Testing

Vitest is configured (`vitest.config.ts`). Run tests with `pnpm test:unit`.

## Development Rules

### Language Rules

- **All code comments MUST be written in English**
- **All documentation files MUST be written in English**
- **All commit messages MUST be written in English**
- **Variable names, function names, and other identifiers MUST use English**

### Task Tracking Rules

- **MUST record task completion status truthfully**
- **DO NOT mark tasks as "completed" if they only contain placeholder code**
- **DO NOT mark tasks as "completed" if the actual functionality is not working**
- **If a task is partially completed, mark it as "partial" with detailed notes**
- **If a task cannot be completed due to technical limitations, document the reasons**
- **Update task status in `docs/TASK_STATUS.md` after each task is completed**

### Internationalization (i18n) Rules

- **ALL user-facing text MUST use the i18n system** - no hardcoded strings in templates
- **Use `t('key')` function** for all display text in Vue templates
- **Add translations for both languages** (English and Chinese) in `src/i18n/translations.ts`
- **Translation keys should be camelCase** (e.g., `configList`, `saveChanges`)

**Required i18n usage:**

```vue
<!-- CORRECT -->
<h1>{{ t('configuration') }}</h1>
<button>{{ t('save') }}</button>
<th>{{ t('dataId') }}</th>
<option value="json">{{ t('configTypeJson') }}</option>

<!-- WRONG - hardcoded text -->
<h1>Configuration</h1>
<button>Save</button>
<th>Data ID</th>
<option value="json">JSON</option>
```

**Exceptions (do NOT translate):**

- Language names in language selector (e.g., "English", "简体中文")
- Technical terms that are universally used (e.g., "JSON", "YAML", "XML")
- Brand names and product names (e.g., "Nacos", "Claude")
- Code examples and technical identifiers

**Adding new translations:**

```typescript
// src/i18n/translations.ts
export const translations = {
  en: {
    myNewKey: 'English text',
    // ...
  },
  zh: {
    myNewKey: '中文文本',
    // ...
  },
}
```

### Code Quality Rules

- All new code must pass `pnpm type-check` without errors
- All new code must pass `pnpm lint` without errors
- Follow existing code style and patterns in the codebase
