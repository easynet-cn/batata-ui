import type { AxiosResponse } from 'axios'
import { createApiInstance } from './client'
import { config } from '@/config'
import type { BatataResponse } from './batata'
import type {
  AiResourceImportExecuteResponse,
  AiResourceImportSearchResponse,
  AiResourceImportSourceInfo,
  AiResourceImportValidateResponse,
} from '@/types/aiResourceImport'

const IMPORT_PATH = '/ai/import'

const instance = createApiInstance(`${config.api.baseUrl}/v3/console`)

export const aiResourceImportApi = {
  listSources(params: {
    resourceType: string
  }): Promise<AxiosResponse<BatataResponse<AiResourceImportSourceInfo[]>>> {
    return instance.get<BatataResponse<AiResourceImportSourceInfo[]>>(`${IMPORT_PATH}/sources`, {
      params,
    })
  },

  search(data: {
    namespaceId?: string
    resourceType: string
    sourceId: string
    query?: string
    cursor?: string
    limit?: number
  }): Promise<AxiosResponse<BatataResponse<AiResourceImportSearchResponse>>> {
    return instance.post<BatataResponse<AiResourceImportSearchResponse>>(
      `${IMPORT_PATH}/search`,
      data,
    )
  },

  validate(data: {
    namespaceId?: string
    resourceType: string
    sourceId: string
    selectedItems: string
    overwriteExisting?: boolean
  }): Promise<AxiosResponse<BatataResponse<AiResourceImportValidateResponse>>> {
    return instance.post<BatataResponse<AiResourceImportValidateResponse>>(
      `${IMPORT_PATH}/validate`,
      data,
    )
  },

  execute(data: {
    namespaceId?: string
    resourceType: string
    sourceId: string
    selectedItems: string
    overwriteExisting?: boolean
    skipInvalid?: boolean
    validationToken?: string
  }): Promise<AxiosResponse<BatataResponse<AiResourceImportExecuteResponse>>> {
    return instance.post<BatataResponse<AiResourceImportExecuteResponse>>(
      `${IMPORT_PATH}/execute`,
      data,
    )
  },
}
