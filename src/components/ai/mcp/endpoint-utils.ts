import type { McpFrontEndpointConfig, McpServiceRef, McpEndpointInfo } from '@/types/mcp'

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
