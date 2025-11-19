# Nacos 3.1.0 管理后台

基于 Vue 3 + TypeScript + Element Plus 构建的 Nacos 管理控制台。

## 功能特性

### 🎯 核心功能
- **服务管理** - 服务的注册、发现、实例管理
- **配置管理** - 配置的创建、编辑、版本控制
- **命名空间** - 多环境配置隔离
- **集群管理** - 节点状态监控和健康检查
- **仪表板** - 系统概览和关键指标展示

### 🛠 技术栈
- **前端框架**: Vue 3.5.24
- **开发语言**: TypeScript
- **UI组件库**: Element Plus 2.11.8
- **状态管理**: Pinia 3.0.4
- **路由管理**: Vue Router 4.6.3
- **图表库**: ECharts 6.0.0 + Vue-ECharts 8.0.1
- **HTTP客户端**: Axios 1.13.2
- **构建工具**: Vite (rolldown-vite)

### 🎨 界面设计
- 现代化的暗色侧边栏设计
- 响应式布局，适配各种屏幕尺寸
- 丰富的交互动画和过渡效果
- 统一的设计语言和组件规范

## 项目结构

```
src/
├── api/                    # API接口层
│   └── nacos.ts           # Nacos API封装
├── components/             # 通用组件
├── layout/                # 布局组件
│   └── NacosLayout.vue    # 主布局
├── router/                # 路由配置
│   └── index.ts          # 路由定义
├── stores/               # 状态管理
│   └── nacos.ts         # Nacos状态管理
├── views/               # 页面组件
│   ├── DashboardView.vue    # 仪表板
│   ├── ServicesView.vue    # 服务管理
│   ├── ConfigsView.vue     # 配置管理
│   ├── NamespacesView.vue  # 命名空间管理
│   ├── ClusterNodesView.vue # 集群节点
│   └── LoginView.vue      # 登录页面
├── App.vue             # 根组件
└── main.ts            # 应用入口
```

## 快速开始

### 环境要求
- Node.js >= 20.19.0 或 >= 22.12.0
- Yarn 或 npm

### 安装依赖
```bash
yarn install
```

### 开发模式
```bash
yarn dev
```
访问 http://localhost:5176

### 构建生产版本
```bash
yarn build
```

### 运行测试
```bash
yarn test:unit
```

### 代码检查
```bash
yarn lint
```

### 代码格式化
```bash
yarn format
```

## 配置说明

### API配置
在 `src/api/nacos.ts` 中修改 Nacos 服务器地址：

```typescript
const nacosApi = new NacosApi('http://localhost:8848/nacos/v1')
```

### 默认登录信息
- 用户名: `nacos`
- 密码: `nacos`

## 功能模块详解

### 1. 仪表板 (Dashboard)
- 系统概览统计
- 服务健康状态图表
- 最近活动记录
- 快速操作入口

### 2. 服务管理 (Services)
- 服务列表查看
- 服务实例详情
- 服务创建和删除
- 健康状态监控
- 实例权重管理

### 3. 配置管理 (Configs)
- 配置文件列表
- 配置内容编辑
- 多格式支持 (JSON/YAML/Properties/XML)
- 命名空间隔离
- 配置历史版本

### 4. 命名空间 (Namespaces)
- 命名空间创建和删除
- 配置数量统计
- 环境隔离管理

### 5. 集群管理 (Cluster)
- 节点状态监控
- 集群健康指标
- 节点详细信息
- 故障转移管理

## API接口

### 服务管理
- `GET /catalog/services` - 获取服务列表
- `GET /catalog/instances` - 获取服务实例
- `POST /catalog/services` - 创建服务
- `DELETE /catalog/services` - 删除服务

### 配置管理
- `GET /cs/configs` - 获取配置列表
- `GET /cs/configs` - 获取配置内容
- `POST /cs/configs` - 发布配置
- `DELETE /cs/configs` - 删除配置

### 命名空间管理
- `GET /console/namespaces` - 获取命名空间列表
- `POST /console/namespaces` - 创建命名空间
- `DELETE /console/namespaces/{id}` - 删除命名空间

### 集群管理
- `GET /cluster/nodes` - 获取集群节点
- `GET /cluster/list` - 获取集群信息

### 用户认证
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出

## 开发规范

### 代码风格
- 使用 ESLint + Prettier 进行代码规范
- 遵循 Vue 3 Composition API 最佳实践
- TypeScript 严格模式

### 组件规范
- 使用 `<script setup>` 语法
- Props 和 Emits 需要明确的类型定义
- 组件命名使用 PascalCase

### 状态管理
- 使用 Pinia 进行状态管理
- 异步操作统一在 Actions 中处理
- 错误处理和加载状态统一管理

## 部署说明

### Docker部署
```dockerfile
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 环境变量
- `VITE_NACOS_BASE_URL` - Nacos服务器地址
- `VITE_APP_TITLE` - 应用标题

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 常见问题

### Q: 如何修改Nacos服务器地址？
A: 在 `src/api/nacos.ts` 文件中修改 `baseURL` 参数。

### Q: 如何添加新的API接口？
A: 在 `src/api/nacos.ts` 中添加相应的方法，并在 store 中调用。

### Q: 如何自定义主题？
A: 修改 `src/assets/main.css` 中的CSS变量。

## 更新日志

### v1.0.0 (2024-01-19)
- ✨ 初始版本发布
- 🎯 完成核心功能模块
- 🎨 实现现代化UI设计
- 📱 响应式布局适配