<script setup>
import { mapLocation, mapViewport, unclusterZoom } from '../utils/map-viewport'
import { loadYandexApiV2, loadYandexApiV3 } from '../utils/yandex-maps-api'
const CLUSTER_GRID = 128
const props = defineProps({ properties: { type: Array, default: () => [] }, selected: { type: String, default: null }, padding: { type: Array, default: () => [60, 30, 150, 30] }, interactive: { type: Boolean, default: true } })
const emit = defineEmits(['select'])
const container = ref(null)
const config = useRuntimeConfig()
const theme = useState('app-theme', () => 'dark')
const mode = ref(config.public.yandexMapsKey ? 'loading' : 'widget')
const engine = ref(null)
let map
let api
let clusterer
let clusterModule
let disposed = false
let resizeObserver
let v2Markers = []
let focusZoom = null
const userMoved = ref(false)
const viewport = reactive({ width: 1200, height: 800 })
const cameraPadding = computed(() => {
  // Intro frames the full viewport; search reserves the measured panel footprint.
  if (!props.interactive) return [64, 40, 80, 40]
  const padding = [...props.padding]
  if (props.selected) padding[2] = Math.max(0, Math.min(viewport.height - padding[0] - 120, padding[2] + 150))
  return padding
})
function resultsLocation() {
  return mapLocation(props.properties, viewport.width, viewport.height, cameraPadding.value)
}
const clusterIds = ref([])
const clusterProperties = computed(() => props.properties.filter(property => clusterIds.value.includes(property.id)))
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
function selectProperty(id) { clusterIds.value = []; focusZoom = null; emit('select', id) }
function selectClusterProperty(id) {
  const members = clusterProperties.value
  const property = members.find(item => item.id === id)
  const mates = members.filter(item => item.id !== id).map(item => item.location)
  const currentZoom = engine.value === 'v3' ? map?.zoom : engine.value === 'v2' ? map?.getZoom?.() : 0
  focusZoom = property
    ? Math.max(currentZoom ?? 0, unclusterZoom(property.location, mates, CLUSTER_GRID))
    : null
  clusterIds.value = []
  emit('select', id)
  if (props.selected === id) focusSelected()
}
function makeButton(label, title, className, onClick) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.textContent = label
  button.setAttribute('aria-label', title)
  button.title = title
  button.addEventListener('click', event => { event.stopPropagation(); onClick() })
  return button
}
function priceLabel(property) {
  return `${new Intl.NumberFormat('ru-RU').format(property.priceFrom)} ₽${property.rentalMode === 'long_term' ? '/мес' : ''}`
}
function syncMarkers(fit = false) {
  if (engine.value === 'v3') syncMarkersV3(fit)
  else if (engine.value === 'v2') syncMarkersV2(fit)
}
function syncMarkersV3(fit = false) {
  if (!map || !clusterModule) return
  if (clusterer) map.removeChild(clusterer)
  clusterIds.value = []
  const features = props.properties.map(property => ({
    type: 'Feature', id: property.id, geometry: { type: 'Point', coordinates: [property.location.lon, property.location.lat] },
    properties: { property },
  }))
  const marker = feature => {
    const property = feature.properties.property
    const button = makeButton(priceLabel(property), property.title, `map-price-marker${property.id === props.selected ? ' is-selected' : ''}`, () => selectProperty(property.id))
    return new api.YMapMarker({ coordinates: feature.geometry.coordinates }, button)
  }
  const cluster = (coordinates, items) => {
    const button = makeButton(String(items.length), `Объекты рядом: ${items.length}`, 'map-cluster-marker', () => { clusterIds.value = items.map(item => item.id) })
    return new api.YMapMarker({ coordinates }, button)
  }
  clusterer = new clusterModule.YMapClusterer({ method: clusterModule.clusterByGrid({ gridSize: CLUSTER_GRID }), features, marker, cluster })
  map.addChild(clusterer)
  if (fit) fitResults()
}
function syncMarkersV2(fit = false) {
  if (!map || !window.ymaps || !clusterer) return
  clusterer.removeAll()
  clusterIds.value = []
  v2Markers = props.properties.map(property => {
    const marker = new window.ymaps.Placemark([property.location.lat, property.location.lon], {
      iconContent: priceLabel(property),
      hintContent: escapeHtml(property.title),
      propertyId: property.id,
    }, { preset: property.id === props.selected ? 'islands#darkGreenStretchyIcon' : 'islands#blackStretchyIcon' })
    marker.events.add('click', event => { event.stopPropagation(); selectProperty(property.id) })
    return marker
  })
  clusterer.add(v2Markers)
  if (fit) fitResults()
}
function fitResults() {
  if (!map || !props.properties.length) return
  if (engine.value === 'v3') {
    map.update({ margin: cameraPadding.value, location: resultsLocation() })
    return
  }
  if (engine.value === 'v2') {
    const camera = initialCamera()
    map.setCenter([camera.lat, camera.lon], camera.zoom, { checkZoomRange: true })
  }
}
function initialCamera() {
  return mapViewport(props.properties, viewport.width, viewport.height, cameraPadding.value)
}
function focusSelected() {
  const property = props.properties.find(item => item.id === props.selected)
  if (!map || !property) return
  const zoom = focusZoom ?? (engine.value === 'v3' ? map.zoom : map.getZoom())
  focusZoom = null
  if (engine.value === 'v3') map.update({ margin: cameraPadding.value, location: { center: [property.location.lon, property.location.lat], zoom } })
  else if (engine.value === 'v2') map.setCenter([property.location.lat, property.location.lon], zoom, { checkZoomRange: true })
}
function showAll() {
  userMoved.value = false
  if (engine.value === 'v3' && map?.center) map.update({ location: { center: [map.center[0], map.center[1]], zoom: map.zoom } })
  fitResults()
}
function adjustZoom(delta) {
  if (!map) return
  userMoved.value = true
  if (engine.value === 'v3') {
    map.update({ location: { center: map.center, zoom: map.zoom + delta } })
    return
  }
  if (engine.value === 'v2') map.setZoom(map.getZoom() + delta, { checkZoomRange: true })
}
function measureViewport() { viewport.width = window.innerWidth; viewport.height = window.innerHeight }
function observeResize() {
  if (typeof ResizeObserver === 'undefined' || !container.value) return
  resizeObserver = new ResizeObserver(entries => {
    if (!entries[0]?.contentRect.width || !entries[0]?.contentRect.height || userMoved.value) return
    if (engine.value === 'v2') map?.container.fitToViewport()
    // No fitResults here: intro→search and panel resize must not jump the camera.
    if (props.selected) focusSelected()
  })
  resizeObserver.observe(container.value)
}
async function mountV3(key) {
  const loaded = await loadYandexApiV3(key)
  if (disposed) return
  api = loaded.api
  clusterModule = loaded.cluster
  map = new api.YMap(container.value, { location: resultsLocation(), margin: cameraPadding.value, theme: theme.value }, [
    new api.YMapDefaultSchemeLayer(), new api.YMapDefaultFeaturesLayer(),
  ])
  map.addChild(new api.YMapListener({ onClick: object => { if (object?.type === 'marker') return; clusterIds.value = []; emit('select', null) } }))
  engine.value = 'v3'
  mode.value = 'api'
  syncMarkers(true)
  observeResize()
}
async function mountV2(key) {
  const ymaps = await loadYandexApiV2(key)
  if (disposed) return
  const camera = initialCamera()
  map = new ymaps.Map(container.value, { center: [camera.lat, camera.lon], zoom: camera.zoom, controls: [] }, { suppressMapOpenBlock: true })
  clusterer = new ymaps.Clusterer({ gridSize: CLUSTER_GRID, clusterDisableClickZoom: true, clusterOpenBalloonOnClick: false, preset: 'islands#darkGreenClusterIcons' })
  clusterer.events.add('click', event => {
    const target = event.get('target')
    if (typeof target?.getGeoObjects !== 'function') return
    event.preventDefault(); event.stopPropagation()
    clusterIds.value = target.getGeoObjects().map(marker => marker.properties.get('propertyId'))
  })
  map.geoObjects.add(clusterer)
  map.events.add('click', () => { clusterIds.value = []; emit('select', null) })
  engine.value = 'v2'
  mode.value = 'api'
  syncMarkers(true)
  observeResize()
}
function useWidget(error) {
  map?.destroy?.(); map = undefined
  engine.value = null
  if (!disposed) {
    console.warn('Yandex Maps failed to load; using the map widget.', error instanceof Error ? error.message : 'Map initialization failed')
    mode.value = 'widget'
  }
}
onMounted(async () => {
  measureViewport()
  window.addEventListener('resize', measureViewport)
  if (!config.public.yandexMapsKey) return
  try {
    await mountV3(config.public.yandexMapsKey)
  } catch (v3Error) {
    try {
      console.warn('Yandex Maps API 3.0 unavailable; falling back to API 2.1.', v3Error instanceof Error ? v3Error.message : v3Error)
      await mountV2(config.public.yandexMapsKey)
    } catch (v2Error) {
      useWidget(v2Error)
    }
  }
})
watch(() => props.properties, () => { userMoved.value = false; syncMarkers(true) }, { deep: true })
watch(() => props.selected, () => { syncMarkers(false); focusSelected() })
watch(cameraPadding, () => {
  if (!map) return
  // Margin only: refitting here shifts the intro camera when the search panel appears.
  if (engine.value === 'v3') map.update({ margin: cameraPadding.value })
  if (!userMoved.value && props.selected) focusSelected()
}, { deep: true })
watch(theme, value => {
  if (engine.value !== 'v3' || !map) return
  // Let the shell class paint first; map tiles can catch up on the next frame.
  requestAnimationFrame(() => { if (!disposed && map) map.update({ theme: value }) })
})
const widgetCamera = computed(() => mapViewport(props.selected ? props.properties.filter(item => item.id === props.selected) : props.properties, viewport.width, viewport.height, cameraPadding.value))
const widgetUrl = computed(() => {
  const { lon, lat, zoom } = widgetCamera.value
  const params = new URLSearchParams({ ll: `${lon},${lat}`, z: String(zoom) })
  const points = props.properties.map(property => `${property.location.lon},${property.location.lat}`)
  if (points.length) params.set('pt', points.join('~'))
  return `https://yandex.ru/map-widget/v1/?${params}`
})
onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('resize', measureViewport)
  resizeObserver?.disconnect()
  if (engine.value === 'v3') map?.destroy?.()
  else if (engine.value === 'v2') map?.destroy?.()
})
</script>
<template>
  <div class="yandex-map" @pointerdown="userMoved = true" @wheel.passive="userMoved = true">
    <div v-show="mode !== 'widget'" ref="container" class="yandex-canvas" aria-label="Карта объектов"></div>
    <iframe v-if="mode === 'widget'" class="yandex-canvas" :src="widgetUrl" title="Яндекс Карта жилья на юге России" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <div v-if="mode === 'loading'" class="map-loading">Загружаем карту…</div>
    <div v-if="mode === 'widget' && interactive" class="map-provider-hint">Яндекс Карта · подробности объектов доступны в списке</div>
    <button v-if="mode === 'api' && interactive" class="map-show-all" @click.stop="showAll">Показать все объекты</button>
    <div v-if="mode === 'api' && interactive" class="map-zoom" role="group" aria-label="Масштаб карты">
      <button type="button" aria-label="Приблизить" @click.stop="adjustZoom(1)">+</button>
      <button type="button" aria-label="Отдалить" @click.stop="adjustZoom(-1)">−</button>
    </div>
    <section v-if="clusterProperties.length" class="map-cluster-list" aria-label="Объекты на карте">
      <div class="map-cluster-heading"><b>Объекты рядом · {{ clusterProperties.length }}</b><button aria-label="Закрыть список объектов" @click="clusterIds = []">×</button></div>
      <button v-for="property in clusterProperties" :key="property.id" class="map-cluster-item" @click="selectClusterProperty(property.id)"><span>{{ property.title }}<small>{{ property.city }}</small></span><b>{{ new Intl.NumberFormat('ru-RU').format(property.priceFrom) }} ₽<small>{{ property.rentalMode === 'long_term' ? '/мес' : '/ночь' }}</small></b></button>
    </section>
  </div>
</template>
<style scoped>
.map-show-all{position:absolute;top:var(--map-top,100px);right:var(--map-right,24px);z-index:3;border:1px solid var(--border-main);border-radius:24px;padding:10px 14px;background:var(--surface-glass);color:var(--text-main);font-size:12px}
.map-zoom{position:absolute;top:50%;right:var(--map-right,24px);z-index:3;display:flex;flex-direction:column;transform:translateY(-50%);border:1px solid var(--border-main);border-radius:16px;overflow:hidden;background:var(--surface-glass)}
.map-zoom button{width:44px;height:44px;border:0;background:transparent;color:var(--text-main);font-size:22px;line-height:1}
.map-zoom button+button{border-top:1px solid var(--border-main)}
.map-zoom button:hover{background:var(--surface-control)}
.map-cluster-list{position:absolute;z-index:6;inset:auto 12px 25px;background:var(--surface-glass);border:1px solid var(--border-main);border-radius:16px;padding:12px;max-height:min(320px,70%);overflow:auto;color:var(--text-main)}.map-cluster-heading,.map-cluster-item{display:flex;align-items:center;justify-content:space-between;gap:12px}.map-cluster-heading button{border:0;background:transparent;color:inherit;font-size:24px;width:44px;height:44px}.map-cluster-item{width:100%;min-height:54px;padding:8px 4px;border:0;border-top:1px solid var(--border-main);background:transparent;color:inherit;text-align:left}.map-cluster-item span{min-width:0}.map-cluster-item b{text-align:right;white-space:nowrap}.map-cluster-item small{display:block;color:var(--text-muted);font-size:11px}

:deep(.map-price-marker),:deep(.map-cluster-marker){border:1px solid var(--map-marker-border,#fff);background:var(--map-marker-bg,#142019);color:var(--map-marker-fg,#fff);font-size:12px;font-weight:800;box-shadow:0 3px 12px var(--map-marker-shadow,#0006);cursor:pointer}
:deep(.map-price-marker){border-radius:30px;padding:8px 12px;white-space:nowrap}
:deep(.map-price-marker.is-selected){background:#d0f35b;color:#10170c;border-color:#d0f35b}
:deep(.map-cluster-marker){border-radius:50%;min-width:44px;min-height:44px}
</style>
