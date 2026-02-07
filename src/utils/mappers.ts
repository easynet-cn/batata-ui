/**
 * Mapping functions to transform API responses to internal types.
 * Extracted from view components for better separation of concerns.
 */

interface AuditLogApiItem {
  id: number
  gmtCreate: string
  operator: string
  sourceIp?: string
  resourceType: string
  operation: string
  resourceId?: string
  result: string
  details?: string
  errorMessage?: string
}

interface AuditLogInternal {
  id: string
  timestamp: number
  username: string
  ip: string
  resourceType: 'config' | 'service' | 'namespace' | 'user' | 'role' | 'permission'
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  resourceName: string
  success: boolean
  details?: unknown
  errorMessage?: string
}

const OPERATION_MAP: Record<string, AuditLogInternal['action']> = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PUBLISH: 'update',
  ROLLBACK: 'update',
  IMPORT: 'create',
  EXPORT: 'create',
  CLONE: 'create',
  QUERY: 'create',
}

const RESOURCE_TYPE_MAP: Record<string, AuditLogInternal['resourceType']> = {
  CONFIG: 'config',
  SERVICE: 'service',
  INSTANCE: 'service',
  NAMESPACE: 'namespace',
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  CAPACITY: 'config',
  CLUSTER: 'service',
}

/**
 * Map an API audit log item to the internal format.
 */
export function mapAuditLogItem(item: AuditLogApiItem): AuditLogInternal {
  let details: unknown
  if (item.details) {
    try {
      details = JSON.parse(item.details)
    } catch {
      details = item.details
    }
  }

  return {
    id: String(item.id),
    timestamp: new Date(item.gmtCreate).getTime(),
    username: item.operator,
    ip: item.sourceIp || 'unknown',
    resourceType: RESOURCE_TYPE_MAP[item.resourceType] || 'config',
    action: OPERATION_MAP[item.operation] || 'create',
    resourceName: item.resourceId || '',
    success: item.result === 'SUCCESS',
    details,
    errorMessage: item.errorMessage,
  }
}
