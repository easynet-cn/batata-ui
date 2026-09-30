# Batata UI

[![Vue](https://img.shields.io/badge/vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind_css-4.3-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Batata UI** is the web management console for [Batata](https://github.com/easynet-cn/batata) - a high-performance, Rust-based dynamic service discovery and configuration management platform compatible with [Nacos](https://nacos.io/) V2/V3, [Consul](https://www.consul.io/) and [Apollo](https://github.com/apolloconfig/apollo) APIs.

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
- **Apollo Compatibility** - Full Apollo console with apps, clusters, app namespaces, release/publish history, access keys, import/export, global search, consumers, favorites, audit and instance views
- **Audit Logs** - Operation audit trail with filtering and search
- **Tracing** - Distributed tracing with OpenTelemetry integration
- **Plugin Management** - Plugin lifecycle management
- **System Settings** - Application configuration and preferences
- **Dark Mode** - Full light/dark theme support
- **Internationalization** - English and Chinese language support
- **Provider Switching** - Seamless Batata/Consul/Apollo provider switching

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
| Build Tool       | Vite 8 (Rolldown)                        |
| Testing          | Vitest + Playwright (E2E)                |
| Linting          | ESLint + Prettier                        |

## Quick Start

### Prerequisites

- Node.js ^20.19.0 or >=22.12.0
- pnpm 12.4.2+ (declared via the `packageManager` field)
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

# Build and copy the output into the Batata server's console-ui/ directory
pnpm build:ui

# Run unit tests
pnpm test:unit

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (Playwright)
pnpm test:e2e

# Open the E2E test report
pnpm test:e2e:report

# Update dependencies to the latest versions
pnpm update

# Lint and auto-fix
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
src/
├── api/                    # API layer
│   ├── batata.ts          # Batata (Nacos-compatible) API client
│   ├── apollo.ts          # Apollo API client
│   ├── consul.ts          # Consul API client
│   ├── client.ts          # Shared HTTP client
│   ├── provider-factory.ts # Provider-aware API resolution
│   ├── helpers.ts
│   └── types.ts
├── assets/                # Static assets and styles
│   └── main.css          # Main styles (theme tokens, dark mode)
├── components/            # Shared components
│   ├── ai/               # AI-related components (optimize dialogs, pipelines)
│   ├── common/           # Reusable UI components (DataTable, CodeEditor, DiffEditor, etc.)
│   ├── consul/           # Consul-specific components (topology, discovery chain)
│   └── feedback/         # Notification components (ToastMessage)
├── composables/           # Composables
│   ├── useTheme.ts       # Theme switching (light/dark)
│   ├── useProvider.ts    # Provider switching (batata/consul/apollo)
│   ├── useApi.ts         # API call wrapper
│   ├── useAsyncData.ts   # Async data loading state
│   ├── useStorage.ts     # Persistent local storage
│   ├── useConsulAbilities.ts  # Consul ACL permission checking
│   ├── useListView.ts    # List view pagination and filtering
│   ├── useDetailView.ts  # Detail view logic
│   ├── useFormValidation.ts   # Form validation utilities
│   ├── useAutoRefresh.ts # Auto-refresh interval management
│   ├── useBlockingQuery.ts    # Consul blocking queries (real-time updates)
│   ├── useVersionStatus.ts    # Version status tracking
│   ├── useNotifications.ts
│   └── useWebSocket.ts
├── config/                # Application configuration
│   └── index.ts
├── i18n/                  # Internationalization
│   ├── index.ts
│   └── translations.ts
├── layout/
│   └── BatataLayout.vue  # Main layout (sidebar + header + content)
├── router/
│   └── index.ts
├── stores/                # Pinia stores
│   ├── auth.ts           # Authentication state
│   ├── batata.ts         # Batata core state
│   ├── consul.ts         # Consul state (+ consul-acl/catalog/kv/mesh)
│   ├── namespace.ts
│   └── server.ts
├── types/
│   └── index.ts
├── utils/                 # Shared utilities (auto-imported)
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
    ├── apollo/            # Apollo mode (Apps, Clusters, Namespaces, Releases, Access Keys, Import/Export, etc.)
    ├── audit/             # Audit logs
    ├── tracing/           # Distributed tracing
    ├── plugin/            # Plugin management
    ├── settings/          # System settings & Copilot LLM configuration
    ├── AdminInitView.vue  # First-run admin initialization
    ├── LoginView.vue      # Login
    ├── OIDCCallbackView.vue # OIDC/OAuth2 SSO callback
    └── NotFoundView.vue   # 404
```

## Connecting to Batata Server

By default, the development server proxies `/v3` requests to `http://localhost:8081`. The console port (8081) serves the UI and console APIs only — it does **not** expose the Nacos-compatible data APIs, so the frontend should always connect to the console server and never directly to the main server (8848).

To connect to a different Batata server, edit `.env.development`:

```env
VITE_API_PROXY_TARGET=http://your-batata-server:8081
VITE_CONSUL_PROXY_TARGET=http://your-batata-server:8500
VITE_APOLLO_PROXY_TARGET=http://your-batata-server:8080
```

| Variable                   | Proxy path    | Default                 |
| -------------------------- | ------------- | ----------------------- |
| `VITE_API_PROXY_TARGET`    | `/v3`         | `http://localhost:8081` |
| `VITE_CONSUL_PROXY_TARGET` | `/consul-api` | `http://localhost:8500` |
| `VITE_APOLLO_PROXY_TARGET` | `/apollo-api` | `http://localhost:8080` |

### Default Batata Server Ports

| Port  | Service          | Description                 |
| ----- | ---------------- | --------------------------- |
| 8848  | Main HTTP API    | Nacos-compatible API        |
| 8081  | Console HTTP API | Web management console API  |
| 8080  | Apollo HTTP API  | Apollo Config/Admin/OpenAPI |
| 9848  | SDK gRPC         | Client SDK communication    |
| 9849  | Cluster gRPC     | Inter-node communication    |
| 8500  | Consul HTTP API  | Consul-compatible API       |
| 9080  | MCP Registry     | MCP server registry         |
| 15010 | xDS              | Service mesh (Envoy/Istio)  |

## E2E Tests

End-to-end tests live in `e2e/` and run against a running Batata server with Playwright.

```bash
# Install browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Open the HTML report
pnpm test:e2e:report
```

## Embedding into the Batata Server

The Batata server serves the console UI from its `console-ui/` directory. To build the UI and copy the output there in one step:

```bash
pnpm build:ui
```

This runs a production build and copies `dist/` to `../batata/console-ui/` (requires the [batata](https://github.com/easynet-cn/batata) repository to be cloned as a sibling directory). After restarting the server, open `http://localhost:8081/`.

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
- [Apollo](https://github.com/apolloconfig/apollo) - Config Service / Admin Service / OpenAPI design
