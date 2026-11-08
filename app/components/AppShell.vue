<script setup>
import { brandName } from '#shared/brand'
const { isHost, isTg, link, path } = usePlatform()
const isMapSearch = computed(() => ['/', '/search'].includes(path.value) || path.value.startsWith('/locations/'))
const introCoversChrome = useState('home-intro-covers-chrome', () => false)
const theme = useState('app-theme', () => 'dark')
const themeClass = computed(() => theme.value === 'light' ? 'theme-light' : 'theme-dark')
const themeAttr = computed(() => theme.value === 'light' ? 'mesto-light' : 'mesto')
function applyTheme(value) {
  theme.value = value
  if (!import.meta.client) return
  // Keep page chrome in sync without swapping the whole document theme tree.
  document.documentElement.style.colorScheme = value
  document.body.style.background = value === 'light' ? '#f6f7f1' : '#0c1210'
}
function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  try { localStorage.setItem('lokal-theme', next) } catch { /* Storage may be unavailable. */ }
}
onMounted(() => {
  try { applyTheme(localStorage.getItem('lokal-theme') === 'light' ? 'light' : 'dark') } catch { applyTheme('dark') }
})
</script>
<template>
<div class="app-shell" :class="[themeClass, { 'host-shell': isHost, 'map-search-shell': isMapSearch }]" :data-theme="themeAttr">
  <header class="topbar" :class="{ 'is-intro': introCoversChrome }"><NuxtLink :to="link('/')" class="logo">{{ brandName }}<span>.</span></NuxtLink><div class="desktop-links"><NuxtLink :to="link('/search')">Найти жильё</NuxtLink><NuxtLink :to="link('/favorites')">Избранное</NuxtLink><NuxtLink :to="link('/bookings')">Брони</NuxtLink></div><div class="context-switch"><NuxtLink :class="{current: !isHost}" :to="link('/search')">Гость</NuxtLink><NuxtLink :class="{current: isHost}" :to="link('/host/properties')">Хозяин</NuxtLink><NuxtLink :class="{current: isTg}" :to="isTg ? '/search' : '/tg'">{{ isTg ? 'Web ↗' : 'TG ↗' }}</NuxtLink></div><button class="theme-toggle" type="button" :aria-label="theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'" :title="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'" @click="toggleTheme"><span aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span></button></header>
  <div v-if="isHost" class="host-layout"><aside class="host-sidebar" aria-label="Навигация хозяина"><NuxtLink :to="link('/host/properties')">⌂ <span>Объекты</span></NuxtLink><NuxtLink :to="link('/host/calendar')">▦ <span>Календарь</span></NuxtLink><NuxtLink :to="link('/host/bookings')">▤ <span>Бронирования</span></NuxtLink><NuxtLink :to="link('/host/bot')">◉ <span>Мой бот</span></NuxtLink><NuxtLink :to="link('/host/audit')">☷ <span>Журнал</span></NuxtLink><NuxtLink :to="link('/profile')">♙ <span>Профиль</span></NuxtLink></aside><div class="host-layout-content"><slot /></div></div>
  <slot v-else />
  <nav class="bottom-nav" :hidden="introCoversChrome || undefined"><NuxtLink :to="isHost ? link('/host/properties') : link('/search')"><span>⌕</span>{{ isHost ? 'Объекты' : 'Поиск' }}</NuxtLink><NuxtLink :to="isHost ? link('/host/calendar') : link('/favorites')"><span>{{ isHost ? '▦' : '♡' }}</span>{{ isHost ? 'Календарь' : 'Избранное' }}</NuxtLink><NuxtLink :to="isHost ? link('/host/bookings') : link('/bookings')"><span>▤</span>Брони</NuxtLink><NuxtLink :to="link('/profile')"><span>♙</span>Профиль</NuxtLink></nav>
</div>
</template>

<style scoped>
.map-search-shell{padding-bottom:0;min-height:100dvh}
.map-search-shell>.topbar{position:fixed;z-index:8;top:0;left:0;right:0;max-width:none;background:transparent;pointer-events:auto}
.map-search-shell>.topbar:not(.is-intro){background:color-mix(in srgb,var(--surface-page) 62%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.map-search-shell>.topbar.is-intro{color:#f5f4eb;border-bottom-color:#ffffff2e}
.map-search-shell>.topbar.is-intro .desktop-links{color:#a8b1a4}
.map-search-shell>.topbar.is-intro .logo span{color:#d0f35b}
.map-search-shell>.bottom-nav{pointer-events:auto}
.theme-toggle{flex:none;display:grid;place-items:center;width:44px;height:44px;border:1px solid var(--border-main);border-radius:50%;background:var(--surface-card);color:var(--text-main);font-size:22px}
@media(max-width:800px){.topbar{gap:8px}.theme-toggle{width:44px;height:44px}.context-switch{margin-left:auto}}
</style>
