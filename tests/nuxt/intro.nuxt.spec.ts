import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HomeIntro from '../../app/components/HomeIntro.vue'
import seed from '../../demo/seed.json'

describe('home introduction', () => {
  it('keeps search accessible when reduced motion is requested', async () => {
    const media = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    try {
      const wrapper = await mountSuspended(HomeIntro, { route: '/', slots: { default: '<button>Search control</button>' } })
      expect(wrapper.get('.search-content').attributes('inert')).toBeUndefined()
      wrapper.unmount()
    } finally { media.mockRestore() }
  })
  it('shows published property photos and links to the search on the same page', async () => {
    const wrapper = await mountSuspended(HomeIntro, { route: '/', slots: { default: '<button>Search control</button>' } })
    const photos = seed.properties.filter(property => property.status === 'published').flatMap(property => property.images)
    const shown = wrapper.findAll('.intro-tile img').map(image => image.attributes('src')!)
    expect(shown).toHaveLength(12)
    expect(new Set(shown).size).toBe(Math.min(12, new Set(photos).size))
    expect(shown.every(image => photos.includes(image))).toBe(true)
    expect(wrapper.get('a').attributes('href')).toBe('#search')
    expect(wrapper.get('.search-content').attributes('inert')).toBeDefined()
    expect(wrapper.get('.home-search button').text()).toBe('Search control')
    wrapper.unmount()
  })
})
