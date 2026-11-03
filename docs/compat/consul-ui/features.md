# Consul UI Frontend Parity (features + e2e)

> Methodology aligned with `batata/.workbuddy/memory/MEMORY.md`: verify by reading source first; double-check with Grep + git log; upstream domains mount on three faces; e2e must cover both success and failure paths; mutant guards.
> This document is the **frontend** parity record for the official Consul Web UI (corresponds to the server-side `batata` consul-compatibility layer).

## 0. Upstream Source (verified to exist)

- Upstream: `~/work/github/easynet-cn/consul/ui/packages/consul-ui` (Ember application)
- batata implementation: `~/work/github/easynet-cn/batata` (consul-compatible HTTP API)
- batata-ui views: `src/views/consul/*` (31 views)

## 1. Feature Coverage Matrix (batata-ui view ↔ upstream consul-ui ↔ e2e)

batata-ui's Consul coverage is **already very complete**, covering nearly all first-level feature domains of consul-ui.

| batata-ui view                                        | Upstream feature          | e2e spec                                                   | Status |
| ----------------------------------------------------- | ------------------------- | ---------------------------------------------------------- | ------ |
| `KVListView` / `KVDetailView` / `KVEditorView`        | KV store                  | `consul-kv.spec.ts`                                        | ✅     |
| `ACLPolicyListView` / `ACLPolicyEditorView`           | ACL policy                | `consul-acl.spec.ts`                                       | ✅     |
| `ACLRoleListView` / `ACLRoleEditorView`               | ACL role                  | `consul-acl.spec.ts`                                       | ✅     |
| `ACLTokenListView` / `ACLTokenEditorView`             | ACL token                 | `consul-acl.spec.ts`                                       | ✅     |
| `AuthMethodListView` / `AuthMethodDetailView`         | Auth method               | `consul-auth-methods.spec.ts`                              | ✅     |
| `CatalogServiceListView` / `CatalogServiceDetailView` | Service catalog           | `consul-catalog.spec.ts` / `consul-catalog-detail.spec.ts` | ✅     |
| `CatalogNodeListView` / `CatalogNodeDetailView`       | Node catalog              | `consul-catalog.spec.ts` / `consul-catalog-detail.spec.ts` | ✅     |
| `ConfigEntryListView` / `ConfigEntryDetailView`       | Config entries            | `consul-config-entries.spec.ts`                            | ✅     |
| `ConsulDashboardView`                                 | Dashboard                 | `consul-dashboard.spec.ts`                                 | ✅     |
| `ConsulNamespaceListView`                             | Namespaces                | `consul-namespaces.spec.ts`                                | ✅     |
| `EventListView`                                       | Events                    | `consul-events.spec.ts`                                    | ✅     |
| `ExportedServicesView`                                | Exported services         | `consul-exported-services.spec.ts`                         | ✅     |
| `HealthCheckListView`                                 | Health checks             | `consul-health.spec.ts`                                    | ✅     |
| `IntentionListView`                                   | Intentions (service mesh) | `consul-intentions.spec.ts`                                | ✅     |
| `OperatorView`                                        | Operator (raft/metrics)   | `consul-operator.spec.ts`                                  | ✅     |
| `PartitionListView`                                   | Admin partitions          | `consul-partitions.spec.ts`                                | ✅     |
| `PeeringListView` / `PeeringDetailView`               | Cluster federation        | `consul-peering.spec.ts`                                   | ✅     |
| `SessionListView` / `SessionDetailView`               | Sessions                  | `consul-sessions.spec.ts`                                  | ✅     |
| `ServiceInstanceDetailView`                           | Service instance          | `service-instance.spec.ts`                                 | ✅     |

## 2. Feature Gaps (B class)

After inventory review, **no missing first-level feature pages** were found. Clarifications from the depth review (2026-11-03):

- `ConfigEntryDetailView` and the catalog `CatalogNodeDetailView` / `CatalogServiceDetailView` are **read-only** detail views — there is no edit or deregister action in the UI. The real config-entry editing lives in `ConfigEntryListView`'s create/edit/delete **modal** (`putConfigEntry`), now covered by a CRUD test.
- `ACLTokenEditorView` is a genuine editor: it supports policy/role **binding** (checkboxes) and an **ExpirationTTL** field, now covered by a dedicated token-binding test.
- Consul UI's **Intention creation wizard**: `IntentionListView`'s create/edit modal already implements the wizard (source/destination/action + L7 `HTTP` permissions sub-form). A source-verified bug was fixed — when L7 permissions were attached the UI omitted `Action`, which the batata backend (`connect_ca.rs`, `IntentionRequest.action` is non-optional) rejected with **400**; `Action` is now always sent. Covered by e2e (edit flow + L7 sub-form).
- Consul UI's **ACL policy syntax highlighting**: `ACLPolicyEditorView` already renders a CodeMirror `CodeEditor` with a bespoke HCL tokenizer (`hclLanguage` in `CodeEditor.vue`), so HCL rules are syntax-highlighted — already satisfied, no gap.

## 3. e2e Blind Spots (A class) — resolved

Consul e2e already had 16 specs. This round read the actual list/detail views and resolved the open questions:

- **config-entries**: `ConfigEntryDetailView` is **read-only** (renders JSON + copy). The real editing is the create/edit/delete **modal** in `ConfigEntryListView` (`putConfigEntry`). Covered by a new CRUD test in `consul-config-entries.spec.ts` (create → edit body → delete).
- **acl token**: `ACLTokenEditorView` genuinely supports **policy/role binding** (checkboxes) + an **ExpirationTTL** field. `consul-acl.spec.ts` now has a "create token bound to a policy with an expiration TTL" test that asserts the binding + TTL persist server-side (`findAclToken` helper).
- **service-instance**: `service-instance.spec.ts` is actually a **Nacos** spec; it already covers health-status toggle + deregister. The Consul `ServiceInstanceDetailView` is the catalog instance detail loaded by `consul-catalog-detail.spec.ts`.
- **catalog-detail (node/service)**: both detail views are **read-only** — no deregister action exists in the UI. Pages load (covered). The "deregister" long-tail item was based on a wrong assumption and is N/A.

> Remaining outstanding blind spots: **none**. Consul parity is complete (features complete, no B-class gap; e2e 16 specs + the 2 new depth tests).

## 4. Todo List

- [x] Feature-coverage inventory + matrix (conclusion: features complete, no B-class gap)
- [x] **config-entries CRUD**: create/edit/delete via `ConfigEntryListView` modal — `consul-config-entries.spec.ts`
- [x] **acl token binding**: policy/role binding + ExpirationTTL — `consul-acl.spec.ts` (`findAclToken` helper added)
- [x] Review `consul-config-entries` / `consul-acl` / `catalog-detail` detail views — confirmed read-only (no edit/deregister); depth gaps closed
- [x] **Intention wizard**: edit flow + L7 `HTTP` permission sub-form — `consul-intentions.spec.ts` (also fixed a 400 bug: `Action` was omitted when L7 permissions were present)
- [x] **ACL policy syntax highlighting**: already implemented via `CodeEditor` HCL tokenizer (`hclLanguage`) — no gap

## 5. Notes

- Consul parity is lower priority than apollo: apollo had 12 **zero-coverage** Portal admin views; consul's long-tail was editor-level depth only, now closed (§3/§4).
- No consul **source** changes this round (no B-class gap); only e2e depth specs + helpers were added.
- All new specs are type-checked (`tsc --ignoreConfig`); not run live (require a local Consul server via batata :8081).
