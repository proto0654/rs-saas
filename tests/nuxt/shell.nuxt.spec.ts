import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppShell from '../../app/components/AppShell.vue'

describe('branded platform layouts', () => {
  it('shows Lokal and keeps owner links inside the Mini App', async () => {
    const wrapper = await mountSuspended(AppShell, { route: '/tg/host/properties', slots: { default: 'Screen content' } })
    expect(wrapper.get('.logo').text()).toBe('Локаль.')
    expect(wrapper.get('.logo').attributes('href')).toBe('/tg')
    expect(wrapper.get('.context-switch a.current').text()).toBe('Хозяин')
    expect(wrapper.findAll('.bottom-nav a').map(link => link.attributes('href'))).toEqual(['/tg/host/properties', '/tg/host/calendar', '/tg/host/bookings', '/tg/profile'])
    expect(wrapper.text()).toContain('Screen content')
    wrapper.unmount()
  })
})
