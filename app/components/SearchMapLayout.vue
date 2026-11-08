<script setup>
const props = defineProps({ expanded: Boolean })
const emit = defineEmits(['update:expanded'])
const intro = inject('homeIntroMap', null)
const panel = ref(null)
const padding = ref([100, 24, 100, 24])
const isIntro = computed(() => Boolean(intro && !intro.reducedMotion.value && intro.contentOpacity.value < .99))
const mapStyle = computed(() => ({
  '--map-top': `${padding.value[0]}px`,
  '--map-right': `${padding.value[1]}px`,
  '--map-bottom': `${padding.value[2]}px`,
  '--map-left': `${padding.value[3]}px`,
}))
let observer
function measure() {
  if (!panel.value) return
  const bounds = panel.value.getBoundingClientRect()
  const mobile = window.innerWidth <= 800
  padding.value = mobile
    ? [88, 16, Math.min(window.innerHeight - 140, window.innerHeight - bounds.top + 16), 16]
    : [104, 24, 48, Math.min(window.innerWidth - 200, bounds.right + 24)]
}
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(panel.value)
  }
  window.addEventListener('resize', measure)
})
watch(() => props.expanded, () => nextTick(measure))
onBeforeUnmount(() => { observer?.disconnect(); window.removeEventListener('resize', measure) })
</script>

<template>
  <main class="search-workspace" :class="{ 'is-expanded': expanded }">
    <section ref="panel" class="search-panel" aria-label="Поиск жилья">
      <button class="search-panel-handle" :aria-expanded="expanded" aria-controls="search-results" @click="emit('update:expanded', !expanded)"><span aria-hidden="true"></span>{{ expanded ? 'Свернуть список' : 'Поиск и варианты жилья' }}</button>
      <slot />
    </section>
    <Teleport :to="intro?.layer.value || 'body'" :disabled="!intro?.layer.value">
      <div class="search-map-layer" :class="{ 'is-intro': isIntro }" :style="mapStyle" :inert="isIntro || undefined" :aria-hidden="isIntro || undefined">
        <slot name="map" :padding="padding" :interactive="!isIntro" />
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.search-workspace{position:fixed;inset:0;pointer-events:none}
.search-panel{position:fixed;z-index:3;top:96px;bottom:24px;left:24px;width:min(460px,40vw);padding:20px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;pointer-events:auto;background:var(--surface-glass);border:1px solid #465448;border-radius:20px;box-shadow:0 12px 40px #0004}
.search-panel-handle{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:36px;border:0;background:none;color:var(--text-muted);font-size:12px;margin-bottom:14px}
.search-map-layer{position:fixed;inset:0;z-index:0;pointer-events:auto;filter:none;transition:filter .5s ease}
.search-map-layer.is-intro{filter:grayscale(1)}
.search-map-layer[inert]{pointer-events:none}
.search-map-layer :deep(.map){position:absolute;inset:0;height:100%;min-height:0;border:0;border-radius:0}
@media(prefers-reduced-motion:reduce){.search-map-layer{transition:none}}
.search-map-layer :deep(.map-card){left:auto;right:24px;bottom:48px;width:min(440px,calc(100vw - var(--map-left) - 48px))}
.search-map-layer :deep(.map-empty){left:calc(var(--map-left) + (100% - var(--map-left) - var(--map-right))/2);top:calc(var(--map-top) + (100% - var(--map-top) - var(--map-bottom))/2)}
.search-map-layer :deep(.map-provider-hint){top:var(--map-top);left:var(--map-left);max-width:calc(100% - var(--map-left) - var(--map-right))}
.search-map-layer :deep(.map-cluster-list){left:var(--map-left);right:var(--map-right);bottom:var(--map-bottom)}
.search-panel :deep(.search-heading){display:flex;margin:0 0 18px}
.search-panel :deep(.search-heading h1){font-size:36px}
.search-panel :deep(.search-heading p){font-size:13px}
.search-panel :deep(.heading-note){display:none}
.search-panel :deep(.search-controls){display:grid;grid-template-columns:1fr;gap:8px}
.search-panel :deep(.search-trigger){min-width:0;width:100%}
.search-panel :deep(.quick-filters){flex-wrap:wrap}
.search-panel :deep(.results-heading){margin:22px 0 14px;gap:8px}
.search-panel :deep(.results-heading h2){font-size:23px}
.search-panel :deep(.results-heading>div:first-child){display:block}
.search-panel :deep(.view-switch){width:auto;flex:none}
.search-panel :deep(.results-layout){display:block}
.search-panel :deep(.property-card){grid-template-columns:38% 62%;min-height:190px}
.search-panel :deep(.card-content){padding:12px}
.search-panel :deep(.card-content h3){font-size:17px}
.search-panel :deep(.filter-fields){grid-template-columns:1fr}
.search-panel :deep(.filter-fields .check-list){grid-template-columns:repeat(2,minmax(0,1fr))}
.search-panel :deep(.filter-actions){bottom:0;background:var(--surface-card)}
.search-panel-handle{min-height:44px}
@media(max-width:800px){
  .search-panel{top:auto;left:10px;right:10px;bottom:calc(76px + max(env(safe-area-inset-bottom),var(--telegram-safe-bottom,0px)));width:auto;max-height:36dvh;padding:10px 16px 16px;border-radius:22px}
  .is-expanded .search-panel{max-height:calc(var(--telegram-viewport-height,100dvh) - 170px - var(--telegram-safe-top,0px))}
  .search-panel-handle{position:sticky;top:-10px;z-index:2;flex-direction:column;gap:5px;background:var(--surface-input);padding:8px 0;font-size:11px;margin-bottom:8px;touch-action:manipulation}
  .search-panel-handle>span{width:36px;height:4px;border-radius:4px;background:#647260}
  .search-panel :deep(.search-heading h1){font-size:28px;margin:6px 0}
  .search-panel :deep(.search-heading p){display:none}
  .search-map-layer :deep(.map-card){left:10px;right:10px;bottom:var(--map-bottom);width:auto;padding:10px}
  .search-map-layer :deep(.map-card img){width:64px;height:72px}
  .search-map-layer :deep(.map-card strong){font-size:14px}
}
</style>
