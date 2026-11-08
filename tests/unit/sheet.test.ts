// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UiSheet from '../../app/components/UiSheet.vue'

describe('sheet keyboard and page lifecycle', () => {
  it('traps focus, closes with Escape and returns focus and scrolling', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    const originalOverflow = document.body.style.overflow
    opener.focus()
    const wrapper = mount(UiSheet, { attachTo: document.body, props: { open: false, title: 'Фильтры' }, slots: { default: '<input aria-label="Цена"><button data-test="last">Применить</button>' } })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    const close = wrapper.get('button.close').element as HTMLButtonElement
    const last = wrapper.get('[data-test="last"]').element as HTMLButtonElement
    expect(document.activeElement).toBe(close)
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.setProps({ open: false })
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).toBe(originalOverflow)
    wrapper.unmount(); opener.remove()
  })
  it('releases the page when the parent unmounts an open sheet', async () => {
    const originalOverflow = document.body.style.overflow
    const wrapper = mount(UiSheet, { attachTo: document.body, props: { open: true, title: 'Новый объект' } })
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    expect(document.body.style.overflow).toBe(originalOverflow)
  })
})
