import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MestoApp from '../../app/components/MestoApp.vue'
import { useDemoStore } from '../../app/stores/demo.js'

describe('owner booking hierarchy', () => {
  it('groups owner bookings under their property and unit and applies actions', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/host/bookings', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    const hotel = wrapper.findAll('.booking-group').find(group => group.get('summary').text().includes('Кипарис'))!
    expect(hotel.get('summary').text()).toContain('8 ед. размещения')
    expect(hotel.findAll('.booking-unit')).toHaveLength(8)
    const room = hotel.findAll('.booking-unit').find(unit => unit.get('summary').text().includes('№302'))!
    expect(room.text()).toContain('Ожидает подтверждения')
    await room.findAll('button').find(button => button.text() === 'Подтвердить')!.trigger('click')
    expect(store.data!.db.bookings.find(booking => booking.id === 'b5')!.status).toBe('confirmed')
    expect(room.text()).toContain('Подтверждена')
    expect(hotel.get('summary').text()).toContain('Ожидают: 0')
    expect(wrapper.findAll('.booking-group').every(group => !group.text().includes('Балкон над парком'))).toBe(true)
    wrapper.unmount()
  })
  it('shows the same grouped calendar inside an individual hotel', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/host/properties/p2', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    await wrapper.findAll('button').find(button => button.text() === 'Календарь')!.trigger('click')
    const toggle = wrapper.get('.calendar-group-toggle')
    expect(toggle.text()).toContain('Кипарис')
    expect(toggle.text()).toContain('Свободно 2 · занято 5 · закрыто 1')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(wrapper.findAll('button.timeline-booking').length).toBeGreaterThan(0)
    wrapper.unmount()
  })
})
