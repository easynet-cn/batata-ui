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
  ServiceTags: string[]
  Type: string
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
  CreateIndex: number
  ModifyIndex: number
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

export type ConsulBindingRuleBindType = 'service' | 'node' | 'role'

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
