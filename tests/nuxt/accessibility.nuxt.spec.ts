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
    await flushPromises()
    wrapper.unmount()
  })
  it('closes the inline date panel with Escape without applying changes', async () => {
    const wrapper = await mountSuspended(MestoApp, { route: '/search', global: { stubs: { YandexMap: true } } })
    useDemoStore().restore(); await nextTick()
    await wrapper.get('[data-search-panel="dates"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.get('[name="checkOut"]').setValue('2027-06-20')
    await wrapper.get('#search-editor').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('#search-editor').exists()).toBe(false)
    expect(useDemoStore().data!.filters.checkOut).not.toBe('2027-06-20')
    await flushPromises()
    wrapper.unmount()
  })
})
