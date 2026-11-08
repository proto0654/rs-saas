<script setup>
import { brandName } from '#shared/brand'
const { isHost, isTg, link, path } = usePlatform()
const isMapSearch = computed(() => ['/', '/search'].includes(path.value) || path.value.startsWith('/locations/'))
const theme = useState('app-theme', () => 'dark')
function applyTheme(value) {
  theme.value = value
  document.documentElement.dataset.theme = value === 'light' ? 'mesto-light' : 'mesto'
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
<div class="app-shell" :class="{ 'host-shell': isHost, 'map-search-shell': isMapSearch }">
  <header class="topbar"><NuxtLink :to="link('/')" class="logo">{{ brandName }}<span>.</span></NuxtLink><div class="desktop-links"><NuxtLink :to="link('/search')">Найти жильё</NuxtLink><NuxtLink :to="link('/favorites')">Избранное</NuxtLink><NuxtLink :to="link('/bookings')">Брони</NuxtLink></div><div class="context-switch"><NuxtLink :class="{current: !isHost}" :to="link('/search')">Гость</NuxtLink><NuxtLink :class="{current: isHost}" :to="link('/host/properties')">Хозяин</NuxtLink><NuxtLink :class="{current: isTg}" :to="isTg ? '/search' : '/tg'">{{ isTg ? 'Web ↗' : 'TG ↗' }}</NuxtLink></div><button class="theme-toggle" type="button" :aria-label="theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'" :title="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'" @click="toggleTheme"><span aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span></button></header>
  <div v-if="isHost" class="host-layout"><aside class="host-sidebar" aria-label="Навигация хозяина"><NuxtLink :to="link('/host/properties')">⌂ <span>Объекты</span></NuxtLink><NuxtLink :to="link('/host/calendar')">▦ <span>Календарь</span></NuxtLink><NuxtLink :to="link('/host/bookings')">▤ <span>Бронирования</span></NuxtLink><NuxtLink :to="link('/host/bot')">◉ <span>Мой бот</span></NuxtLink><NuxtLink :to="link('/host/audit')">☷ <span>Журнал</span></NuxtLink><NuxtLink :to="link('/profile')">♙ <span>Профиль</span></NuxtLink></aside><div class="host-layout-content"><slot /></div></div>
  <slot v-else />
  <nav class="bottom-nav"><NuxtLink :to="isHost ? link('/host/properties') : link('/search')"><span>⌕</span>{{ isHost ? 'Объекты' : 'Поиск' }}</NuxtLink><NuxtLink :to="isHost ? link('/host/calendar') : link('/favorites')"><span>{{ isHost ? '▦' : '♡' }}</span>{{ isHost ? 'Календарь' : 'Избранное' }}</NuxtLink><NuxtLink :to="isHost ? link('/host/bookings') : link('/bookings')"><span>▤</span>Брони</NuxtLink><NuxtLink :to="link('/profile')"><span>♙</span>Профиль</NuxtLink></nav>
</div>
</template>

<style scoped>
.map-search-shell{padding-bottom:0;min-height:100dvh}
.map-search-shell>.topbar{position:fixed;z-index:8;top:0;left:0;right:0;max-width:none;background:var(--surface-glass);backdrop-filter:blur(12px);pointer-events:auto}
.map-search-shell>.bottom-nav{pointer-events:auto}
.theme-toggle{flex:none;display:grid;place-items:center;width:44px;height:44px;border:1px solid var(--border-main);border-radius:50%;background:var(--surface-card);color:var(--text-main);font-size:22px}
@media(max-width:800px){.topbar{gap:8px}.theme-toggle{width:44px;height:44px}.context-switch{margin-left:auto}}
</style>
