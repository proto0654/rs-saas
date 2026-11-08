import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MestoApp from '../../app/components/MestoApp.vue'
import { useDemoStore } from '../../app/stores/demo.js'
import { nextTick } from 'vue'

describe('guest booking controls', () => {
  it('enables checkout only after selecting a concrete unit and displays the quote', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/stays/p1', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.restore(); await nextTick()
    const checkout = wrapper.findAll('button').find(button => button.text() === 'Забронировать →')!
    expect(checkout.attributes('disabled')).toBeDefined()
    await wrapper.get('button.unit-row').trigger('click')
    expect(checkout.attributes('disabled')).toBeUndefined()
    expect(wrapper.get('.total').text().replace(/\s/g,'')).toContain('16800')
    wrapper.unmount()
  })
  it('simulates payment through the screen and persists the changed booking status', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/bookings', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.restore(); await nextTick()
    const booking = store.data!.db.bookings.find(b => b.guestId === 'guest1' && b.status === 'confirmed')!
    const payment = wrapper.findAll('button').find(button => button.text() === 'Симулировать оплату')!
    await payment.trigger('click')
    expect(booking.status).toBe('paid')
    expect(wrapper.text()).toContain('Оплачена (демо)')
    const saved = JSON.parse(localStorage.getItem('rs-saas-demo')!)
    expect(saved.db.bookings.find((b: { id: string }) => b.id === booking.id).status).toBe('paid')
    wrapper.unmount()
  })
})
