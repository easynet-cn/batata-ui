import { useI18n } from '@/i18n'

export type VersionStatus = 'draft' | 'reviewing' | 'online' | 'offline'

export function useVersionStatus() {
  const { t } = useI18n()

  const statusDotClass = (status: VersionStatus) => {
    const map: Record<VersionStatus, string> = {
      draft: 'bg-gray-400',
      reviewing: 'bg-amber-500',
      online: 'bg-emerald-500',
      offline: 'bg-red-500',
    }
    return map[status] || 'bg-gray-400'
  }

  const statusBadgeClass = (status: VersionStatus) => {
    const map: Record<VersionStatus, string> = {
      draft: 'badge badge-secondary',
      reviewing: 'badge badge-warning',
      online: 'badge badge-success',
      offline: 'badge badge-danger',
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
