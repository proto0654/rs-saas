<script setup>
import seed from '../../demo/seed.json'
import { brandName } from '#shared/brand'
import { introMotion } from '../utils/intro-motion'

const section = ref(null)
const progress = ref(0)
const reducedMotion = ref(false)
const photos = seed.properties.filter(property => property.status === 'published' && property.images?.[0])
const images = ref(photos.slice(0, 12).map(property => property.images[0]))
const stage = ref(null)
const mapLayer = ref(null)
const viewport = reactive({ width: 1200, height: 800 })
const motion = computed(() => introMotion(progress.value, viewport.width, viewport.height))
provide('homeIntroMap', { layer: mapLayer, progress, contentOpacity: computed(() => motion.value.contentOpacity), reducedMotion })
const introCoversChrome = useState('home-intro-covers-chrome', () => false)
watchEffect(() => {
  introCoversChrome.value = !reducedMotion.value && motion.value.contentOpacity < .99
})
const gridStyle = computed(() => ({
  width: `${motion.value.geometry.gridWidth}px`,
  '--intro-tile-height': `${motion.value.geometry.tileHeight}px`,
  '--intro-column-gap': `${motion.value.geometry.columnGap}px`,
  '--intro-row-gap': `${motion.value.geometry.rowGap}px`,
}))
let frame = 0
let targetProgress = 0
let lastFrame = 0
let motionPreference
function updateMotionPreference() {
  reducedMotion.value = motionPreference.matches
}

function updateProgress() {
  if (!section.value || !stage.value) return
  viewport.width = stage.value.clientWidth
  viewport.height = stage.value.clientHeight
  const distance = section.value.offsetHeight - viewport.height
  targetProgress = distance > 0 ? Math.max(0, Math.min(1, -section.value.getBoundingClientRect().top / distance)) : 1
  // Mobile browser chrome can stop a few pixels short of the calculated end; treat that as finished.
  if (distance > 0 && targetProgress >= .97) {
    targetProgress = 1
    progress.value = 1
  }
}
function animate(time) {
  const delta = lastFrame ? Math.min(64, time - lastFrame) : 16
  lastFrame = time
  progress.value += (targetProgress - progress.value) * (1 - Math.exp(-delta / 80))
  if (Math.abs(targetProgress - progress.value) < .002) {
    progress.value = targetProgress
    frame = 0
    lastFrame = 0
  } else frame = requestAnimationFrame(animate)
}
function onScroll() {
  updateProgress()
  if (!frame) frame = requestAnimationFrame(animate)
}
onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  motionPreference.addEventListener('change', updateMotionPreference)
  const groups = new Map()
  for (const property of photos) {
    const group = groups.get(property.region) || []
    for (const image of property.images) if (!group.includes(image)) group.push(image)
    groups.set(property.region, group)
  }
  const shuffled = [...groups.values()].map(group => group.sort(() => Math.random() - .5))
  const selection = []
  const selected = new Set()
  while (selection.length < 12 && shuffled.some(group => group.length)) {
    for (const group of shuffled) {
      while (group.length && selected.has(group[group.length - 1])) group.pop()
      if (!group.length || selection.length >= 12) continue
      const image = group.pop()
      selected.add(image)
      selection.push(image)
    }
  }
  if (selection.length) {
    const uniquePhotos = [...selection]
    while (selection.length < 12) selection.push(uniquePhotos[selection.length % uniquePhotos.length])
  }
  images.value = selection
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
})
onBeforeUnmount(() => {
  introCoversChrome.value = false
  motionPreference?.removeEventListener('change', updateMotionPreference)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="home-reveal" :style="{ '--content-opacity': motion.contentOpacity }">
  <div ref="mapLayer" class="intro-map-layer"></div>
  <div class="home-search-track">
    <div class="home-search">
      <header class="intro-heading">
        <div class="intro-copy">
          <div class="intro-brand">{{ brandName }}<span>.</span></div>
          <p>Жильё для поездок и жизни</p>
        </div>
        <a class="intro-scroll" href="#search"><span>ЛИСТАЙТЕ ВНИЗ</span><span class="intro-scroll-line" aria-hidden="true"></span><span class="intro-search-link">Перейти к поиску ↓</span></a>
      </header>
      <div class="search-content" :inert="!reducedMotion && motion.contentOpacity < .99 || undefined"><slot /></div>
    </div>
    <div class="home-search-runway" aria-hidden="true"></div>
  </div>
  <section ref="section" class="home-intro" :inert="motion.contentOpacity >= .99 || undefined" :aria-hidden="motion.contentOpacity >= .99 || undefined" aria-label="Локаль — жильё для поездок и жизни">
    <span id="search" class="search-anchor" aria-hidden="true"></span>
    <div ref="stage" class="intro-stage">
      <div class="intro-grid-frame" :style="gridStyle" aria-hidden="true"><div class="intro-tiles" :style="{ transform: `scale(${motion.scale})` }">
        <div v-for="(image, index) in images" :key="index" class="intro-tile" :style="motion.tiles[index]"><img :src="image" alt=""></div>
      </div>
      </div>
    </div>
  </section>
  </div>
</template>

<style scoped>
.home-reveal{display:grid;position:relative}
.intro-map-layer{position:fixed;inset:0;z-index:0;pointer-events:none}
.home-search-track,.home-intro{grid-area:1/1}
.home-search-track{min-width:0}
.home-search-runway{height:300svh;pointer-events:none}
.home-search{position:sticky;top:0;min-height:100svh;z-index:2;pointer-events:none}
.intro-heading{position:relative;z-index:2;height:100svh;display:grid;place-items:center;color:var(--text-main);pointer-events:none;opacity:calc(1 - var(--content-opacity))}
.search-content{position:fixed;inset:0;opacity:var(--content-opacity);pointer-events:none}
.home-intro{position:relative;height:400svh;color:var(--text-main);z-index:1;pointer-events:none}
.home-intro[aria-hidden=true]{visibility:hidden}
.search-anchor{position:absolute;top:300svh;left:0}
.intro-stage{position:sticky;top:0;height:100svh;overflow:hidden;display:grid;place-items:center;isolation:isolate}
.intro-stage::before{content:'';position:absolute;inset:0;background:var(--intro-map-veil,#080c0a);opacity:calc(.78 * (1 - var(--content-opacity)));z-index:-1}
.intro-grid-frame{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.intro-tiles{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,var(--intro-tile-height));gap:var(--intro-row-gap) var(--intro-column-gap);will-change:transform}
.intro-tile{min-width:0;min-height:0;overflow:hidden;will-change:transform,opacity}
.intro-tile img{display:block;width:100%;height:100%;object-fit:cover}
.intro-copy{position:relative;z-index:1;text-align:center;pointer-events:none}
.intro-brand{font-size:clamp(76px,13vw,180px);font-weight:900;letter-spacing:-.085em;line-height:1.05;background:#d0f35b url('/demo/intro-map.svg') center/cover;-webkit-background-clip:text;background-clip:text;color:transparent}
.intro-brand span{color:#d0f35b}
.intro-copy p{margin-top:12px;font-size:clamp(15px,1.6vw,20px);color:var(--text-main)}
.intro-scroll{position:absolute;z-index:2;bottom:max(30px,env(safe-area-inset-bottom));display:flex;align-items:center;flex-direction:column;gap:12px;color:var(--text-main);font-size:10px;font-weight:800;letter-spacing:.2em;pointer-events:auto;opacity:calc(1 - var(--content-opacity))}
.intro-scroll-line{height:36px;width:1px;background:var(--text-muted)}
.intro-search-link{letter-spacing:0;font-size:12px;font-weight:600}
.intro-scroll:focus-visible{outline:2px solid #d0f35b;outline-offset:8px}
@media(max-width:600px){.intro-copy{padding:0 20px}.intro-brand{font-size:clamp(68px,16vw,100px)}}
@media(prefers-reduced-motion:reduce){.home-reveal{display:block}.home-intro,.home-search-runway,.intro-heading{display:none}.home-search{position:static}.search-content{opacity:1}.intro-tiles{display:none}}
</style>
