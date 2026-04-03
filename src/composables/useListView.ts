import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { useBatataStore } from '@/stores/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'

interface PageResult<T> {
  pageItems: T[]
  totalCount: number
}

interface FetchParams {
  pageNo: number
  pageSize: number
  namespaceId: string
  [key: string]: unknown
}

interface UseListViewOptions<T> {
  fetchFn: (params: FetchParams) => Promise<{ data: { data: PageResult<T> } }>
  deleteFn?: (namespace: string, name: string) => Promise<unknown>
  uploadFn?: (formData: FormData) => Promise<unknown>
  getItemName: (item: T) => string
  searchParamKey?: string
  pageSize?: number
  watchNamespace?: boolean
  /** Enable batch selection and batch delete support */
  batchDelete?: boolean
}

export function useListView<T>(options: UseListViewOptions<T>) {
  const {
    fetchFn,
    deleteFn,
    uploadFn,
    getItemName,
    searchParamKey = 'search',
    pageSize: defaultPageSize = 12,
    watchNamespace = true,
  } = options

  const store = useBatataStore()
  const namespace = computed(() => store.currentNamespace)

  // List state
  const loading = ref(false)
  const items = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)
  const searchKeyword = ref('')

  // Delete state
  const showDeleteModal = ref(false)
  const itemToDelete = ref<T | null>(null) as Ref<T | null>

  // Upload state
  const showUploadModal = ref(false)
  const uploadFile = ref<File | null>(null)
  const uploading = ref(false)

  // Fetch items
  const fetchItems = async () => {
    loading.value = true
    try {
      const params: FetchParams = {
        pageNo: currentPage.value,
        pageSize: pageSize.value,
        namespaceId: namespace.value,
      }
      if (searchKeyword.value) {
        params[searchParamKey] = searchKeyword.value
        params.search = 'blur'
      }
      const response = await fetchFn(params)
      items.value = response.data.data.pageItems || []
      total.value = response.data.data.totalCount || 0
    } catch (error) {
      logger.error('Failed to fetch items:', error)
      toast.apiError(error)
    } finally {
      loading.value = false
    }
  }

  // Search
  const handleSearch = () => {
    currentPage.value = 1
    fetchItems()
  }

  const handleReset = () => {
    searchKeyword.value = ''
    currentPage.value = 1
    fetchItems()
  }

  // Pagination
  const handlePageChange = (page: number) => {
    currentPage.value = page
    fetchItems()
  }

  // Delete flow
  const handleDelete = (item: T) => {
    itemToDelete.value = item
    showDeleteModal.value = true
  }

  const confirmDelete = async () => {
    if (!itemToDelete.value || !deleteFn) return
    try {
      await deleteFn(namespace.value, getItemName(itemToDelete.value))
      showDeleteModal.value = false
      itemToDelete.value = null
      fetchItems()
    } catch (error) {
      logger.error('Failed to delete item:', error)
      toast.apiError(error)
    }
  }

  // Upload flow
  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    uploadFile.value = target.files?.[0] || null
  }

  const handleUpload = async () => {
    if (!uploadFile.value || !uploadFn) return
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', uploadFile.value)
      formData.append('namespaceId', namespace.value)
      await uploadFn(formData)
      showUploadModal.value = false
      uploadFile.value = null
      fetchItems()
    } catch (error) {
      logger.error('Failed to upload:', error)
      toast.apiError(error)
    } finally {
      uploading.value = false
    }
  }

  // Watch namespace
  if (watchNamespace) {
    watch(namespace, () => {
      currentPage.value = 1
      fetchItems()
    })
  }

  // Batch selection
  const selectedNames = ref<Set<string>>(new Set())
  const showBatchDeleteModal = ref(false)

  const toggleSelect = (name: string) => {
    const newSet = new Set(selectedNames.value)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    selectedNames.value = newSet
  }

  const toggleSelectAll = () => {
    if (selectedNames.value.size === items.value.length) {
      selectedNames.value = new Set()
    } else {
      selectedNames.value = new Set(items.value.map((item) => getItemName(item)))
    }
  }

  const clearSelection = () => {
    selectedNames.value = new Set()
  }

  const confirmBatchDelete = async () => {
    if (!deleteFn || selectedNames.value.size === 0) return
    try {
      const names = Array.from(selectedNames.value)
      await Promise.all(names.map((name) => deleteFn(namespace.value, name)))
      showBatchDeleteModal.value = false
      clearSelection()
      fetchItems()
    } catch (error) {
      logger.error('Failed to batch delete:', error)
      toast.apiError(error)
    }
  }

  // Auto-fetch on mount
  onMounted(() => {
    fetchItems()
  })

  return {
    // State
    namespace,
    loading,
    items,
    total,
    currentPage,
    pageSize,
    searchKeyword,
    // Delete
    showDeleteModal,
    itemToDelete,
    handleDelete,
    confirmDelete,
    // Upload
    showUploadModal,
    uploadFile,
    uploading,
    handleFileChange,
    handleUpload,
    // Batch selection
    selectedNames,
    showBatchDeleteModal,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    confirmBatchDelete,
    // Methods
    fetchItems,
    handleSearch,
    handleReset,
    handlePageChange,
  }
}
