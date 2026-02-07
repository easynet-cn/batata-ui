import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs debug messages in development', () => {
    logger.debug('test debug')
    expect(console.debug).toHaveBeenCalledWith('[DEBUG] test debug')
  })

  it('logs info messages', () => {
    logger.info('test info')
    expect(console.info).toHaveBeenCalledWith('[INFO] test info')
  })

  it('logs warnings', () => {
    logger.warn('test warn')
    expect(console.warn).toHaveBeenCalledWith('[WARN] test warn')
  })

  it('logs errors', () => {
    logger.error('test error')
    expect(console.error).toHaveBeenCalledWith('[ERROR] test error')
  })

  it('passes additional arguments', () => {
    const extra = { key: 'value' }
    logger.error('test', extra)
    expect(console.error).toHaveBeenCalledWith('[ERROR] test', extra)
  })
})
