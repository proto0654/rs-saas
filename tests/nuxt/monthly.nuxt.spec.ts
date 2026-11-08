import { flushPromises } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MestoApp from '../../app/components/MestoApp.vue'
import { useDemoStore } from '../../app/stores/demo.js'

describe('monthly rental screens', () => {
  it('explains when a saved catalog has no monthly properties', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp, { route: '/search', global: { stubs: { YandexMap: true } } })
    const store = useDemoStore(); store.$reset(); store.restore(); await nextTick()
    store.data!.db.properties = store.data!.db.properties.filter(p => p.rentalMode !== 'long_term')
    await wrapper.findAll('button').find(b => b.text() === 'Долгосрок · от 30 ночей')!.trigger('click')
    expect(wrapper.text()).toContain('В сохранённом демо пока нет объектов долгосрочной аренды')
    expect(wrapper.text()).toContain('Текущие изменения демо будут удалены')
    await flushPromises()
    wrapper.unmount()
  })
  it('switches search to monthly prices and applies a region', async () => {
    localStorage.clear()
    const wrapper=await mountSuspended(MestoApp,{route:'/search',global:{stubs:{YandexMap:true}}})
    const store=useDemoStore();store.$reset();store.restore();await nextTick()
    await wrapper.findAll('button').find(b=>b.text()==='Долгосрок · от 30 ночей')!.trigger('click')
    expect(store.data!.filters).toMatchObject({rentalMode:'long_term',checkIn:'2027-06-12',checkOut:'2027-07-12',maxPrice:null})
    expect(wrapper.get('.property-card').text()).toContain('/ месяц')
    await wrapper.findAll('button').find(b=>b.text().includes('Все фильтры'))!.trigger('click')
    await wrapper.get('[aria-label="Закрыть без применения"]').trigger('click')
    expect(wrapper.text()).not.toContain('Заезд сегодня')
    await wrapper.get('[data-search-panel="destination"]').trigger('click')
    await wrapper.findAll('select')[0]!.setValue('krasnodar')
    await wrapper.findAll('button').find(b=>b.text().startsWith('Показать '))!.trigger('click')
    expect(store.data!.filters.region).toBe('krasnodar')
    expect(wrapper.findAll('.property-card').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.property-card').every(card=>card.text().includes('Кубань'))).toBe(true)
    await flushPromises()
    wrapper.unmount()
  })
  it('opens a monthly apartment directly and quotes the selected unit', async () => {
    localStorage.clear()
    const wrapper=await mountSuspended(MestoApp,{route:'/stays/p35',global:{stubs:{YandexMap:true}}})
    const store=useDemoStore();store.$reset();store.restore();await nextTick()
    expect(wrapper.text()).toContain('От 30 ночей')
    expect(wrapper.get('button.unit-row').text()).toContain('38 000 ₽')
    await wrapper.get('button.unit-row').trigger('click')
    expect(wrapper.get('.total').text().replace(/\s/g,'')).toContain('38000')
    await flushPromises()
    wrapper.unmount()
  })
})
