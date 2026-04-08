# Batata Microservice Management Platform - User Manual

**Software Name:** Batata Microservice Management Platform

**Version:** V1.0

**Developer:** EasyNet

---

## Table of Contents

1. [Software Overview](#1-software-overview)
2. [System Requirements](#2-system-requirements)
3. [Installation & Deployment](#3-installation--deployment)
4. [System Login](#4-system-login)
5. [Dashboard](#5-dashboard)
6. [Configuration Management](#6-configuration-management)
7. [Service Management](#7-service-management)
8. [Namespace Management](#8-namespace-management)
9. [Cluster Management](#9-cluster-management)
10. [Access Control](#10-access-control)
11. [AI Registry](#11-ai-registry)
12. [Consul Compatibility](#12-consul-compatibility)
13. [Multi-Datacenter Management](#13-multi-datacenter-management)
14. [Audit Logs](#14-audit-logs)
15. [Distributed Tracing](#15-distributed-tracing)
16. [Plugin Management](#16-plugin-management)
17. [System Settings](#17-system-settings)
18. [Technical Architecture](#18-technical-architecture)
19. [FAQ](#19-faq)

---

## 1. Software Overview

### 1.1 Introduction

Batata Microservice Management Platform is an enterprise-grade microservice infrastructure management system built on a high-performance Rust backend and a modern Vue 3 frontend. The platform is fully compatible with the Apache Nacos 3.x protocol and provides 99% HashiCorp Consul API compatibility, serving as a high-performance drop-in replacement for either Nacos or Consul.

Compared to the traditional Java-based Nacos implementation, Batata offers significant advantages:

- **Ultra-low memory footprint**: 50-100MB runtime memory, 1/10 to 1/20 of the Java version
- **Instant startup**: 1-2 seconds startup time, 1/30 of the Java version
- **Dual-protocol compatibility**: Supports both Nacos and Consul service discovery protocols
- **AI-native integration**: Built-in MCP (Model Context Protocol) server registry and A2A (Agent-to-Agent) agent management

### 1.2 Core Features

| Module                   | Description                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Configuration Management | Create, edit, version control, gray release, import/export, cross-environment sync       |
| Service Management       | Service registration & discovery, instance management, health checks, subscriber queries |
| Namespace                | Multi-environment isolation, tenant capacity management                                  |
| Cluster Management       | Node status monitoring, Raft consensus protocol, multi-datacenter sync                   |
| Access Control           | User management, role management, fine-grained RBAC permissions                          |
| AI Management            | MCP server registry, A2A agent management                                                |
| Consul Compatibility     | KV store, service catalog, ACL, Service Mesh                                             |
| Observability            | Prometheus metrics, OpenTelemetry tracing, audit logs                                    |
| Plugin System            | Extensible plugin architecture                                                           |

### 1.3 Use Cases

- Service registration and discovery in microservice architectures
- Centralized configuration management for distributed systems
- Multi-environment (dev, test, staging, production) configuration isolation
- Enterprise-grade access control and auditing
- Cloud-native application service governance
- AI/LLM application tool and agent management

---

## 2. System Requirements

### 2.1 Server Requirements

| Item             | Requirement                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Operating System | Linux (x86_64/aarch64), macOS, Windows                                                          |
| Memory           | Minimum 256MB, recommended 512MB+                                                               |
| Disk             | Minimum 500MB available space                                                                   |
| Database         | MySQL 5.7+/8.0+ or PostgreSQL (cluster mode)                                                    |
| Network Ports    | 8848 (main server), 8081 (console), 9848/9849 (gRPC), 8500 (Consul compat), 9080 (MCP Registry) |

### 2.2 Browser Requirements

| Browser         | Minimum Version |
| --------------- | --------------- |
| Google Chrome   | 90+             |
| Mozilla Firefox | 90+             |
| Microsoft Edge  | 90+             |
| Safari          | 15+             |

### 2.3 Screen Resolution

- Minimum: 1280 x 720
- Recommended: 1920 x 1080 and above
- Responsive layout supporting tablet and desktop devices

---

## 3. Installation & Deployment

### 3.1 Standalone Mode

Standalone mode uses embedded RocksDB storage with no external database required, suitable for development and testing.

```bash
# Standalone mode (embedded storage) - recommended
./scripts/startup.sh -m standalone -p embedded

# Or use the legacy script
./scripts/start-embedded.sh
```

Access the console at: `http://localhost:8081`

### 3.2 Cluster Mode

Cluster mode requires an external database (MySQL or PostgreSQL) and supports high availability with horizontal scaling.

```bash
# Configure database connection (conf/application.yml)
# db.url: mysql://user:password@localhost:3306/batata

# Configure cluster members (conf/cluster.conf)
# 192.168.1.1:8848
# 192.168.1.2:8848
# 192.168.1.3:8848

# Cluster mode startup - recommended
./scripts/startup.sh

# With MySQL database
./scripts/startup.sh --db.url=mysql://user:pass@localhost:3306/batata

# Or use the legacy script
./scripts/start-server.sh
```

### 3.3 Separated Deployment

```bash
# Start Server only (no console) - recommended
./scripts/startup.sh -d server

# Start Console only (connects to remote Server)
./scripts/startup.sh -d console

# Server + MCP Registry
./scripts/startup.sh -d serverWithMcp

# Or use the legacy scripts
./scripts/start-server.sh
./scripts/start-console.sh
```

### 3.4 Docker Deployment

```bash
# Embedded mode (no database required)
docker compose up batata

# With MySQL
docker compose --profile mysql up

# With PostgreSQL
docker compose --profile postgres up

# Full monitoring stack (with Prometheus + Grafana)
docker compose --profile mysql --profile monitoring up
```

**Stop services:**

```bash
# Using the shutdown script
./scripts/shutdown.sh

# Or using Docker Compose
docker compose down
```

### 3.5 Admin Initialization

After the first deployment, initialize the administrator password:

```bash
./init-admin.sh
```

Or complete the setup through the browser's admin initialization page.

---

## 4. System Login

### 4.1 Login Page

Open a browser and navigate to the console address (default `http://localhost:8081`) to reach the login page.

**Login fields:**

- **Username**: Enter your registered username
- **Password**: Enter your password
- **Remember Me**: Check to maintain login session

### 4.2 Admin Initialization

On first use, the system automatically redirects to the admin initialization page to set the initial password for the administrator (batata) account.

### 4.3 User Registration

If user registration is enabled, new users can create accounts through the registration page.

### 4.4 OIDC Single Sign-On

When OAuth2/OIDC authentication is configured, users can log in via third-party identity providers (e.g., Google, GitHub, Microsoft). After authenticating with the external provider, the system automatically handles the callback and completes the login process.

---

## 5. Dashboard

After login, the dashboard displays an overview of key system metrics.

### 5.1 Statistics Cards

Four statistics cards at the top of the dashboard:

- **Total Services**: Number of registered services
- **Total Configurations**: Number of created configurations
- **Namespaces**: Number of created namespaces
- **Cluster Nodes**: Number of online cluster nodes

### 5.2 Charts

- **Service Health Distribution**: Pie/donut chart showing healthy vs unhealthy service ratios
- **Configuration Type Distribution**: Chart showing configuration counts by format (JSON, YAML, Properties, etc.)

### 5.3 Recent Activity

Displays recent configuration changes, service registrations, and other operational records.

### 5.4 Quick Actions

Provides quick-access shortcuts to common operations such as creating configurations and registering services.

---

## 6. Configuration Management

Configuration management is the core module of Batata, providing full lifecycle management of configurations.

### 6.1 Configuration List

**Path:** Sidebar > Configuration Management > Configuration List

Displays all configurations under the current namespace.

**Statistics Cards:**
Four statistics cards at the top: Total Configurations, Encrypted Configs, Beta Configs, and Groups.

**Operations:**

- **Search & Filter**: Search by Data ID, Group, application name, and tags (supports fuzzy/exact modes)
- **Advanced Search**: Expand advanced filters for multi-criteria queries
- **Pagination**: Customizable items per page
- **Batch Operations**: Batch delete, batch export selected configurations

### 6.2 Create Configuration

**Path:** Configuration List > Create Configuration

Creating a new configuration requires the following fields:

| Field            | Required | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| Data ID          | Yes      | Unique identifier for the configuration                |
| Group            | Yes      | Configuration group, defaults to DEFAULT_GROUP         |
| Format           | Yes      | Supports TEXT, JSON, YAML, XML, HTML, Properties, TOML |
| Content          | Yes      | Edit using the code editor with syntax highlighting    |
| Application Name | No       | Associated application name                            |
| Tags             | No       | Configuration tags for categorization                  |
| Description      | No       | Configuration description                              |

The code editor is built on CodeMirror 6 and supports:

- Multi-language syntax highlighting (JSON, YAML, XML, Properties, etc.)
- Code folding
- Line numbers
- Search and replace
- Auto-indentation

### 6.3 Edit Configuration

**Path:** Configuration List > Click "Edit" in the action column

Opens the configuration editor to modify content, format, description, and other fields. A history version is automatically recorded upon saving.

### 6.4 Configuration Details

**Path:** Configuration List > Click the Data ID link

View complete configuration information:

- Basic info (Data ID, Group, format, application name)
- Configuration content (read-only view)
- Metadata information
- Action buttons (Edit, Delete)

### 6.5 Version History

**Path:** Configuration Details > History

View all historical change records for a configuration:

- **Version List**: Shows timestamp, operator, and operation type for each change
- **Version Comparison**: Side-by-side diff view comparing two versions
- **Rollback**: Restore configuration to a specific historical version
- **View Details**: View the full content of any historical version

### 6.6 Gray Release (Beta)

Gray release allows pushing configuration changes to a subset of clients for validation before full rollout.

**Gray Rule Types:**

- **IP Mode**: Specify client IP addresses, separated by commas
- **Tag Mode**: Use tag expressions to match clients (e.g., `env=gray AND region=cn-east`)

**Workflow:**

- **Publish Beta Configuration**: Select gray release in the editor, set gray name and rule
- **View Beta Status**: Check current beta configuration and rules in config details
- **Confirm/Cancel Beta**: Confirm full release after validation, or cancel the beta

### 6.7 Configuration Encryption

Batata supports automatic encryption and decryption of configuration content:

- **Auto-detection**: Encryption is automatically enabled when the Data ID starts with `cipher-` prefix
- **Encryption Algorithm**: AES-GCM 256-bit encryption
- **Transparent Decryption**: Clients automatically decrypt when fetching configurations via SDK

### 6.8 Listener Query

**Path:** Sidebar > Configuration Management > Listener Query

Query clients currently listening for configuration changes:

- **Query by Configuration**: Enter Data ID and Group to find all listening client IPs
- **Query by IP**: Enter a client IP to find all configurations it is listening to

### 6.9 Import & Export

**Export Configurations:**

- Select configurations to export from the list
- Click "Export" to download a ZIP package

**Import Configurations:**

- Click "Import" and upload a configuration package
- Select import policy:
  - **Skip**: Skip if configuration already exists
  - **Overwrite**: Overwrite existing configurations
  - **Abort**: Abort import if any configuration exists

### 6.10 Clone Configuration

Clone selected configurations to another namespace, ideal for cross-environment configuration migration.

### 6.11 Configuration Sync

**Path:** Sidebar > Configuration Management > Configuration Sync

Cross-environment configuration synchronization, supporting syncing configurations from the current environment to target environments:

- **Target Environment Management**: Configure `batata.sync.targets` in `application.yml` to specify target environment addresses
- **Sync Policies**:
  - **Skip** (SKIP): Do not overwrite configurations that already exist on the target
  - **Overwrite** (OVERWRITE): Force overwrite target configurations
  - **Abort** (ABORT): Abort synchronization when conflicts are encountered
- **Sync History**: View historical sync records and results

---

## 7. Service Management

The service management module provides microservice registration, discovery, and instance management.

### 7.1 Service List

**Path:** Sidebar > Service Management > Service List

Displays all registered services under the current namespace:

| Column               | Description                        |
| -------------------- | ---------------------------------- |
| Service Name         | Unique service name                |
| Group                | Service group                      |
| Cluster Count        | Number of clusters in the service  |
| Instance Count       | Total number of instances          |
| Healthy Instances    | Number of healthy instances        |
| Protection Threshold | Service protection threshold (0-1) |

**Operations:**

- Search by service name and group
- Create service manually
- Hide empty services (filter services with no instances)
- Edit/Delete services

### 7.2 Service Details

**Path:** Service List > Click service name

Displays detailed service information:

**Cluster Information:**

- Cluster name
- Health check type and configuration
- Instance count statistics

**Instance List:**

| Column         | Description                     |
| -------------- | ------------------------------- |
| IP             | Instance IP address             |
| Port           | Service port                    |
| Weight         | Routing weight                  |
| Health Status  | Whether health check passed     |
| Online/Offline | Instance availability           |
| Metadata       | Additional instance information |

**Instance Operations:**

- Enable/Disable instance
- Edit instance weight and metadata
- Delete instance
- Edit cluster health check configuration

### 7.3 Subscriber List

**Path:** Sidebar > Service Management > Subscribers

View clients subscribing to service change notifications:

- Client IP address
- Subscribed service name
- Application identifier

---

## 8. Namespace Management

**Path:** Sidebar > Namespaces

Namespaces provide logical isolation for multi-environment scenarios.

### 8.1 Namespace List

Displays all namespace information:

| Column              | Description                                           |
| ------------------- | ----------------------------------------------------- |
| Namespace ID        | Unique identifier ("public" is the default namespace) |
| Namespace Name      | Display name                                          |
| Configuration Count | Number of configurations in the namespace             |
| Description         | Namespace description                                 |

### 8.2 Create Namespace

Click "Create Namespace" and fill in:

- **Namespace ID**: Unique identifier (can be auto-generated)
- **Namespace Name**: Display name
- **Description**: Purpose description

### 8.3 Switch Namespace

Use the namespace selector in the header bar to switch the current working namespace. Configuration and service lists will update to show data from the selected namespace.

---

## 9. Cluster Management

**Path:** Sidebar > Cluster Management

### 9.1 Node List

Displays the status of all nodes in the cluster:

| Column        | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| Node Address  | Node IP address and port                                        |
| Status        | UP / DOWN / SUSPICIOUS                                          |
| Capabilities  | Supported features (Remote connection, Metrics, Raft consensus) |
| Extended Info | Node extended information (JSON format, expandable for details) |

**Operations:**

- **Search**: Search nodes by IP address
- **Refresh**: Manually refresh the node list

### 9.2 Cluster Architecture

Batata supports two consistency modes:

- **CP Mode (Raft)**: Strong consistency, suitable for configuration management and scenarios requiring strict consistency
- **AP Mode (Distro)**: Eventual consistency, suitable for service discovery and scenarios prioritizing availability

---

## 10. Access Control

Batata provides Role-Based Access Control (RBAC).

### 10.1 User Management

**Path:** Sidebar > Access Control > Users

- **Create User**: Set username and password
- **Change Password**: Reset user password
- **Delete User**: Remove user account
- **Search Users**: Search by username

### 10.2 Role Management

**Path:** Sidebar > Access Control > Roles

- **Bind Role**: Assign a role to a user
- **Unbind Role**: Remove a user's role binding
- **Search**: Search by role name or username

### 10.3 Permission Management

**Path:** Sidebar > Access Control > Permissions

Configure fine-grained resource access permissions:

| Field    | Description                                 |
| -------- | ------------------------------------------- |
| Role     | The role this permission belongs to         |
| Resource | Resource identifier (supports wildcard `*`) |
| Action   | Read (r) / Write (w)                        |

**Permission Format:** `{namespace}:{group}:{resource_type}/{resource_name}`

Example: `public:DEFAULT_GROUP:config/application.yml:r` grants read access to the `application.yml` configuration in the `DEFAULT_GROUP` group under the `public` namespace.

### 10.4 Authentication Methods

Batata supports multiple authentication methods:

- **Local Authentication**: Username/password with JWT tokens
- **LDAP**: Enterprise directory service integration
- **OAuth2/OIDC**: Third-party login via Google, GitHub, Microsoft

---

## 11. AI Registry

Batata includes a comprehensive AI-native registry for managing AI capabilities across the platform. The AI Registry supports Skills, Prompts, Agents, Agent Specifications, and MCP Servers, along with a built-in Copilot configuration.

### 11.1 Skill Management

**Path:** Sidebar > AI Registry > Skills

Skills are reusable AI capability packages that can be versioned, published, and shared across the platform.

**Statistics Cards:**
Two statistics cards at the top: Total Skills and Online Skills.

**Skill List:**

- View all registered skills as a card grid
- Filter by scope (public/private)
- Sort by download count
- Search by skill name
- Batch select and delete skills

**Create Skill:**

Click "Create Skill" to open the skill editor. Fill in the skill metadata including name, description, labels, and business tags. Skills support a draft workflow — create a draft, submit for review, then publish.

**Upload Skill:**

Click "Upload Skill" to upload a skill package file directly.

**Skill Details:**

- View skill metadata (name, scope, labels, business tags)
- Browse version history
- Download specific versions
- Manage skill lifecycle: online/offline, publish, scope changes

**Skill Publishing Workflow:**

1. **Create Draft** — Start with a draft version of the skill
2. **Submit for Review** — Submit the draft for approval
3. **Publish** — Approve and publish the skill (admin can force publish)
4. **Online/Offline** — Control skill availability without deleting

### 11.2 Prompt Management

**Path:** Sidebar > AI Registry > Prompts

Prompts are versioned prompt templates with governance support for AI applications.

**Prompt List:**

- View all prompts as a card grid
- Search by prompt key (fuzzy or exact mode)
- Batch select and delete prompts

**Create Prompt:**

Click "Create Prompt" to open the prompt editor. Define the prompt key, content, description, labels, and business tags.

**Prompt Details:**

- View prompt metadata and content
- Browse version history
- View governance information
- Manage prompt lifecycle

**Prompt Publishing Workflow:**

1. **Create Draft** — Start with a draft version
2. **Submit for Review** — Submit for approval
3. **Publish** — Approve and publish (admin can force publish)
4. **Online/Offline** — Control prompt availability
5. **Update Metadata** — Update description, labels, and business tags independently

### 11.3 Agent Management

**Path:** Sidebar > AI Registry > Agents

Agents are AI agent definitions that combine models, prompts, and tools (MCP servers) for task execution.

**Agent List:**

- View all registered agents
- Status display (enabled/disabled)
- Associated MCP servers

**Create Agent:**

| Field          | Description                       |
| -------------- | --------------------------------- |
| Agent Name     | Name identifier                   |
| Model          | AI model to use                   |
| System Prompt  | System prompt configuration       |
| MCP Servers    | Associated tool servers           |
| Temperature    | Generation temperature parameter  |
| Max Tokens     | Output length limit               |
| Max Iterations | Maximum tool-call iteration count |

**Agent Details:**

- View agent configuration and metadata
- Edit agent settings
- Delete agent

### 11.4 Agent Specification Management

**Path:** Sidebar > AI Registry > Agent Specs

Agent Specifications (AgentSpecs) are reusable agent configuration templates that can be versioned, published, and shared — similar to Skills but for agent definitions.

**AgentSpec List:**

- View all agent specs as a card grid
- Filter by scope (public/private)
- Sort by download count
- Search by spec name
- Batch select and delete specs

**Create AgentSpec:**

Click "Create Agent Spec" to open the editor, or "Upload Agent Spec" to upload a spec package file.

**AgentSpec Details:**

- View spec metadata and version history
- Download specific versions
- Manage lifecycle: online/offline, publish, scope changes

**AgentSpec Publishing Workflow:**

1. **Create Draft** — Start with a draft
2. **Submit for Review** — Submit for approval
3. **Publish** — Approve and publish (admin can force publish)
4. **Online/Offline** — Control availability

### 11.5 MCP Server Management

**Path:** Sidebar > AI Registry > MCP Servers

MCP (Model Context Protocol) is a tool registration protocol for AI/LLM applications.

**Statistics Cards:**
Four statistics cards at the top: Total MCP Servers, Enabled count, Total Tools, and Server Types.

**MCP Server List:**

- View all registered MCP servers
- Server type display (stdio, SSE, HTTP)
- Enabled/disabled status
- Available tool count

**Create MCP Server:**

| Field                 | Description                             |
| --------------------- | --------------------------------------- |
| Server Name           | MCP server name                         |
| Connection Type       | stdio / SSE / HTTP                      |
| Connection Config     | Command-line arguments or URL           |
| Environment Variables | Environment variables for the server    |
| Tool List             | Tool definitions provided by the server |

**MCP Server Details:**

- View server metadata
- Browse available tools
- View tool input/output schemas

**Import Features:**

- Import tool definitions from existing MCP servers
- Import from MCP Registry (search and select servers from the registry)
- Import from OpenAPI specification
- Validate import data
- Batch import

### 11.6 Copilot Settings

**Path:** Sidebar > AI Registry > Copilot Settings

Configure the built-in AI Copilot that assists with skill and prompt optimization.

**LLM Configuration:**

| Field    | Description                                                    |
| -------- | -------------------------------------------------------------- |
| API Key  | API key for your LLM provider (e.g., DashScope, OpenAI)        |
| Model    | LLM model selection (e.g., qwen-plus, qwen-turbo, gpt-4, etc.) |
| Base URL | Custom LLM endpoint URL (optional, uses provider default)      |

**Studio Configuration:**

| Field      | Description                                            |
| ---------- | ------------------------------------------------------ |
| Studio URL | External AI studio URL for advanced editing (optional) |

---

## 12. Consul Compatibility

Batata provides 99% Consul API compatibility. Switch to the Consul management interface via the Provider toggle.

### 12.1 Switch to Consul Mode

Click the "CONSUL" button in the header's Provider switcher to access the Consul management interface.

### 12.2 Consul Dashboard

Displays Consul cluster overview including service count, node count, and health check status.

### 12.3 KV Store

**Path:** Consul Sidebar > KV Store

- **Browse KV List**: View key-value pairs in a directory tree structure
- **Create KV**: Create new key-value pairs
- **Edit KV**: Modify values
- **Delete KV**: Remove key-value pairs

### 12.4 Service Catalog

**Path:** Consul Sidebar > Catalog > Services / Nodes

- **Service List**: View all registered Consul services
- **Service Details**: View service instance information
- **Node List**: View all nodes in the cluster
- **Node Details**: View services running on a node

### 12.5 Health Checks

**Path:** Consul Sidebar > Health

View and manage service health check status.

### 12.6 ACL (Access Control List)

**Path:** Consul Sidebar > ACL

- **Token Management**: Create and manage ACL tokens
- **Policy Management**: Define access control policies
- **Role Management**: Manage ACL roles
- **Auth Methods**: Configure external authentication methods

### 12.7 Service Mesh

**Path:** Consul Sidebar > Service Mesh

- **Intentions**: Manage inter-service communication intents (allow/deny)
- **Config Entries**: Manage Service Mesh configuration entries

### 12.8 Cluster Peering

**Path:** Consul Sidebar > Peerings

- **Peering List**: View cluster peering connections
- **Peering Details**: View detailed peering information including status, imported/exported service counts, and connection metadata

### 12.9 Exported Services

**Path:** Consul Sidebar > Service Mesh > Exported Services

Manage services that are exported across cluster partitions or peers for cross-cluster service discovery.

### 12.10 Admin Partitions

**Path:** Consul Sidebar > Cluster > Partitions

Manage administrative partitions for multi-tenancy isolation within a Consul cluster.

### 12.11 Consul Namespaces

**Path:** Consul Sidebar > Cluster > Namespaces

Manage Consul namespaces for logical isolation of services and KV data within a partition.

### 12.12 Session Management

**Path:** Consul Sidebar > Cluster > Sessions

Manage distributed lock sessions:

- **Session List**: View active sessions with TTL and lock information
- **Session Details**: View detailed session information including associated node and checks

### 12.13 Event Log

**Path:** Consul Sidebar > Cluster > Events

View and manage Consul user events:

- Event name and payload
- Event timestamp and source node
- Fire new events

### 12.14 Operator

**Path:** Consul Sidebar > Cluster > Operator

View cluster operator information including Raft peer status and autopilot configuration.

---

## 13. Multi-Datacenter Management

**Path:** Sidebar > Multi-Datacenter

### 13.1 Datacenter List

Manage multiple datacenter configurations:

- Add/Edit/Delete datacenters
- Set primary datacenter
- View datacenter status

### 13.2 Sync Topology

Visualize the synchronization relationships and topology between datacenters.

### 13.3 Sync Progress

Monitor cross-datacenter data synchronization progress and status.

---

## 14. Audit Logs

**Path:** Sidebar > Audit Logs

Tracks all configuration change operations as an audit trail, based on configuration history records:

### 14.1 Log Query

**Filter Criteria:**

- **Operation Type**: CREATE, UPDATE, DELETE
- **Operator**: Search by username
- **Time Range**: Custom start and end time
- **Pagination**: Customizable items per page

### 14.2 Log Details

View detailed information for individual audit records:

- Operator and source IP
- Affected resource (group/dataId)
- Operation timestamp
- Change type

### 14.3 Audit Statistics

Displays an operation statistics overview: total operations, today's operations, and configuration change count.

---

## 15. Distributed Tracing

**Path:** Sidebar > Tracing

Provides distributed tracing integration capabilities. Batata exports trace data to external tracing systems via the OpenTelemetry (OTLP) protocol.

### 15.1 Configure Tracing

Enable OpenTelemetry in `application.yml`:

```yaml
batata:
  otel:
    enabled: true
    exporter:
      otlp:
        endpoint: http://jaeger:4317
    service:
      name: batata-server
```

### 15.2 Trace Query

When OTLP is configured, the page displays tracing backend information and connection status. For full trace data, query the tracing backend such as Jaeger or Tempo.

### 15.3 Service Dependencies

Visualize inter-service call dependency relationships (requires tracing backend support).

---

## 16. Plugin Management

> **Note:** Following the Nacos 3.x architecture direction, plugin management is implemented through the built-in SPI mechanism and does not provide a runtime hot-loading interface. Plugins are registered at compile time.

**Path:** Sidebar > Plugin Management

### 16.1 Plugin List

Manage system plugins:

- **Plugin Types**: config, auth, naming, datasource, other
- **Enable/Disable**: Control plugin runtime status
- **Plugin Configuration**: Modify plugin parameters
- **Status Indicators**: Display plugin running status (normal/error)

---

## 17. System Settings

**Path:** Sidebar > Settings

### 17.1 Appearance

- **Theme Toggle**: Light mode / Dark mode / System
- **Language Selection**: English / Simplified Chinese
- **Namespace Display Mode**: Show name only / Show ID only / Show both name and ID
- **Sidebar Collapsed**: Control the default sidebar collapse state

### 17.2 Editor Settings

- **Font Size**: Code editor font size
- **Tab Size**: Indentation width
- **Word Wrap**: Enable/disable automatic word wrapping
- **Line Numbers**: Show/hide line numbers

### 17.3 Notification Preferences

Configure system notification display preferences.

### 17.4 Auto Refresh

Set automatic refresh intervals for list pages.

### 17.5 About

View system version information and related links.

---

## 18. Technical Architecture

### 18.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Browser  │  │SDK Client│  │gRPC Client│  │DNS Client│ │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────┬────┘ │
└────────┼─────────────┼─────────────┼────────────┼──────┘
         │             │             │            │
┌────────┼─────────────┼─────────────┼────────────┼──────┐
│        ▼             ▼             ▼            ▼      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Console   │  │HTTP  8848│  │gRPC  9848│  │DNS  53 │ │
│  │    8081  │  └─────┬────┘  └─────┬────┘  └───┬────┘ │
│  └─────┬────┘        │             │            │      │
│        │             ▼             ▼            ▼      │
│        ▼       ┌─────────────────────────────────────┐ │
│  ┌──────────┐  │          Business Logic Layer        │ │
│  │ Console  │  │  ┌──────────┐  ┌──────────┐         │ │
│  │   API    │  │  │  Config  │  │  Naming  │         │ │
│  └──────────┘  │  │ Service  │  │  Service │         │ │
│                │  └──────────┘  └──────────┘         │ │
│                │  ┌──────────┐  ┌──────────┐         │ │
│                │  │   Auth   │  │    AI    │         │ │
│                │  │ Service  │  │  Service │         │ │
│                │  └──────────┘  └──────────┘         │ │
│                │  ┌──────────┐  ┌──────────┐         │ │
│                │  │  Consul  │  │ Cluster  │         │ │
│                │  │  Plugin  │  │ Service  │         │ │
│                │  └──────────┘  └──────────┘         │ │
│                └─────────────────┬───────────────────┘ │
│                                  │                     │
│  ┌───────────────────────────────▼─────────────────┐   │
│  │            Consistency Protocol Layer            │   │
│  │  ┌──────────────┐    ┌──────────────┐           │   │
│  │  │ Raft (CP)    │    │ Distro (AP)  │           │   │
│  │  └──────────────┘    └──────────────┘           │   │
│  └───────────────────────────────┬─────────────────┘   │
│                                  │                     │
│  ┌───────────────────────────────▼─────────────────┐   │
│  │              Storage Layer                       │   │
│  │  ┌────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │ MySQL  │  │PostgreSQL│  │ RocksDB  │        │   │
│  │  └────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────┘   │
│                    Batata Server                        │
└─────────────────────────────────────────────────────────┘
```

### 18.2 Frontend Technology Stack

| Technology   | Version | Purpose            |
| ------------ | ------- | ------------------ |
| Vue 3        | 3.5+    | Frontend framework |
| TypeScript   | 5.x     | Type safety        |
| Tailwind CSS | 4.x     | Styling framework  |
| Pinia        | 3.x     | State management   |
| Vue Router   | 5.x     | Routing            |
| Axios        | 1.x     | HTTP client        |
| ECharts      | 5.x     | Data visualization |
| CodeMirror   | 6.x     | Code editor        |
| Lucide Icons | -       | Icon library       |

### 18.3 Backend Technology Stack

| Technology     | Version | Purpose               |
| -------------- | ------- | --------------------- |
| Rust           | 1.85+   | Programming language  |
| Actix-web      | 4.x     | HTTP framework        |
| Tonic          | 0.14    | gRPC framework        |
| Tokio          | 1.50    | Async runtime         |
| SeaORM         | 1.1     | Database ORM          |
| OpenRaft       | 0.9     | Raft consensus        |
| RocksDB        | 0.24    | Embedded storage      |
| JSON Web Token | 9.x     | Authentication tokens |
| OpenTelemetry  | 0.28    | Observability         |

### 18.4 Protocol Support

| Protocol  | Port  | Description                      |
| --------- | ----- | -------------------------------- |
| HTTP REST | 8848  | Nacos V2/V3 compatible API       |
| HTTP REST | 8081  | Console management API           |
| gRPC      | 9848  | SDK client communication         |
| gRPC      | 9849  | Inter-node cluster communication |
| xDS       | 15010 | Service mesh (Envoy/Istio)       |
| DNS       | 53    | DNS-based service discovery      |

### 18.5 Storage Backends

| Mode                 | Storage            | Use Case                               |
| -------------------- | ------------------ | -------------------------------------- |
| Standalone Embedded  | RocksDB            | Development and testing                |
| Distributed Embedded | RocksDB + Raft     | Production cluster without external DB |
| External Database    | MySQL / PostgreSQL | Production cluster with external DB    |

---

## 19. FAQ

### Q1: What should I do if I forget the admin password?

Reset the admin password using the command-line tool:

```bash
./init-admin.sh
```

### Q2: How do I migrate from Nacos to Batata?

Batata is fully compatible with Nacos V2/V3 APIs. Existing Nacos SDK clients require no code changes — simply point the server address to Batata. Configuration data can be migrated using the export/import functionality.

### Q3: How do I migrate from Consul to Batata?

Batata provides 99% Consul API compatibility. Existing Consul clients only need to change the server address. KV data can be migrated via JSON format import/export.

### Q4: How many nodes are required for cluster mode?

It is recommended to use 3 or 5 nodes (odd numbers) to satisfy the Raft protocol's majority requirement.

### Q5: How do I configure HTTPS?

Deploy Nginx or another reverse proxy in front of Batata to provide HTTPS support.

### Q6: What configuration formats are supported?

Seven formats are supported: TEXT, JSON, YAML, XML, HTML, Properties, and TOML. The editor provides corresponding syntax highlighting for each format.

### Q7: How do I enable authentication?

Set the following in the configuration file `conf/application.yml`:

```yaml
nacos:
  core:
    auth:
      enabled: true
```

### Q8: Does Batata support Kubernetes?

Yes. Batata includes Kubernetes service sync (bidirectional), pod service account integration, and can be deployed using Helm charts or Docker Compose.

### Q9: What observability integrations are available?

- **Metrics**: Prometheus endpoint at `/nacos/actuator/prometheus`
- **Tracing**: OpenTelemetry OTLP compatible with Jaeger, Zipkin, Tempo, and Datadog
- **Logging**: Structured JSON logging with file rotation

### Q10: What is the difference between CP and AP modes?

- **CP Mode (Raft)**: Provides strong consistency guarantees. Used for configuration management where data correctness is critical.
- **AP Mode (Distro)**: Provides eventual consistency with high availability. Used for service discovery where availability is prioritized over strict consistency.

---

**Batata Microservice Management Platform V1.0 User Manual**

Copyright (C) EasyNet. All rights reserved.
