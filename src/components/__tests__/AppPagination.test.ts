import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from '../common/AppPagination.vue'

// Mock i18n
vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: { value: 'en' },
    setLanguage: vi.fn(),
  }),
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  ChevronLeft: { template: '<span class="icon-left" />' },
  ChevronRight: { template: '<span class="icon-right" />' },
}))

describe('AppPagination', () => {
  const createWrapper = (props: { currentPage: number; pageSize: number; total: number }) => {
    return mount(AppPagination, { props })
  }

  describe('rendering', () => {
    it('displays total count', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 50 })
      expect(wrapper.text()).toContain('50')
    })

    it('displays current page and total pages', () => {
      const wrapper = createWrapper({ currentPage: 2, pageSize: 10, total: 50 })
      expect(wrapper.text()).toContain('2 / 5')
    })

    it('calculates total pages correctly', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 25 })
      // 25 items / 10 per page = 3 pages (ceil)
      expect(wrapper.text()).toContain('1 / 3')
    })

    it('defaults to 1 page when total is 0', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 0 })
      expect(wrapper.text()).toContain('1 / 1')
    })
  })

  describe('navigation', () => {
    const getPrevButton = (wrapper: ReturnType<typeof createWrapper>) =>
      wrapper.findAll('button')[0]!
    const getNextButton = (wrapper: ReturnType<typeof createWrapper>) =>
      wrapper.findAll('button')[1]!

    it('emits change with previous page on prev click', async () => {
      const wrapper = createWrapper({ currentPage: 3, pageSize: 10, total: 50 })

      await getPrevButton(wrapper).trigger('click')

      expect(wrapper.emitted('change')).toEqual([[2]])
    })

    it('emits change with next page on next click', async () => {
      const wrapper = createWrapper({ currentPage: 2, pageSize: 10, total: 50 })

      await getNextButton(wrapper).trigger('click')

      expect(wrapper.emitted('change')).toEqual([[3]])
    })

    it('disables prev button on first page', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 50 })

      expect(getPrevButton(wrapper).attributes('disabled')).toBeDefined()
    })

    it('enables prev button when not on first page', () => {
      const wrapper = createWrapper({ currentPage: 2, pageSize: 10, total: 50 })

      expect(getPrevButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('disables next button on last page', () => {
      const wrapper = createWrapper({ currentPage: 5, pageSize: 10, total: 50 })

      expect(getNextButton(wrapper).attributes('disabled')).toBeDefined()
    })

    it('enables next button when not on last page', () => {
      const wrapper = createWrapper({ currentPage: 3, pageSize: 10, total: 50 })

      expect(getNextButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('disables both buttons when there is only one page', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 5 })

      expect(getPrevButton(wrapper).attributes('disabled')).toBeDefined()
      expect(getNextButton(wrapper).attributes('disabled')).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles exact page boundary (total divisible by pageSize)', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 30 })
      expect(wrapper.text()).toContain('1 / 3')
    })

    it('handles single item', () => {
      const wrapper = createWrapper({ currentPage: 1, pageSize: 10, total: 1 })
      expect(wrapper.text()).toContain('1 / 1')
    })

    it('handles large datasets', () => {
      const wrapper = createWrapper({ currentPage: 50, pageSize: 20, total: 10000 })
      expect(wrapper.text()).toContain('50 / 500')
    })
  })
})
