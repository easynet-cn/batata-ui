# Nacos Frontend Feature Parity Checklist (Nacos core)

> **Source of truth:** `nacos/console-ui-next` (React 19, develop branch) — `/Users/terry/work/github/easynet-cn/nacos/console-ui-next/src/pages/`
> **Target:** `batata-ui` (Vue 3 + Tailwind) — `/Users/terry/work/github/easynet-cn/batata-ui/src/views/`
> **Method:** Enumerate upstream feature modules by reading source, then compare against `batata-ui`'s existing implementation (pages + e2e). Status is decided by source facts, each verified against `batata-ui` source directly.
> **Related:** The server-side Nacos backend parity lives in `batata/docs/compat/nacos/` (API contract layer). This document only aligns the **frontend console features**.

## Legend

- ✅ Aligned　🟡 Partial　❌ Missing　🚀 Ahead of upstream

## 1. Configuration Management (configurationManagement domain)

| Feature                                                                                          | Upstream | batata                             | Status    |
| ------------------------------------------------------------------------------------------------ | -------- | ---------------------------------- | --------- |
| Fuzzy / exact search (dataId/group/appName/type/content/tags)                                    | ✅       | ✅                                 | ✅        |
| New config (with encryption toggle, gray-release rules)                                          | ✅       | 🚀 Ahead                           | ✅        |
| Import zip (conflict policy ABORT/SKIP/OVERWRITE)                                                | ✅       | ✅                                 | ✅        |
| Export selected                                                                                  | ✅       | ✅                                 | ✅        |
| **Export All** (current filter)                                                                  | ✅       | ✅                                 | ✅ **B2** |
| Batch delete                                                                                     | ✅       | ✅                                 | ✅        |
| **Clone**: multi-select + per-row editable dataId/group                                          | ✅       | ✅                                 | ✅ **B1** |
| Type / encryption / gray-release badges                                                          | ✅       | ✅                                 | ✅        |
| Row actions: detail / edit / delete / history / listeners / clone / sample-code / promote-stable | ✅       | 🚀 Ahead                           | ✅        |
| Gray release / version compare / history / rollback / listener query / config sync               | ✅       | 🚀 Ahead (upstream sync is a stub) | 🚀        |

## 2. Service Management (serviceManagement / serviceDetail / subscriberList)

| Feature                                                                                                 | Upstream | batata                                                                                          | Status                                                      |
| ------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Service list (name/group/cluster count/instance count/healthy count/protect threshold)                  | ✅       | ✅                                                                                              | ✅                                                          |
| Create / edit (serviceName/group/protectThreshold/metadata)                                             | ✅       | ✅                                                                                              | ✅                                                          |
| **Create** with **ephemeral toggle**                                                                    | ✅       | ✅ (backend console `ServiceForm` + datasource `service_create` forward ephemeral; create-only) | ✅ **B3** (frontend create form now has ephemeral checkbox) |
| Create / edit with **selector** (type/expression)                                                       | ✅       | ✅                                                                                              | ✅ **B3**                                                   |
| **triggerFlag column** in list                                                                          | ✅       | ✅ (backend `ServiceInfo.triggerFlag` returns a string)                                         | ✅ **B4**                                                   |
| Service detail: instance list / weight edit / online-offline / health / metadata / cluster health check | ✅       | ✅ 🚀                                                                                           | ✅                                                          |
| Subscriber list (group/service/address/agent/app)                                                       | ✅       | ✅                                                                                              | ✅                                                          |

## 3. Namespace / Cluster / Permissions

| Module                                                               | Upstream | batata                                    | Status |
| -------------------------------------------------------------------- | -------- | ----------------------------------------- | ------ |
| Namespace (list/create/edit/delete/type category/quota)              | ✅       | 🚀 Ahead                                  | ✅     |
| Cluster (node list/search/health/leader/abilities/expandable detail) | ✅       | 🚀 Ahead                                  | ✅     |
| User (list/create/delete/reset password/status badge)                | ✅       | ✅ (B5 confirm-password validation added) | ✅     |
| Role (bind role+username / ROLE_ADMIN protection)                    | ✅       | ✅                                        | ✅     |
| Permission (role/resource/action + custom resource dropdown)         | ✅       | 🚀 Ahead                                  | ✅     |

## 4. e2e Blind Spots (pages exist, functional specs added)

| Page                               | Existing coverage                                 | Notes                                                                                                 |
| ---------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ConfigSyncView` (config sync)     | smoke + **A1** `config-sync.spec.ts` ✅           | Stat cards / config selection table / sync dialog guard (Start Sync disabled with no target env)      |
| `SubscriberListView` (subscribers) | smoke + **A2** `subscribers.spec.ts` ✅           | Service-name echo / column headers / empty state / search path                                        |
| `ConfigDetailView`                 | smoke + **A3** `config-detail.spec.ts` ✅         | Version-compare dialog / cross-config compare (form → result) / clone-to-target-namespace from detail |
| `ConfigHistoryDetailView`          | smoke + **A4** `config-history-detail.spec.ts` ✅ | opType badge / metadata (Source User/IP/MD5) / rollback navigation to `config/rollback`               |

## 5. Todo List

- [x] **B1** Config clone: multi-select + per-row editable dataId/group (backend `cloneConfig` already supports batch `configBeans`) — `ConfigListView.vue`
- [x] **B2** Config export-all (+ `exportAll` i18n) — `ConfigListView.vue` + `translations.ts`
- [x] **B3** Service selector (type/expression) (backend `createService` already supports `selector`) — `ServiceListView.vue` + `translations.ts`
- [x] **B3** Service ephemeral toggle (backend gap fixed on 2026-11-02: commit `b4faf1a5` forwards ephemeral through console `ServiceForm` and datasource `service_create`; create-only — upstream `updateService` also ignores it. Frontend adds ephemeral checkbox in `ServiceListView.vue` create form; `type-check` passes)
- [x] **B4** Service list triggerFlag column (backend `ServiceInfo.triggerFlag` returns a string) — `ServiceListView.vue`
- [x] **B5** User create confirm-password validation (+ `passwordMismatch` i18n) — `UserListView.vue` + `translations.ts`
- [x] **A1–A4** Four e2e specs added (all `tsc`-verified; running requires a local batata server)

## 6. Ahead of Upstream (keep, do not break)

Config Sync, Config encryption/gray-release editor, Config History, Listeners, Service sample-code,
Cluster health/leader/abilities cards, Namespace type category + quota, User status badge, Permission resource dropdown.

## 7. Upstream Source References

- Config: `configurationManagement/index.tsx`, `newconfig`, `configeditor`, `configdetail`, `configsync`, `listeningToQuery`, `historyRollback`, `historyDetail`, `configRollback`
- Service: `serviceManagement/index.tsx`, `serviceDetail/index.tsx`, `subscriberList/index.tsx`
- Others: `namespace`, `clusterManagement`, `userManagement`, `rolesManagement`, `permissionsManagement`, `settingCenter`
- Routing: `router/routes.tsx` (Nacos core: AdminGuard-protected cluster/user/role/permission + public namespace/config/service)
