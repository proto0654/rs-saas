import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { useRuntimeConfig } from '#app'
import YandexMap from '../../app/components/YandexMap.client.vue'

describe('map clusters', () => {
  afterEach(() => { vi.unstubAllGlobals() })
  it('lists the actual properties in a cluster and selects the one clicked', async () => {
    const config = useRuntimeConfig()
    const originalKey = config.public.yandexMapsKey
    config.public.yandexMapsKey = 'test'
    let clusterClick: ((event: any) => void) | undefined
    let markers: any[] = []
    let firstHint = ''
    class FakePlacemark {
      properties: { get: (name: string) => unknown }
      events = { add: vi.fn() }
      constructor(_coords: unknown, values: Record<string, unknown>) {
        this.properties = { get: name => values[name] }
        if (!firstHint) firstHint = String(values.hintContent)
      }
    }
    class FakeClusterer {
      events = { add: (_event: string, handler: (event: any) => void) => { clusterClick = handler } }
      removeAll() { markers = [] }
      add(items: any[]) { markers = items }
      getBounds() { return [[44, 34], [45, 35]] }
    }
    class FakeMap {
      geoObjects = { add: vi.fn() }
      events = { add: vi.fn() }
      container = { fitToViewport: vi.fn() }
      setBounds = vi.fn()
      setCenter = vi.fn()
      destroy = vi.fn()
    }
    vi.stubGlobal('ymaps', { ready: (callback: () => void) => callback(), Placemark: FakePlacemark, Clusterer: FakeClusterer, Map: FakeMap })
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    const properties = [
      { id: 'one', title: '<img src=x onerror=alert(1)>', city: 'Ялта', priceFrom: 1000, location: { lat: 44, lon: 34 } },
      { id: 'two', title: 'Другая квартира', city: 'Ялта', priceFrom: 2000, location: { lat: 45, lon: 35 } },
    ]
    const wrapper = await mountSuspended(YandexMap, { props: { properties } })
    await flushPromises()
    expect(firstHint).toContain('&lt;img')
    expect(clusterClick).toBeTypeOf('function')
    clusterClick!({ get: () => ({ getGeoObjects: () => markers }), preventDefault: vi.fn(), stopPropagation: vi.fn() })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.map-cluster-list').text()).toContain('Другая квартира')
    await wrapper.findAll('.map-cluster-item')[1]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['two'])
    expect(wrapper.find('.map-cluster-list').exists()).toBe(false)
    wrapper.unmount()
    config.public.yandexMapsKey = originalKey
  })
})
