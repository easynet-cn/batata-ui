import type {
  McpFrontEndpointConfig,
  McpServiceRef,
  McpEndpointInfo,
  McpServerDetailInfo,
} from '@/types/mcp'

/** Normalized endpoint entry built from either source of the server detail. */
export interface NormalizedEndpoint {
  protocol: string
  address: string
  port: string
  path: string
  url: string
}

/**
 * Extract all front-end endpoints from a server detail, regardless of whether
 * they come from `frontendEndpoints` or `remoteServerConfig.frontEndpointConfigList`.
 */
export function extractEndpoints(detail?: McpServerDetailInfo | null): NormalizedEndpoint[] {
  const list: NormalizedEndpoint[] = []
  if (!detail) return list

  for (const ep of detail.frontendEndpoints || []) {
    list.push({
      protocol: ep.protocol,
      address: ep.address,
      port: ep.port,
      path: ep.path || '',
      url: `${ep.protocol}://${ep.address}:${ep.port}${ep.path || ''}`,
    })
  }

  for (const ep of detail.remoteServerConfig?.frontEndpointConfigList || []) {
    if (typeof ep.endpointData === 'string' && ep.endpointData) {
      const info = parseEndpointString(ep.endpointData)
      const path = ep.path || info.path || ''
      list.push({
        protocol: ep.protocol || ep.type || info.protocol,
        address: info.address,
        port: info.port,
        path,
        url: `${info.protocol}://${info.address}:${info.port}${path}`,
      })
    }
  }

  return list
}

/** Split a URL-like endpoint string into protocol, host, port, path. */
export function parseEndpointString(endpoint: string): McpEndpointInfo {
  const trimmed = endpoint.trim()
  let protocol = 'http'
  let address = 'localhost'
  let port = '8080'
  let path = ''

  if (trimmed) {
    const protocolMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//)
    if (protocolMatch) {
      protocol = protocolMatch[1]
    }
    const withoutProtocol = trimmed.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
    const slashIdx = withoutProtocol.indexOf('/')
    const hostPart = slashIdx >= 0 ? withoutProtocol.slice(0, slashIdx) : withoutProtocol
    path = slashIdx >= 0 ? withoutProtocol.slice(slashIdx) : ''

    const colonIdx = hostPart.lastIndexOf(':')
    if (colonIdx >= 0) {
      address = hostPart.slice(0, colonIdx)
      port = hostPart.slice(colonIdx + 1)
    } else {
      address = hostPart
    }
  }

  return { protocol, address, port, path }
}

/** Build an endpoint string from protocol/host/port/path parts. */
export function buildEndpointString(info: McpEndpointInfo): string {
  const base = `${info.protocol}://${info.address}:${info.port}`
  return info.path ? `${base}${info.path}` : base
}

/** Determine if an endpoint config uses a Nacos service reference. */
export function isServiceRef(data: McpFrontEndpointConfig['endpointData']): data is McpServiceRef {
  return !!data && typeof data === 'object' && 'serviceName' in data
}

/** Extract a display label for an endpoint config. */
export function getEndpointLabel(ep: McpFrontEndpointConfig): string {
  if (ep.endpointType === 'REF' && isServiceRef(ep.endpointData)) {
    return `ref://${ep.endpointData.serviceName}`
  }
  if (typeof ep.endpointData === 'string' && ep.endpointData) {
    return ep.endpointData
  }
  return ep.path || ep.protocol || 'endpoint'
}
