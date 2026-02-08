import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import type {
  ConsulKVPair,
  ConsulServiceNode,
  ConsulHealthCheck,
  ConsulNode,
  ConsulAgentMember,
  ConsulAgentSelf,
  ConsulACLToken,
  ConsulACLPolicy,
  ConsulACLRole,
  ConsulIntention,
  ConsulConfigEntry,
  ConsulConfigEntryKind,
  ConsulSession,
} from '@/types/consul'

class ConsulApi {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: config.api.consulBaseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor: attach Consul token
    this.instance.interceptors.request.use(
      (reqConfig) => {
        const token = storage.get('consul-token')
        if (token) {
          reqConfig.headers['X-Consul-Token'] = token
        }
        return reqConfig
      },
      (error) => Promise.reject(error),
    )
  }

  // ============================================
  // KV Store API
  // ============================================

  async listKVKeys(prefix?: string, separator?: string) {
    return this.instance.get<string[]>('/kv/', {
      params: { keys: '', prefix, separator },
    })
  }

  async getKV(key: string) {
    return this.instance.get<ConsulKVPair[]>(`/kv/${key}`)
  }

  async putKV(key: string, value: string, flags?: number) {
    return this.instance.put<boolean>(`/kv/${key}`, value, {
      params: flags !== undefined ? { flags } : undefined,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  async deleteKV(key: string, recurse?: boolean) {
    return this.instance.delete<boolean>(`/kv/${key}`, {
      params: recurse ? { recurse: '' } : undefined,
    })
  }

  // ============================================
  // Catalog API
  // ============================================

  async getCatalogServices(dc?: string) {
    return this.instance.get<Record<string, string[]>>('/catalog/services', {
      params: dc ? { dc } : undefined,
    })
  }

  async getCatalogServiceNodes(name: string, dc?: string) {
    return this.instance.get<ConsulServiceNode[]>(`/catalog/service/${name}`, {
      params: dc ? { dc } : undefined,
    })
  }

  async getCatalogNodes(dc?: string) {
    return this.instance.get<ConsulNode[]>('/catalog/nodes', {
      params: dc ? { dc } : undefined,
    })
  }

  async getCatalogNode(node: string, dc?: string) {
    return this.instance.get<{ Node: ConsulNode; Services: Record<string, ConsulServiceNode> }>(
      `/catalog/node/${node}`,
      { params: dc ? { dc } : undefined },
    )
  }

  async getDatacenters() {
    return this.instance.get<string[]>('/catalog/datacenters')
  }

  // ============================================
  // Health API
  // ============================================

  async getHealthService(name: string, dc?: string, passing?: boolean) {
    return this.instance.get<ConsulServiceNode[]>(`/health/service/${name}`, {
      params: { dc, passing: passing ? '' : undefined },
    })
  }

  async getHealthChecks(service: string, dc?: string) {
    return this.instance.get<ConsulHealthCheck[]>(`/health/checks/${service}`, {
      params: dc ? { dc } : undefined,
    })
  }

  async getHealthState(state: string, dc?: string) {
    return this.instance.get<ConsulHealthCheck[]>(`/health/state/${state}`, {
      params: dc ? { dc } : undefined,
    })
  }

  // ============================================
  // Agent API
  // ============================================

  async getAgentMembers() {
    return this.instance.get<ConsulAgentMember[]>('/agent/members')
  }

  async getAgentSelf() {
    return this.instance.get<ConsulAgentSelf>('/agent/self')
  }

  async registerService(data: Record<string, unknown>) {
    return this.instance.put('/agent/service/register', data)
  }

  async deregisterService(id: string) {
    return this.instance.put(`/agent/service/deregister/${id}`)
  }

  // ============================================
  // ACL API
  // ============================================

  async listACLTokens() {
    return this.instance.get<ConsulACLToken[]>('/acl/tokens')
  }

  async getACLToken(id: string) {
    return this.instance.get<ConsulACLToken>(`/acl/token/${id}`)
  }

  async createACLToken(data: Partial<ConsulACLToken>) {
    return this.instance.put<ConsulACLToken>('/acl/token', data)
  }

  async updateACLToken(id: string, data: Partial<ConsulACLToken>) {
    return this.instance.put<ConsulACLToken>(`/acl/token/${id}`, data)
  }

  async deleteACLToken(id: string) {
    return this.instance.delete<boolean>(`/acl/token/${id}`)
  }

  async listACLPolicies() {
    return this.instance.get<ConsulACLPolicy[]>('/acl/policies')
  }

  async getACLPolicy(id: string) {
    return this.instance.get<ConsulACLPolicy>(`/acl/policy/${id}`)
  }

  async createACLPolicy(data: Partial<ConsulACLPolicy>) {
    return this.instance.put<ConsulACLPolicy>('/acl/policy', data)
  }

  async updateACLPolicy(id: string, data: Partial<ConsulACLPolicy>) {
    return this.instance.put<ConsulACLPolicy>(`/acl/policy/${id}`, data)
  }

  async deleteACLPolicy(id: string) {
    return this.instance.delete<boolean>(`/acl/policy/${id}`)
  }

  async listACLRoles() {
    return this.instance.get<ConsulACLRole[]>('/acl/roles')
  }

  async getACLRole(id: string) {
    return this.instance.get<ConsulACLRole>(`/acl/role/${id}`)
  }

  async createACLRole(data: Partial<ConsulACLRole>) {
    return this.instance.put<ConsulACLRole>('/acl/role', data)
  }

  async updateACLRole(id: string, data: Partial<ConsulACLRole>) {
    return this.instance.put<ConsulACLRole>(`/acl/role/${id}`, data)
  }

  async deleteACLRole(id: string) {
    return this.instance.delete<boolean>(`/acl/role/${id}`)
  }

  // ============================================
  // Connect / Intentions API
  // ============================================

  async listIntentions() {
    return this.instance.get<ConsulIntention[]>('/connect/intentions')
  }

  async getIntention(id: string) {
    return this.instance.get<ConsulIntention>(`/connect/intentions/${id}`)
  }

  async createIntention(data: Partial<ConsulIntention>) {
    return this.instance.post<string>('/connect/intentions', data)
  }

  async updateIntention(id: string, data: Partial<ConsulIntention>) {
    return this.instance.put<ConsulIntention>(`/connect/intentions/${id}`, data)
  }

  async deleteIntention(id: string) {
    return this.instance.delete<boolean>(`/connect/intentions/${id}`)
  }

  // ============================================
  // Config Entries API
  // ============================================

  async listConfigEntries(kind: ConsulConfigEntryKind) {
    return this.instance.get<ConsulConfigEntry[]>(`/config/${kind}`)
  }

  async getConfigEntry(kind: ConsulConfigEntryKind, name: string) {
    return this.instance.get<ConsulConfigEntry>(`/config/${kind}/${name}`)
  }

  async putConfigEntry(data: ConsulConfigEntry) {
    return this.instance.put<boolean>('/config', data)
  }

  async deleteConfigEntry(kind: ConsulConfigEntryKind, name: string) {
    return this.instance.delete<boolean>(`/config/${kind}/${name}`)
  }

  // ============================================
  // Session API
  // ============================================

  async listSessions(dc?: string) {
    return this.instance.get<ConsulSession[]>('/session/list', {
      params: dc ? { dc } : undefined,
    })
  }

  async getSession(id: string, dc?: string) {
    return this.instance.get<ConsulSession[]>(`/session/info/${id}`, {
      params: dc ? { dc } : undefined,
    })
  }

  async createSession(data: Partial<ConsulSession>) {
    return this.instance.put<{ ID: string }>('/session/create', data)
  }

  async destroySession(id: string, dc?: string) {
    return this.instance.put<boolean>(`/session/destroy/${id}`, null, {
      params: dc ? { dc } : undefined,
    })
  }
}

export default new ConsulApi()
