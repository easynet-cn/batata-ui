# Batata UI

[![Vue](https://img.shields.io/badge/vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind_css-4.3-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Batata UI** 是 [Batata](https://github.com/easynet-cn/batata) 的 Web 管理控制台 —— Batata 是一个基于 Rust 构建的高性能动态服务发现与配置管理平台，兼容 [Nacos](https://nacos.io/) V2/V3、[Consul](https://www.consul.io/) 与 [Apollo](https://github.com/apolloconfig/apollo) API。

[English](README.md)

## 功能特性

- **仪表板** - 系统概览，展示关键指标和实时统计
- **配置管理** - 配置的创建、编辑、差异对比、导入/导出、版本历史、回滚、灰度发布（Beta）、加密、跨环境同步
- **服务管理** - 服务注册、发现、实例管理与健康监控
- **命名空间管理** - 多环境配置隔离
- **集群管理** - 节点状态监控与健康检查
- **多数据中心** - 跨数据中心拓扑与复制状态
- **认证授权** - 用户、角色和权限管理 (RBAC)，支持 OIDC/OAuth2 单点登录
- **AI 注册中心** - 技能管理、提示词管理（支持版本控制与治理）、智能体管理、智能体规格管理、MCP 服务器注册、Copilot LLM 配置
- **Consul 兼容** - 完整的 Consul UI，包括 KV 存储、服务目录、健康检查、ACL（Token/策略/角色/认证方法）、Service Mesh（Intentions/配置条目）、集群对等、管理分区、命名空间、会话、事件和 Operator 视图
- **Apollo 兼容** - 完整的 Apollo 控制台，包括应用、集群、应用命名空间、发布/灰度历史、Access Key、导入导出、全局搜索、消费者、收藏、审计与实例视图
- **审计日志** - 操作审计追踪，支持过滤和搜索
- **链路追踪** - 基于 OpenTelemetry 的分布式追踪
- **插件管理** - 插件生命周期管理
- **系统设置** - 应用配置与偏好设置
- **深色模式** - 完整的明/暗主题支持
- **国际化** - 支持中英文双语
- **Provider 切换** - Batata/Consul/Apollo 无缝切换

## 技术栈

| 类别        | 技术                           |
| ----------- | ------------------------------ |
| 前端框架    | Vue 3.5 + TypeScript           |
| 样式        | Tailwind CSS 4（无 UI 组件库） |
| 状态管理    | Pinia                          |
| 路由        | Vue Router                     |
| 图表        | ECharts + Vue-ECharts          |
| 代码编辑器  | CodeMirror 6                   |
| HTTP 客户端 | Axios                          |
| 图标        | Lucide Vue Next                |
| 构建工具    | Vite 8 (Rolldown)              |
| 测试        | Vitest + Playwright（E2E）     |
| 代码规范    | ESLint + Prettier              |

## 快速开始

### 环境要求

- Node.js ^20.19.0 或 >=22.12.0
- pnpm 12.4.2+（由 `packageManager` 字段声明）
- 运行中的 [Batata](https://github.com/easynet-cn/batata) 服务（默认 Console 端口：8081）

### 安装

```bash
# 克隆仓库
git clone https://github.com/easynet-cn/batata-ui.git
cd batata-ui

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

开发服务器启动在 `http://localhost:5173`，API 请求（`/v3`）会代理到 `http://localhost:8081`（Batata Console 服务）。

### 生产构建

```bash
pnpm build
```

构建产物位于 `dist/` 目录，可由任意静态文件服务器提供服务，或嵌入 Batata 服务端。

## 开发命令

```bash
# 开发服务器（热重载）
pnpm dev

# 类型检查
pnpm type-check

# 生产构建
pnpm build

# 构建并分析包体积
pnpm build:analyze

# 构建并复制产物到 Batata 服务端的 console-ui/ 目录
pnpm build:ui

# 运行单元测试
pnpm test:unit

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试（Playwright）
pnpm test:e2e

# 打开 E2E 测试报告
pnpm test:e2e:report

# 更新依赖到最新版本
pnpm update

# 代码检查并自动修复
pnpm lint

# 代码格式化
pnpm format
```

## 项目结构

```
src/
├── api/                    # API 接口层
│   ├── batata.ts          # Batata（Nacos 兼容）API 封装
│   ├── apollo.ts          # Apollo API 封装
│   ├── consul.ts          # Consul API 封装
│   ├── client.ts          # 共享 HTTP 客户端
│   ├── provider-factory.ts # 按 Provider 解析 API
│   ├── helpers.ts
│   └── types.ts
├── assets/                # 静态资源和样式
│   └── main.css          # 主样式（主题变量、深色模式）
├── components/            # 通用组件
│   ├── ai/               # AI 相关组件（优化对话框、流水线展示）
│   ├── common/           # 可复用 UI 组件（DataTable、CodeEditor、DiffEditor 等）
│   ├── consul/           # Consul 专用组件（拓扑图、发现链）
│   └── feedback/         # 通知组件（ToastMessage）
├── composables/           # 组合式函数
│   ├── useTheme.ts       # 主题切换（明/暗）
│   ├── useProvider.ts    # Provider 切换（batata/consul/apollo）
│   ├── useApi.ts         # API 调用封装
│   ├── useAsyncData.ts   # 异步数据加载状态
│   ├── useStorage.ts     # 本地持久化存储
│   ├── useConsulAbilities.ts  # Consul ACL 权限检查
│   ├── useListView.ts    # 列表视图分页与筛选
│   ├── useDetailView.ts  # 详情视图逻辑
│   ├── useFormValidation.ts   # 表单验证工具
│   ├── useAutoRefresh.ts # 自动刷新间隔管理
│   ├── useBlockingQuery.ts    # Consul 阻塞查询（实时更新）
│   ├── useVersionStatus.ts    # 版本状态追踪
│   ├── useNotifications.ts
│   └── useWebSocket.ts
├── config/                # 应用配置
│   └── index.ts
├── i18n/                  # 国际化
│   ├── index.ts
│   └── translations.ts
├── layout/
│   └── BatataLayout.vue  # 主布局（侧边栏 + 顶栏 + 内容区）
├── router/
│   └── index.ts
├── stores/                # Pinia 状态管理
│   ├── auth.ts           # 认证状态
│   ├── batata.ts         # Batata 核心状态
│   ├── consul.ts         # Consul 状态（含 consul-acl/catalog/kv/mesh）
│   ├── namespace.ts
│   └── server.ts
├── types/
│   └── index.ts
├── utils/                 # 通用工具函数（自动导入）
└── views/                 # 页面组件
    ├── dashboard/         # 仪表板
    ├── config/            # 配置管理（列表、编辑器、详情、历史、同步、回滚、监听查询）
    ├── service/           # 服务管理
    ├── namespace/         # 命名空间管理
    ├── cluster/           # 集群管理
    ├── datacenter/        # 多数据中心
    ├── auth/              # 用户/角色/权限
    ├── ai/                # AI 注册中心（技能、提示词、智能体、智能体规格、MCP 服务器）
    ├── consul/            # Consul 模式（仪表板、KV、目录、ACL、Service Mesh、对等连接等）
    ├── apollo/            # Apollo 模式（应用、集群、命名空间、发布、Access Key、导入导出等）
    ├── audit/             # 审计日志
    ├── tracing/           # 链路追踪
    ├── plugin/            # 插件管理
    ├── settings/          # 系统设置和 Copilot LLM 配置
    ├── AdminInitView.vue  # 首次运行管理员初始化
    ├── LoginView.vue      # 登录
    ├── OIDCCallbackView.vue # OIDC/OAuth2 单点登录回调
    └── NotFoundView.vue   # 404
```

## 连接 Batata 服务

开发模式下默认将 `/v3` 请求代理到 `http://localhost:8081`。Console 端口（8081）仅提供 UI 与控制台接口，**不暴露** Nacos 兼容的数据接口，因此前端应始终连接 Console 服务，不要直连主服务（8848）。

如需连接其他 Batata 服务，编辑 `.env.development`：

```env
VITE_API_PROXY_TARGET=http://your-batata-server:8081
VITE_CONSUL_PROXY_TARGET=http://your-batata-server:8500
VITE_APOLLO_PROXY_TARGET=http://your-batata-server:8080
```

| 变量                       | 代理路径      | 默认值                  |
| -------------------------- | ------------- | ----------------------- |
| `VITE_API_PROXY_TARGET`    | `/v3`         | `http://localhost:8081` |
| `VITE_CONSUL_PROXY_TARGET` | `/consul-api` | `http://localhost:8500` |
| `VITE_APOLLO_PROXY_TARGET` | `/apollo-api` | `http://localhost:8080` |

### Batata 服务默认端口

| 端口  | 服务             | 说明                               |
| ----- | ---------------- | ---------------------------------- |
| 8848  | 主 HTTP API      | Nacos 兼容 API                     |
| 8081  | Console HTTP API | Web 管理控制台 API                 |
| 8080  | Apollo HTTP API  | Apollo 兼容的 Config/Admin/OpenAPI |
| 9848  | SDK gRPC         | 客户端 SDK 通信                    |
| 9849  | 集群 gRPC        | 节点间通信                         |
| 8500  | Consul HTTP API  | Consul 兼容 API                    |
| 9080  | MCP Registry     | MCP 服务器注册                     |
| 15010 | xDS              | Service Mesh（Envoy/Istio）        |

## E2E 测试

端到端测试位于 `e2e/` 目录，基于 Playwright 对运行中的 Batata 服务执行。

```bash
# 安装浏览器（仅首次需要）
pnpm exec playwright install

# 运行 E2E 测试
pnpm test:e2e

# 打开 HTML 测试报告
pnpm test:e2e:report
```

## 嵌入 Batata 服务端

Batata 服务端从自身的 `console-ui/` 目录托管控制台 UI。可一步完成构建并复制产物：

```bash
pnpm build:ui
```

该命令会执行生产构建，并将 `dist/` 复制到 `../batata/console-ui/`（需将 [batata](https://github.com/easynet-cn/batata) 仓库克隆到同级目录）。重启服务后访问 `http://localhost:8081/`。

## 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 开源协议

本项目基于 Apache-2.0 协议开源，详见 [LICENSE](LICENSE) 文件。

## 相关项目

- [Batata](https://github.com/easynet-cn/batata) - 基于 Rust 的后端服务
- [Nacos](https://nacos.io/) - 原始设计和 API 规范
- [Consul](https://www.consul.io/) - KV 存储和服务发现 API 设计
- [Apollo](https://github.com/apolloconfig/apollo) - Config Service / Admin Service / OpenAPI 设计
