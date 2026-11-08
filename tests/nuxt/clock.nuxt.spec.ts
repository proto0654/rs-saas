import { flushPromises } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MestoApp from '../../app/components/MestoApp.vue'
import { useDemoStore } from '../../app/stores/demo.js'
import { nextTick } from 'vue'

describe('demo clock', () => {
  it('changes the persisted date from profile and uses it in the availability shortcut', async () => {
    localStorage.clear()
    const wrapper = await mountSuspended(MestoApp,{route:'/profile',global:{stubs:{YandexMap:true}}})
    const store = useDemoStore(); store.restore(); await nextTick()
    await wrapper.get('input[type="date"]').setValue('2027-06-15')
    await wrapper.findAll('button').find(b => b.text() === 'Применить демо-дату')!.trigger('click')
    expect(store.data!.db.demoToday).toBe('2027-06-15')
    expect(JSON.parse(localStorage.getItem('rs-saas-demo')!).db.demoToday).toBe('2027-06-15')
    await flushPromises()
    wrapper.unmount()
    const search = await mountSuspended(MestoApp,{route:'/search',global:{stubs:{YandexMap:true}}})
    await search.findAll('button').find(b => b.text() === 'Заезд сегодня')!.trigger('click')
    expect(store.data!.filters).toMatchObject({checkIn:'2027-06-15',checkOut:'2027-06-16'})
    await flushPromises()
    search.unmount()
  })
})
