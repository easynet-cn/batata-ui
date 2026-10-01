import type { AxiosResponse } from 'axios'
import { createApiInstance } from './client'
import { config } from '@/config'
import type { BatataResponse } from './batata'
import type {
  McpListParams,
  McpListResponse,
  McpServerDetailInfo,
  McpTool,
  McpDraftData,
  McpPage,
  McpServerVersionDetail,
  McpServerVersionSummary,
  McpVersionIdentity,
  McpVersionStatus,
} from '@/types/mcp'

const BASE = '/ai/mcp'
const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' }

// Reuse the shared client factory (same auth + error interceptors as batata API)
const instance = createApiInstance(`${config.api.baseUrl}/v3/console`)

/** Convert an object to URLSearchParams, skipping undefined/null values. */
export function toMcpFormParams(data: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  }
  return params
}

function postVersionAction(
  path: string,
  data: McpVersionIdentity,
): Promise<AxiosResponse<BatataResponse<McpServerVersionSummary>>> {
  return instance.post<BatataResponse<McpServerVersionSummary>>(
    `${BASE}/${path}`,
    toMcpFormParams(data as unknown as Record<string, unknown>),
    { headers: FORM_HEADERS },
  )
}

export const mcpApi = {
  /** List MCP servers with pagination and search */
  listMcpServers(params: McpListParams): Promise<AxiosResponse<BatataResponse<McpListResponse>>> {
    return instance.get<BatataResponse<McpListResponse>>(`${BASE}/list`, { params })
  },

  /** Get MCP server detail */
  getMcpServer(params: {
    mcpId?: string
    mcpName?: string
    version?: string
    namespaceId?: string
  }): Promise<AxiosResponse<BatataResponse<McpServerDetailInfo>>> {
    return instance.get<BatataResponse<McpServerDetailInfo>>(BASE, { params })
  },

  /** Delete an MCP server */
  deleteMcpServer(params: {
    mcpId?: string
    mcpName?: string
    namespaceId?: string
  }): Promise<AxiosResponse<BatataResponse<string>>> {
    return instance.delete<BatataResponse<string>>(BASE, { params })
  },

  /** List lifecycle versions for one canonical MCP server. */
  listVersions(params: {
    namespaceId?: string
    mcpName: string
    status?: McpVersionStatus
    pageNo?: number
    pageSize?: number
  }): Promise<AxiosResponse<BatataResponse<McpPage<McpServerVersionSummary>>>> {
    return instance.get<BatataResponse<McpPage<McpServerVersionSummary>>>(`${BASE}/versions`, {
      params,
    })
  },

  /** Read one exact lifecycle version. */
  getVersion(
    params: McpVersionIdentity,
  ): Promise<AxiosResponse<BatataResponse<McpServerVersionDetail>>> {
    return instance.get<BatataResponse<McpServerVersionDetail>>(`${BASE}/version`, { params })
  },

  /** Create one lifecycle draft. */
  createDraft(data: McpDraftData): Promise<AxiosResponse<BatataResponse<McpServerVersionDetail>>> {
    return instance.post<BatataResponse<McpServerVersionDetail>>(
      `${BASE}/draft`,
      toMcpFormParams(data as unknown as Record<string, unknown>),
      { headers: FORM_HEADERS },
    )
  },

  /** Replace one exact current lifecycle draft. */
  updateDraft(data: McpDraftData): Promise<AxiosResponse<BatataResponse<McpServerVersionDetail>>> {
    return instance.put<BatataResponse<McpServerVersionDetail>>(
      `${BASE}/draft`,
      toMcpFormParams(data as unknown as Record<string, unknown>),
      { headers: FORM_HEADERS },
    )
  },

  /** Delete one exact current lifecycle draft. */
  deleteDraft(params: McpVersionIdentity): Promise<AxiosResponse<BatataResponse<void>>> {
    return instance.delete<BatataResponse<void>>(`${BASE}/draft`, { params })
  },

  submit(data: McpVersionIdentity) {
    return postVersionAction('submit', data)
  },

  publish(data: McpVersionIdentity) {
    return postVersionAction('publish', data)
  },

  forcePublish(data: McpVersionIdentity) {
    return postVersionAction('force-publish', data)
  },

  redraft(data: McpVersionIdentity) {
    return postVersionAction('redraft', data)
  },

  online(data: McpVersionIdentity) {
    return postVersionAction('online', data)
  },

  offline(data: McpVersionIdentity) {
    return postVersionAction('offline', data)
  },

  /** Replace custom labels while preserving the server-managed latest label. */
  updateLabels(data: {
    namespaceId?: string
    mcpName: string
    labels: string
  }): Promise<AxiosResponse<BatataResponse<Record<string, string>>>> {
    return instance.put<BatataResponse<Record<string, string>>>(
      `${BASE}/labels`,
      toMcpFormParams(data as unknown as Record<string, unknown>),
      { headers: FORM_HEADERS },
    )
  },

  /** Enable or disable one lifecycle-managed MCP server resource. */
  updateStatus(data: {
    namespaceId?: string
    mcpName: string
    enabled: boolean
  }): Promise<AxiosResponse<BatataResponse<string>>> {
    return instance.put<BatataResponse<string>>(
      `${BASE}/status`,
      toMcpFormParams(data as unknown as Record<string, unknown>),
      { headers: FORM_HEADERS },
    )
  },

  /** Update one lifecycle-managed MCP server resource scope. */
  updateScope(data: {
    namespaceId?: string
    mcpName: string
    scope: 'PUBLIC' | 'PRIVATE'
  }): Promise<AxiosResponse<BatataResponse<string>>> {
    return instance.put<BatataResponse<string>>(
      `${BASE}/scope`,
      toMcpFormParams(data as unknown as Record<string, unknown>),
      { headers: FORM_HEADERS },
    )
  },

  /** Import tools from an external MCP server endpoint */
  importToolsFromMcp(params: {
    transportType: string
    baseUrl: string
    endpoint?: string
    authToken?: string
  }): Promise<AxiosResponse<BatataResponse<McpTool[]>>> {
    return instance.get<BatataResponse<McpTool[]>>(`${BASE}/importToolsFromMcp`, { params })
  },
}
