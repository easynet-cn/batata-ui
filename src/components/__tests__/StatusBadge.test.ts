import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../common/StatusBadge.vue'

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: { value: 'en' },
    setLanguage: vi.fn(),
  }),
}))

describe('StatusBadge', () => {
  describe('status colors', () => {
    it('renders healthy status with green classes', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-green-50')
      expect(badge.classes()).toContain('text-green-700')

      const dot = badge.find('span')
      expect(dot.classes()).toContain('bg-green-500')
    })

    it('renders warning status with amber classes', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'warning' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-amber-50')
      expect(badge.classes()).toContain('text-amber-700')
    })

    it('renders critical status with red classes', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'critical' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-red-50')
      expect(badge.classes()).toContain('text-red-700')
    })

    it('renders unknown status with gray classes', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'unknown' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-gray-50')
      expect(badge.classes()).toContain('text-gray-600')
    })

    it('renders passing status with green classes (same as healthy)', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'passing' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-green-50')
      expect(badge.classes()).toContain('text-green-700')
    })

    it('renders failing status with red classes (same as critical)', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'failing' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('bg-red-50')
      expect(badge.classes()).toContain('text-red-700')
    })
  })

  describe('label', () => {
    it('shows i18n label when no custom label provided', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy' },
      })

      // The t() mock returns the key itself
      expect(wrapper.text()).toBe('healthy')
    })

    it('shows custom label when provided', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy', label: 'Running' },
      })

      expect(wrapper.text()).toBe('Running')
    })

    it('shows correct default label for each status', () => {
      const statuses = ['healthy', 'warning', 'critical', 'unknown', 'passing', 'failing'] as const

      for (const status of statuses) {
        const wrapper = mount(StatusBadge, {
          props: { status },
        })

        // t() mock returns the key, which matches the status name
        expect(wrapper.text()).toBe(status)
      }
    })
  })

  describe('sizes', () => {
    it('renders md size by default', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('px-2.5')
      expect(badge.classes()).toContain('py-1')
      expect(badge.classes()).toContain('text-xs')
    })

    it('renders sm size with smaller classes', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy', size: 'sm' },
      })

      const badge = wrapper.find('span')
      expect(badge.classes()).toContain('px-2')
      expect(badge.classes()).toContain('py-0.5')
      expect(badge.classes()).toContain('text-[11px]')
    })

    it('renders sm size with smaller dot', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy', size: 'sm' },
      })

      const dot = wrapper.find('span span')
      expect(dot.classes()).toContain('w-1.5')
      expect(dot.classes()).toContain('h-1.5')
    })

    it('renders md size with larger dot', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'healthy', size: 'md' },
      })

      const dot = wrapper.find('span span')
      expect(dot.classes()).toContain('w-2')
      expect(dot.classes()).toContain('h-2')
    })
  })
})
