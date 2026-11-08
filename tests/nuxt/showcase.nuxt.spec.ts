import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MestoApp from '../../app/components/MestoApp.vue'
import { useDemoStore } from '../../app/stores/demo.js'

describe('showcase details', () => {
  it('summarizes occupied rooms and the next arrival in the owner list', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/host/properties', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    const cards = wrapper.findAll('.host-card')
    expect(cards.find(card => card.text().includes('Кипарис'))!.text()).toContain('5 занято сегодня')
    expect(cards.find(card => card.text().includes('Терраса над Ялтой'))!.text()).toContain('Ближайший заезд · 18 июн.')
    expect(cards.find(card => card.text().includes('Студия у моря'))!.text()).toContain('Продолжить')
    wrapper.unmount()
  })
  it('switches between the example property photos', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/stays/p1', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    expect(wrapper.get('.detail-photo img').attributes('src')).toContain('photo-p1.png')
    await wrapper.get('[aria-label="Следующее фото"]').trigger('click')
    expect(wrapper.get('.detail-photo img').attributes('src')).toContain('photo-p1-interior.png')
    expect(wrapper.get('.gallery-count').text()).toBe('2 / 2')
    wrapper.unmount()
  })
  it('shows actual room availability and repair on the selected date', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/host/properties/p2', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    const rows = wrapper.findAll('.host-unit-row')
    expect(rows[0]!.text()).toContain('Занят до 15 июн.')
    expect(rows[1]!.text()).toContain('Свободен')
    expect(rows[2]!.text()).toContain('Заезд сегодня')
    expect(rows[3]!.text()).toContain('Закрыт на ремонт')
    await wrapper.get('.host-day input').setValue('2027-06-16')
    expect(wrapper.findAll('.host-unit-row')[0]!.text()).toContain('Свободен')
    wrapper.unmount()
  })
})
