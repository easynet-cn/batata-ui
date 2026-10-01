import type { McpVersionStatus } from '@/types/mcp'
import type { PublishPipelineInfo } from '@/types'
import { canForcePublish, canResubmitReview } from '../version-lifecycle'

export type McpVersionAction =
  | 'editDraft'
  | 'submit'
  | 'publish'
  | 'forcePublish'
  | 'redraft'
  | 'online'
  | 'offline'
  | 'deleteDraft'

/** Compute the available lifecycle actions for a version given its status + pipeline. */
export function getMcpVersionActions(
  status: McpVersionStatus,
  pipelineInfo: PublishPipelineInfo | null,
  globalAdmin: boolean,
): McpVersionAction[] {
  const forcePublish = canForcePublish(status, pipelineInfo, globalAdmin)
    ? (['forcePublish'] as const)
    : []
  const resubmit = canResubmitReview(status, pipelineInfo) ? (['submit'] as const) : []
  switch (status) {
    case 'draft':
      return ['editDraft', 'submit', 'deleteDraft', ...forcePublish]
    case 'reviewing':
      return [...resubmit, 'publish', ...forcePublish]
    case 'reviewed':
      return [...resubmit, 'publish', 'redraft', ...forcePublish]
    case 'online':
      return ['offline']
    case 'offline':
      return ['online']
  }
}

/** Detect the "lifecycle not available / syncing" error from the backend. */
export function isMcpLifecycleUnavailable(error: unknown): boolean {
  const response = (
    error as {
      response?: { status?: number; data?: { message?: unknown; data?: unknown } }
    }
  )?.response
  if (response?.status !== 409) {
    return false
  }
  const message = `${String(response.data?.message || '')} ${String(response.data?.data || '')}`
  return message.includes('LIFECYCLE_MANAGED')
}

// ===== Status display mappings =====

export const MCP_VERSION_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  reviewing: '审核中',
  reviewed: '已审核',
  online: '已上线',
  offline: '已下线',
}

export function getMcpVersionStatusLabel(status?: string): string {
  if (!status) return ''
  return MCP_VERSION_STATUS_LABELS[status] || status
}

export function getMcpStatusBadgeClass(status?: string): string {
  switch (status) {
    case 'online':
      return 'badge-success'
    case 'draft':
      return 'badge-info'
    case 'reviewing':
    case 'reviewed':
      return 'badge-warning'
    case 'offline':
      return 'badge-secondary'
    default:
      return 'badge'
  }
}
