import { describe, it, expect } from 'vitest'
import { mapAuditLogItem } from '../mappers'

describe('mappers', () => {
  describe('mapAuditLogItem', () => {
    const baseItem = {
      id: 1,
      gmtCreate: '2024-06-15T10:30:00Z',
      operator: 'admin',
      sourceIp: '192.168.1.1',
      resourceType: 'CONFIG',
      operation: 'CREATE',
      resourceId: 'test-config',
      result: 'SUCCESS',
      details: undefined,
      errorMessage: undefined,
    }

    it('maps basic fields correctly', () => {
      const result = mapAuditLogItem(baseItem)
      expect(result.id).toBe('1')
      expect(result.username).toBe('admin')
      expect(result.ip).toBe('192.168.1.1')
      expect(result.resourceName).toBe('test-config')
      expect(result.success).toBe(true)
    })

    it('maps operation types correctly', () => {
      expect(mapAuditLogItem({ ...baseItem, operation: 'CREATE' }).action).toBe('create')
      expect(mapAuditLogItem({ ...baseItem, operation: 'UPDATE' }).action).toBe('update')
      expect(mapAuditLogItem({ ...baseItem, operation: 'DELETE' }).action).toBe('delete')
      expect(mapAuditLogItem({ ...baseItem, operation: 'LOGIN' }).action).toBe('login')
      expect(mapAuditLogItem({ ...baseItem, operation: 'LOGOUT' }).action).toBe('logout')
      expect(mapAuditLogItem({ ...baseItem, operation: 'PUBLISH' }).action).toBe('update')
      expect(mapAuditLogItem({ ...baseItem, operation: 'ROLLBACK' }).action).toBe('update')
    })

    it('maps resource types correctly', () => {
      expect(mapAuditLogItem({ ...baseItem, resourceType: 'CONFIG' }).resourceType).toBe('config')
      expect(mapAuditLogItem({ ...baseItem, resourceType: 'SERVICE' }).resourceType).toBe('service')
      expect(mapAuditLogItem({ ...baseItem, resourceType: 'NAMESPACE' }).resourceType).toBe(
        'namespace',
      )
      expect(mapAuditLogItem({ ...baseItem, resourceType: 'USER' }).resourceType).toBe('user')
      expect(mapAuditLogItem({ ...baseItem, resourceType: 'ROLE' }).resourceType).toBe('role')
    })

    it('handles missing sourceIp', () => {
      const result = mapAuditLogItem({ ...baseItem, sourceIp: undefined })
      expect(result.ip).toBe('unknown')
    })

    it('handles failed result', () => {
      const result = mapAuditLogItem({ ...baseItem, result: 'FAILED' })
      expect(result.success).toBe(false)
    })

    it('parses JSON details', () => {
      const result = mapAuditLogItem({
        ...baseItem,
        details: '{"key": "value"}',
      })
      expect(result.details).toEqual({ key: 'value' })
    })

    it('handles invalid JSON details gracefully', () => {
      const result = mapAuditLogItem({
        ...baseItem,
        details: 'not-json',
      })
      expect(result.details).toBe('not-json')
    })

    it('handles unknown operation type', () => {
      const result = mapAuditLogItem({ ...baseItem, operation: 'UNKNOWN' })
      expect(result.action).toBe('create') // default fallback
    })

    it('handles unknown resource type', () => {
      const result = mapAuditLogItem({ ...baseItem, resourceType: 'UNKNOWN' })
      expect(result.resourceType).toBe('config') // default fallback
    })

    it('converts timestamp correctly', () => {
      const result = mapAuditLogItem(baseItem)
      expect(result.timestamp).toBe(new Date('2024-06-15T10:30:00Z').getTime())
    })
  })
})
