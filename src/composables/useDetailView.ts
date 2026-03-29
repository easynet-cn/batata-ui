import { ref, computed, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBatataStore } from '@/stores/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'

interface UseDetailViewOptions<T> {
  fetchFn: (namespace: string, name: string) => Promise<{ data: { data: T } }>
  deleteFn: (namespace: string, name: string) => Promise<unknown>
  queryKey: string
  listRoute: string
  updateLabelsFn?: (
    namespace: string,
    name: string,
    labels: Record<string, string>,
  ) => Promise<unknown>
  updateBizTagsFn?: (namespace: string, name: string, bizTags: string) => Promise<unknown>
}

export function useDetailView<T>(options: UseDetailViewOptions<T>) {
  const { fetchFn, deleteFn, queryKey, listRoute, updateLabelsFn, updateBizTagsFn } = options

  const router = useRouter()
  const route = useRoute()
  const store = useBatataStore()
  const namespace = computed(() => store.currentNamespace)
  const itemName = computed(() => route.query[queryKey] as string)

  // State
  const loading = ref(false)
  const detail = ref<T | null>(null) as Ref<T | null>
  const showDeleteModal = ref(false)

  // Labels editing
  const editingLabels = ref(false)
  const labelsText = ref('')

  // Biz tags editing
  const editingBizTags = ref(false)
  const bizTagsText = ref('')

  // Fetch
  const fetchDetail = async () => {
    if (!itemName.value) return
    loading.value = true
    try {
      const response = await fetchFn(namespace.value, itemName.value)
      detail.value = response.data.data
    } catch (error) {
      logger.error('Failed to fetch detail:', error)
      toast.apiError(error)
    } finally {
      loading.value = false
    }
  }

  // Navigation
  const goBack = () => {
    router.push(listRoute)
  }

  // Delete
  const confirmDelete = async () => {
    if (!itemName.value) return
    try {
      await deleteFn(namespace.value, itemName.value)
      showDeleteModal.value = false
      router.push(listRoute)
    } catch (error) {
      logger.error('Failed to delete:', error)
      toast.apiError(error)
    }
  }

  // Labels editing
  const startEditLabels = (labels: Record<string, string> | undefined) => {
    if (labels) {
      labelsText.value = Object.entries(labels)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')
    } else {
      labelsText.value = ''
    }
    editingLabels.value = true
  }

  const saveLabels = async () => {
    if (!updateLabelsFn || !itemName.value) return
    const labels: Record<string, string> = {}
    labelsText.value
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const [key, ...rest] = line.split('=')
        if (key?.trim()) {
          labels[key.trim()] = rest.join('=').trim()
        }
      })
    try {
      await updateLabelsFn(namespace.value, itemName.value, labels)
      editingLabels.value = false
      fetchDetail()
    } catch (error) {
      logger.error('Failed to update labels:', error)
      toast.apiError(error)
    }
  }

  // Biz tags editing
  const startEditBizTags = (bizTags: string | undefined) => {
    bizTagsText.value = bizTags || ''
    editingBizTags.value = true
  }

  const saveBizTags = async () => {
    if (!updateBizTagsFn || !itemName.value) return
    try {
      await updateBizTagsFn(namespace.value, itemName.value, bizTagsText.value)
      editingBizTags.value = false
      fetchDetail()
    } catch (error) {
      logger.error('Failed to update biz tags:', error)
      toast.apiError(error)
    }
  }

  onMounted(() => {
    fetchDetail()
  })

  return {
    namespace,
    itemName,
    loading,
    detail,
    showDeleteModal,
    // Labels
    editingLabels,
    labelsText,
    startEditLabels,
    saveLabels,
    // Biz tags
    editingBizTags,
    bizTagsText,
    startEditBizTags,
    saveBizTags,
    // Methods
    fetchDetail,
    goBack,
    confirmDelete,
  }
}
