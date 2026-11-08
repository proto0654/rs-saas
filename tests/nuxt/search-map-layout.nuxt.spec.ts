import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import SearchMapLayout from '../../app/components/SearchMapLayout.vue'

describe('search over a persistent viewport map', () => {
  it('reveals the same map node after the intro and supports reduced motion', async () => {
    const layer = document.createElement('div')
    document.body.appendChild(layer)
    const contentOpacity = ref(0), reducedMotion = ref(false)
    const wrapper = await mountSuspended(SearchMapLayout, {
      global: { provide: { homeIntroMap: { layer: ref(layer), contentOpacity, reducedMotion } } },
      slots: { default: '<div id="search-results">Results</div>', map: '<button class="test-map">Map control</button>' },
    })
    try {
      const mapNode = layer.querySelector('.test-map')
      expect(mapNode).not.toBeNull()
      expect(layer.querySelector('.search-map-layer')!.hasAttribute('inert')).toBe(true)
      contentOpacity.value = .99
      await nextTick()
      expect(layer.querySelector('.test-map')).toBe(mapNode)
      expect(layer.querySelector('.search-map-layer')!.hasAttribute('inert')).toBe(false)
      contentOpacity.value = 1
      await nextTick()
      expect(layer.querySelector('.search-map-layer')!.hasAttribute('inert')).toBe(false)
      contentOpacity.value = 0
      reducedMotion.value = true
      await nextTick()
      expect(layer.querySelector('.search-map-layer')!.hasAttribute('inert')).toBe(false)
      await wrapper.get('.search-panel-handle').trigger('click')
      expect(wrapper.emitted('update:expanded')?.[0]).toEqual([true])
    } finally { wrapper.unmount(); layer.remove() }
  })
})
