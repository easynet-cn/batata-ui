// Apollo-compatible DTOs (mirrors batata-plugin-apollo OpenAPI, camelCase JSON).

export interface ApolloAppDTO {
  appId: string
  name: string
  orgId: string
  orgName: string
  ownerName: string
  ownerEmail: string
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastTime?: string
}

export interface ApolloAppNamespaceDTO {
  id?: number
  appId: string
  name: string
  format?: string
  isPublic: boolean
  comment?: string
  dataChangeCreatedBy?: string
  dataChangeCreatedTime?: string
}

export interface ApolloClusterDTO {
  name: string
  appId: string
  parentClusterId?: number
  comment?: string
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastTime?: string
}

export interface ApolloItemDTO {
  id?: number
  key: string
  value: string
  type?: number
  comment?: string
  lineNum?: number
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
  dataChangeLastTime?: string
}

export interface ApolloOpenNamespace {
  appId: string
  clusterName: string
  namespaceName: string
  format?: string
  comment?: string
  isPublic: boolean
  items: ApolloItemDTO[]
  isLocked?: boolean
  lockedBy?: string
  lockedDate?: string
  lockedComment?: string
}

export interface ApolloOpenRelease {
  id?: number
  releaseId: number
  appId: string
  clusterName: string
  namespaceName: string
  name?: string
  configurations: Record<string, string>
  comment?: string
}

export interface ApolloReleaseHistoryDTO {
  id?: number
  appId: string
  clusterName: string
  namespaceName: string
  branchName?: string
  releaseId: number
  previousReleaseId: number
  operation: number
  operationContext?: string
  dataChangeCreatedBy?: string
  dataChangeCreatedTime?: string
}

export interface ApolloGrayReleaseRuleDTO {
  id?: number
  appId: string
  clusterName: string
  namespaceName: string
  branchName: string
  rules?: string
  releaseId?: number
  branchStatus?: number
  priority?: number
  dataChangeCreatedBy?: string
  dataChangeLastModifiedBy?: string
  dataChangeCreatedTime?: string
}

export interface ApolloAccessKeyDTO {
  id?: number
  appId: string
  secret: string
  mode?: number
  isEnabled: boolean
  dataChangeCreatedBy?: string
  dataChangeCreatedTime?: string
}

export interface ApolloAuditDTO {
  id?: number
  auditKey?: string
  entityName?: string
  entityId?: string
  opName?: string
  opTime?: string
  opBy?: string
  opClientIp?: string
  detail?: string
  dataChangeCreatedBy?: string
}

export interface ApolloInstanceDTO {
  id?: number
  appId: string
  clusterName: string
  dataCenter?: string
  ip: string
  dataChangeCreatedTime?: string
  dataChangeLastTime?: string
}

export interface ApolloEnvCluster {
  env: string
  clusters: string[]
}

export interface ApolloPage<T> {
  content: T[]
  page: number
  size: number
  total: number
}

// ---------------- Extended DTOs ----------------

export interface ApolloItemChangeDTO {
  key: string
  oldValue?: string
  newValue?: string
  op?: number // 0=create, 1=update, 2=delete
  comment?: string
}

export interface ApolloCommitDTO {
  id?: number
  appId: string
  clusterName?: string
  namespaceName?: string
  changeSets?: ApolloItemChangeDTO[]
  dataChangeCreatedBy?: string
  dataChangeCreatedTime?: string
}

export interface ApolloConsumerTokenDTO {
  token?: string
  expiredAt?: string
  createBy?: string
}

export interface ApolloConsumerDTO {
  appId?: string
  name?: string
  ownerName?: string
  ownerEmail?: string
  departmentId?: number
  departmentName?: string
  allowCreateApplication?: boolean
  allowManageUsers?: boolean
  rateLimitEnabled?: boolean
  rateLimit?: number
  tokens?: ApolloConsumerTokenDTO[]
}

export interface ApolloFavoriteDTO {
  appId?: string
  appName?: string
  env?: string
  clusterName?: string
  namespaceName?: string
  position?: number
}

export interface ApolloSearchResultDTO {
  appId?: string
  env?: string
  clusterName?: string
  namespaceName?: string
  key?: string
  value?: string
}

export interface ApolloMissingNamespaceDTO {
  env?: string
  clusterName?: string
  namespaceName?: string
}

export interface ApolloCompareResultDTO {
  baseReleaseId?: number
  toReleaseId?: number
  baseReleaseConfigs?: Record<string, string>
  toReleaseConfigs?: Record<string, string>
  differentConfigs?: Record<string, { oldValue?: string; newValue?: string }>
}
