<script setup>
const props = defineProps({ properties: { type: Array, default: () => [] }, selected: { type: String, default: null } })
const emit = defineEmits(['select'])
const container = ref(null)
const config = useRuntimeConfig()
const mode = ref(config.public.yandexMapsKey ? 'loading' : 'widget')
let map
let clusterer
let disposed = false
let markers = []
let resizeObserver
const clusterIds = ref([])
const clusterProperties = computed(() => props.properties.filter(property => clusterIds.value.includes(property.id)))
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
function selectProperty(id) { clusterIds.value = []; emit('select', id) }

function loadApi(key) {
  return new Promise((resolve, reject) => {
    if (window.ymaps) { window.ymaps.ready(() => resolve(window.ymaps)); return }
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key)}&lang=ru_RU`
    script.async = true
    const timeout = window.setTimeout(() => reject(new Error('Map timeout')), 12000)
    script.onload = () => window.ymaps ? window.ymaps.ready(() => { window.clearTimeout(timeout); resolve(window.ymaps) }) : reject(new Error('Map unavailable'))
    script.onerror = () => { window.clearTimeout(timeout); reject(new Error('Map unavailable')) }
    document.head.appendChild(script)
  })
}
function syncMarkers(fit = false) {
  if (!map || !window.ymaps) return
  clusterer.removeAll()
  clusterIds.value = []
  markers = props.properties.map(property => {
    const marker = new window.ymaps.Placemark([property.location.lat, property.location.lon], {
      iconContent: `${new Intl.NumberFormat('ru-RU').format(property.priceFrom)} ₽${property.rentalMode === 'long_term' ? '/мес' : ''}`,
      hintContent: escapeHtml(property.title),
      propertyId: property.id,
    }, { preset: property.id === props.selected ? 'islands#darkGreenStretchyIcon' : 'islands#blackStretchyIcon' })
    marker.events.add('click', event => { event.stopPropagation(); selectProperty(property.id) })
    return marker
  })
  clusterer.add(markers)
  if (!fit || !props.properties.length) return
  if (props.properties.length === 1) map.setCenter([props.properties[0].location.lat, props.properties[0].location.lon], 11)
  else { const bounds = clusterer.getBounds(); if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: [60, 30, 150, 30] }) }
}
onMounted(async () => {
  if (!config.public.yandexMapsKey) return
  try {
    const api = await loadApi(config.public.yandexMapsKey)
    if (disposed) return
    map = new api.Map(container.value, { center: [44.54, 34.23], zoom: 10, controls: ['zoomControl'] }, { suppressMapOpenBlock: true })
    clusterer = new api.Clusterer({ gridSize: 128, clusterDisableClickZoom: true, clusterOpenBalloonOnClick: false, preset: 'islands#darkGreenClusterIcons' })
    clusterer.events.add('click', event => {
      const target = event.get('target')
      if (typeof target?.getGeoObjects !== 'function') return
      event.preventDefault(); event.stopPropagation()
      clusterIds.value = target.getGeoObjects().map(marker => marker.properties.get('propertyId'))
    })
    map.geoObjects.add(clusterer)
    map.events.add('click', () => { clusterIds.value = []; emit('select', null) })
    mode.value = 'api'; syncMarkers(true)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(entries => {
        if (!entries[0]?.contentRect.width || !entries[0]?.contentRect.height) return
        map.container.fitToViewport()
        syncMarkers(true)
      })
      resizeObserver.observe(container.value)
    }
  } catch { if (!disposed) mode.value = 'widget' }
})
watch(() => props.properties, () => syncMarkers(true), { deep: true })
watch(() => props.selected, () => syncMarkers(false))
const widgetUrl = computed(() => { const property = props.properties.find(p => p.id === props.selected) || props.properties[0]; const lon = property?.location.lon ?? 39; const lat = property?.location.lat ?? 45; return `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=${property ? 11 : 6}` })
onBeforeUnmount(() => { disposed = true; resizeObserver?.disconnect(); map?.destroy() })
</script>
<template>
  <div class="yandex-map">
    <div v-show="mode !== 'widget'" ref="container" class="yandex-canvas" aria-label="Карта объектов"></div>
    <iframe v-if="mode === 'widget'" class="yandex-canvas" :src="widgetUrl" title="Яндекс Карта жилья на юге России" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <div v-if="mode === 'loading'" class="map-loading">Загружаем карту…</div>
    <div v-if="mode === 'widget'" class="map-provider-hint">Яндекс Карта · метки доступны после настройки API-ключа</div>
    <section v-if="clusterProperties.length" class="map-cluster-list" aria-label="Объекты на карте">
      <div class="map-cluster-heading"><b>Объекты рядом · {{ clusterProperties.length }}</b><button aria-label="Закрыть список объектов" @click="clusterIds = []">×</button></div>
      <button v-for="property in clusterProperties" :key="property.id" class="map-cluster-item" @click="selectProperty(property.id)"><span>{{ property.title }}<small>{{ property.city }}</small></span><b>{{ new Intl.NumberFormat('ru-RU').format(property.priceFrom) }} ₽<small>{{ property.rentalMode === 'long_term' ? '/мес' : '/ночь' }}</small></b></button>
    </section>
  </div>
</template>
<style scoped>
.map-cluster-list{position:absolute;z-index:6;inset:auto 12px 25px;background:#101713f5;border:1px solid #526052;border-radius:16px;padding:12px;max-height:min(320px,70%);overflow:auto;color:#f5f4eb}.map-cluster-heading,.map-cluster-item{display:flex;align-items:center;justify-content:space-between;gap:12px}.map-cluster-heading button{border:0;background:transparent;color:inherit;font-size:24px;width:44px;height:44px}.map-cluster-item{width:100%;min-height:54px;padding:8px 4px;border:0;border-top:1px solid #344037;background:transparent;color:inherit;text-align:left}.map-cluster-item span{min-width:0}.map-cluster-item b{text-align:right;white-space:nowrap}.map-cluster-item small{display:block;color:#a8b1a4;font-size:11px}
</style>
