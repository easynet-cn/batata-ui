import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mcpApi } from '@/api/mcp'
import type { McpServerBasicInfo, McpServerDetailInfo, McpSearchMode } from '@/types/mcp'
import { logger } from '@/utils/logger'

export const useMcpStore = defineStore('mcp', () => {
  // ===== List state =====
  const mcpServers = ref<McpServerBasicInfo[]>([])
  const loading = ref(false)
  const total = ref(0)
  const pageNo = ref(1)
  const pageSize = ref(12)

  // ===== Search state =====
  const searchName = ref('')
  const searchMode = ref<McpSearchMode>('blur')

  // ===== Selection (batch operations) =====
  const selectedNames = ref<Set<string>>(new Set())

  // ===== Detail state =====
  const currentMcp = ref<McpServerDetailInfo | null>(null)
  const detailLoading = ref(false)
  const selectedVersion = ref<string | null>(null)

  // ===== Import dialog =====
  const importDialogOpen = ref(false)

  // ===== Error =====
  const error = ref<string | null>(null)

  // ===== Actions =====

  async function fetchMcpServers(namespaceId: string) {
    // Keep existing data visible during re-fetches; only show skeleton on empty state
    const hasData = mcpServers.value.length > 0
    loading.value = !hasData
    error.value = null
    try {
      const response = await mcpApi.listMcpServers({
        mcpName: searchName.value || undefined,
        namespaceId,
        search: searchMode.value,
        pageNo: pageNo.value,
        pageSize: pageSize.value,
      })
      const data = response.data.data
      mcpServers.value = data.pageItems || []
      total.value = data.totalCount || 0
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch MCP servers'
      error.value = message
      mcpServers.value = []
      total.value = 0
      logger.error('fetchMcpServers failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchMcpDetail(namespaceId: string, mcpName: string, version?: string) {
    const hasMcp = currentMcp.value !== null
    detailLoading.value = !hasMcp
    error.value = null
    try {
      const response = await mcpApi.getMcpServer({ mcpName, version, namespaceId })
      const data = response.data.data
      currentMcp.value = data
      selectedVersion.value = version || data?.versionDetail?.version || data?.version || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch MCP server detail'
      error.value = message
      currentMcp.value = null
      logger.error('fetchMcpDetail failed:', err)
    } finally {
      detailLoading.value = false
    }
  }

  async function deleteMcpServer(namespaceId: string, mcpName: string): Promise<boolean> {
    try {
      await mcpApi.deleteMcpServer({ mcpName, namespaceId })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete MCP server'
      error.value = message
      return false
    }
  }

  async function batchDelete(namespaceId: string, names: string[]): Promise<boolean> {
    let allSuccess = true
    for (const name of names) {
      try {
        await mcpApi.deleteMcpServer({ mcpName: name, namespaceId })
      } catch {
        allSuccess = false
      }
    }
    selectedNames.value = new Set()
    return allSuccess
  }

  function setSearchParams(params: { searchName?: string; searchMode?: McpSearchMode }) {
    if (params.searchName !== undefined) searchName.value = params.searchName
    if (params.searchMode !== undefined) searchMode.value = params.searchMode
    pageNo.value = 1
  }

  function setPage(newPageNo: number, newPageSize?: number) {
    pageNo.value = newPageNo
    if (newPageSize !== undefined) pageSize.value = newPageSize
  }

  function resetSearch() {
    searchName.value = ''
    searchMode.value = 'blur'
    pageNo.value = 1
  }

  function setSelectedVersion(version: string | null) {
    selectedVersion.value = version
  }

  function toggleSelect(name: string) {
    const next = new Set(selectedNames.value)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    selectedNames.value = next
  }

  function selectAll(names: string[]) {
    selectedNames.value = new Set(names)
  }

  function clearSelection() {
    selectedNames.value = new Set()
  }

  function openImportDialog() {
    importDialogOpen.value = true
  }

  function closeImportDialog() {
    importDialogOpen.value = false
  }

  function clearCurrentMcp() {
    currentMcp.value = null
    selectedVersion.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // state
    mcpServers,
    loading,
    total,
    pageNo,
    pageSize,
    searchName,
    searchMode,
    selectedNames,
    currentMcp,
    detailLoading,
    selectedVersion,
    importDialogOpen,
    error,
    // actions
    fetchMcpServers,
    fetchMcpDetail,
    deleteMcpServer,
    batchDelete,
    setSearchParams,
    setPage,
    resetSearch,
    setSelectedVersion,
    toggleSelect,
    selectAll,
    clearSelection,
    openImportDialog,
    closeImportDialog,
    clearCurrentMcp,
    clearError,
  }
})
