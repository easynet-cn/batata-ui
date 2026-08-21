import { describe, it, expect } from 'vitest'
import { mapAuditLogItem } from '../mappers'

describe('mappers', () => {
  describe('mapAuditLogItem', () => {
    const baseItem = {
      id: 1,
      createdTime: '2024-06-15 10:30:00',
      operator: 'admin',
      operatorIp: '192.168.1.1',
      resourceType: 'config',
      operationType: 'CREATE',
      resourceName: 'DEFAULT_GROUP/test-config',
      result: 'SUCCESS',
      detail: undefined,
      errorMessage: undefined,
    }

    it('maps basic fields correctly', () => {
      const result = mapAuditLogItem(baseItem)
      expect(result.id).toBe('1')
      expect(result.username).toBe('admin')
      expect(result.ip).toBe('192.168.1.1')
      expect(result.resourceName).toBe('DEFAULT_GROUP/test-config')
      expect(result.success).toBe(true)
    })

    it('maps operation types correctly', () => {
      expect(mapAuditLogItem({ ...baseItem, operationType: 'CREATE' }).action).toBe('create')
      expect(mapAuditLogItem({ ...baseItem, operationType: 'UPDATE' }).action).toBe('update')
      expect(mapAuditLogItem({ ...baseItem, operationType: 'DELETE' }).action).toBe('delete')
      expect(mapAuditLogItem({ ...baseItem, operationType: 'LOGIN' }).action).toBe('login')
      expect(mapAuditLogItem({ ...baseItem, operationType: 'LOGOUT' }).action).toBe('logout')
      expect(mapAuditLogItem({ ...baseItem, operationType: 'PUBLISH' }).action).toBe('update')
      expect(mapAuditLogItem({ ...baseItem, operationType: 'ROLLBACK' }).action).toBe('update')
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

    it('handles missing operatorIp', () => {
      const result = mapAuditLogItem({ ...baseItem, operatorIp: undefined })
      expect(result.ip).toBe('unknown')
    })

    it('handles failed result', () => {
      const result = mapAuditLogItem({ ...baseItem, result: 'FAILED' })
      expect(result.success).toBe(false)
    })

    it('parses JSON details', () => {
      const result = mapAuditLogItem({
        ...baseItem,
        detail: '{"key": "value"}',
      })
      expect(result.details).toEqual({ key: 'value' })
    })

    it('handles invalid JSON details gracefully', () => {
      const result = mapAuditLogItem({
        ...baseItem,
        detail: 'not-json',
      })
      expect(result.details).toBe('not-json')
    })

    it('handles unknown operation type', () => {
      const result = mapAuditLogItem({ ...baseItem, operationType: 'UNKNOWN' })
      expect(result.action).toBe('create') // default fallback
    })

    it('handles unknown resource type', () => {
      const result = mapAuditLogItem({ ...baseItem, resourceType: 'UNKNOWN' })
      expect(result.resourceType).toBe('config') // default fallback
    })

    it('converts timestamp correctly', () => {
      const result = mapAuditLogItem(baseItem)
      expect(result.timestamp).toBe(new Date('2024-06-15 10:30:00').getTime())
    })
  })
})
