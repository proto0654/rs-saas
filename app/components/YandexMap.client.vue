<script setup>
import { mapLocation, mapViewport, unclusterZoom } from '../utils/map-viewport'
import { loadYandexApiV2, loadYandexApiV3 } from '../utils/yandex-maps-api'
const CLUSTER_GRID = 128
const FOCUS_MIN_ZOOM = 11
const props = defineProps({ properties: { type: Array, default: () => [] }, selected: { type: String, default: null }, padding: { type: Array, default: () => [100, 24, 100, 24] }, interactive: { type: Boolean, default: true } })
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
let focusFrame = 0
const userMoved = ref(false)
const viewport = reactive({ width: 1200, height: 800 })
// Intro stays full-bleed. Search fit/focus use the free area beside the panel (card boost only when focused).
const cameraPadding = [64, 40, 80, 40]
const overviewPadding = computed(() => props.interactive ? [...props.padding] : cameraPadding)
const focusPadding = computed(() => {
  const padding = [...overviewPadding.value]
  padding[2] = Math.max(0, Math.min(viewport.height - padding[0] - 120, padding[2] + 150))
  return padding
})
function resultsLocation() {
  return mapLocation(props.properties, viewport.width, viewport.height, overviewPadding.value)
}
const typeLabels = { apartment: 'Квартира', hotel: 'Мини-отель', hostel: 'Хостел', house: 'Дом' }
const clusterIds = ref([])
const clusterProperties = computed(() => props.properties.filter(property => clusterIds.value.includes(property.id)))
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
function openCluster(ids) {
  // Clear the single-listing card so the cluster sheet owns the same popup slot.
  emit('select', null)
  clusterIds.value = ids
}
function selectProperty(id) { clusterIds.value = []; emit('select', id) }
function selectClusterProperty(id) {
  clusterIds.value = []
  emit('select', id)
}
function currentZoom() {
  return engine.value === 'v3' ? map?.zoom : engine.value === 'v2' ? map?.getZoom?.() : 0
}
/** Zoom high enough that the pin is its own marker, never stuck inside a price cluster. */
function focusZoomFor(property, keepZoom = false) {
  const mates = props.properties.filter(item => item.id !== property.id).map(item => item.location)
  const needed = Math.max(FOCUS_MIN_ZOOM, unclusterZoom(property.location, mates, CLUSTER_GRID))
  // Selection changes (marker / cluster list / map-card ‹›) recompute zoom so paging can zoom out.
  // Panel measure and resize only keep the pin framed without stealing a deeper zoom.
  return keepZoom ? Math.max(currentZoom() ?? 0, needed) : needed
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
function clusterLabel(count) {
  const noun = { one: 'объект', few: 'объекта', many: 'объектов', other: 'объекта' }[new Intl.PluralRules('ru').select(count)]
  return `${count} ${noun}`
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
    const label = clusterLabel(items.length)
    const button = makeButton(label, label, 'map-cluster-marker', () => openCluster(items.map(item => item.id)))
    return new api.YMapMarker({ coordinates }, button)
  }
  clusterer = new clusterModule.YMapClusterer({ method: clusterModule.clusterByGrid({ gridSize: CLUSTER_GRID }), features, marker, cluster })
  map.addChild(clusterer)
  if (fit) fitOrFocus()
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
  if (fit) fitOrFocus()
}
function fitOrFocus() {
  if (props.selected) focusSelected()
  else fitResults()
}
function fitResults() {
  if (!map || !props.properties.length) return
  if (engine.value === 'v3') {
    map.update({ margin: overviewPadding.value, location: resultsLocation() })
    return
  }
  if (engine.value === 'v2') {
    const camera = initialCamera()
    map.setCenter([camera.lat, camera.lon], camera.zoom, { checkZoomRange: true })
  }
}
function initialCamera() {
  return mapViewport(props.properties, viewport.width, viewport.height, overviewPadding.value)
}
function focusSelected(keepZoom = false) {
  const property = props.properties.find(item => item.id === props.selected)
  if (!map || !property) return
  // Uncluster from every neighbor; free-area framing is margin (v3) or a same-zoom shift (v2 / widget).
  // Do not combine both — double offset pushed pins too far right on desktop and too high on mobile.
  const zoom = focusZoomFor(property, keepZoom)
  if (engine.value === 'v3') {
    map.update({
      margin: focusPadding.value,
      location: { center: [property.location.lon, property.location.lat], zoom },
    })
    return
  }
  if (engine.value === 'v2') {
    const camera = mapViewport([property], viewport.width, viewport.height, focusPadding.value, zoom)
    map.setCenter([camera.lat, camera.lon], zoom, { checkZoomRange: true })
  }
}
function cancelScheduledFocus() {
  if (typeof cancelAnimationFrame === 'undefined') return
  cancelAnimationFrame(focusFrame)
  focusFrame = 0
}
// Marker clicks set userMoved via the map pointer target before select lands; reclaim the camera, then
// re-focus after SearchMapLayout measures the collapsed panel / preview card.
function scheduleFocusSelected() {
  userMoved.value = false
  focusSelected()
  cancelScheduledFocus()
  nextTick(() => {
    focusFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        focusFrame = 0
        if (!disposed && props.selected && !userMoved.value) focusSelected(true)
      })
    })
  })
}
function clearFocusMargin() {
  cancelScheduledFocus()
  if (engine.value === 'v3' && map) map.update({ margin: overviewPadding.value })
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
    if (props.selected) focusSelected(true)
  })
  resizeObserver.observe(container.value)
}
async function mountV3(key) {
  const loaded = await loadYandexApiV3(key)
  if (disposed) return
  api = loaded.api
  clusterModule = loaded.cluster
  map = new api.YMap(container.value, { location: resultsLocation(), margin: cameraPadding, theme: theme.value }, [
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
    openCluster(target.getGeoObjects().map(marker => marker.properties.get('propertyId')))
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
watch(() => props.selected, () => {
  syncMarkers(false)
  if (props.selected) scheduleFocusSelected()
  else clearFocusMargin()
})
watch(focusPadding, () => {
  // Panel resize may update focus margins, but never reframe the unselected overview.
  if (props.selected && !userMoved.value) focusSelected(true)
}, { deep: true })
watch(theme, value => {
  if (engine.value !== 'v3' || !map) return
  // Let the shell class paint first; map tiles can catch up on the next frame.
  requestAnimationFrame(() => { if (!disposed && map) map.update({ theme: value }) })
})
const widgetCamera = computed(() => {
  const focused = props.selected ? props.properties.filter(item => item.id === props.selected) : props.properties
  if (!props.selected || !focused[0]) {
    return mapViewport(focused, viewport.width, viewport.height, overviewPadding.value)
  }
  const zoom = focusZoomFor(focused[0])
  return mapViewport(focused, viewport.width, viewport.height, focusPadding.value, zoom)
})
const widgetUrl = computed(() => {
  const { lon, lat, zoom } = widgetCamera.value
  const params = new URLSearchParams({ ll: `${lon},${lat}`, z: String(zoom) })
  const points = props.properties.map(property => `${property.location.lon},${property.location.lat}`)
  if (points.length) params.set('pt', points.join('~'))
  return `https://yandex.ru/map-widget/v1/?${params}`
})
onBeforeUnmount(() => {
  disposed = true
  cancelScheduledFocus()
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
      <div class="map-cluster-heading"><b>{{ clusterLabel(clusterProperties.length) }} рядом</b><button type="button" class="map-card-close" aria-label="Закрыть список объектов" @click="clusterIds = []">×</button></div>
      <button v-for="property in clusterProperties" :key="property.id" type="button" class="map-cluster-item" @click="selectClusterProperty(property.id)">
        <img :src="property.images?.[0] || '/demo/p1.svg'" :alt="property.title">
        <div>
          <strong>{{ property.title }}</strong>
          <small>{{ property.city }} · {{ typeLabels[property.type] || property.type }}</small>
          <span>★ {{ property.rating }} <i v-if="property.videoVerified"> · Видео проверено</i></span>
          <b>{{ new Intl.NumberFormat('ru-RU').format(property.priceFrom) }} ₽ <small>/ {{ property.rentalMode === 'long_term' ? 'месяц' : 'ночь' }}</small></b>
        </div>
      </button>
    </section>
  </div>
</template>
<style scoped>
.map-show-all{position:absolute;top:var(--map-top,100px);right:var(--map-right,24px);z-index:3;border:1px solid var(--border-main);border-radius:24px;padding:10px 14px;background:var(--surface-glass);color:var(--text-main);font-size:12px}
.map-zoom{position:absolute;top:50%;right:var(--map-right,24px);z-index:3;display:flex;flex-direction:column;transform:translateY(-50%);border:1px solid var(--border-main);border-radius:16px;overflow:hidden;background:var(--surface-glass)}
.map-zoom button{width:44px;height:44px;border:0;background:transparent;color:var(--text-main);font-size:22px;line-height:1}
.map-zoom button+button{border-top:1px solid var(--border-main)}
.map-zoom button:hover{background:var(--surface-control)}
.map-cluster-list{position:absolute;z-index:6;inset:auto 12px 25px;display:grid;gap:10px;background:var(--surface-glass);border:1px solid var(--border-main);border-radius:16px;padding:10px;max-height:min(360px,70%);overflow:auto;color:var(--text-main)}
.map-cluster-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 2px}
.map-cluster-heading .map-card-close{width:44px;height:44px;flex:none;border:0;border-radius:50%;background:transparent;color:inherit;font-size:24px;line-height:1}
.map-cluster-heading .map-card-close:hover{background:var(--surface-control)}
.map-cluster-item{display:flex;gap:13px;align-items:center;width:100%;padding:0;border:0;border-radius:12px;background:transparent;color:inherit;text-align:left;cursor:pointer}
.map-cluster-item img{width:100px;height:90px;object-fit:cover;border-radius:10px;flex-shrink:0}
.map-cluster-item>div{display:grid;gap:4px;flex:1;min-width:0}
.map-cluster-item strong{overflow-wrap:anywhere}
.map-cluster-item small,.map-cluster-item span{font-size:12px;color:var(--text-muted)}
.map-cluster-item i{color:var(--accent-text);font-style:normal}
.map-cluster-item>div>b{white-space:nowrap}

:deep(.map-price-marker),:deep(.map-cluster-marker){border:1px solid var(--map-marker-border,#fff);background:var(--map-marker-bg,#142019);color:var(--map-marker-fg,#fff);font-size:12px;font-weight:800;box-shadow:0 3px 12px var(--map-marker-shadow,#0006);cursor:pointer}
:deep(.map-price-marker){border-radius:30px;padding:8px 12px;white-space:nowrap}
:deep(.map-price-marker.is-selected){background:#d0f35b;color:#10170c;border-color:#d0f35b}
:deep(.map-cluster-marker){border-radius:30px;padding:8px 12px;white-space:nowrap;min-height:44px}
</style>
