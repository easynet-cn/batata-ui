// ============================================
// Consul KV Store Types
// ============================================

export interface ConsulKVPair {
  Key: string
  Value: string | null // base64 encoded
  Flags: number
  CreateIndex: number
  ModifyIndex: number
  LockIndex: number
  Session?: string
}

// ============================================
// Consul Catalog Types
// ============================================

// Service kind constants matching Consul's ServiceKind
export type ConsulServiceKind =
  | ''
  | 'connect-proxy'
  | 'mesh-gateway'
  | 'terminating-gateway'
  | 'ingress-gateway'
  | 'api-gateway'

// Enriched service summary from /v1/internal/ui/services endpoint
export interface ConsulUIServiceSummary {
  Kind: ConsulServiceKind
  Name: string
  Datacenter: string
  Tags: string[]
  Nodes: string[]
  ExternalSources: string[]
  InstanceCount: number
  ChecksPassing: number
  ChecksWarning: number
  ChecksCritical: number
  GatewayConfig?: {
    AssociatedServiceCount?: number
    Addresses?: string[]
  }
  TransparentProxy: boolean
  ConnectNative: boolean
  ConnectedWithProxy: boolean
  ConnectedWithGateway: boolean
  PeerName?: string
  Namespace?: string
  Partition?: string
}

export interface ConsulCatalogService {
  ServiceName: string
  ServiceID: string
  ServicePort: number
  ServiceAddress: string
  ServiceTags: string[]
  ServiceMeta: Record<string, string>
  ServiceWeights?: { Passing: number; Warning: number }
  ServiceEnableTagOverride?: boolean
  Namespace?: string
}

export interface ConsulServiceNode {
  Node: ConsulNodeInfo
  Service: ConsulServiceInfo
  Checks: ConsulHealthCheck[]
}

export interface ConsulNodeInfo {
  ID: string
  Node: string
  Address: string
  Datacenter: string
  TaggedAddresses?: Record<string, string>
  Meta?: Record<string, string>
  CreateIndex?: number
  ModifyIndex?: number
}

export interface ConsulExposedPath {
  Protocol?: string
  ListenerPort: number
  Path: string
  LocalPathPort: number
}

export interface ConsulServiceProxy {
  DestinationServiceName?: string
  DestinationServiceID?: string
  LocalServiceAddress?: string
  LocalServicePort?: number
  Mode?: string
  TransparentProxy?: {
    OutboundListenerPort?: number
  }
  Expose?: {
    Checks?: boolean
    Paths?: ConsulExposedPath[]
  }
  Upstreams?: Array<{
    DestinationType?: string
    DestinationName?: string
    DestinationNamespace?: string
    LocalBindAddress?: string
    LocalBindPort?: number
  }>
  [key: string]: unknown
}

export interface ConsulServiceInfo {
  ID: string
  Service: string
  Tags?: string[] | null
  Address: string
  Port: number
  Meta?: Record<string, string> | null
  EnableTagOverride: boolean
  Weights: { Passing: number; Warning: number }
  TaggedAddresses?: Record<string, unknown> | null
  Datacenter?: string
  Kind?: string
  Proxy?: ConsulServiceProxy
  Connect?: Record<string, unknown>
  Namespace?: string
  CreateIndex?: number
  ModifyIndex?: number
}

// Legacy type for catalog/service endpoint (flat structure)
export interface ConsulCatalogServiceNode {
  ID: string
  Node: string
  Address: string
  Datacenter: string
  TaggedAddresses?: Record<string, string>
  NodeMeta?: Record<string, string>
  ServiceID: string
  ServiceName: string
  ServiceAddress: string
  ServicePort: number
  ServiceTags: string[]
  ServiceMeta: Record<string, string>
  ServiceWeights?: { Passing: number; Warning: number }
  ServiceEnableTagOverride?: boolean
  CreateIndex: number
  ModifyIndex: number
  Checks?: ConsulHealthCheck[]
}

export interface ConsulNode {
  ID: string
  Node: string
  Address: string
  Datacenter: string
  TaggedAddresses?: Record<string, string>
  Meta?: Record<string, string>
  CreateIndex: number
  ModifyIndex: number
}

// Enriched node info from /v1/internal/ui/nodes endpoint
// Includes embedded services and health checks
export interface ConsulUINode {
  ID: string
  Node: string
  Address: string
  Partition?: string
  PeerName?: string
  TaggedAddresses?: Record<string, string>
  Meta?: Record<string, string>
  Services: ConsulServiceInfo[]
  Checks: ConsulHealthCheck[]
}

// ============================================
// Consul Health Check Types
// ============================================

export type ConsulHealthStatus = 'passing' | 'warning' | 'critical' | 'maintenance'

export interface ConsulHealthCheck {
  CheckID: string
  Name: string
  Node: string
  Status: ConsulHealthStatus
  Notes: string
  Output: string
  ServiceID: string
  ServiceName: string
  ServiceTags?: string[]
  Type: string
  Interval?: string
  Timeout?: string
  Definition?: {
    HTTP?: string
    Header?: Record<string, string[]>
    Method?: string
    Body?: string
    TLSServerName?: string
    TLSSkipVerify?: boolean
    TCP?: string
    UDP?: string
    GRPC?: string
    GRPCUseTLS?: boolean
    Interval?: string
    Timeout?: string
    DeregisterCriticalServiceAfter?: string
  }
  CreateIndex?: number
  ModifyIndex?: number
}

// ============================================
// Consul Agent Types
// ============================================

export interface ConsulAgentMember {
  Name: string
  Addr: string
  Port: number
  Status: number // 1=alive, 2=leaving, 3=left, 4=failed
  Tags: Record<string, string>
  ProtocolMin: number
  ProtocolMax: number
  ProtocolCur: number
  DelegateMin: number
  DelegateMax: number
  DelegateCur: number
}

// ============================================
// Consul ACL Types
// ============================================

export interface ConsulACLToken {
  AccessorID: string
  SecretID: string
  Description: string
  Policies?: ConsulACLTokenPolicyLink[]
  Roles?: ConsulACLTokenRoleLink[]
  ServiceIdentities?: ConsulServiceIdentity[]
  NodeIdentities?: ConsulNodeIdentity[]
  Local: boolean
  CreateTime: string
  Hash: string
  CreateIndex: number
  ModifyIndex: number
  ExpirationTime?: string
}

export interface ConsulACLTokenPolicyLink {
  ID: string
  Name: string
}

export interface ConsulACLTokenRoleLink {
  ID: string
  Name: string
}

export interface ConsulServiceIdentity {
  ServiceName: string
  Datacenters?: string[]
}

export interface ConsulNodeIdentity {
  NodeName: string
  Datacenter: string
}

export interface ConsulACLPolicy {
  ID: string
  Name: string
  Description: string
  Rules: string // HCL
  Datacenters?: string[]
  Hash: string
  CreateIndex: number
  ModifyIndex: number
}

export interface ConsulACLRole {
  ID: string
  Name: string
  Description: string
  Policies?: ConsulACLTokenPolicyLink[]
  ServiceIdentities?: ConsulServiceIdentity[]
  NodeIdentities?: ConsulNodeIdentity[]
  Hash: string
  CreateIndex: number
  ModifyIndex: number
}

// ============================================
// Consul Service Mesh Types
// ============================================

export interface ConsulIntention {
  ID: string
  SourceName: string
  SourceNS?: string
  DestinationName: string
  DestinationNS?: string
  SourceType: string
  Action: 'allow' | 'deny'
  Precedence: number
  Description?: string
  Meta?: Record<string, string>
  CreatedAt: string
  UpdatedAt: string
  CreateIndex: number
  ModifyIndex: number
}

// ============================================
// Consul Config Entry Types
// ============================================

export type ConsulConfigEntryKind =
  | 'service-defaults'
  | 'proxy-defaults'
  | 'service-router'
  | 'service-splitter'
  | 'service-resolver'
  | 'ingress-gateway'
  | 'terminating-gateway'
  | 'service-intentions'
  | 'mesh'
  | 'exported-services'

export interface ConsulConfigEntry {
  Kind: ConsulConfigEntryKind
  Name: string
  Namespace?: string
  Partition?: string
  Meta?: Record<string, string>
  CreateIndex: number
  ModifyIndex: number
  // Additional fields vary by Kind
  [key: string]: unknown
}

// ============================================
// Consul Session Types
// ============================================

export type ConsulSessionBehavior = 'release' | 'delete'

export interface ConsulSession {
  ID: string
  Name: string
  Node: string
  LockDelay: number
  Behavior: ConsulSessionBehavior
  TTL: string
  Checks: string[]
  NodeChecks?: string[]
  ServiceChecks?: ConsulSessionServiceCheck[]
  CreateIndex: number
  ModifyIndex: number
}

export interface ConsulSessionServiceCheck {
  ID: string
  Namespace?: string
}

// ============================================
// Consul Agent Self Types
// ============================================

export interface ConsulAgentSelf {
  Config: {
    Datacenter: string
    PrimaryDatacenter: string
    NodeName: string
    NodeID: string
    Server: boolean
    Revision: string
    Version: string
  }
  Coord?: {
    Adjustment: number
    Error: number
    Vec: number[]
  }
  Member: ConsulAgentMember
  Stats: Record<string, Record<string, string>>
}

// ============================================
// Consul ACL Auth Method Types
// ============================================

export type ConsulAuthMethodType = 'kubernetes' | 'jwt' | 'oidc'

export interface ConsulACLAuthMethod {
  Name: string
  DisplayName: string
  Type: ConsulAuthMethodType
  Description: string
  TokenLocality: string
  MaxTokenTTL: string
  Config: Record<string, unknown>
  CreateIndex: number
  ModifyIndex: number
}

export type ConsulBindingRuleBindType = 'service' | 'node' | 'role' | 'policy'

export interface ConsulACLBindingRule {
  ID: string
  Description: string
  AuthMethod: string
  Selector: string
  BindType: ConsulBindingRuleBindType
  BindName: string
  CreateIndex: number
  ModifyIndex: number
}

// ============================================
// Consul Peering Types
// ============================================

export type ConsulPeeringState =
  | 'PENDING'
  | 'ESTABLISHING'
  | 'ACTIVE'
  | 'FAILING'
  | 'TERMINATED'
  | 'DELETING'

export interface ConsulPeeringStreamStatus {
  LastHeartbeat?: string
  LastReceive?: string
  LastSend?: string
}

export interface ConsulPeering {
  Name: string
  ID: string
  State: ConsulPeeringState
  PeerServerAddresses: string[]
  ServerExternalAddresses?: string[]
  ImportedServices?: string[]
  ExportedServices?: string[]
  StreamStatus: ConsulPeeringStreamStatus
  Meta?: Record<string, string>
  CreateIndex: number
  ModifyIndex: number
}

export interface ConsulPeeringTokenResponse {
  PeeringToken: string
}

// ============================================
// Consul Catalog Overview Types
// ============================================

export interface ConsulCatalogCountSummary {
  Total: number
  Passing: number
  Warning: number
  Critical: number
}

export interface ConsulCatalogSummary {
  Nodes: ConsulCatalogCountSummary
  Services: ConsulCatalogCountSummary
  Checks: ConsulCatalogCountSummary
}

// ============================================
// Consul Service Topology Types
// ============================================

export interface ConsulServiceTopologyIntention {
  Allowed: boolean
  HasPermissions: boolean
  ExternalSource: string
}

export interface ConsulServiceTopologySummary {
  Name: string
  Datacenter: string
  Namespace: string
  Intention: ConsulServiceTopologyIntention
}

export interface ConsulServiceTopology {
  Protocol: string
  TransparentProxy: boolean
  FilteredByACLs: boolean
  Upstreams: ConsulServiceTopologySummary[]
  Downstreams: ConsulServiceTopologySummary[]
}

// ============================================
// Consul Exported/Imported Services Types
// ============================================

export interface ConsulExportedService {
  Service: string
  Consumers: { Peers: string[]; Partitions: string[] }
}

export interface ConsulImportedService {
  Service: string
  SourcePeer: string
}

// ============================================
// Consul Event Types
// ============================================

export interface ConsulUserEvent {
  ID: string
  Name: string
  Payload?: string | null
  NodeFilter: string
  ServiceFilter: string
  TagFilter: string
  Version: number
  LTime: number
}

// ============================================
// Consul Operator Types
// ============================================

export interface ConsulRaftServer {
  ID: string
  Node: string
  Address: string
  Leader: boolean
  Voter: boolean
  ProtocolVersion: string
  LastIndex: number
}

export interface ConsulRaftConfiguration {
  Servers: ConsulRaftServer[]
  Index: number
}

export interface ConsulServiceUsage {
  Nodes: number
  Services: number
  ServiceInstances: number
  ConnectServiceInstances: number
}

export interface ConsulOperatorUsage {
  Usage: Record<string, ConsulServiceUsage>
}

// ============================================
// Consul Coordinate Types
// ============================================

export interface ConsulCoordinate {
  Node: string
  Segment?: string
  Coord: {
    Adjustment: number
    Error: number
    Height: number
    Vec: number[]
  }
}

// ============================================
// Consul Partition Types
// ============================================

export interface ConsulPartition {
  Name: string
  Description: string
  CreateIndex: number
  ModifyIndex: number
}

// ============================================
// Consul Namespace Types
// ============================================

export interface ConsulNamespace {
  Name: string
  Description: string
  ACLs?: {
    PolicyDefaults?: Array<{ ID: string; Name: string }>
    RoleDefaults?: Array<{ ID: string; Name: string }>
  }
  Meta?: Record<string, string>
  CreateIndex: number
  ModifyIndex: number
}
