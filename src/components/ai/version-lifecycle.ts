import type { PublishPipelineInfo } from '@/types'

type PipelineInfoLike = {
  status?: string
  historical?: boolean
}

/** Whether a global admin may force-publish a rejected version. */
export function canForcePublish(
  versionStatus: string | null | undefined,
  pipelineInfo: PipelineInfoLike | null | undefined,
  globalAdmin: boolean,
): boolean {
  if (!globalAdmin || pipelineInfo?.status !== 'REJECTED') {
    return false
  }
  if (versionStatus === 'draft') {
    return !pipelineInfo.historical
  }
  return versionStatus === 'reviewing' || versionStatus === 'reviewed'
}

/** Whether a reviewing/reviewed version may be re-submitted for review. */
export function canResubmitReview(
  versionStatus: string | null | undefined,
  pipelineInfo: PipelineInfoLike | null | undefined,
): boolean {
  if (versionStatus === 'reviewed') {
    return true
  }
  if (versionStatus !== 'reviewing' || pipelineInfo?.historical) {
    return false
  }
  return pipelineInfo?.status === 'APPROVED' || pipelineInfo?.status === 'REJECTED'
}

/** Parse the publish pipeline info JSON string returned by the backend. */
export function parsePipelineInfo(raw: string | null | undefined): PublishPipelineInfo | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.executionId === 'string' && typeof parsed.status === 'string') {
      return parsed as PublishPipelineInfo
    }
    return null
  } catch {
    return null
  }
}
