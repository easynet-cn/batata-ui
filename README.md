# Batata UI

[![Vue](https://img.shields.io/badge/vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind_css-4.2-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Batata UI** is the web management console for [Batata](https://github.com/easynet-cn/batata) - a high-performance, Rust-based dynamic service discovery and configuration management platform compatible with [Nacos](https://nacos.io/) V2/V3 and [Consul](https://www.consul.io/) APIs.

[中文文档](README_CN.md)

## Features

- **Dashboard** - System overview with key metrics and real-time statistics
- **Configuration Management** - Create, edit, diff, import/export, version history, rollback, gray release (beta), encryption, cross-environment sync
- **Service Management** - Service registration, discovery, instance management and health monitoring
- **Namespace Management** - Multi-environment configuration isolation
- **Cluster Management** - Node status monitoring and health checks
- **Multi-Datacenter** - Cross-datacenter topology and replication status
- **Authentication** - User, role, and permission management (RBAC), OIDC/OAuth2 SSO support
- **AI Registry** - Skill management, Prompt management (with versioning and governance), Agent management, AgentSpec management, MCP Server registry, Copilot LLM configuration
- **Consul Compatibility** - Full Consul UI with KV store, service catalog, health checks, ACL (tokens/policies/roles/auth methods), Service Mesh (intentions/config entries), cluster peering, admin partitions, namespaces, sessions, events, and operator view
- **Audit Logs** - Operation audit trail with filtering and search
- **Tracing** - Distributed tracing with OpenTelemetry integration
- **Plugin Management** - Plugin lifecycle management
- **System Settings** - Application configuration and preferences
- **Dark Mode** - Full light/dark theme support
- **Internationalization** - English and Chinese language support
- **Provider Switching** - Seamless Batata/Consul provider switching

## Tech Stack

| Category         | Technology                               |
| ---------------- | ---------------------------------------- |
| Framework        | Vue 3.5 + TypeScript                     |
| Styling          | Tailwind CSS 4 (no UI component library) |
| State Management | Pinia                                    |
| Router           | Vue Router                               |
| Charts           | ECharts + Vue-ECharts                    |
| Code Editor      | CodeMirror 6                             |
| HTTP Client      | Axios                                    |
| Icons            | Lucide Vue Next                          |
| Build Tool       | Vite (rolldown-vite)                     |
| Testing          | Vitest                                   |
| Linting          | ESLint + Prettier                        |

## Quick Start

### Prerequisites

- Node.js ^20.19.0 or >=22.12.0
- pnpm
- A running [Batata](https://github.com/easynet-cn/batata) server (default console port: 8081)

### Installation

```bash
# Clone the repository
git clone https://github.com/easynet-cn/batata-ui.git
cd batata-ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The development server starts at `http://localhost:5173` and proxies API requests (`/v3`) to `http://localhost:8081` (Batata console server).

### Build for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory, ready to be served by any static file server or embedded into the Batata server.

## Development Commands

```bash
# Development server with hot reload
pnpm dev

# Type checking
pnpm type-check

# Production build
pnpm build

# Build with bundle analysis
pnpm build:analyze

# Run unit tests
pnpm test:unit

# Run tests with coverage
pnpm test:coverage

# Lint and auto-fix
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
src/
├── api/                    # API layer
│   └── batata.ts          # Batata API client
├── assets/                # Static assets and styles
│   └── main.css          # Main styles (theme tokens, dark mode)
├── components/            # Shared components
│   ├── ai/               # AI-related components (optimize dialogs, pipelines)
│   ├── common/           # Reusable UI components (DataTable, CodeEditor, DiffEditor, etc.)
│   ├── consul/           # Consul-specific components (topology, discovery chain)
│   └── feedback/         # Notification components (ToastMessage)
├── composables/           # Composables
│   ├── useTheme.ts       # Theme switching (light/dark)
│   ├── useProvider.ts    # Provider switching (batata/consul)
│   ├── useConsulAbilities.ts  # Consul ACL permission checking
│   ├── useListView.ts   # List view pagination and filtering
│   ├── useDetailView.ts  # Detail view logic
│   ├── useFormValidation.ts   # Form validation utilities
│   ├── useAutoRefresh.ts # Auto-refresh interval management
│   ├── useBlockingQuery.ts    # Consul blocking queries (real-time updates)
│   ├── useVersionStatus.ts    # Version status tracking
│   ├── useNotifications.ts
│   └── useWebSocket.ts
├── i18n/                  # Internationalization
│   ├── index.ts
│   └── translations.ts
├── layout/
│   └── BatataLayout.vue  # Main layout (sidebar + header + content)
├── router/
│   └── index.ts
├── stores/
│   └── batata.ts         # Pinia store
├── types/
│   └── index.ts
└── views/                 # Pages
    ├── dashboard/         # Dashboard
    ├── config/            # Configuration management (list, editor, detail, history, sync, rollback, listeners)
    ├── service/           # Service management
    ├── namespace/         # Namespace management
    ├── cluster/           # Cluster management
    ├── datacenter/        # Multi-datacenter
    ├── auth/              # User/Role/Permission
    ├── ai/                # AI Registry (Skills, Prompts, Agents, AgentSpecs, MCP Servers)
    ├── consul/            # Consul mode (Dashboard, KV, Catalog, ACL, Service Mesh, Peering, etc.)
    ├── audit/             # Audit logs
    ├── tracing/           # Distributed tracing
    ├── plugin/            # Plugin management
    └── settings/          # System settings & Copilot LLM configuration
```

## Connecting to Batata Server

By default, the development server proxies `/v3` requests to `http://localhost:8081`. To connect to a different Batata server, edit `.env.development`:

```env
VITE_API_PROXY_TARGET=http://your-batata-server:8081
```

### Default Batata Server Ports

| Port  | Service          | Description                |
| ----- | ---------------- | -------------------------- |
| 8848  | Main HTTP API    | Nacos-compatible API       |
| 8081  | Console HTTP API | Web management console API |
| 9848  | SDK gRPC         | Client SDK communication   |
| 9849  | Cluster gRPC     | Inter-node communication   |
| 8500  | Consul HTTP API  | Consul-compatible API      |
| 9080  | MCP Registry     | MCP server registry        |
| 15010 | xDS              | Service mesh (Envoy/Istio) |

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Batata](https://github.com/easynet-cn/batata) - The Rust-based backend server
- [Nacos](https://nacos.io/) - Original design and API specification
- [Consul](https://www.consul.io/) - KV store and service discovery API design
