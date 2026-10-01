export interface AiResourceImportSourceInfo {
  sourceId: string
  displayName?: string
  description?: string
  pluginName?: string
  resourceTypes?: string[]
  enabled?: boolean
  capabilities?: string[]
}

export interface AiResourceImportCandidateItem {
  externalId?: string
  name?: string
  version?: string
  description?: string
  metadata?: Record<string, string>
}

export interface AiResourceImportSearchResponse {
  sourceId: string
  resourceType: string
  nextCursor?: string
  hasMore?: boolean
  items?: AiResourceImportCandidateItem[]
}

export type AiResourceImportValidationStatus = 'VALID' | 'WARNING' | 'INVALID' | 'CONFLICT'

export interface AiResourceImportValidationItem {
  externalId?: string
  name?: string
  version?: string
  status?: AiResourceImportValidationStatus
  exists?: boolean
  conflictType?: string
  warnings?: string[]
  errors?: string[]
}

export interface AiResourceImportValidateResponse {
  sourceId: string
  resourceType: string
  validationToken?: string
  items?: AiResourceImportValidationItem[]
}

export type AiResourceImportResultStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED'

export interface AiResourceImportResultItem {
  externalId?: string
  resourceName?: string
  version?: string
  status?: AiResourceImportResultStatus
  errorMessage?: string
  warnings?: string[]
}

export interface AiResourceImportExecuteResponse {
  success?: boolean
  totalCount?: number
  successCount?: number
  failedCount?: number
  skippedCount?: number
  results?: AiResourceImportResultItem[]
}

export interface AiResourceImportItem {
  externalId?: string
  name?: string
  version?: string
  metadata?: Record<string, string>
}
