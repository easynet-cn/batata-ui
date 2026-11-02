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

After inventory review, **no missing first-level feature pages** were found. Differences are mainly:

- Some **detail/editor views** (e.g. `ConfigEntryDetailView`, `ACLTokenEditorView`, `ServiceInstanceDetailView`, `*DetailView`) are indirectly covered by their list/detail specs, with no standalone "editor-interaction" spec — this is an e2e depth issue, not a feature gap.
- Interaction details like Consul UI's **Intention creation wizard** and **ACL policy syntax highlighting** need per-source comparison; not deep-dived this round (long tail, suggest a dedicated pass later).

## 3. e2e Blind Spots (A class)

Consul e2e already has 16 specs, broader than apollo. Remaining blind spots are mainly **editor/detail-level interactions**:

- Does `consul-config-entries.spec.ts` cover per-item editing in `ConfigEntryDetailView`?
- Does `consul-acl.spec.ts` cover token **policy binding / expiration** editing?
- Does `service-instance.spec.ts` cover **health-status toggle / deregister** actions?
- Does `consul-catalog-detail.spec.ts` cover **node/service deregister**?

> These need source reading + test runs to confirm; listed as **todo** this round, lower priority than apollo (which had 12 zero-coverage views).

## 4. Todo List

- [x] Feature-coverage inventory + matrix (conclusion: features complete, no B-class gap)
- [ ] Review `consul-config-entries` / `consul-acl` / `service-instance` / `consul-catalog-detail` for editor/deregister depth interactions; add specs if lacking (A-class long tail)
- [ ] (optional) Dedicated comparison for Consul Intention creation wizard, ACL policy syntax highlighting

## 5. Notes

- Consul parity is lower priority than apollo: apollo had 12 **zero-coverage** Portal admin views, while consul only has editor-level depth blind spots.
- No consul source changes this round (no B-class gap); e2e long-tail todo in §3.
- Not committed: per default habit (self-commit), no commit/push was executed yet.
