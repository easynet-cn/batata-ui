# Apollo Portal Frontend Parity (features + e2e)

> Methodology aligned with `batata/.workbuddy/memory/MEMORY.md`: verify by reading source first; double-check with Grep + git log; upstream domains mount on three faces (admin/client/openapi); e2e must cover both success and failure paths; mutant guards.
> This document is the **frontend** parity record for Apollo Portal (corresponds to the server-side `batata-plugin-apollo`).

## 0. Upstream Source (verified to exist)

- Upstream: `~/work/github/easynet-cn/apollo/apollo-portal` (Java backend + legacy server-rendered frontend)
- batata implementation: `~/work/github/easynet-cn/batata/crates/batata-plugin-apollo`
- batata-ui views: `src/views/apollo/*` (17 views)
- Note: Apollo Portal's "frontend" is server-rendered static pages (`src/main/resources/static/*`). batata-ui re-implements an equivalent SPA in Vue. Parity is judged on **feature semantics**, not DOM structure.

## 1. Two API Faces (key insight)

batata exposes **two** route faces for Apollo, matching the upstream Portal's two access modes:

- **OpenAPI consumer face** `/apollo-api/openapi/v1/*` (corresponds to upstream `openapi` controllers)
  — called directly by `apolloApiRequest()` in `e2e/helpers/apollo-api.ts`.
  Covers: apps / appnamespaces / namespaces / items / releases / branches / consumers / import-export / search.
- **Portal admin face** `/apollo-api/...` (called by `apolloApi` in `src/api/apollo.ts`, requires admin login)
  — covers: users / server-config / access-keys / clusters / envclusters / user-tokens /
  system-info / system-permission / favorites / global-search / audit / role.

**Conclusion:** The existing 6 apollo e2e specs only cover the **OpenAPI consumer face**; the **Portal admin face (12 views) was entirely an e2e blind spot** (see §4).

## 2. Feature Coverage Matrix (batata-ui view ↔ upstream feature ↔ e2e)

| batata-ui view                                                  | Upstream feature                               | e2e spec                                 | Status                                        |
| --------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| `ApolloAppListView`                                             | App management                                 | `apollo-apps.spec.ts`                    | ✅                                            |
| `ApolloAppDetailView` (items/instances/releases/namespace tabs) | Config items / instances / releases            | `apollo-namespace-items.spec.ts` (items) | 🟡 Partial                                    |
| `ApolloAppNamespacesView`                                       | AppNamespace                                   | `apollo-app-namespaces.spec.ts`          | ✅                                            |
| `ApolloConsumersView`                                           | Consumer / authorization                       | `apollo-consumers.spec.ts`               | ✅                                            |
| `ApolloImportExportView`                                        | Config import / export                         | `apollo-import-export.spec.ts`           | ✅                                            |
| `ApolloGrayRelease` (inside AppDetail)                          | Gray release                                   | `apollo-gray-release.spec.ts`            | ✅                                            |
| `ApolloServerConfigView`                                        | PortalDB/ConfigDB config                       | ❌ none                                  | ❌ **A1**                                     |
| `ApolloUserManagementView`                                      | User management                                | ❌ none                                  | ❌ **A2**                                     |
| `ApolloClustersView`                                            | Cluster management (by appId)                  | ❌ none                                  | ❌ **A3**                                     |
| `ApolloAccessKeysView`                                          | Access keys (by appId)                         | ❌ none                                  | ❌ **A4**                                     |
| `ApolloUserTokensView`                                          | User tokens                                    | ❌ none                                  | ✅ `apollo-user-tokens.spec.ts` (A5)          |
| `ApolloSystemInfoView`                                          | System info                                    | ❌ none                                  | ✅ `apollo-system-info.spec.ts` (A6)          |
| `ApolloSystemPermissionView`                                    | System permission                              | ❌ none                                  | ✅ `apollo-system-permission.spec.ts` (A7)    |
| `ApolloFavoritesView`                                           | Favorites                                      | ❌ none                                  | ✅ `apollo-favorites.spec.ts` (A8)            |
| `ApolloGlobalSearchView`                                        | Global search                                  | ❌ none                                  | ✅ `apollo-global-search.spec.ts` (A9)        |
| `ApolloAuditView`                                               | Audit                                          | ❌ none                                  | ✅ `apollo-audit.spec.ts` (A10)               |
| `ApolloRoleAssign`                                              | Role assignment (cluster/namespace permission) | ❌ none                                  | ✅ `apollo-cluster-role-assign.spec.ts` (A11) |

## 3. Feature Gaps (B class, source-verified)

After reading every `src/views/apollo/*` view, the Portal admin views' **functionality is complete** (CRUD / enable-disable / delete-confirm all present):

- `ApolloServerConfigView`: PortalDB/ConfigDB dual tabs, env switch, create/delete ✅
- `ApolloUserManagementView`: search, create (userId/name/email/password), enable/disable, delete ✅
- `ApolloClustersView`: create/delete cluster by env, cluster-permission dialog ✅
- `ApolloAccessKeysView`: create/enable-disable/delete key ✅

**B-class gaps: essentially no functional missing features** — differences are mainly in e2e coverage (see §4).
Two items worth noting:

- `ApolloUserManagementView` create user now has **confirm-password** matching Nacos B5 (local-only field + mismatch guard; `confirmPassword` is excluded from the API payload so the backend still receives only `password`).
- `ApolloClustersView`'s cluster-permission dialog embeds `ApolloRoleAssign`; its role-assignment interaction was not e2e-covered (tracked as A11).

## 4. e2e Blind Spots (A class, all filled A1–A11)

Existing apollo e2e had only 6 specs, all for the OpenAPI consumer face. The **Portal admin face (12 views) had zero coverage**; now fully filled (A1–A11, UI-driven, `tsc`-verified):

- **A1** `apollo-server-config.spec.ts` — PortalDB/ConfigDB tab switch, by env, create/delete config item (empty-key failure path).
- **A2** `apollo-users.spec.ts` — create user, enable/disable, delete, duplicate-id failure path.
- **A3** `apollo-clusters.spec.ts` — scaffold app first, enter with `?appId=`, create/delete cluster, empty state.
- **A4** `apollo-access-keys.spec.ts` — scaffold app first, enter with `?appId=`, create/enable-disable/delete key.
- **A5** `apollo-user-tokens.spec.ts` — create (shows token value) / rotate / delete (confirm dialog).
- **A6** `apollo-system-info.spec.ts` — version/commit/env active-status rendering + refresh.
- **A7** `apollo-system-permission.spec.ts` — no-root hint branch / grant-revoke create-app user.
- **A8** `apollo-favorites.spec.ts` — column-header schema check + empty state or row-click navigation.
- **A9** `apollo-global-search.spec.ts` — hit by key (scaffolded data) / no-hit empty state / empty-input no-op guard.
- **A10** `apollo-audit.spec.ts` — four-column schema check + data-or-empty branch.
- **A11** `apollo-cluster-role-assign.spec.ts` — role assignment inside cluster-permission dialog: grant member / revoke member.

## 5. Todo List

- [x] **B class**: feature-gap review (conclusion: Portal admin face is functionally complete, no missing features)
- [x] **A1** `apollo-server-config.spec.ts`
- [x] **A2** `apollo-users.spec.ts`
- [x] **A3** `apollo-clusters.spec.ts`
- [x] **A4** `apollo-access-keys.spec.ts`
- [x] **A5** `apollo-user-tokens.spec.ts`
- [x] **A6** `apollo-system-info.spec.ts`
- [x] **A7** `apollo-system-permission.spec.ts`
- [x] **A8** `apollo-favorites.spec.ts`
- [x] **A9** `apollo-global-search.spec.ts`
- [x] **A10** `apollo-audit.spec.ts`
- [x] **A11** `apollo-cluster-role-assign.spec.ts`
- [x] (optional) Add confirm-password to `ApolloUserManagementView` for Nacos parity (B5-style: local field + mismatch guard, excluded from payload)

## 6. Notes

- All specs are **UI-driven** (click + fill form + assert list), consistent with `apollo-apps.spec.ts`; the admin face uses `storageState` admin login, no extra token needed.
- Actual e2e not run (requires local batata :8081 + apollo plugin); `tsc` type-check passed.
- Not committed: per default habit (self-commit), no commit/push was executed yet.
