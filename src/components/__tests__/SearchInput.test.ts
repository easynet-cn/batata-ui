import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchInput from '../common/SearchInput.vue'

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: { value: 'en' },
    setLanguage: vi.fn(),
  }),
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: (...args: unknown[]) => void) => fn,
}))

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default placeholder from i18n', () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: '' },
    })

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('searchPlaceholder')
  })

  it('renders with custom placeholder', () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: '', placeholder: 'Search services...' },
    })

    expect(wrapper.find('input').attributes('placeholder')).toBe('Search services...')
  })

  it('displays the modelValue', () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: 'test query' },
    })

    expect(wrapper.find('input').element.value).toBe('test query')
  })

  it('emits update:modelValue and search on input', async () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: '' },
    })

    const input = wrapper.find('input')
    // Simulate input event by setting value and triggering input
    await input.setValue('hello')
    await input.trigger('input')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('search')).toBeTruthy()
  })

  it('shows clear button when value is not empty', async () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: 'some text' },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(true)
  })

  it('hides clear button when value is empty', () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: '' },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(false)
  })

  it('clears value and emits on clear button click', async () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: 'test' },
    })

    const clearButton = wrapper.find('button')
    await clearButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('search')?.[0]).toEqual([''])
  })

  it('syncs local value when modelValue prop changes', async () => {
    const wrapper = mount(SearchInput, {
      props: { modelValue: 'initial' },
    })

    expect(wrapper.find('input').element.value).toBe('initial')

    await wrapper.setProps({ modelValue: 'updated' })
    await nextTick()

    expect(wrapper.find('input').element.value).toBe('updated')
  })
})
