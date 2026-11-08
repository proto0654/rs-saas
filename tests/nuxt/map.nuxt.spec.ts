import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { useRuntimeConfig, useState } from '#app'
import YandexMap from '../../app/components/YandexMap.client.vue'
import { resetYandexMapLoaders } from '../../app/utils/yandex-maps-api'

const properties = [
  { id: 'one', title: '<img src=x onerror=alert(1)>', city: 'Ялта', priceFrom: 1000, location: { lat: 44.5, lon: 34.2 } },
  { id: 'two', title: 'Другая квартира', city: 'Ялта', priceFrom: 2000, location: { lat: 44.5005, lon: 34.2005 } },
]
const distantProperties = [
  { id: 'one', title: '<img src=x onerror=alert(1)>', city: 'Ялта', priceFrom: 1000, location: { lat: 44, lon: 34 } },
  { id: 'two', title: 'Другая квартира', city: 'Ялта', priceFrom: 2000, location: { lat: 45, lon: 35 } },
]

describe('Yandex Maps integration', () => {
  let config: ReturnType<typeof useRuntimeConfig>
  let originalKey: typeof config.public.yandexMapsKey
  afterEach(() => {
    config.public.yandexMapsKey = originalKey
    resetYandexMapLoaders()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('falls back to API 2.1 when API 3.0 is unavailable', async () => {
    config = useRuntimeConfig(); originalKey = config.public.yandexMapsKey
    config.public.yandexMapsKey = 'test'
    let firstHint = ''
    let mapInstance: FakeMap
    class FakePlacemark {
      events = { add: vi.fn() }
      properties: { get: (name: string) => unknown }
      constructor(_coords: unknown, values: Record<string, unknown>) {
        this.properties = { get: name => values[name] }
        if (!firstHint) firstHint = String(values.hintContent)
      }
    }
    class FakeClusterer {
      events = { add: vi.fn() }
      removeAll = vi.fn()
      add = vi.fn()
      getBounds = vi.fn(() => [[44, 34], [45, 35]])
    }
    class FakeMap {
      geoObjects = { add: vi.fn() }
      events = { add: vi.fn() }
      container = { fitToViewport: vi.fn() }
      setBounds = vi.fn()
      setCenter = vi.fn()
      getZoom = vi.fn(() => 10)
      destroy = vi.fn()
      constructor() { mapInstance = this }
    }
    vi.stubGlobal('ymaps3', undefined)
    vi.stubGlobal('ymaps', { ready: (callback: () => void) => callback(), Placemark: FakePlacemark, Clusterer: FakeClusterer, Map: FakeMap })
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = createElement(tag)
      if (tag === 'script') {
        Object.defineProperty(element, 'src', {
          configurable: true,
          set(value: string) {
            Object.defineProperty(element, 'src', { configurable: true, value })
            queueMicrotask(() => {
              if (String(value).includes('/v3/')) element.onerror?.(new Event('error') as any)
            })
          },
          get() { return '' },
        })
      }
      return element
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = await mountSuspended(YandexMap, { props: { properties: distantProperties } })
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('.map-show-all').exists()).toBe(true)
    expect(firstHint).toContain('&lt;img')
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('API 3.0'), expect.any(String))
    expect(mapInstance!.setCenter).toHaveBeenCalledWith(
      [expect.any(Number), expect.any(Number)],
      expect.any(Number),
      expect.objectContaining({ checkZoomRange: true }),
    )
    const [, zoom] = mapInstance!.setCenter.mock.calls.at(-1)!
    expect(zoom).toBeGreaterThan(4)
    expect(zoom).toBeLessThan(10)
    wrapper.unmount()
    expect(mapInstance!.destroy).toHaveBeenCalledOnce()
  })

  it('falls back to the widget if both API versions fail', async () => {
    config = useRuntimeConfig(); originalKey = config.public.yandexMapsKey
    config.public.yandexMapsKey = 'test'
    const load = Object.assign(vi.fn().mockRejectedValue(new Error('unavailable')), { registerCdn: vi.fn() })
    vi.stubGlobal('ymaps3', { ready: Promise.resolve(), import: load })
    vi.stubGlobal('ymaps', undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = createElement(tag)
      if (tag === 'script') {
        Object.defineProperty(element, 'src', { set() { queueMicrotask(() => element.onerror?.(new Event('error'))) }, get() { return '' } })
      }
      return element
    })
    const wrapper = await mountSuspended(YandexMap, { props: { properties: distantProperties } })
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('iframe').exists()).toBe(true)
    expect(new URL(wrapper.get('iframe').attributes('src')!).searchParams.get('pt')).toBe('34,44~35,45')
    await wrapper.setProps({ properties: [distantProperties[1]!] })
    expect(new URL(wrapper.get('iframe').attributes('src')!).searchParams.get('pt')).toBe('35,45')
    await wrapper.setProps({ properties: [] })
    expect(new URL(wrapper.get('iframe').attributes('src')!).searchParams.has('pt')).toBe(false)
    expect(wrapper.find('.map-show-all').exists()).toBe(false)
    wrapper.unmount()
  })

  it('keeps clusters, camera and theme in sync with the search on API 3.0', async () => {
    config = useRuntimeConfig(); originalKey = config.public.yandexMapsKey
    config.public.yandexMapsKey = 'test'
    const theme = useState('app-theme', () => 'dark')
    theme.value = 'dark'
    let instance: FakeMap
    let currentCluster: FakeClusterer
    class FakeMap {
      zoom = 9
      update = vi.fn()
      addChild = vi.fn()
      removeChild = vi.fn()
      destroy = vi.fn()
      constructor(_element: unknown, public options: any) { instance = this }
    }
    class FakeClusterer {
      constructor(public options: any) { currentCluster = this }
    }
    class FakeMarker {
      constructor(public options: any, public element: HTMLElement) {}
    }
    class FakeControls { addChild() { return this } }
    const load = Object.assign(vi.fn(async (name: string) => name.includes('clusterer')
      ? { YMapClusterer: FakeClusterer, clusterByGrid: vi.fn() }
      : { YMapZoomControl: class {} }), { registerCdn: vi.fn() })
    vi.stubGlobal('ymaps3', {
      ready: Promise.resolve(), import: load, YMap: FakeMap, YMapMarker: FakeMarker,
      YMapDefaultSchemeLayer: class {}, YMapDefaultFeaturesLayer: class {}, YMapControls: FakeControls, YMapListener: class {},
    })
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    const wrapper = await mountSuspended(YandexMap, { props: { properties } })
    await flushPromises()
    expect(instance!.options.theme).toBe('dark')
    expect(instance!.options.location).toEqual(expect.objectContaining({
      center: [34.20025, 44.50025],
      zoom: expect.any(Number),
    }))
    expect(instance!.options.location.zoom).toBeGreaterThan(10)
    expect(instance!.update).toHaveBeenCalledWith(expect.objectContaining({
      location: expect.objectContaining({ center: [34.20025, 44.50025], zoom: expect.any(Number) }),
    }))
    expect(currentCluster!.options.features[0].geometry.coordinates).toEqual([34.2, 44.5])
    const marker = currentCluster!.options.marker(currentCluster!.options.features[0]) as FakeMarker
    expect(marker.element.textContent).toContain('1 000 ₽')
    expect(marker.element.getAttribute('aria-label')).toBe(properties[0]!.title)
    expect(marker.element.querySelector('img')).toBeNull()
    const cluster = currentCluster!.options.cluster([34.2, 44.5], currentCluster!.options.features) as FakeMarker
    cluster.element.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.map-cluster-list').text()).toContain('Другая квартира')
    await wrapper.findAll('.map-cluster-item')[1]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['two'])
    await wrapper.setProps({ selected: 'two' })
    expect(instance!.update).toHaveBeenCalledWith(expect.objectContaining({
      location: { center: [34.2005, 44.5005], zoom: expect.any(Number) },
    }))
    const focused = instance!.update.mock.calls.map(call => call[0]?.location).find(location => location?.center?.[0] === 34.2005)
    expect(focused?.zoom).toBeGreaterThan(15)
    instance!.update.mockClear()
    theme.value = 'light'
    await wrapper.vm.$nextTick()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    expect(instance!.update).toHaveBeenCalledWith({ theme: 'light' })
    await wrapper.trigger('pointerdown')
    instance!.update.mockClear()
    await wrapper.setProps({ padding: [100, 24, 48, 500] })
    expect(instance!.update).not.toHaveBeenCalledWith(expect.objectContaining({ location: expect.anything() }))
    await wrapper.get('.map-show-all').trigger('click')
    expect(instance!.update).toHaveBeenCalledWith(expect.objectContaining({
      location: expect.objectContaining({ center: [34.20025, 44.50025], zoom: expect.any(Number) }),
    }))
    wrapper.unmount()
    expect(instance!.destroy).toHaveBeenCalledOnce()
  })
})
