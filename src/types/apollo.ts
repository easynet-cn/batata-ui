// ============================================
// Apollo Configuration Center Types
// ============================================

export type ApolloNamespaceFormat = 'properties' | 'yaml' | 'json' | 'xml' | 'yml'

export interface ApolloApp {
  appId: string
  name: string
  orgId: string
  orgName: string
  ownerName: string
  ownerEmail: string
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

export interface ApolloCluster {
  name: string
  appId: string
  parentClusterId?: number
  comment?: string
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

export interface ApolloEnvCluster {
  env: string
  clusters: string[]
}

export interface ApolloNamespace {
  appId: string
  clusterName: string
  namespaceName: string
  format: ApolloNamespaceFormat
  isPublic: boolean
  comment?: string
  items?: ApolloItem[]
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

export interface ApolloItem {
  id?: number
  namespaceId?: number
  key: string
  value: string
  type?: string
  comment?: string
  lineNum?: number
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

export interface ApolloRelease {
  id?: number
  releaseKey: string
  name: string
  appId: string
  clusterName: string
  namespaceName: string
  configurations: Record<string, string>
  comment?: string
  isAbandoned: boolean
  isEmergencyPublish?: boolean
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

export interface ApolloPageResult<T> {
  content: T[]
  page: number
  size: number
  total: number
}

// ============================================
// Namespace Lock
// ============================================

export interface ApolloNamespaceLock {
  namespaceName: string
  isLocked: boolean
  lockedBy?: string
}

// ============================================
// Gray Release / Branches
// ============================================

export interface ApolloGrayReleaseRuleItem {
  clientAppId: string
  clientIpList: string[]
}

export interface ApolloGrayReleaseRule {
  appId: string
  clusterName: string
  namespaceName: string
  branchName: string
  ruleItems: ApolloGrayReleaseRuleItem[]
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

export interface ApolloBranch {
  appId: string
  clusterName: string
  namespaceName: string
  branchName: string
  status?: string
  dataChangeCreatedBy?: string
  dataChangeCreatedTime?: string
}

// ============================================
// Instances
// ============================================

export interface ApolloInstance {
  id?: number
  appId: string
  clusterName: string
  dataCenter?: string
  ip: string
  configs?: ApolloInstanceConfig[]
}

export interface ApolloInstanceConfig {
  releaseKey: string
  releaseDeliveryTime?: string
  dataChangeLastModifiedTime?: string
}

// ============================================
// Release History
// ============================================

export interface ApolloReleaseHistory {
  id: number
  appId: string
  clusterName: string
  namespaceName: string
  branchName: string
  releaseId: number
  previousReleaseId: number
  operation: number
  operationContext: string
  isAbandoned: boolean
  dataChangeCreatedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

// ============================================
// Organizations & Environments
// ============================================

export interface ApolloOrganization {
  orgId: string
  orgName: string
}

export interface ApolloEnvironment {
  env: string
  active: boolean
}

// ============================================
// Access Keys / Consumers
// ============================================

export interface ApolloAccessKey {
  id?: number
  key?: string
  secret?: string
  appId: string
  enabled: boolean
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastModifiedTime?: string
}

// ============================================
// Item Change Sets (bulk operations)
// ============================================

export interface ApolloItemChangeSets {
  createItems: ApolloItemPayload[]
  updateItems: ApolloItemPayload[]
  deleteKeys: string[]
  dataChangeLastModifiedBy?: string
}

// ============================================
// Nav Tree
// ============================================

export interface ApolloNavTree {
  appId: string
  appName: string
  envClusters: ApolloEnvCluster[]
}

// ============================================
// Payload types for create/update operations
// ============================================

export interface ApolloAppPayload {
  appId: string
  name: string
  orgId: string
  orgName: string
  ownerName: string
  ownerEmail: string
}

export interface ApolloCreateAppPayload extends ApolloAppPayload {
  admins?: string[]
}

export interface ApolloClusterPayload {
  name: string
  appId?: string
  comment?: string
}

export interface ApolloNamespacePayload {
  name: string
  appId: string
  format: ApolloNamespaceFormat
  isPublic: boolean
  comment?: string
}

export interface ApolloItemPayload {
  key: string
  value: string
  comment?: string
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
}

export interface ApolloReleasePayload {
  releaseTitle: string
  releaseComment?: string
  releasedBy: string
  isEmergencyPublish?: boolean
}

export interface ApolloGrayReleasePayload {
  releaseTitle: string
  releaseComment?: string
  releasedBy: string
}

export interface ApolloGrayReleaseRulePayload {
  ruleItems: ApolloGrayReleaseRuleItem[]
}
