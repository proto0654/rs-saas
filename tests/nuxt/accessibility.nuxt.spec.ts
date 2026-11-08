import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import MestoApp from '../../app/components/MestoApp.vue'
import { useDemoStore } from '../../app/stores/demo.js'

describe('keyboard interaction', () => {
  it('opens the selected map card with Enter', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/search', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    wrapper.findComponent({ name: 'YandexMap' }).vm.$emit('select', 'p1'); await nextTick()
    const card = wrapper.get('.map-card')
    const navigate = vi.spyOn(wrapper.vm.$router, 'push')
    expect(card.attributes('tabindex')).toBe('0')
    await card.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(navigate).toHaveBeenCalledWith({ path: '/stays/p1', query: expect.objectContaining({ checkIn: '2027-06-12', checkOut: '2027-06-16', guests: '2' }) })
    navigate.mockRestore()
    wrapper.unmount()
  })
  it('labels the sheet and closes it with Escape', async () => {
    const wrapper = await mountSuspended(MestoApp, { route: '/search', global: { stubs: { YandexMap: true } } })
    useDemoStore().restore(); await nextTick()
    await wrapper.findAll('button').find(button => button.text().includes('Фильтры'))!.trigger('click')
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-labelledby')).toBe('dialog-title')
    expect(wrapper.get('#dialog-title').text()).toBe('Фильтры')
    await dialog.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
