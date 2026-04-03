import { useI18n } from '@/i18n'

export type VersionStatus = 'draft' | 'reviewing' | 'online' | 'offline'

export function useVersionStatus() {
  const { t } = useI18n()

  const statusDotClass = (status: VersionStatus) => {
    const map: Record<VersionStatus, string> = {
      draft: 'bg-amber-500',
      reviewing: 'bg-blue-500',
      online: 'bg-emerald-500',
      offline: 'bg-gray-400',
    }
    return map[status] || 'bg-gray-400'
  }

  const statusBadgeClass = (status: VersionStatus) => {
    const map: Record<VersionStatus, string> = {
      draft: 'badge badge-warning',
      reviewing: 'badge badge-info',
      online: 'badge badge-success',
      offline: 'badge badge-secondary',
    }
    return map[status] || 'badge'
  }

  const statusLabel = (status: VersionStatus) => {
    const map: Record<VersionStatus, string> = {
      draft: t('skillDraft'),
      reviewing: t('skillReviewing'),
      online: t('skillOnline'),
      offline: t('skillOffline'),
    }
    return map[status] || status
  }

  return { statusDotClass, statusBadgeClass, statusLabel }
}
